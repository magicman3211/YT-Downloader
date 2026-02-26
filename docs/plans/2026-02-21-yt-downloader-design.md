# YouTube Downloader Web App Design

## MVP Requirements
- Web app running inside a Docker Container.
- Core engine: `yt-dlp` for downloading individually linked videos and entire playlists.
- User input: Paste URL into a React dashboard.
- Destination: Videos are downloaded directly to a configured NAS location on the backend.
- Quality Constraint: Videos are always downloaded to a minimum quality of 720p. If the user explicitly selects a resolution on the dashboard (e.g., 1080p, 4K) and it is available, it honors that up to the selected limit.

## Architecture
**Tech Stack:**
- **Backend**: FastAPI (Python 3.12+). Excellent async capabilities for handling heavy `yt-dlp` tasks.
- **Frontend**: React 19 / Vite. Snappy SPA dashboard built using modern UI/UX principles (e.g., shadcn/ui).
- **Task Queue**: Celery + Redis (or FastAPI BackgroundTasks for v1 if Redis is overkill). Manages long-running downloads asynchronously.

**Data Flow:**
1. User pastes a YouTube URL into the React dashboard.
2. Frontend calls a FastAPI `/api/metadata` endpoint.
3. Backend runs `yt-dlp -F` (with `--cookies-from-browser` for YouTube) to fetch metadata without downloading.
4. Frontend displays thumbnail, title, and a dropdown of qualities >= 720p.
5. User selects a quality and triggers download.
6. Backend creates a background task with celery/Redis, generates a Job ID, and returns it.
7. Frontend polls or subscribes (SSE) to `/api/status/{job_id}` for progress.
8. Backend runs `yt-dlp -f [quality]` and saves the output to the NAS directory.

## Core Features
- **URL Parsing & Validation Engine**: Validates inputs, fetches metadata. Use browser cookies to overcome 403 Forbidden errors on YouTube.
- **Quality Selector**: Dropdown showing available formats that pass the >= 720p check.
- **Background Task Runner**: Handles queueing multiple jobs (e.g., playlist support) so the API doesn't hang.
- **Progress Emitter**: Streams stdout of `yt-dlp` (via SSE) to update a sleek progress bar on the dashboard.
- **NAS Destination Display**: Visual indicator of the current download directory path.

## Error Handling & Edge Cases
- **Resolution unavailable**: Fall back horizontally to closest format that is still >= 720p. Fail gracefully if only 480p is available.
- **Network Interruptions**: Ensure `yt-dlp` can resume downloads (`yt-dlp --continue`) without starting from scratch.
- **YouTube 403 Forbidden**: Always inject `--cookies-from-browser chrome` (or relevant setup) to bypass age restrictions or bot checks.
- **Stale Jobs**: Implement timeout/retry mechanics in Celery to ensure the queue doesn't get blocked by frozen connections.
