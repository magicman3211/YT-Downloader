import yt_dlp
import json
import os
import urllib.request

url = "https://www.youtube.com/playlist?list=PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-"

ydl_opts = {
    'extract_flat': True,
    'quiet': True,
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    meta = ydl.extract_info(url, download=False, process=False)
    thumbs = meta.get('thumbnails', [])
    show_name = meta.get('playlist_title') or meta.get('uploader') or 'Unknown'
    
    print(f"Show Name: {show_name}")
    if thumbs:
        best_thumb = thumbs[-1]['url']
        print(f"Best Thumb: {best_thumb}")
        # Verify download
        urllib.request.urlretrieve(best_thumb, 'test_poster.jpg')
        print(f"File size: {os.path.getsize('test_poster.jpg')} bytes")
    else:
        print("No thumbnails found at top level.")
