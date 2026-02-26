import { useEffect } from 'react';
import type { DownloadJob } from '../App';
import { Video, CheckCircle, AlertOctagon, Loader, Pause, Play, X } from 'lucide-react';

interface PanelProps {
    activeJobs: Record<string, DownloadJob>;
    setActiveJobs: React.Dispatch<React.SetStateAction<Record<string, DownloadJob>>>;
}

export default function ActiveDownloadsPanel({ activeJobs, setActiveJobs }: PanelProps) {

    useEffect(() => {
        const EventSources: Record<string, EventSource> = {};
        const apiUrl = import.meta.env.VITE_API_URL ?? '';

        Object.keys(activeJobs).forEach(jobId => {
            const job = activeJobs[jobId];
            // Only open connections for active jobs
            if (job.status === 'completed' || job.status === 'failed' || EventSources[jobId]) {
                return;
            }

            console.log("Connecting to SSE for:", jobId);
            const url = `${apiUrl}/api/status/${jobId}`;
            const source = new EventSource(url);

            source.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setActiveJobs(prev => ({
                    ...prev,
                    [jobId]: {
                        ...prev[jobId],
                        status: data.status,
                        progress: Number(data.progress || 0),
                        eta: data.eta || '--',
                        speed: data.speed || '--',
                        playlist_mode: data.playlist_mode,
                        current_video: data.current_video ? Number(data.current_video) : undefined,
                        total_videos: data.total_videos ? Number(data.total_videos) : undefined,
                        video_title: data.video_title
                    }
                }));

                if (data.status === 'completed' || data.status === 'failed') {
                    source.close();
                    delete EventSources[jobId];
                }
            };

            source.onerror = (e) => {
                console.error("SSE Error for", jobId, e);
                source.close();
                delete EventSources[jobId];
            };

            EventSources[jobId] = source;
        });

        return () => {
            // Cleanup all open event sources on unmount
            Object.values(EventSources).forEach(source => source.close());
        };
    }, [Object.keys(activeJobs).join(',')]);

    const handleAction = async (jobId: string, action: 'pause' | 'resume' | 'cancel') => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL ?? '';
            await fetch(`${apiUrl}/api/jobs/${jobId}/${action}`, { method: 'POST' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleGlobalAction = async (action: 'pause' | 'resume' | 'cancel') => {
        const promises = Object.values(activeJobs)
            .filter(job => job.status !== 'completed' && job.status !== 'failed')
            .map(job => handleAction(job.job_id, action));
        await Promise.all(promises);
    };

    const hasActiveJobs = Object.values(activeJobs).some(job => job.status !== 'completed' && job.status !== 'failed');

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xl inline-flex items-center gap-2 font-bold text-foreground">
                    Active Jobs
                </h4>
                {hasActiveJobs && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleGlobalAction('pause')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-all flex items-center gap-1">
                            <Pause className="w-3 h-3" /> Pause All
                        </button>
                        <button onClick={() => handleGlobalAction('resume')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-all flex items-center gap-1">
                            <Play className="w-3 h-3" /> Resume All
                        </button>
                        <button onClick={() => handleGlobalAction('cancel')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-all flex items-center gap-1">
                            <X className="w-3 h-3" /> Cancel All
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {Object.values(activeJobs).map((job) => (
                    <div key={job.job_id} className="glass-card rounded-2xl p-5 border-l-4 border-l-primary shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-xl bg-background/50 border border-white/5`}>
                                    {job.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                                        job.status === 'failed' ? <AlertOctagon className="w-5 h-5 text-red-400" /> :
                                            <Video className="w-5 h-5 text-blue-400" />}
                                </div>
                                <div className="truncate pr-4">
                                    <h5 className="font-semibold text-foreground truncate">{job.title}</h5>
                                    {job.playlist_mode && job.current_video && job.total_videos && (
                                        <p className="text-sm font-medium text-purple-400 mt-1 truncate">
                                            Downloading {job.current_video} of {job.total_videos}: <span className="text-white/80">{job.video_title}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                                        {(job.status === 'starting' || job.status === 'downloading') && <Loader className="w-3 h-3 animate-spin" />}
                                        {job.status === 'paused' && <Pause className="w-3 h-3" />}
                                        {job.status}
                                        {job.status === 'downloading' && ` • ${job.speed} • ETA: ${job.eta}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                {/* Control Buttons */}
                                {job.status !== 'completed' && job.status !== 'failed' && (
                                    <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1 border border-white/5">
                                        {job.status === 'paused' ? (
                                            <button onClick={() => handleAction(job.job_id, 'resume')} className="p-1 hover:bg-white/10 rounded text-green-400 transition-colors" title="Resume"><Play className="w-4 h-4" /></button>
                                        ) : (
                                            <button onClick={() => handleAction(job.job_id, 'pause')} className="p-1 hover:bg-white/10 rounded text-yellow-400 transition-colors" title="Pause"><Pause className="w-4 h-4" /></button>
                                        )}
                                        <button onClick={() => handleAction(job.job_id, 'cancel')} className="p-1 hover:bg-white/10 rounded text-red-400 transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                                    </div>
                                )}

                                <span className="font-bold tabular-nums text-foreground/90 text-right min-w-[3rem]">
                                    {typeof job.progress === 'number' ? job.progress.toFixed(1) : job.progress}%
                                </span>
                            </div>
                        </div>

                        <div className="w-full h-2.5 bg-background/50 rounded-full overflow-hidden shadow-inner border border-white/5">
                            <div
                                className={`h-full transition-all duration-300 rounded-full relative overflow-hidden ${job.status === 'failed' ? 'bg-red-500' :
                                    job.status === 'completed' ? 'bg-green-500' :
                                        'bg-gradient-to-r from-blue-500 to-purple-500'
                                    }`}
                                style={{ width: `${Math.max(job.progress, 0)}%` }}
                            >
                                {/* Shine effect on progress bar */}
                                {(job.status === 'downloading' || job.status === 'processing') && (
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
