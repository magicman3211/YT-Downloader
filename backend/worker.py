import os
import redis
import json
from celery import Celery
import yt_dlp

# Redis Setup
redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.Redis.from_url(redis_url, decode_responses=True)

# Celery Setup
celery_app = Celery(
    "worker",
    broker=redis_url,
    backend=redis_url
)

class MyLogger(object):
    def debug(self, msg):
        pass

    def warning(self, msg):
        pass

    def error(self, msg):
        print(msg)

@celery_app.task(bind=True)
def download_video_task(self, url: str, format_id: str, quality_label: str):
    """
    Background job to download a Youtube Video.
    Reports progress natively back to Redis for the web server to SSE.
    """
    job_id = self.request.id
    nas_dir = os.getenv("NAS_PATH", "/mnt/nas/downloads")
    
    # Ensure destination directory exists
    os.makedirs(nas_dir, exist_ok=True)

    # Redis key to store this job's progress
    progress_key = f"job_progress:{job_id}"
    
    r.hset(progress_key, mapping={
        "status": "starting",
        "progress": 0,
        "eta": "Calculating...",
        "speed": "0MiB/s",
        "quality": quality_label
    })

    last_update = {"time": 0}

    def progress_hook(d):
        import time
        current_time = time.time()
        
        # Throttle Redis calls to max 10 times per second during active downloads
        if d.setdefault('status', 'downloading') == 'downloading' and current_time - last_update["time"] < 0.1:
            return
            
        last_update["time"] = current_time

        # 1. Check for action commands from the user (Pause / Cancel)
        action_key = f"job_action:{job_id}"
        action = r.get(action_key)
        
        if action == "cancel":
            r.delete(action_key)
            raise Exception("Job cancelled by user")
            
        if action == "pause":
            r.hset(progress_key, "status", "paused")
            while r.get(action_key) == "pause":
                time.sleep(1) # Block the download loop
            # Exited pause, resume processing
            r.hset(progress_key, "status", "downloading")
            if r.get(action_key) == "cancel":
                r.delete(action_key)
                raise Exception("Job cancelled by user")

        # 2. Extract Progress and Playlist Info
        if d['status'] == 'downloading':
            try:
                import re
                
                percent_str = d.get('_percent_str', '0%').strip()
                match = re.search(r'([\d\.]+)%', percent_str)
                percent_val = float(match.group(1)) if match else 0.0

                speed_str = d.get('_speed_str', '0MiB/s').strip()
                speed = re.sub(r'\x1b\[[0-9;]*[mK]', '', speed_str).strip()
                if "DL:" in percent_str:
                    speed_match = re.search(r'DL:([^\s]+)', percent_str)
                    if speed_match:
                        speed = speed_match.group(1) + '/s'
                
                eta_str = d.get('_eta_str', 'Unknown').strip()
                eta = re.sub(r'\x1b\[[0-9;]*[mK]', '', eta_str).strip()
                
                info = d.get('info_dict', {})
                video_title = info.get('title', 'Unknown Title')
                playlist_index = info.get('playlist_index', 1) or 1
                playlist_count = info.get('n_entries', 1) or 1
                
                # If downloading a playlist, prefix the status
                progress_status = "downloading"
                if playlist_count > 1:
                    r.hset(progress_key, "playlist_mode", "true")
                    r.hset(progress_key, "current_video", playlist_index)
                    r.hset(progress_key, "total_videos", playlist_count)
                    r.hset(progress_key, "video_title", video_title)

                r.hset(progress_key, mapping={
                    "status": r.hget(progress_key, "status") or "downloading", # Retain 'paused' if just waking up
                    "progress": percent_val,
                    "eta": eta,
                    "speed": speed
                })
            except Exception as e:
                import traceback
                print(f"Failed to parse progress: {e}\n{traceback.format_exc()}")
                pass
                
        elif d['status'] == 'finished':
            r.hset(progress_key, mapping={
                "status": "processing",
                "progress": 100,
                "eta": "Finalizing/Merging Video...",
                "speed": "Done"
            })

    try:
        is_playlist = False
        
        # Pre-flight: Download Show Poster (Playlist/Channel Thumbnail)
        try:
            meta_opts = {
                'quiet': True, 
                'extract_flat': True, 
                'ignoreerrors': True,
                'js_runtimes': {'node': {}}
            }
            cookie_path = '/app/cookies.txt'
            if os.path.exists(cookie_path):
                meta_opts['cookiefile'] = cookie_path

            with yt_dlp.YoutubeDL(meta_opts) as ydl_meta:
                meta = ydl_meta.extract_info(url, download=False, process=False)
                # Determine Plex "Show" Name to match output_template
                is_playlist = meta.get('_type') == 'playlist'
                show_name = meta.get('title') if is_playlist else meta.get('uploader')
                
                # Sanitize the show_name to match OS folder naming exactly as yt-dlp does
                from yt_dlp.utils import sanitize_filename
                show_name_clean = sanitize_filename(show_name, restricted=False) if show_name else 'Unknown'
                
                thumbs = meta.get('thumbnails', [])
                if thumbs:
                    best_thumb_url = thumbs[-1]['url']
                    show_dir = os.path.join(nas_dir, show_name_clean)
                    os.makedirs(show_dir, exist_ok=True)
                    
                    import urllib.request
                    poster_path = os.path.join(show_dir, 'poster.jpg')
                    if not os.path.exists(poster_path):
                        urllib.request.urlretrieve(best_thumb_url, poster_path)
        except Exception as e:
            # Silently fail poster fetch so main download isn't impacted
            pass

        # Dynamically define directory grouping based on media type
        if is_playlist:
            # Flat folder for playlists, no seasons folder, numbered locally
            output_template = os.path.join(nas_dir, 
                '%(playlist_title,uploader)s', 
                '%(playlist_autonumber)02d - %(title)s.%(ext)s'
            )
        else:
            # Plex TV Shows naming convention for individual channel videos
            # Structure: Show Name/Season YYYY/Show Name - SYYYYEmmdd - Title.ext
            output_template = os.path.join(nas_dir, 
                '%(uploader)s', 
                'Season %(upload_date>%Y|Unknown)s', 
                '%(uploader)s - S%(upload_date>%Y|00)sE%(upload_date>%m%d|00)s - %(title)s.%(ext)s'
            )

        ydl_opts = {
            'format': f"{format_id}+bestaudio/best",
            'outtmpl': output_template,
            'progress_hooks': [progress_hook],
            'logger': MyLogger(),
            'ignoreerrors': True,
            # 'cookiesfrombrowser': ('chrome',), # Fails in docker without host mount mapping
            'merge_output_format': 'mp4', # Ensures ffmpeg merges audio + video into single mp4
            
            # Speed optimizations: Use native concurrent fragments rather than aria2c 
            # as aria2c is heavily throttled by YouTube
            'concurrent_fragment_downloads': 8,
            'http_chunk_size': 10485760, # 10MB chunks to bypass speed throttling
            
            # Impersonate iOS client to bypass YouTube throttling
            'extractor_args': {'youtube': ['player_client=ios,android,web']},
            
            # Save Metadata
            'writeinfojson': True,
            'writethumbnail': True,
            'writedescription': True,
            
            # Use NodeJS for JS Challenge Solving (Bot detection bypass)
            'js_runtimes': {'node': {}}
        }

        cookie_path = '/app/cookies.txt'
        if os.path.exists(cookie_path):
            ydl_opts['cookiefile'] = cookie_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        # Mark as 100% completed in redis
        r.hset(progress_key, "status", "completed")
        # Cleanup redis cache after 24 hrs
        r.expire(progress_key, 86400) 
        
        return {"status": "success", "job_id": job_id}
        
    except Exception as e:
        r.hset(progress_key, "status", "failed")
        r.hset(progress_key, "error_detail", str(e))
        r.expire(progress_key, 86400)
        raise e
