import yt_dlp
import sys
import json

url = sys.argv[1]

ydl_opts = {
    'skip_download': True,
    'quiet': True,
    'no_warnings': True,
    'extract_flat': True,
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        print("Success!")
        if 'entries' in info:
            print("Is Playlist. Number of entries:", len(list(info['entries'])))
            print("First item title:", list(info['entries'])[0].get('title', 'Unknown'))
        else:
            print("Single Video:", info.get('title'))
except Exception as e:
    print(f"Error: {e}")
