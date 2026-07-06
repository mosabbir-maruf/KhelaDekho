"use client";

import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import { useCopyButton } from "@/hooks/useCopyButton";

interface CodeBlockProps {
    code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
    const { copied, copy } = useCopyButton();

    return (
        <div className="relative group bg-card border border-border-alt shadow-2xl overflow-hidden font-mono text-xs my-6">
            {/* Raw Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border-b border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                <div className="text-[10px] text-fg-dim font-mono tracking-widest uppercase">system.out</div>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto text-fg-muted bg-transparent flex items-start gap-3 w-full scrollbar-red">
                <span className="text-emerald-500 select-none mr-1 shrink-0">{`$`}</span>
                <pre className="whitespace-pre overflow-x-auto w-full min-w-0">
                    <code className="block w-full">{code}</code>
                </pre>
            </div>

            {/* Copy Button */}
            <button
                onClick={() => copy(code)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-hover-alt hover:bg-hover-alt text-fg-dim hover:text-fg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-border-alt"
                aria-label="Copy code"
            >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    );
}
