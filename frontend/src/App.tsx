import { useState } from 'react';
import HeroInput from './components/HeroInput';
import MetadataCard from './components/MetadataCard';
import ActiveDownloadsPanel from './components/ActiveDownloadsPanel';

export type VideoFormat = {
  format_id: string;
  quality: string;
  ext: string;
  vcodec?: string;
  filesize?: number;
};

export type VideoMetadata = {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  url: string;
  available_formats: VideoFormat[];
};

export type DownloadJob = {
  job_id: string;
  status: string;
  progress: number;
  eta: string;
  speed: string;
  title: string;
  playlist_mode?: string;
  current_video?: number;
  total_videos?: number;
  video_title?: string;
};

function App() {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<Record<string, DownloadJob>>({});

  const handleFetchMetadata = async (url: string) => {
    setLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const response = await fetch(`${apiUrl}/api/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch metadata');
      }

      const data = await response.json();
      setMetadata(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDownload = async (formatId: string, qualityLabel: string) => {
    if (!metadata) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const response = await fetch(`${apiUrl}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: metadata.url,
          format_id: formatId,
          quality_label: qualityLabel,
        }),
      });

      if (!response.ok) throw new Error('Failed to start download');

      const data = await response.json();
      const jobId = data.job_id;

      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        [jobId]: {
          job_id: jobId,
          status: 'Starting...',
          progress: 0,
          eta: '--',
          speed: '--',
          title: metadata.title,
        }
      }));

      // In a real app we'd connect to SSE here. For MVP, the ActiveDownloadsPanel handles it.

    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse-slow"></div>
      <div className="absolute top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-4xl z-10 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Craigs Youtube Downloader
          </h1>
          <p className="text-lg text-muted-foreground">
            Paste a link to download videos in stunning 720p+ quality straight to your NAS.
          </p>
        </div>

        <HeroInput onFetch={handleFetchMetadata} isLoading={loading} />

        {error && (
          <div className="p-4 rounded-xl bg-destructive/20 border border-destructive text-destructive-foreground text-center animate-in fade-in slide-in-from-bottom-4">
            {error}
          </div>
        )}

        {metadata && !loading && (
          <MetadataCard
            metadata={metadata}
            onDownload={handleStartDownload}
          />
        )}

        {Object.keys(activeJobs).length > 0 && (
          <ActiveDownloadsPanel
            activeJobs={activeJobs}
            setActiveJobs={setActiveJobs}
          />
        )}
      </div>
    </div>
  );
}

export default App;
