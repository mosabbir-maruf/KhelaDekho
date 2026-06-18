"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { getApiBaseUrl, sanitizeBaseUrl } from "@/lib/api";
import { useCopyButton } from "@/hooks/useCopyButton";
import Tv from "lucide-react/dist/esm/icons/tv";
import Share2 from "lucide-react/dist/esm/icons/share-2";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

export default function V4ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy: handleShare } = useCopyButton();

  useEffect(() => {
    if (!id) return;
    let active = true;
    const controller = new AbortController();
    const baseUrl = sanitizeBaseUrl(getApiBaseUrl() || "");
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v4/channels/${encodeURIComponent(id)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Channel not found");
        const body = await res.json();
        if (!active) return;
        setChannel(body?.data || null);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (active) setError(e instanceof Error ? e.message : "Failed to load channel");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [id]);

  const rawUrl = channel?.stream_url;
  const streamUrl = rawUrl;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero icon={<Tv className="w-3 h-3 text-red-500" />} badge="V4 Stream" title={channel?.name || `Channel ${id}`} description={channel ? `${(channel.stream_type || "DASH").toUpperCase()} stream` : "Loading..."} hint="Stream buffering? Try another channel." />
        {loading ? <LoadingSpinner label="Loading stream..." /> : error ? <div className="text-center py-20 font-mono text-red-500">{error}</div> : streamUrl ? (
          <>
            <div className="flex items-center justify-between border border-border-alt bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Tv className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{channel?.name}</h2>
                  <p className="font-mono text-xs text-fg-dim">{(channel?.stream_type || "DASH").toUpperCase()} · ACTIVE</p>
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
            <VideoPlayer streamUrl={streamUrl} streamType={channel?.stream_type || "dash"} clearKeys={channel?.drm_kid ? { [channel.drm_kid]: channel.drm_key } : null} />
            <StatsGrid items={[
              { label: "Server", value: "V4", icon: "zap" },
              { label: "Type", value: (channel?.stream_type || "DASH").toUpperCase(), icon: "shield" },
              { label: "Status", value: "ACTIVE", highlight: true, icon: "monitor" },
            ]} />
          </>
        ) : <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>}
      </div>
    </div>
  );
}
