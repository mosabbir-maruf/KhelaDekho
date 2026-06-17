"use client";

import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import { useCopyButton } from "@/hooks/useCopyButton";

interface CopyButtonProps {
    text: string;
    className?: string;
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
    const { copied, copy } = useCopyButton();

    return (
        <button
            onClick={() => copy(text)}
            className={`hover:text-fg transition-colors bg-hover p-1.5 rounded border border-border-alt hover:bg-hover-alt ${className}`}
            aria-label="Copy code"
        >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
    );
}
