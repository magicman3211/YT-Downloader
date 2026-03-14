# YT-Downloader

A high-performance, full-stack YouTube video downloader built with **FastAPI**, **React**, and **Celery**. This application allows users to fetch video metadata, choose quality formats, and track download progress in real-time.

## 🚀 Features

- **Metadata Fetching**: Quickly retrieve video titles, thumbnails, and available formats.
- **Dynamic Quality Selection**: Choose from various video and audio qualities.
- **Real-time Progress Tracking**: Powered by Server-Sent Events (SSE) for live download updates.
- **Background Processing**: Uses Celery workers to handle downloads without blocking the UI.
- **Dockerized**: Easy setup and deployment using Docker Compose.
- **Modern UI**: Sleek and responsive interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Downloader**: `yt-dlp`
- **Task Queue**: Celery
- **Message Broker/Cache**: Redis
- **API Type**: REST + SSE (Server-Sent Events)

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/magicman3211/YT-Downloader.git
   cd YT-Downloader
   ```

2. Start the application:
   ```bash
   docker compose up --build
   ```

3. Access the app:
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)

## 🔧 Configuration

The application uses an `.env` file for configuration. Ensure your backend environment variables are correctly set for Redis and other services.

## 📄 License

This project is open-source and available for educational purposes.