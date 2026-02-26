import { useState } from 'react';
import { DownloadCloud, Clock, User, AlertCircle } from 'lucide-react';
import type { VideoMetadata } from '../App';

interface MetadataCardProps {
    metadata: VideoMetadata;
    onDownload: (formatId: string, qualityLabel: string) => void;
}

export default function MetadataCard({ metadata, onDownload }: MetadataCardProps) {
    const formatSeconds = (sec: number) => {
        const min = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${min}:${s < 10 ? '0' : ''}${s}`;
    };

    const [selectedFormat, setSelectedFormat] = useState<string>(
        metadata.available_formats[0]?.format_id || ''
    );

    const handleDownloadClick = () => {
        const fmt = metadata.available_formats.find((f) => f.format_id === selectedFormat);
        if (fmt) {
            onDownload(fmt.format_id, fmt.quality);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card rounded-3xl overflow-hidden p-6 relative group">

                {/* Decorative corner glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full mix-blend-screen opacity-0 group-hover:opacity-100 transition duration-700"></div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-5/12 aspect-video rounded-xl overflow-hidden relative shadow-lg">
                        <img
                            src={metadata.thumbnail}
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl"></div>
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatSeconds(metadata.duration)}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold leading-tight break-words text-foreground pt-1">
                                {metadata.title}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                <User className="w-4 h-4" />
                                <span>{metadata.uploader}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            {metadata.available_formats.length > 0 ? (
                                <>
                                    <label htmlFor="quality" className="text-sm text-foreground/80 font-medium">
                                        Select Quality (Minimum 720p)
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <select
                                            id="quality"
                                            value={selectedFormat}
                                            onChange={(e) => setSelectedFormat(e.target.value)}
                                            className="flex-1 bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50 appearance-none backdrop-blur-md transition-colors"
                                        >
                                            {metadata.available_formats.map((fmt) => (
                                                <option key={fmt.format_id} value={fmt.format_id} className="bg-background">
                                                    {fmt.quality} {fmt.ext ? `(.${fmt.ext})` : ''} {fmt.vcodec ? `[${fmt.vcodec}]` : ''}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={handleDownloadClick}
                                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] active:scale-[0.98]"
                                        >
                                            <DownloadCloud className="w-5 h-5" />
                                            Download
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-sm font-medium animate-pulse">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    No high-resolution streams available (720p+ required).
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
