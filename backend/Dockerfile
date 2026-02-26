FROM python:3.12-slim

# Create a non-root user
RUN addgroup --gid 1000 appgroup && \
    adduser --uid 1000 --gid 1000 --disabled-password --gecos "" appuser

WORKDIR /app

# Install system dependencies, primarily ffmpeg which is crucial for yt-dlp to merge formats
# nodejs is required for yt-dlp to solve the YouTube 'n' challenge bot-detection
RUN apt-get update && apt-get install -y \
    ffmpeg \
    aria2 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies first (caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Command will be overridden by docker-compose for either web or worker
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
