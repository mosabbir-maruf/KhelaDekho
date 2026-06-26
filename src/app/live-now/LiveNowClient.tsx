"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getApiBaseUrl, sanitizeBaseUrl, LiveNowMatchWithChannels, LiveNowChannel } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/PageHero";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { useCopyButton } from "@/hooks/useCopyButton";
import Tv from "lucide-react/dist/esm/icons/tv";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Radio from "lucide-react/dist/esm/icons/radio";
import Server from "lucide-react/dist/esm/icons/server";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((m) => ({ default: m.VideoPlayer })), { ssr: false });

interface PlayerConfig {
  streamUrl: string;
  streamType: string;
  clearKeys: Record<string, string> | null;
  stats: { label: string; value: string; icon: "zap" | "shield" | "monitor" }[];
}

function formatTeam(name: string): string {
  return name.length > 18 ? name.slice(0, 16) + "…" : name;
}

export default function LiveNowClient() {
  const pathname = usePathname();
  const apiBaseUrl = (getApiBaseUrl() || "").replace(/\/+$/, "");

  const [matches, setMatches] = useState<LiveNowMatchWithChannels[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchIdx, setSelectedMatchIdx] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<LiveNowChannel | null>(null);
  const [mobileMatchOpen, setMobileMatchOpen] = useState(false);
  const [mobileChannelOpen, setMobileChannelOpen] = useState(false);
  const { copied, copy: handleShare } = useCopyButton();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const baseUrl = sanitizeBaseUrl(getApiBaseUrl() || "");
        const xkey = (typeof window !== "undefined"
          ? (window as Window & { __KHELADEKHO_XKEY?: string }).__KHELADEKHO_XKEY
          : "") || process.env.XKEY || "";
        const hdrs: Record<string, string> = { Accept: "application/json" };
        if (xkey) hdrs["xkey"] = xkey;
        const res = await fetch(`${baseUrl}/api/v2/live`, { headers: hdrs });
        if (!active) return;
        const body = res.ok ? await res.json() : {};
        const data: LiveNowMatchWithChannels[] = body?.data?.matches || [];
        setMatches(data);
        if (data.length > 0) setSelectedMatchIdx(0);
      } catch {
        if (active) setMatches([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const selectedMatch = selectedMatchIdx !== null ? matches[selectedMatchIdx] ?? null : null;
  const aliveChannels = useMemo(
    () => selectedMatch?.channels.filter((c) => c.is_alive) ?? [],
    [selectedMatch],
  );

  const selectChannel = useCallback((ch: LiveNowChannel) => {
    setSelectedChannel(ch);
    setMobileChannelOpen(false);
  }, []);

  useEffect(() => {
    setSelectedChannel(null);
  }, [selectedMatchIdx]);

  useEffect(() => {
    if (aliveChannels.length > 0 && !selectedChannel) {
      selectChannel(aliveChannels[0]);
    }
  }, [aliveChannels, selectedChannel, selectChannel]);

  const playerConfig: PlayerConfig | null = useMemo(() => {
    if (!selectedChannel || !selectedChannel.stream_url) return null;
    const isDash = selectedChannel.stream_type === "dash";
    const url = isDash
      ? `${apiBaseUrl}/api/v2/proxy?url=${encodeURIComponent(selectedChannel.stream_url)}&source=v2`
      : selectedChannel.stream_url;
    return {
      streamUrl: url,
      streamType: selectedChannel.stream_type,
      clearKeys: selectedChannel.drm_kid && selectedChannel.drm_key
        ? { [selectedChannel.drm_kid]: selectedChannel.drm_key }
        : null,
      stats: [
        { label: "Source", value: "V2", icon: "zap" as const },
        { label: "Type", value: (selectedChannel.stream_type || "hls").toUpperCase(), icon: "shield" as const },
        { label: "Status", value: selectedChannel.is_alive ? "ACTIVE" : "OFFLINE", icon: "monitor" as const },
      ],
    };
  }, [selectedChannel, apiBaseUrl]);

  const shareUrl = useMemo(() => {
    if (selectedMatchIdx === null) return "";
    return `${window.location.origin}${pathname}?match=${selectedMatchIdx}`;
  }, [pathname, selectedMatchIdx]);

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="relative border border-border-alt bg-card p-6 md:p-8">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="relative space-y-2.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
              <Radio className="w-3 h-3 text-red-500" />
              V2 KICKBD
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
              Live Now<span className="text-red-500">.</span>
            </h1>
            <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
              {matches.length} live match{matches.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading live matches..." />
        ) : matches.length === 0 ? (
          <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
            <div className="text-center space-y-3">
              <Radio className="w-8 h-8 text-fg-dim mx-auto" />
              <p className="font-mono text-sm text-fg-dim font-semibold">No live matches</p>
              <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">Check back later</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Match List - Desktop */}
            <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0 max-h-[calc(100dvh-12rem)]">
              <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-1 mb-2 shrink-0">
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-red space-y-1">
                {matches.map((item, idx) => {
                  const m = item.match;
                  const alive = item.channels.filter((c) => c.is_alive).length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedMatchIdx(idx); setMobileMatchOpen(false); }}
                      className={`w-full text-left border p-3 transition-all cursor-pointer group ${
                        idx === selectedMatchIdx
                          ? "border-red-500/30 bg-red-500/[0.03]"
                          : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-hover flex items-center justify-center overflow-hidden">
                          {m.team_a.logo ? (
                            <img src={m.team_a.logo} alt="" className="w-6 h-6 object-contain" loading="lazy" />
                          ) : (
                            <Tv className="w-4 h-4 text-fg-dim" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-mono truncate">{formatTeam(m.team_a.name)}</div>
                          <div className="text-[11px] font-mono text-fg-dim">vs {formatTeam(m.team_b.name)}</div>
                        </div>
                        <div className="shrink-0">
                          {alive > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              {alive}
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-fg-faint">OFF</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-4 w-full">
              {/* Mobile: Match Selector */}
              <div className="relative lg:hidden w-full shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileMatchOpen((p) => !p)}
                  className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all shadow-md cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="min-w-0 text-center flex-1">
                    <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">Select Match</span>
                    <span className="font-mono text-xs font-bold text-fg truncate block">
                      {selectedMatch ? `${selectedMatch.match.team_a.name} vs ${selectedMatch.match.team_b.name}` : "Tap to select"}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-fg-dim transition-transform duration-200 ${mobileMatchOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileMatchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 max-h-[60dvh] overflow-y-auto">
                    {matches.map((item, idx) => {
                      const m = item.match;
                      const alive = item.channels.filter((c) => c.is_alive).length;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMatchIdx(idx); setMobileMatchOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-xs font-mono transition-all cursor-pointer flex items-center gap-3 ${
                            idx === selectedMatchIdx
                              ? "text-red-400 bg-red-500/[0.03] font-semibold"
                              : "text-fg-dim hover:text-fg hover:bg-hover"
                          }`}
                        >
                          <span className="w-6 h-6 shrink-0 rounded-full bg-hover flex items-center justify-center overflow-hidden">
                            {m.team_a.logo ? (
                              <img src={m.team_a.logo} alt="" className="w-5 h-5 object-contain" loading="lazy" />
                            ) : (
                              <Tv className="w-3 h-3" />
                            )}
                          </span>
                          <span className="flex-1 truncate">{formatTeam(m.team_a.name)} vs {formatTeam(m.team_b.name)}</span>
                          {alive > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedMatch ? (
                <>
                  {/* Match Header */}
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-center shrink-0">
                        <div className="w-10 h-10 mx-auto rounded-full bg-hover flex items-center justify-center overflow-hidden">
                          {selectedMatch.match.team_a.logo ? (
                            <img src={selectedMatch.match.team_a.logo} alt="" className="w-8 h-8 object-contain" loading="lazy" />
                          ) : (
                            <Tv className="w-5 h-5 text-fg-dim" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-fg mt-1 truncate max-w-[80px]">{formatTeam(selectedMatch.match.team_a.name)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-mono text-fg-dim">VS</div>
                        <div className="text-[10px] font-mono text-fg-faint">{selectedMatch.match.league}</div>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="w-10 h-10 mx-auto rounded-full bg-hover flex items-center justify-center overflow-hidden">
                          {selectedMatch.match.team_b.logo ? (
                            <img src={selectedMatch.match.team_b.logo} alt="" className="w-8 h-8 object-contain" loading="lazy" />
                          ) : (
                            <Tv className="w-5 h-5 text-fg-dim" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-fg mt-1 truncate max-w-[80px]">{formatTeam(selectedMatch.match.team_b.name)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleShare(shareUrl)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border-alt bg-input text-fg-dim hover:text-fg hover:border-border-alt text-xs font-mono transition-all cursor-pointer shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Share"}
                    </button>
                  </div>

                  {/* Channel List */}
                  {selectedMatch.channels.length > 0 ? (
                    <>
                      {/* Mobile: Channel Selector */}
                      <div className="relative lg:hidden w-full">
                        <button
                          type="button"
                          onClick={() => setMobileChannelOpen((p) => !p)}
                          className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all shadow-md cursor-pointer"
                        >
                          <Server className="w-4 h-4 text-red-500 shrink-0" />
                          <div className="min-w-0 text-center flex-1">
                            <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">Select Channel</span>
                            <span className="font-mono text-xs font-bold text-fg truncate block">
                              {selectedChannel?.name || "Tap to select"}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-fg-dim transition-transform duration-200 ${mobileChannelOpen ? "rotate-180" : ""}`} />
                        </button>
                        {mobileChannelOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 max-h-[50dvh] overflow-y-auto">
                            {selectedMatch.channels.map((ch, i) => (
                              <button
                                key={i}
                                onClick={() => selectChannel(ch)}
                                disabled={!ch.is_alive}
                                className={`w-full text-left px-4 py-3 text-xs font-mono transition-all cursor-pointer flex items-center gap-3 ${
                                  !ch.is_alive
                                    ? "text-fg-faint opacity-50 cursor-not-allowed"
                                    : selectedChannel === ch
                                    ? "text-red-400 bg-red-500/[0.03] font-semibold"
                                    : "text-fg-dim hover:text-fg hover:bg-hover"
                                }`}
                              >
                                <Server className={`w-3.5 h-3.5 ${ch.is_alive ? "text-green-500" : "text-fg-faint"}`} />
                                <span className="flex-1">{ch.name}</span>
                                <span className="text-[9px] font-mono uppercase">{ch.stream_type}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Desktop: Channel tabs */}
                      <div className="hidden lg:flex flex-wrap gap-2">
                        {selectedMatch.channels.map((ch, i) => (
                          <button
                            key={i}
                            onClick={() => selectChannel(ch)}
                            disabled={!ch.is_alive}
                            className={`flex items-center gap-2 px-3 py-2 border text-xs font-mono transition-all cursor-pointer ${
                              !ch.is_alive
                                ? "border-border-alt bg-hover text-fg-faint opacity-50 cursor-not-allowed"
                                : selectedChannel === ch
                                ? "border-red-500/30 bg-red-500/[0.03] text-red-400"
                                : "border-border-alt bg-card text-fg-dim hover:border-red-500/20 hover:text-fg"
                            }`}
                          >
                            <Server className={`w-3.5 h-3.5 ${ch.is_alive ? "text-green-500" : "text-fg-faint"}`} />
                            {ch.name}
                            <span className="text-[9px] font-mono uppercase text-fg-faint">{ch.stream_type}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="border border-border-alt bg-card p-4 text-center">
                      <p className="font-mono text-xs text-fg-dim">No stream sources available for this match</p>
                    </div>
                  )}

                  {/* Video Player */}
                  {!selectedChannel ? (
                    <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                      <div className="text-center space-y-3">
                        <Tv className="w-8 h-8 text-fg-dim mx-auto" />
                        <p className="font-mono text-sm text-fg-dim font-semibold">Select a channel</p>
                      </div>
                    </div>
                  ) : selectedChannel.stream_url && playerConfig ? (
                    <>
                      <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <Server className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{selectedChannel.name}</h2>
                          </div>
                        </div>
                      </div>
                      <VideoPlayer streamUrl={playerConfig.streamUrl} streamType={playerConfig.streamType} clearKeys={playerConfig.clearKeys} />
                      <StatsGrid items={playerConfig.stats} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                      <p className="font-mono text-xs text-fg-dim">Channel offline</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                  <div className="text-center space-y-3">
                    <Radio className="w-8 h-8 text-fg-dim mx-auto" />
                    <p className="font-mono text-sm text-fg-dim font-semibold">Select a match</p>
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">Choose from the left panel</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
