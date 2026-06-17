"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { CATEGORIES, LOGO_BASE, LOGO_MAP, getCategory } from "@/data/liveTv";
import type { Category } from "@/data/liveTv";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Image from "next/image";
import Tv from "lucide-react/dist/esm/icons/tv";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Zap from "lucide-react/dist/esm/icons/zap";
import Shield from "lucide-react/dist/esm/icons/shield";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import X from "lucide-react/dist/esm/icons/x";
import Search from "lucide-react/dist/esm/icons/search";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

interface M3u8Channel {
  name: string;
  url: string;
}

function getLogoUrl(name: string): string | null {
  const key = name.toLowerCase().trim().replace(/\s+/g, " ");
  const filename = LOGO_MAP[key];
  if (filename) return LOGO_BASE + encodeURIComponent(filename);
  return null;
}

const JSON_URL = "https://raw.githubusercontent.com/boy653859/m3u8/main/live_channel.json";
const CACHE_KEY = "khela_live_tv_channels";
const CACHE_TTL = 60 * 60 * 1000;

function loadCachedChannels(): M3u8Channel[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCachedChannels(chs: M3u8Channel[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: chs, ts: Date.now() }));
  } catch {}
}

export default function LiveTvPage() {
  const [channels, setChannels] = useState<M3u8Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<M3u8Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let cachedSelection: M3u8Channel | null = null;

    (async () => {
      const cached = loadCachedChannels();
      if (cached && cached.length > 0) {
        setChannels(cached);
        cachedSelection = cached[0];
        setSelectedChannel(cached[0]);
        setLoading(false);
      }

      try {
        const res = await fetch(JSON_URL, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch channels");
        const data = await res.json();
        if (!active) return;
        const chs: M3u8Channel[] = data.channels || [];
        setChannels(chs);
        saveCachedChannels(chs);
        if (chs.length > 0) {
          const stillSelected = cachedSelection && chs.some((c) => c.name === cachedSelection!.name && c.url === cachedSelection!.url);
          if (!stillSelected) setSelectedChannel(chs[0]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!cachedSelection) console.error("Failed to load channels:", err);
      } finally {
        if (active && !cachedSelection) setLoading(false);
      }
    })();

    return () => { active = false; controller.abort(); };
  }, []);

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (activeCategory !== "All") {
      result = result.filter((ch) => getCategory(ch.name) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ch) => ch.name.toLowerCase().includes(q));
    }
    return result;
  }, [channels, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: channels.length };
    for (const ch of channels) {
      const cat = getCategory(ch.name);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [channels]);

  const selectChannel = useCallback((ch: M3u8Channel) => {
    setSelectedChannel(ch);
    setIsMobileDropdownOpen(false);
  }, []);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 flex-1 min-h-0">
        <PageHero
          icon={<Tv className="w-3 h-3 text-red-500" />}
          badge="Browse Streams"
          title="Live TV"
          description="Streaming live TV channels"
          hint="Stream buffering? Switch channel or server."
        />

        {loading ? <LoadingSpinner label="Indexing streams..." /> : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-6 items-stretch flex-1 min-h-0 overflow-hidden grid-rows-[1fr]">
            {/* ── Left: Channel List ── */}
            <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card overflow-hidden min-h-0">
              <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-3 py-2 border-b border-border-alt shrink-0">
                {filteredChannels.length} channel{filteredChannels.length !== 1 ? "s" : ""}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 space-y-1 p-2 scrollbar-red">
                {filteredChannels.map((ch, i) => (
                  <button
                    key={`${ch.name}-${i}`}
                    onClick={() => selectChannel(ch)}
                    className={`w-full text-left border p-3 transition-all cursor-pointer group ${
                      selectedChannel?.name === ch.name && selectedChannel?.url === ch.url
                        ? "border-red-500/30 bg-red-500/[0.03]"
                        : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`relative w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden transition-all ${
                        selectedChannel?.name === ch.name && selectedChannel?.url === ch.url
                          ? "border-red-500/20 bg-red-500/10"
                          : "border-border-alt bg-hover group-hover:border-red-500/20 group-hover:bg-red-500/10"
                      }`}>
                        {(() => {
                          const logoUrl = getLogoUrl(ch.name);
                          return logoUrl ? (
                            <Image src={logoUrl} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <Tv className={`w-3.5 h-3.5 transition-colors ${
                              selectedChannel?.name === ch.name ? "text-red-400" : "text-fg-dim group-hover:text-red-400"
                            }`} />
                          );
                        })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-mono font-semibold truncate transition-colors ${
                          selectedChannel?.name === ch.name ? "text-red-400" : "text-fg group-hover:text-red-400"
                        }`}>
                          {ch.name}
                        </div>
                        <div className="text-[9px] font-mono text-fg-dim mt-0.5">
                          {getCategory(ch.name).toUpperCase()}
                        </div>
                      </div>
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

            {/* ── Middle: Player ── */}
            <div className="min-w-0 w-full min-h-0 flex flex-col gap-3">
              {selectedChannel ? (
                <>
                  {/* Channel details header */}
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center overflow-hidden">
                        {(() => {
                          const logoUrl = getLogoUrl(selectedChannel.name);
                          return logoUrl ? (
                            <Image src={logoUrl} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                          ) : (
                            <Tv className="w-5 h-5 text-red-400" />
                          );
                        })()}
                      </div>
                      <div>
                        <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{selectedChannel.name}</h2>
                        <p className="font-mono text-xs text-fg-dim">{getCategory(selectedChannel.name)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-fg-dim">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-fg font-bold">STREAM</span>
                      </span>
                    </div>
                  </div>

                  <VideoPlayer streamUrl={selectedChannel.url} streamType="hls" clearKeys={null} />

                  {/* Fixed bottom: stats grid */}
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
                      <p className="font-mono text-sm font-bold text-fg">HLS</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Stream Type</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Shield className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">NONE</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Drm</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Monitor className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">{channels.length}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Channels</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                  <div className="text-center space-y-3 py-16">
                    <div className="w-12 h-12 rounded-xl border border-border-alt bg-hover flex items-center justify-center mx-auto">
                      <Monitor className="w-6 h-6 text-fg-dim" />
                    </div>
                    <p className="font-mono text-sm text-fg-dim font-semibold">Select a channel</p>
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                      Select a channel from the list to start watching
                    </p>
                  </div>
                </div>
              )}

              {/* MOBILE ONLY: Channel selector */}
              <div className="relative lg:hidden w-full shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all text-left shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Tv className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">{selectedChannel ? "Active Channel" : "Select Channel"}</span>
                      <span className="font-mono text-xs font-bold text-fg truncate block">{selectedChannel?.name || "Tap to browse"}</span>
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
                      {filteredChannels.map((ch, i) => (
                        <button
                          key={`mobile-${ch.name}-${i}`}
                          type="button"
                          onClick={() => selectChannel(ch)}
                          className={`w-full text-left border p-3 transition-all cursor-pointer group flex items-center justify-between ${
                            selectedChannel?.name === ch.name
                              ? "border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold"
                              : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <div className="text-xs font-mono truncate">{ch.name}</div>
                              <div className="text-[9px] font-mono text-fg-dim mt-0.5">{getCategory(ch.name).toUpperCase()}</div>
                            </div>
                          </div>
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
            </div>

            {/* ── Right: Filter List ── */}
            <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card p-3 gap-3 min-h-0 overflow-y-auto">
              {/* Category filter */}
              <div className="space-y-0.5">
                {CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.label] || 0;
                  const isActiveCat = activeCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => { setActiveCategory(cat.label); setSearchQuery(""); }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left border transition-all cursor-pointer group ${
                        isActiveCat
                          ? "border-red-500/30 bg-red-500/[0.03]"
                          : "border-transparent hover:border-red-500/10 hover:bg-red-500/[0.02]"
                      }`}
                    >
                      <span className={`font-mono text-[11px] transition-colors ${
                        isActiveCat ? "text-red-400 font-semibold" : "text-fg-dim group-hover:text-fg"
                      }`}>
                        {cat.label}
                      </span>
                      <span className={`font-mono text-[10px] ${
                        isActiveCat ? "text-red-400/60" : "text-fg-faint"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
