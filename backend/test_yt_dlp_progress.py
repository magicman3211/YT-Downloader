import yt_dlp
import json

def progress_hook(d):
    print("--- PROGRESS UPDATE ---")
    
    # Let's print the dict but omit 'info_dict' since it's huge
    d_copy = {k: v for k, v in d.items() if k != 'info_dict'}
    print(json.dumps(d_copy, indent=2))
    
    # Also print the specific fields we try to parse
    if d['status'] == 'downloading':
        percent_str = d.get('_percent_str', '0%').strip()
        print(f"Origin percent_str: {repr(percent_str)}")
        try:
            percent_clean = percent_str.replace('\x1b[0;94m', '').replace('\x1b[0m', '').replace('%', '')
            percent_val = float(percent_clean)
            print(f"Cleaned percent: {percent_val}")
        except Exception as e:
            print(f"Failed to parse percent: {e}")

ydl_opts = {
    'format': 'worst',
    'progress_hooks': [progress_hook],
    'quiet': True,
    'outtmpl': '/tmp/test_vid.%(ext)s'
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    # A lightweight test video URL
    ydl.download(['https://www.youtube.com/watch?v=jNQXAC9IVRw'])
