"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { useCopyButton } from "@/hooks/useCopyButton";
import Tv from "lucide-react/dist/esm/icons/tv";
import Share2 from "lucide-react/dist/esm/icons/share-2";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

export default function V1ChannelPage() {
  const { key } = useParams<{ key: string }>();
  const [streamData, setStreamData] = useState<{ url: string; type: string; clearkey: Record<string, string> | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy: handleShare } = useCopyButton();

  useEffect(() => {
    if (!key) return;
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/stream?key=${encodeURIComponent(key)}`, { signal: controller.signal });
        if (!res.ok) {
          const errText = await res.text().catch(() => "Unknown error");
          throw new Error(errText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!active) return;
        if (!data.url) throw new Error("Empty stream URL returned from server");
        setStreamData({ url: data.url, type: data.type || "hls", clearkey: data.clearkey || null });
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (active) setError(e instanceof Error ? e.message : "Failed to load stream");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [key]);

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero icon={<Tv className="w-3 h-3 text-red-500" />} badge="V1 Stream" title={`Channel ${key}`} description="Legacy stream" hint="Stream buffering? Try another channel." />
        {loading ? <LoadingSpinner label="Decrypting stream..." /> : error ? <div className="text-center py-20 font-mono text-red-500">{error}</div> : streamData?.url ? (
          <>
            <div className="flex items-center justify-between border border-border-alt bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Tv className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-mono text-lg font-bold text-fg tracking-tight">Channel {key}</h2>
                </div>
              </div>
              <button
                onClick={() => handleShare(window.location.href)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border-alt bg-input text-fg-dim hover:text-fg hover:border-border-alt text-xs font-mono transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
            <VideoPlayer streamUrl={streamData.url} streamType={streamData.type} clearKeys={streamData.clearkey} />
            <StatsGrid items={[
              { label: "Server", value: "V1", icon: "zap" },
              { label: "Type", value: (streamData.type || "HLS").toUpperCase(), icon: "shield" },
              { label: "Status", value: "LIVE", highlight: true, icon: "monitor" },
            ]} />
          </>
        ) : <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>}
      </div>
    </div>
  );
}
