"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { getApiBaseUrl } from "@/lib/api";
import Tv from "lucide-react/dist/esm/icons/tv";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

export default function V2ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const controller = new AbortController();
    const baseUrl = (getApiBaseUrl() || "").replace(/\/+$/, "");
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v2/channels/${encodeURIComponent(id)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Channel not found");
        const body = await res.json();
        if (!active) return;
        setChannel(body?.data || null);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        if (active) setError(e.message || "Failed to load channel");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [id]);

  const rawUrl = channel?.stream_url;
  const apiBase = getApiBaseUrl();
  const needsProxy = rawUrl && (rawUrl.includes("storage.googleapis.com") || rawUrl.includes("soccerball.st"));
  const streamUrl = needsProxy && apiBase
    ? `${apiBase.replace(/\/+$/, "")}/api/v2/proxy?url=${encodeURIComponent(rawUrl)}`
    : rawUrl;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero icon={<Tv className="w-3 h-3 text-red-500" />} badge="V2 Stream" title={channel?.name || `Channel ${id}`} description={channel ? `${(channel.stream_type || "HLS").toUpperCase()} stream` : "Loading..."} hint="Stream buffering? Try another channel." />
        {loading ? <LoadingSpinner label="Loading stream..." /> : error ? <div className="text-center py-20 font-mono text-red-500">{error}</div> : streamUrl ? <VideoPlayer streamUrl={streamUrl} streamType={channel?.stream_type || "hls"} clearKeys={channel?.drm_kid ? { [channel.drm_kid]: channel.drm_key } : null} /> : <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>}
      </div>
    </div>
  );
}
