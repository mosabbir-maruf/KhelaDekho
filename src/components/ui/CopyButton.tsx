"use client";

import { useState } from "react";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";

interface CopyButtonProps {
    text: string;
    className?: string;
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`hover:text-fg transition-colors bg-hover p-1.5 rounded border border-border-alt hover:bg-hover-alt ${className}`}
            aria-label="Copy code"
        >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
    );
}
