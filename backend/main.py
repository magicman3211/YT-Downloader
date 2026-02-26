from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import asyncio
import os

from core.downloader import fetch_metadata
from worker import download_video_task

app = FastAPI(title="YouTube Downloader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    format_id: str
    quality_label: str

@app.post("/api/metadata")
async def get_metadata(request: URLRequest):
    try:
        data = fetch_metadata(request.url)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/download")
async def start_download(request: DownloadRequest):
    # Queue the task in celery
    task = download_video_task.delay(request.url, request.format_id, request.quality_label)
    return {"job_id": task.id, "status": "Queued"}

import redis as redis_lib
r = redis_lib.Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"), decode_responses=True)

@app.post("/api/jobs/{job_id}/pause")
async def pause_job(job_id: str):
    r.set(f"job_action:{job_id}", "pause")
    return {"status": "success", "action": "pause"}

@app.post("/api/jobs/{job_id}/resume")
async def resume_job(job_id: str):
    r.set(f"job_action:{job_id}", "resume")
    return {"status": "success", "action": "resume"}

@app.post("/api/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    r.set(f"job_action:{job_id}", "cancel")
    return {"status": "success", "action": "cancel"}

@app.get("/api/status/{job_id}")
async def job_status(request: Request, job_id: str):
    """
    SSE endpoint to stream the status of the background task.
    Reads from Redis where the Celery worker pushes progress updates.
    """
    # Import redis here to avoid circular imports / initialization issues
    import redis
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    r = redis.Redis.from_url(redis_url, decode_responses=True)

    async def event_publisher():
        # Loop infinitely and yield SSE events to the frontend
        while True:
            # If client disconnects, stop
            if await request.is_disconnected():
                break

            # Poll for the latest progress from Redis utilizing the job ID
            progress = r.hgetall(f"job_progress:{job_id}")
            
            if not progress:
                # Setup phase or job not started
                yield {"event": "message", "data": '{"status": "queued", "progress": 0}'}
                await asyncio.sleep(1)
                continue
                
            # Formatting event data
            import json
            yield {
                "event": "message",
                "data": json.dumps(progress)
            }
            
            # If the job is marked complete or failed, we can terminate the stream
            if progress.get("status") in ["completed", "failed"]:
                break
                
            await asyncio.sleep(0.5)

    return EventSourceResponse(event_publisher())
