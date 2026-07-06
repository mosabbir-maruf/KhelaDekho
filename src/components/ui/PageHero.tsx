import Link from "next/link";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import type { ReactNode } from "react";

interface PageHeroProps {
  icon: ReactNode;
  badge: string;
  title: string;
  titleDot?: string;
  description: ReactNode;
  hint: string;
}

export function PageHero({ icon, badge, title, titleDot = ".", description, hint }: PageHeroProps) {
  return (
    <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
            {icon}
            {badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
            {title}<span className="text-red-500">{titleDot}</span>
          </h1>
          <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
        <Link prefetch={false}
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Lobby
        </Link>
      </div>
      <p className="text-[11px] font-mono text-yellow-500/80 leading-relaxed text-center mt-6">
        {hint}
      </p>
    </div>
  );
}

interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <svg className="w-8 h-8 text-red-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">{label}</span>
    </div>
  );
}
