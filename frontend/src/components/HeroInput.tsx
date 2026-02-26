import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface HeroInputProps {
    onFetch: (url: string) => void;
    isLoading: boolean;
}

export default function HeroInput({ onFetch, isLoading }: HeroInputProps) {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onFetch(url.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full relative group mx-auto max-w-2xl animate-in slide-in-from-bottom-8 duration-700">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-card/60 backdrop-blur-xl ring-1 ring-white/10 rounded-2xl p-2 w-full shadow-2xl overflow-hidden glass">

                <div className="pl-4 pr-3 text-muted-foreground">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Search className="w-6 h-6 group-hover:text-primary transition-colors" />}
                </div>

                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube or Playlist URL here..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 text-lg py-3 px-2"
                    disabled={isLoading}
                />

                <button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="ml-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                >
                    {isLoading ? 'Scanning...' : 'Fetch Info'}
                </button>
            </div>
        </form>
    );
}
