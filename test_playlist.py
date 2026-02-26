import yt_dlp
import json

ydl_opts = {
    'extract_flat': True,
    'playlistend': 1,
}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info("https://www.youtube.com/playlist?list=PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-", download=False)
    print(json.dumps({k: v for k, v in info.items() if k != 'entries'}, indent=2))
