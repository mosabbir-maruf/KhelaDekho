"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { getV3Channels } from "@/data/admin";
import Tv from "lucide-react/dist/esm/icons/tv";

export default function V3ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<{ name: string; url: string; logo?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const found = getV3Channels().find((c) => c.id === id);
    setChannel(found || null);
    setLoading(false);
  }, [id]);

  const deferredUrl = channel?.url || null;
  const isTs = deferredUrl?.match(/\.ts($|\?)/);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero icon={<Tv className="w-3 h-3 text-red-500" />} badge="V3 Stream" title={channel?.name || "Channel"} description="Admin-configured stream" hint="Stream buffering? Try another channel." />
        {loading ? <LoadingSpinner label="Loading..." /> : !channel ? <div className="text-center py-20 font-mono text-red-500">Channel not found</div> : deferredUrl ? <VideoPlayer streamUrl={deferredUrl} streamType={isTs ? "direct" : "hls"} clearKeys={null} /> : <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>}
      </div>
    </div>
  );
}
