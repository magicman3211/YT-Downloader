import yt_dlp
import os

def filter_formats(formats):
    """
    Filters formats to return only resolutions >= 720p.
    Provides video+audio formats whenever possible to avoid complex post-processing, 
    but also provides distinct video lines if they're high quality.
    """
    available = []
    seen_heights = set()
    
    # Sort formats from highest resolution to lowest
    sorted_formats = sorted(formats, key=lambda f: f.get('height', 0) or 0, reverse=True)
    
    for f in sorted_formats:
        h = f.get('height')
        # Skip audio-only or very low res
        if not h or h < 720:
            continue
            
        ext = f.get('ext')
        # Prefer mp4/webm. 
        if ext not in ['mp4', 'webm']:
            continue
            
        # Optional: We want to deduplicate mostly matching resolutions.
        if h not in seen_heights:
            parsed = {
                "format_id": f.get("format_id"),
                "quality": f"{h}p",
                "ext": ext,
                "vcodec": f.get("vcodec"),
                "acodec": f.get("acodec", "none"),
                "filesize": f.get("filesize", 0)
            }
            available.append(parsed)
            # Temporarily disabled so users can choose codecs 
            # seen_heights.add(h)
    
    # If no 720p+ available, we must fail gracefully on the frontend.
    return available

def fetch_metadata(url: str):
    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'playlistend': 1, # Only parse the first video of a playlist to save API timeout
        'js_runtimes': {'node': {}},
        'extractor_args': {'youtube': ['player_client=android,web']}
    }
    
    cookie_path = '/app/cookies.txt'
    if os.path.exists(cookie_path):
        ydl_opts['cookiefile'] = cookie_path
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            
            # If playlist, handle differently. For MVP, assuming single video first.
            if 'entries' in info:
                # It's a playlist. Grab the first entry just to prove metadata.
                # In full implementation, we'd list the playlist videos.
                info = info['entries'][0]
                
            formats = filter_formats(info.get('formats', []))
            
            return {
                "title": info.get('title', 'Unknown Title'),
                "thumbnail": info.get('thumbnail', ''),
                "duration": info.get('duration') or 0,
                "uploader": info.get('uploader', 'Unknown'),
                "url": url,
                "available_formats": formats
            }
            
        except yt_dlp.utils.DownloadError as e:
            raise Exception(f"yt-dlp error: {str(e)}")
