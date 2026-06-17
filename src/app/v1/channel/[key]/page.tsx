"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { PageHero } from "@/components/ui/PageHero";
import Tv from "lucide-react/dist/esm/icons/tv";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

export default function V1ChannelPage() {
  const { key } = useParams<{ key: string }>();
  const [streamData, setStreamData] = useState<{ url: string; type: string; clearkey: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/stream?key=${encodeURIComponent(key)}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!active) return;
        setStreamData({ url: data.url || "", type: data.type || "hls", clearkey: data.clearkey || null });
      } catch (e: any) {
        if (active) setError(e.message || "Failed to load stream");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [key]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero icon={<Tv className="w-3 h-3 text-red-500" />} badge="V1 Stream" title={`Channel ${key}`} description="Legacy stream" hint="Stream buffering? Try another channel." />
        {loading ? <LoadingSpinner label="Decrypting stream..." /> : error ? <div className="text-center py-20 font-mono text-red-500">{error}</div> : streamData?.url ? <VideoPlayer streamUrl={streamData.url} streamType={streamData.type} clearKeys={streamData.clearkey} /> : <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>}
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
