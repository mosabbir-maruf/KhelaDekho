"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { getV3Channels } from "@/data/admin";
import Tv from "lucide-react/dist/esm/icons/tv";
import Zap from "lucide-react/dist/esm/icons/zap";
import Share2 from "lucide-react/dist/esm/icons/share-2";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

export default function V3ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<any>(null);
  const [qualityIdx, setQualityIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
            <div className="flex items-center justify-between border border-border-alt bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Tv className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{channel?.name}</h2>
                  <p className="font-mono text-xs text-fg-dim">{channel?.sourceLabel || "V3"} · {urls.length} source{urls.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border-alt bg-input text-fg-dim hover:text-fg hover:border-border-alt text-xs font-mono transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
            <VideoPlayer streamUrl={selectedUrl.url} streamType={isTs ? "direct" : "hls"} clearKeys={null} />
            <StatsGrid items={[
              { label: "Server", value: "V3", icon: "zap" },
              { label: "URLs", value: `${urls.length}`, icon: "shield" },
              { label: "Status", value: "ONLINE", highlight: true, icon: "monitor" },
            ]} />
          </>
        ) : (
          <div className="text-center py-20 font-mono text-fg-dim">Stream unavailable</div>
        )}
      </div>
    </div>
  );
}
