"use client";

import { useEffect, useState, useMemo } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tv from "lucide-react/dist/esm/icons/tv";
import Search from "lucide-react/dist/esm/icons/search";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import X from "lucide-react/dist/esm/icons/x";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Zap from "lucide-react/dist/esm/icons/zap";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Shield from "lucide-react/dist/esm/icons/shield";
import Link from "next/link";
import Image from "next/image";
import { event } from "@/lib/analytics";

interface V2Channel {
  id: number;
  name: string;
  logo: string | null;
  stream_type: string;
  stream_url: string | null;
  drm_kid: string | null;
  drm_key: string | null;
  is_alive: boolean;
  cached_at: string;
}

async function fetchV2Channels(signal: AbortSignal): Promise<V2Channel[]> {
  const rawBaseUrl = getApiBaseUrl();
  if (!rawBaseUrl) return [];
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/v2/channels`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body?.data?.channels || [];
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<V2Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<V2Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const chs = await fetchV2Channels(controller.signal);
        if (!active) return;
        setChannels(chs);
        setLoading(false);

        const alive = chs.find((c) => c.is_alive && c.stream_url);
        if (alive) setSelectedChannel(alive);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to load channels:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; controller.abort(); };
  }, []);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  const aliveChs = channels.filter((c) => c.is_alive);
  const aliveCount = aliveChs.length;

  const streamUrl = selectedChannel?.stream_url || null;
  const streamType = selectedChannel?.stream_type || "hls";
  const clearkey = selectedChannel?.drm_kid && selectedChannel?.drm_key
    ? { [selectedChannel.drm_kid]: selectedChannel.drm_key }
    : null;
  const hasDrm = !!(selectedChannel?.drm_kid && selectedChannel?.drm_key);

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
                {aliveCount} active &middot; {channels.length.toLocaleString()} indexed
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby
            </Link>
          </div>
          <p className="text-[11px] font-mono text-yellow-500/80 leading-relaxed text-center mt-6">
            Stream buffering? Switch channel or server.
          </p>
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
                    key={ch.id}
                    onClick={() => {
                      setSelectedChannel(ch);
                      event("stream_view", { channel_name: ch.name, channel_key: String(ch.id), stream_type: "channel_browse" });
                    }}
                    className={`w-full text-left border p-3 transition-all cursor-pointer group ${
                      selectedChannel?.id === ch.id
                        ? "border-red-500/30 bg-red-500/[0.03]"
                        : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`relative w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden transition-all ${
                        selectedChannel?.id === ch.id
                          ? "border-red-500/20 bg-red-500/10"
                          : "border-border-alt bg-hover group-hover:border-red-500/20 group-hover:bg-red-500/10"
                      }`}>
                        {ch.logo ? (
                          <Image src={ch.logo} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <Tv className={`w-3.5 h-3.5 transition-colors ${
                            selectedChannel?.id === ch.id ? "text-red-400" : "text-fg-dim group-hover:text-red-400"
                          }`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-mono font-semibold truncate transition-colors ${
                          selectedChannel?.id === ch.id ? "text-red-400" : "text-fg group-hover:text-red-400"
                        }`}>
                          {ch.name}
                        </div>
                        <div className="text-[9px] font-mono text-fg-dim mt-0.5">
                          {ch.stream_type.toUpperCase()}
                        </div>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-green-500" />
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
                          {selectedChannel.stream_type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-fg-dim">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-fg font-bold">ACTIVE</span>
                      </span>
                    </div>
                  </div>

                  {/* Video Player Box */}
                  {streamUrl ? (
                    <VideoPlayer
                      streamUrl={streamUrl}
                      streamType={streamType}
                      clearKeys={clearkey}
                    />
                  ) : (
                    <div className="border border-border-alt bg-card p-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Stream unavailable</span>
                      </div>
                    </div>
                  )}

                  {/* MOBILE ONLY: Dropdown Selector Trigger & Dropdown Menu */}
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
                              key={ch.id}
                              type="button"
                  onClick={() => {
                    setSelectedChannel(ch);
                    setIsMobileDropdownOpen(false);
                    event("stream_view", { channel_name: ch.name, channel_key: String(ch.id), stream_type: "channel_browse_mobile" });
                  }}
                  className={`w-full text-left border p-3 transition-all cursor-pointer group flex items-center justify-between ${
                    selectedChannel?.id === ch.id
                      ? "border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold"
                      : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                  }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                  <div className="text-xs font-mono truncate">{ch.name}</div>
                                  <div className="text-[9px] font-mono text-fg-dim mt-0.5">
                                    {ch.stream_type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-green-500" />
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
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Signal</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-green-500">ACTIVE</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Status</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Zap className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">{selectedChannel.stream_type.toUpperCase()}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Stream Type</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Shield className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">{hasDrm ? "PRESENT" : "NONE"}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Drm</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Monitor className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">ID {selectedChannel.id}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Channel</p>
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
