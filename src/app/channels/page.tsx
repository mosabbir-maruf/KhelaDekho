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

interface V1Channel {
  key: string;
  name: string;
  image_url: string | null;
  category: string;
  quality: string;
  status: string;
  live_viewers: number;
}

function needsProxy(u: string) {
  return u.includes('storage.googleapis.com') || u.includes('soccerball.st');
}

async function fetchChannels(version: "v1" | "v2", signal: AbortSignal): Promise<any[]> {
  const rawBaseUrl = getApiBaseUrl();
  if (!rawBaseUrl) return [];
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${baseUrl}/api/${version}/channels?limit=100`, {
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

function isV1Alive(ch: any): boolean {
  return ch.status === "live";
}

function isV2Alive(ch: any): boolean {
  return ch.is_alive && ch.stream_url;
}

export default function ChannelsPage() {
  const [apiVersion, setApiVersion] = useState<"v1" | "v2">("v2");
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setSelectedChannel(null);
      const chs = await fetchChannels(apiVersion, controller.signal);
      if (!active) return;
      setChannels(chs);
      setLoading(false);
      const alive = chs.find(apiVersion === "v1" ? isV1Alive : isV2Alive);
      if (alive) setSelectedChannel(alive);
    })();

    return () => { active = false; controller.abort(); };
  }, [apiVersion]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter((ch: any) => ch.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  const aliveCount = useMemo(
    () => channels.filter(apiVersion === "v1" ? isV1Alive : isV2Alive).length,
    [channels, apiVersion],
  );

  const selectChannel = useCallback((ch: any) => {
    setSelectedChannel(ch);
    setIsMobileDropdownOpen(false);
  }, []);

  const toggleVersion = useCallback(() => {
    setApiVersion((prev) => (prev === "v1" ? "v2" : "v1"));
  }, []);

  const isV1 = apiVersion === "v1";
  const [v1StreamData, setV1StreamData] = useState<{ url: string; type: string; clearkey: any } | null>(null);

  useEffect(() => {
    if (!isV1 || !selectedChannel) { setV1StreamData(null); return; }
    let active = true;
    const key = (selectedChannel as V1Channel).key;
    if (!key) return;
    (async () => {
      try {
        const res = await fetch(`/api/stream?key=${encodeURIComponent(key)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setV1StreamData({
          url: data.url || "",
          type: data.type || "hls",
          clearkey: data.clearkey || null,
        });
      } catch {}
    })();
    return () => { active = false; };
  }, [isV1, selectedChannel]);

  const streamUrl = useMemo(() => {
    if (!selectedChannel) return null;
    if (isV1) return v1StreamData?.url || null;
    const v2ch = selectedChannel as V2Channel;
    const raw = v2ch.stream_url;
    if (!raw) return null;
    const apiBase = getApiBaseUrl();
    if (needsProxy(raw) && apiBase) {
      return `${apiBase.replace(/\/+$/, "")}/api/v2/proxy?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  }, [selectedChannel, isV1, v1StreamData]);

  const streamType = isV1 ? v1StreamData?.type || "hls" : (selectedChannel as V2Channel)?.stream_type || "hls";
  const clearkey = isV1
    ? v1StreamData?.clearkey || null
    : ((selectedChannel as V2Channel)?.drm_kid
        ? { [(selectedChannel as V2Channel).drm_kid!]: (selectedChannel as V2Channel).drm_key! }
        : null);
  const hasDrm = isV1 ? !!v1StreamData?.clearkey : !!(selectedChannel as V2Channel)?.drm_kid;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Tv className="w-3 h-3 text-red-500" />
                {isV1 ? "Legacy Streams" : "Browse Streams"}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Channels<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                {aliveCount} active &middot; {channels.length.toLocaleString()} indexed
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={toggleVersion}
                className="inline-flex items-center gap-2 px-4 py-2 border text-xs font-mono transition-all cursor-pointer shrink-0 bg-input text-fg-dim hover:text-fg hover:border-border-alt"
              >
                <span className={`w-2 h-2 rounded-full ${isV1 ? "bg-yellow-500" : "bg-green-500"}`} />
                API v{isV1 ? "1" : "2"}
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
              >
                <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Lobby
              </a>
            </div>
          </div>
          <p className="text-[11px] font-mono text-yellow-500/80 leading-relaxed text-center mt-6">
            Stream buffering? Switch channel or server.
          </p>
        </div>

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
                {filteredChannels.map((ch: any) => (
                  <ChannelListItem
                    key={isV1 ? ch.key : ch.id}
                    item={{ name: ch.name, logo: ch.image_url || ch.logo, extra: isV1 ? (ch.category || "").toUpperCase() : (ch.stream_type || "").toUpperCase() }}
                    selected={isV1 ? selectedChannel?.key === ch.key : selectedChannel?.id === ch.id}
                    onClick={() => {
                      selectChannel(ch);
                      event("stream_view", { channel_name: ch.name, channel_key: String(isV1 ? ch.key : ch.id), stream_type: "channel_browse" });
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
                          <p className="font-mono text-xs text-fg-dim">
                            {isV1 ? (selectedChannel as V1Channel).category || "N/A" : ((selectedChannel as V2Channel).stream_type || "HLS").toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-fg-dim">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isV1 ? "bg-yellow-500" : "bg-green-500"}`} />
                          <span className="text-fg font-bold">{isV1 ? "LEGACY" : "ACTIVE"}</span>
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
                          {filteredChannels.map((ch: any) => (
                            <ChannelListItem
                              key={isV1 ? ch.key : ch.id}
                    item={{ name: ch.name, logo: ch.image_url || ch.logo, extra: isV1 ? (ch.category || "").toUpperCase() : (ch.stream_type || "").toUpperCase() }}
                              selected={isV1 ? selectedChannel?.key === ch.key : selectedChannel?.id === ch.id}
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
                    items={
                      isV1
                        ? [
                            { label: "Category", value: (selectedChannel as V1Channel).category, icon: "zap" },
                            { label: "Quality", value: (selectedChannel as V1Channel).quality, icon: "shield" },
                            { label: "Viewers", value: String((selectedChannel as V1Channel).live_viewers), icon: "monitor" },
                          ]
                        : [
                            { label: "Stream Type", value: ((selectedChannel as V2Channel).stream_type || "HLS").toUpperCase(), icon: "zap" },
                            { label: "Drm", value: hasDrm ? "PRESENT" : "NONE", icon: "shield" },
                            { label: "Channel", value: `ID ${(selectedChannel as V2Channel).id}`, icon: "monitor" },
                          ]
                    }
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
