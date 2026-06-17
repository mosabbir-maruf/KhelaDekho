"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { PageHero } from "@/components/ui/PageHero";
import { getApiBaseUrl } from "@/lib/api";
import Tv from "lucide-react/dist/esm/icons/tv";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

export default function V2ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const baseUrl = (getApiBaseUrl() || "").replace(/\/+$/, "");
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v2/channels?limit=100`, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("Failed to fetch channels");
        const body = await res.json();
        const channels: any[] = body?.data?.channels || [];
        const found = channels.find((c: any) => String(c.id) === id);
        if (!active) return;
        if (!found) { setError("Channel not found"); setLoading(false); return; }
        setChannel(found);
      } catch (e: any) {
        if (active) setError(e.message || "Failed to load channel");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const rawUrl = channel?.stream_url;
  const apiBase = getApiBaseUrl();
  const streamUrl = rawUrl && (rawUrl.includes('storage.googleapis.com') || rawUrl.includes('soccerball.st')) && apiBase
    ? `${apiBase.replace(/\/+$/, "")}/api/v2/proxy?url=${encodeURIComponent(rawUrl)}`
    : rawUrl;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero icon={<Tv className="w-3 h-3 text-red-500" />} badge="V2 Stream" title={channel?.name || `Channel ${id}`} description={channel ? `${channel.stream_type?.toUpperCase() || "HLS"} stream` : "Loading..."} hint="Stream buffering? Try another channel." />
        {loading ? <LoadingSpinner label="Loading stream..." /> : error ? <div className="text-center py-20 font-mono text-red-500">{error}</div> : streamUrl ? <VideoPlayer streamUrl={streamUrl} streamType={channel?.stream_type || "hls"} clearKeys={channel?.drm_kid ? { [channel.drm_kid]: channel.drm_key } : null} /> : <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>}
      </div>
    </div>
  );
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">{label}</span>
    </div>
  );
}
