"use client";
export const runtime = "edge";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { getV3Channels } from "@/data/admin";
import Tv from "lucide-react/dist/esm/icons/tv";
import Zap from "lucide-react/dist/esm/icons/zap";
import Copy from "lucide-react/dist/esm/icons/copy";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Link from "next/link";

export default function V3ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<any>(null);
  const [qualityIdx, setQualityIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setQualityIdx(0);
    setShowAll(false);
    setChannel(getV3Channels().find((c) => c.id === id) || null);
    setLoading(false);
  }, [id]);

  const selectedUrl = channel?.urls?.[qualityIdx];
  const urls = channel?.urls || [];
  const isTs = selectedUrl?.url?.match(/\.ts($|\?)/);

  const copyUrl = useCallback((u: string) => {
    navigator.clipboard.writeText(u);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero
          icon={<Tv className="w-3 h-3 text-red-500" />}
          badge={channel?.sourceLabel || "V3 Stream"}
          title={channel?.name || "Channel"}
          description={selectedUrl ? `Playing ${selectedUrl.label} · ${urls.length} source${urls.length > 1 ? "s" : ""}` : "Admin-configured stream"}
          hint="Stream buffering? Try another quality."
        />
        {loading ? <LoadingSpinner label="Loading..." /> : !channel ? <div className="text-center py-20 font-mono text-red-500">Channel not found</div> : selectedUrl?.url ? (
          <>
            {urls.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {urls.map((u: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => { setQualityIdx(i); setShowAll(false); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all cursor-pointer ${
                      i === qualityIdx && !showAll
                        ? "border-red-500/30 bg-red-500/[0.03] text-red-400"
                        : "border-border-alt bg-input text-fg-dim hover:text-fg"
                    }`}
                  >
                    <Zap className={`w-3 h-3 ${i === qualityIdx && !showAll ? "text-red-400" : "text-fg-faint"}`} />
                    {u.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono cursor-pointer bg-input text-fg-dim hover:text-fg"
                >
                  {showAll ? "Hide" : "All URLs"}
                </button>
              </div>
            )}

            <div className="border border-border-alt bg-card p-3 text-[10px] font-mono space-y-2">
              <div className="flex items-center justify-between text-fg-dim">
                <span className="uppercase tracking-widest">Active URL</span>
                <div className="flex items-center gap-2">
                  <a href={selectedUrl.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
                  <button onClick={() => copyUrl(selectedUrl.url)} className="hover:text-red-400 transition-colors cursor-pointer">
                    {copied ? <span className="text-green-500 text-[9px]">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-fg-faint break-all truncate">{selectedUrl.url}</p>
            </div>

            {showAll && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono text-fg-dim uppercase tracking-widest">All URLs</p>
                {urls.map((u: any, i: number) => (
                  <div key={i} className="border border-border-alt bg-card px-3 py-2 text-[10px] font-mono">
                    <div className="flex items-center justify-between text-fg-dim">
                      <span className="font-bold">{u.label}</span>
                      <div className="flex items-center gap-2">
                        <a href={u.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-400"><ExternalLink className="w-3 h-3" /></a>
                        <button onClick={() => copyUrl(u.url)} className="hover:text-red-400 cursor-pointer"><Copy className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="text-fg-faint truncate mt-0.5">{u.url}</p>
                  </div>
                ))}
              </div>
            )}

            <VideoPlayer streamUrl={selectedUrl.url} streamType={isTs ? "direct" : "hls"} clearKeys={null} />
          </>
        ) : <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>}
      </div>
    </div>
  );
}
