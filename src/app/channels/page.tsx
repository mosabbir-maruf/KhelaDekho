"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { SearchInput } from "@/components/ui/SearchInput";
import { ChannelListItem } from "@/components/ui/ChannelListItem";
import { StatsGrid } from "@/components/ui/StatsGrid";
import Tv from "lucide-react/dist/esm/icons/tv";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Monitor from "lucide-react/dist/esm/icons/monitor";
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

function needsProxy(u: string) {
  return u.includes('storage.googleapis.com') || u.includes('soccerball.st');
}

async function fetchV2Channels(signal: AbortSignal): Promise<V2Channel[]> {
  const rawBaseUrl = getApiBaseUrl();
  if (!rawBaseUrl) return [];
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${baseUrl}/api/v2/channels`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body?.data?.channels || [];
  } catch {
    return [];
  }
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
      const chs = await fetchV2Channels(controller.signal);
      if (!active) return;
      setChannels(chs);
      setLoading(false);
      const alive = chs.find((c) => c.is_alive && c.stream_url);
      if (alive) setSelectedChannel(alive);
    })();

    return () => { active = false; controller.abort(); };
  }, []);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  const aliveCount = useMemo(() => channels.filter((c) => c.is_alive).length, [channels]);

  const selectChannel = useCallback((ch: V2Channel) => {
    setSelectedChannel(ch);
    setIsMobileDropdownOpen(false);
  }, []);

  const rawStreamUrl = selectedChannel?.stream_url || null;
  const apiBase = getApiBaseUrl();
  const streamUrl = rawStreamUrl && needsProxy(rawStreamUrl)
    ? `${apiBase.replace(/\/+$/, '')}/api/v2/proxy?url=${encodeURIComponent(rawStreamUrl)}`
    : rawStreamUrl;
  const streamType = selectedChannel?.stream_type || "hls";
  const clearkey = selectedChannel?.drm_kid && selectedChannel?.drm_key
    ? { [selectedChannel.drm_kid]: selectedChannel.drm_key }
    : null;
  const hasDrm = !!(selectedChannel?.drm_kid && selectedChannel?.drm_key);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <PageHero
          icon={<Tv className="w-3 h-3 text-red-500" />}
          badge="Browse Streams"
          title="Channels"
          description={<>{aliveCount} active &middot; {channels.length.toLocaleString()} indexed</>}
          hint="Stream buffering? Switch channel or server."
        />

        {loading ? (
          <LoadingSpinner label="Indexing streams..." />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0">
              <SearchInput value={searchQuery} onChange={setSearchQuery} />
              <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-1 mt-3 mb-1 shrink-0">
                {filteredChannels.length} channel{filteredChannels.length !== 1 ? "s" : ""}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-red">
                {filteredChannels.map((ch) => (
                  <ChannelListItem
                    key={ch.id}
                    item={{ name: ch.name, logo: ch.logo, extra: ch.stream_type.toUpperCase() }}
                    selected={selectedChannel?.id === ch.id}
                    onClick={() => {
                      selectChannel(ch);
                      event("stream_view", { channel_name: ch.name, channel_key: String(ch.id), stream_type: "channel_browse" });
                    }}
                    showExtra
                  />
                ))}
                {filteredChannels.length === 0 && (
                  <div className="text-center py-10">
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-4 w-full">
              {selectedChannel ? (
                <>
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{selectedChannel.name}</h2>
                        <p className="font-mono text-xs text-fg-dim">{selectedChannel.stream_type.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-fg-dim">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-fg font-bold">ACTIVE</span>
                      </span>
                    </div>
                  </div>

                  {streamUrl ? (
                    <VideoPlayer streamUrl={streamUrl} streamType={streamType} clearKeys={clearkey} />
                  ) : (
                    <div className="border border-border-alt bg-card p-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Stream unavailable</span>
                      </div>
                    </div>
                  )}

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
                            <ChannelListItem
                              key={ch.id}
                              item={{ name: ch.name, logo: ch.logo, extra: ch.stream_type.toUpperCase() }}
                              selected={selectedChannel?.id === ch.id}
                              onClick={() => selectChannel(ch)}
                              showExtra
                            />
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

                  <StatsGrid
                    items={[
                      { label: "Stream Type", value: selectedChannel.stream_type.toUpperCase(), icon: "zap" },
                      { label: "Drm", value: hasDrm ? "PRESENT" : "NONE", icon: "shield" },
                      { label: "Channel", value: `ID ${selectedChannel.id}`, icon: "monitor" },
                    ]}
                  />
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
