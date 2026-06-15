"use client";

export const runtime = "edge";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { getChannels, getMatches, StreamResponse, Match, ChannelInfo, getLiveChannels } from "@/lib/api";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tv from "lucide-react/dist/esm/icons/tv";
import Users from "lucide-react/dist/esm/icons/users";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Zap from "lucide-react/dist/esm/icons/zap";
import Globe from "lucide-react/dist/esm/icons/globe";
import Flag from "lucide-react/dist/esm/icons/flag";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Link from "next/link";
import Image from "next/image";
import { event } from "@/lib/analytics";

export default function LiveMatchPage() {
  const params = useParams();
  const router = useRouter();
  const channelKey = params.channel_key as string;

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [streamData, setStreamData] = useState<StreamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [associatedMatch, setAssociatedMatch] = useState<Match | null>(null);
  const [allChannels, setAllChannels] = useState<ChannelInfo[]>([]);

  const lastLoggedKeyRef = useRef<string | null>(null);
  const lastLoggedMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!channelKey) return;

    let active = true;
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [chResult, liveChResult] = await Promise.all([
          getChannels({}, { signal: controller.signal }),
          getLiveChannels({ signal: controller.signal }),
        ]);

        if (!active) return;

        const foundCh = chResult?.channels.find((c) => c.key === channelKey) || null;
        setAllChannels(liveChResult?.channels || chResult?.channels || []);

        if (!foundCh) {
          setError("Channel not found in the directory.");
          setLoading(false);
          return;
        }
        setChannel(foundCh);

        const matchesResult = await getMatches({ status: "live" }, { signal: controller.signal });
        if (!active) return;

        const liveMatches = matchesResult?.matches || [];
        const matched =
          liveMatches.find((m) => {
            const stageLower = m.stage.toLowerCase();
            const chNameLower = foundCh.name.toLowerCase();
            const chCatLower = foundCh.category.toLowerCase();
            return (
              stageLower.includes(chNameLower) ||
              chNameLower.includes(stageLower) ||
              chCatLower.includes(m.group.toLowerCase())
            );
          }) || liveMatches[0] || null;
        setAssociatedMatch(matched);

        const res = await fetch(`/api/stream?key=${channelKey}`, { signal: controller.signal });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Error ${res.status} retrieving stream`);
        }
        if (!active) return;

        const strData: StreamResponse = await res.json();
        setStreamData(strData);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Error loading stream data:", err);
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load channel stream configuration.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [channelKey]);

  useEffect(() => {
    if (!channel || !streamData || lastLoggedKeyRef.current === channel.key) return;
    lastLoggedKeyRef.current = channel.key;
    event("stream_view", { channel_name: channel.name, channel_key: channel.key, stream_type: streamData.type });
  }, [channel, streamData]);

  useEffect(() => {
    if (!associatedMatch || lastLoggedMatchIdRef.current === associatedMatch.match_id) return;
    lastLoggedMatchIdRef.current = associatedMatch.match_id;
    event("match_view", { match_id: associatedMatch.match_id, team1: associatedMatch.team1.name, team2: associatedMatch.team2.name });
  }, [associatedMatch]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full w-20 h-20" />
          <Loader2 className="relative w-10 h-10 text-red-500 animate-spin" />
        </div>
        <div className="space-y-2 text-center">
          <span className="font-mono text-sm text-fg font-semibold uppercase tracking-wider">
            Mounting Decrypted Feed
          </span>
          <p className="font-mono text-[10px] text-fg-dim uppercase tracking-widest">
            validating stream signatures...
          </p>
        </div>
      </div>
    );
  }

  if (error || !channel || !streamData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="inline-flex mx-auto items-center justify-center w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-mono text-sm font-semibold text-red-400 uppercase tracking-widest">
              Connection Failed
            </h2>
            <p className="font-mono text-xs text-fg-dim leading-relaxed">
              {error || "Unable to reach the upstream decryptor."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Lobby
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasDrm = !!streamData.drm || !!streamData.clearkey?.keys;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ── Hero ── */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {associatedMatch ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">
                      Live Now
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      Online
                    </span>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                  <Monitor className="w-3 h-3 text-fg-dim" />
                  {streamData.type.toUpperCase()}
                </div>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Lobby
              </Link>
            </div>

            {associatedMatch && (
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  {associatedMatch.team1.flag_url ? (
                    <Image src={associatedMatch.team1.flag_url} alt={associatedMatch.team1.name} width={56} height={40} className="object-cover border border-border-alt" unoptimized />
                  ) : (
                    <div className="w-14 h-10 bg-input border border-border-alt flex items-center justify-center">
                      <Flag className="w-4 h-4 text-fg-faint" />
                    </div>
                  )}
                  <span className="font-mono text-xs font-bold text-fg text-center max-w-[80px] truncate">{associatedMatch.team1.name}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="font-mono text-4xl font-bold text-fg tracking-tight">
                    {associatedMatch.score1 ?? 0} - {associatedMatch.score2 ?? 0}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                    {associatedMatch.group || associatedMatch.stage}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {associatedMatch.team2.flag_url ? (
                    <Image src={associatedMatch.team2.flag_url} alt={associatedMatch.team2.name} width={56} height={40} className="object-cover border border-border-alt" unoptimized />
                  ) : (
                    <div className="w-14 h-10 bg-input border border-border-alt flex items-center justify-center">
                      <Flag className="w-4 h-4 text-fg-faint" />
                    </div>
                  )}
                  <span className="font-mono text-xs font-bold text-fg text-center max-w-[80px] truncate">{associatedMatch.team2.name}</span>
                </div>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight text-center break-words px-2">
              {channel.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5 text-sm font-mono">
              <span className="text-fg-dim">
                {channel.category} &middot; {channel.quality} &middot; {channel.resolution}
              </span>
              <span className="text-fg-dim">
                <Users className="w-4 h-4 inline text-red-500 mr-1 -mt-0.5" />
                <span className="text-fg font-bold">{channel.live_viewers.toLocaleString()}</span> watching
              </span>
              <span className="text-fg-dim">
                <Globe className="w-4 h-4 inline text-fg-dim mr-1 -mt-0.5" />
                <span className="text-fg font-bold">{channel.total_views.toLocaleString()}</span> total views
              </span>
              <span className="text-fg-dim">
                <Zap className="w-4 h-4 inline text-fg-dim mr-1 -mt-0.5" />
                <span className="text-fg font-bold">{streamData.type.toUpperCase()}</span> protocol
              </span>
              <span className="text-fg-dim">
                <ShieldCheck className="w-4 h-4 inline text-fg-dim mr-1 -mt-0.5" />
                <span className="text-fg font-bold">{hasDrm ? "Active" : "ClearKey"}</span> encryption
              </span>
            </div>
          </div>
        </div>

        {/* ── Video Player ── */}
        <div>
          <VideoPlayer
            streamUrl={streamData.url}
            streamType={streamData.type}
            clearKeys={streamData.clearkey?.keys || null}
            fallbackSources={streamData.sources || undefined}
          />
        </div>

        {/* ── Related Channels ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hover" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-fg-faint">
              More Channels
            </span>
            <div className="h-px flex-1 bg-hover" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allChannels
              .filter((c) => c.key !== channelKey)
              .slice(0, 8)
              .map((ch) => (
                <Link
                  key={ch.key}
                  href={`/live/${ch.key}`}
                  className="border border-border-alt bg-card p-4 hover:border-red-500/10 hover:bg-red-500/[0.02] transition-all group flex items-start gap-4"
                >
                  <div className="relative w-10 h-10 rounded-lg bg-hover border border-border-alt flex items-center justify-center shrink-0 overflow-hidden group-hover:border-red-500/20 group-hover:bg-red-500/10 transition-all">
                    {ch.image_url ? (
                      <Image src={ch.image_url} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <Tv className="w-4 h-4 text-fg-dim group-hover:text-red-400 transition-colors" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-mono text-xs font-semibold text-fg truncate group-hover:text-red-400 transition-colors">
                      {ch.name}
                    </h3>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-fg-dim">
                      {ch.category}
                    </p>
                    <p className="font-mono text-[9px] text-fg-faint">
                      {ch.resolution} &middot; {ch.live_viewers.toLocaleString()} watching
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-fg-faint shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            {allChannels.filter((c) => c.key !== channelKey).length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                  No other channels available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
