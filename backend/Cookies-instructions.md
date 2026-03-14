# YT-Downloader: YouTube Cookies Guide

The `backend/cookies.txt` file is used to authenticate `yt-dlp` requests with YouTube. This helps bypass aggressive bot detection mechanisms (like the "Sign in to confirm you're not a bot" error) and provides access to age-restricted or private videos.

## Do I need to update my cookies?

Generally, you do not *need* to update or download `cookies.txt` again for standard, public YouTube videos if your downloads are currently working. 

However, there are a few scenarios where you **will** need to update them in the future:

1. **Bot Detection Returns:** YouTube frequently updates its anti-bot measures. The combination of your current `cookies.txt` and the `nodejs` runtime we installed allows `yt-dlp` to solve YouTube's bot challenges. If YouTube changes its detection methods or flags your container's IP again, you may need to export a fresh `cookies.txt` from your browser to re-authenticate.
2. **Age-Restricted Videos:** If you try to download a video that requires you to be logged in to verify your age, `yt-dlp` will need a valid, unexpired `cookies.txt` file exported from an account that meets the age requirement.
3. **Members-Only or Private Videos:** If you are trying to download videos that are only accessible to your specific logged-in YouTube account (like paid channel memberships, your own private videos, or unlisted videos shared with you), the `cookies.txt` file provides that access.
4. **Cookie Expiration:** Cookies naturally expire over time or get invalidated if you manually log out of YouTube in the browser you exported them from. If they expire, `yt-dlp` will essentially fall back to anonymous browsing, which might trigger bot detection again.

## How to Update `cookies.txt`

If your downloads stop working and you see `Sign in to confirm you're not a bot` or `Video unavailable` errors in the logs:

1. Log into YouTube in your desktop web browser (Chrome, Firefox, Edge).
2. Use a browser extension like "Get cookies.txt locally" to export your YouTube cookies in Netscape format.
3. Save the exported file as `cookies.txt`.
4. Replace the existing `backend/cookies.txt` file in this project with your newly downloaded file.
5. Rebuild and restart the Docker containers to ensure the new file is mounted properly:
   ```bash
   docker compose up -d --build backend worker
   ```
