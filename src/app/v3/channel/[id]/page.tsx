"use client";
export const runtime = "edge";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { getV3Channels } from "@/data/admin";
import Tv from "lucide-react/dist/esm/icons/tv";
import Zap from "lucide-react/dist/esm/icons/zap";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

export default function V3ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<any>(null);
  const [qualityIdx, setQualityIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setQualityIdx(0);
    setChannel(getV3Channels().find((c) => c.id === id) || null);
    setLoading(false);
  }, [id]);

  const selectedUrl = channel?.urls?.[qualityIdx];
  const urls = channel?.urls || [];
  const isTs = selectedUrl?.url?.match(/\.ts($|\?)/);

  const desc = selectedUrl
    ? `${selectedUrl.label} · ${urls.length} source${urls.length > 1 ? "s" : ""}`
    : "Admin-configured stream";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero
          icon={<Tv className="w-3 h-3 text-red-500" />}
          badge={channel?.sourceLabel || "V3 Stream"}
          title={channel?.name || "Channel"}
          description={desc}
          hint="Stream buffering? Try another quality."
        />
        {loading ? (
          <LoadingSpinner label="Loading..." />
        ) : !channel ? (
          <div className="text-center py-20 font-mono text-red-500">Channel not found</div>
        ) : selectedUrl?.url ? (
          <>
            {urls.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {urls.map((u: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setQualityIdx(i)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono transition-all cursor-pointer ${
                      i === qualityIdx
                        ? "border-red-500/30 bg-red-500/[0.03] text-red-400"
                        : "border-border-alt bg-input text-fg-dim hover:text-fg"
                    }`}
                  >
                    <Zap className={`w-3 h-3 ${i === qualityIdx ? "text-red-400" : "text-fg-faint"}`} />
                    {u.label}
                  </button>
                ))}
              </div>
            )}
            <VideoPlayer streamUrl={selectedUrl.url} streamType={isTs ? "direct" : "hls"} clearKeys={null} />
          </>
        ) : (
          <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>
        )}
      </div>
    </div>
  );
}
