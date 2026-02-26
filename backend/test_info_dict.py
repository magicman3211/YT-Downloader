import yt_dlp
import json

ydl_opts = {
    'playlistend': 1,
    'simulate': True,
    'quiet': True,
}

info_dict_dump = {}

def progress_hook(d):
    global info_dict_dump
    if d['status'] == 'downloading':
        # Grab info_dict on first hook call
        if not info_dict_dump:
            info_dict_dump = d.get('info_dict', {})

ydl_opts['progress_hooks'] = [progress_hook]

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download(["https://www.youtube.com/playlist?list=PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-"])

# Print out keys related to playlist
res = {k: v for k, v in info_dict_dump.items() if 'playlist' in k or 'thumb' in k}
print(json.dumps(res, indent=2))
