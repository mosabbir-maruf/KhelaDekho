import Link from "next/link";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";

export default function NotFound() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[70dvh] px-6">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="space-y-2">
                    <p className="text-[10px] font-mono text-fg-faint uppercase tracking-widest">
                        ERROR_404
                    </p>
                    <h1 className="text-6xl font-mono font-bold text-fg tracking-tight">
                        <span className="text-red-500">4</span>0<span className="text-red-500">4</span>
                    </h1>
                    <p className="font-mono text-sm text-fg-dim leading-relaxed">
                        The page you are looking for does not exist or has been moved.
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border-alt bg-card text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Lobby
                </Link>
            </div>
        </div>
    );
}
