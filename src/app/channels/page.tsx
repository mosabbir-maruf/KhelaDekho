"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDevicePlatform } from "@/hooks/useDevicePlatform";
import { ChannelInfo, StreamResponse, getChannels } from "@/lib/api";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tv from "lucide-react/dist/esm/icons/tv";
import Users from "lucide-react/dist/esm/icons/users";
import Search from "lucide-react/dist/esm/icons/search";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import X from "lucide-react/dist/esm/icons/x";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Zap from "lucide-react/dist/esm/icons/zap";
import Globe from "lucide-react/dist/esm/icons/globe";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Link from "next/link";
import Image from "next/image";
import { event } from "@/lib/analytics";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelInfo | null>(null);
  const [streamData, setStreamData] = useState<StreamResponse | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  const devicePlatform = useDevicePlatform();
  const autoSelectedRef = useRef(false);

  const isApple = devicePlatform !== "unknown"
    && (devicePlatform === "ios" || devicePlatform === "ipados" || devicePlatform === "macos");

  const fetchStream = useCallback(async (channelKey: string, signal: AbortSignal) => {
    const res = await fetch(`/api/stream?key=${encodeURIComponent(channelKey)}`, { signal });
    if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);
    return res.json() as Promise<StreamResponse>;
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const result = await getChannels({}, { signal: controller.signal });
        if (!active) return;
        const chs = result?.channels || [];
        setChannels(chs);
        setLoading(false);

        if (chs.length > 0) {
          const iosCh = isApple
            ? chs.find((c) => c.source_types.includes("hls") && /^ios/i.test(c.name.trim()))
            : null;
          const initial = iosCh || chs[0];
          autoSelectedRef.current = true;
          setSelectedChannel(initial);

          setStreamLoading(true);
          try {
            const data = await fetchStream(initial.key, controller.signal);
            if (active) setStreamData(data);
          } catch {
            if (active) setStreamData(null);
          } finally {
            if (active) setStreamLoading(false);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to load channels:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; controller.abort(); };
  }, [devicePlatform, isApple, fetchStream]);

  useEffect(() => {
    if (!selectedChannel) return;
    if (autoSelectedRef.current) {
      autoSelectedRef.current = false;
      return;
    }

    let active = true;
    const controller = new AbortController();

    (async () => {
      setStreamLoading(true);
      setStreamData(null);
      try {
        const data = await fetchStream(selectedChannel.key, controller.signal);
        if (active) setStreamData(data);
      } catch {
        if (active) setStreamData(null);
      } finally {
        if (active) setStreamLoading(false);
      }
    })();

    return () => { active = false; controller.abort(); };
  }, [selectedChannel, fetchStream]);

  const filteredChannels = useMemo(() => {
    const filtered = channels.filter((ch) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return ch.name.toLowerCase().includes(q) || ch.category.toLowerCase().includes(q);
    });
    if (searchQuery.trim() || !isApple) return filtered;
    return [...filtered].sort((a, b) => {
      const aIsIOS = a.source_types.includes("hls") && /^ios/i.test(a.name.trim());
      const bIsIOS = b.source_types.includes("hls") && /^ios/i.test(b.name.trim());
      if (aIsIOS !== bIsIOS) return aIsIOS ? -1 : 1;
      return 0;
    });
  }, [channels, searchQuery, isApple]);

  const liveCount = channels.filter((c) => c.live_viewers > 0).length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* ── Hero ── */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Tv className="w-3 h-3 text-red-500" />
                Browse Streams
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Channels<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                {liveCount} active &middot; {channels.length.toLocaleString()} indexed
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Indexing streams...</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* ── Left Sidebar: Channel List (DESKTOP ONLY) ── */}
            <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0">
              <div className="flex items-center gap-2 border border-border-alt bg-card px-3 py-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-fg-dim shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter..."
                  className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-1 mt-3 mb-1 shrink-0">
                {filteredChannels.length} channel{filteredChannels.length !== 1 ? "s" : ""}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-red">
                {filteredChannels.map((ch) => (
                  <button
                    key={ch.key}
                    onClick={() => {
                      setSelectedChannel(ch);
                      event("stream_view", { channel_name: ch.name, channel_key: ch.key, stream_type: "channel_browse" });
                    }}
                    className={`w-full text-left border p-3 transition-all cursor-pointer group ${
                      selectedChannel?.key === ch.key
                        ? "border-red-500/30 bg-red-500/[0.03]"
                        : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`relative w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden transition-all ${
                        selectedChannel?.key === ch.key
                          ? "border-red-500/20 bg-red-500/10"
                          : "border-border-alt bg-hover group-hover:border-red-500/20 group-hover:bg-red-500/10"
                      }`}>
                        {ch.image_url ? (
                          <Image src={ch.image_url} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <Tv className={`w-3.5 h-3.5 transition-colors ${
                            selectedChannel?.key === ch.key ? "text-red-400" : "text-fg-dim group-hover:text-red-400"
                          }`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-mono font-semibold truncate transition-colors ${
                          selectedChannel?.key === ch.key ? "text-red-400" : "text-fg group-hover:text-red-400"
                        }`}>
                          {ch.name}
                        </div>
                        <div className="text-[9px] font-mono text-fg-dim mt-0.5">
                          {ch.category} &middot; {ch.quality} &middot; {ch.resolution}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-fg-faint flex items-center gap-0.5 shrink-0">
                        <Users className="w-2.5 h-2.5 text-red-500/60" />
                        {ch.live_viewers.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
                {filteredChannels.length === 0 && (
                  <div className="text-center py-10">
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Center / Right: Video Player & Mobile Selector ── */}
            <div className="flex-1 min-w-0 space-y-4 w-full">
              {selectedChannel ? (
                <>
                  {/* Channel details header */}
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{selectedChannel.name}</h2>
                        <p className="font-mono text-xs text-fg-dim">
                          {selectedChannel.category} &middot; {selectedChannel.quality} &middot; {selectedChannel.resolution} &middot; {selectedChannel.live_viewers.toLocaleString()} watching
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-fg-dim">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-fg font-bold">{selectedChannel.live_viewers.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-fg font-bold">{selectedChannel.total_views.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Video Player Box */}
                  {streamLoading ? (
                    <div className="flex items-center justify-center py-20 border border-border-alt bg-card">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                        <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Initializing stream...</span>
                      </div>
                    </div>
                  ) : streamData ? (
                    <VideoPlayer
                      streamUrl={streamData.url}
                      streamType={streamData.type}
                      clearKeys={streamData.clearkey?.keys || null}
                      fallbackSources={streamData.sources || undefined}
                    />
                  ) : (
                    <div className="border border-red-500/10 bg-red-500/[0.02] p-12 text-center">
                      <span className="font-mono text-xs text-red-400 uppercase tracking-widest">Stream Unavailable</span>
                    </div>
                  )}

                  {/* MOBILE ONLY: Dropdown Selector Trigger & Dropdown Menu (directly under video player!) */}
                  <div className="relative lg:hidden w-full">
                    <button
                      type="button"
                      onClick={() => setIsMobileDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all text-left shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Tv className="w-4 h-4 text-red-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">Active Channel</span>
                          <span className="font-mono text-xs font-bold text-fg truncate block">{selectedChannel.name}</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-fg-dim transition-transform duration-200 ${isMobileDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isMobileDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 max-h-[60vh] flex flex-col">
                        <div className="flex items-center gap-2 border-b border-border-alt px-3 py-2 bg-card shrink-0">
                          <Search className="w-3.5 h-3.5 text-fg-dim shrink-0" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search channel..."
                            className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
                          />
                          {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg">
                              <X className="w-3" />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 p-1 scrollbar-red">
                          {filteredChannels.map((ch) => (
                            <button
                              key={ch.key}
                              type="button"
                              onClick={() => {
                                setSelectedChannel(ch);
                                setIsMobileDropdownOpen(false);
                                event("stream_view", { channel_name: ch.name, channel_key: ch.key, stream_type: "channel_browse_mobile" });
                              }}
                              className={`w-full text-left border p-3 transition-all cursor-pointer group flex items-center justify-between ${
                                selectedChannel?.key === ch.key
                                  ? "border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold"
                                  : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                  <div className="text-xs font-mono truncate">{ch.name}</div>
                                  <div className="text-[9px] font-mono text-fg-dim mt-0.5">{ch.category} &middot; {ch.resolution}</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-fg-faint flex items-center gap-0.5 shrink-0">
                                <Users className="w-2.5 h-2.5 text-red-500/60" />
                                {ch.live_viewers.toLocaleString()}
                              </span>
                            </button>
                          ))}
                          {filteredChannels.length === 0 && (
                            <div className="text-center py-8">
                              <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Channel stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">Live</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-fg">{selectedChannel.status.toUpperCase()}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Status</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Zap className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">{streamData?.type.toUpperCase() || "—"}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Sources</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Globe className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">{selectedChannel.total_views.toLocaleString()}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Total Views</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Monitor className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">{selectedChannel.resolution} {selectedChannel.quality}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Resolution</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl border border-border-alt bg-hover flex items-center justify-center mx-auto">
                      <Monitor className="w-6 h-6 text-fg-dim" />
                    </div>
                    <p className="font-mono text-sm text-fg-dim font-semibold">Select a channel</p>
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                      Choose from the left panel to start watching
                    </p>
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
