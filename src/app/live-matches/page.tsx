"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getApiBaseUrl, sanitizeBaseUrl } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/PageHero";
import { SearchInput } from "@/components/ui/SearchInput";
import { ChannelListItem } from "@/components/ui/ChannelListItem";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { useCopyButton } from "@/hooks/useCopyButton";
import { Virtuoso } from "react-virtuoso";
import Tv from "lucide-react/dist/esm/icons/tv";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Share2 from "lucide-react/dist/esm/icons/share-2";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

interface StreamingChannel {
  id: number | string;
  name: string;
  logo: string | null;
  stream_type: string;
  stream_url: string | null;
  drm_kid: string | null;
  drm_key: string | null;
  is_alive: boolean;
  cached_at: string;
}

interface V3Channel {
  name: string;
  logo?: string;
  group?: string;
  url: string;
  type?: string;
  kid?: string;
  key?: string;
  status?: string;
  verified_at?: string;
  status_code?: number;
  content_type?: string;
  id?: string;
}

type ApiVersion = "v1" | "v2" | "v3" | "v4";

interface ChannelData {
  name: string;
  logo?: string | null;
  image_url?: string | null;
  group?: string;
  stream_url?: string | null;
  stream_type?: string;
  url?: string;
  category?: string;
  key?: string;
  id?: string | number;
  status?: string;
}

interface VersionMeta {
  color: string;
  label: string;
  alive: (ch: ChannelData) => boolean;
  id: (ch: ChannelData) => string;
  extra: (ch: ChannelData) => string;
}

const VERSION_CONFIG: Record<ApiVersion, VersionMeta> = {
  v1: {
    color: "bg-yellow-500", label: "V1 Streams",
    alive: (ch) => ch.status === "live",
    id: (ch) => String(ch.key),
    extra: (ch) => (ch.category || "").toUpperCase(),
  },
  v2: {
    color: "bg-green-500", label: "V2 Streams",
    alive: (ch) => !!ch.stream_url,
    id: (ch) => String(ch.id),
    extra: (ch) => (ch.stream_type || "").toUpperCase(),
  },
  v3: {
    color: "bg-cyan-500", label: "V3 Streams",
    alive: (ch) => !!ch.url,
    id: (ch) => String(ch.id || ch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
    extra: (ch) => (ch.group || "").toUpperCase(),
  },
  v4: {
    color: "bg-purple-500", label: "V4 Streams",
    alive: (ch) => !!ch.stream_url,
    id: (ch) => String(ch.id),
    extra: (ch) => (ch.stream_type || "").toUpperCase(),
  },
};

function getUrlParams() {
  if (typeof window === "undefined") return { v: null, ch: null };
  const params = new URLSearchParams(window.location.search);
  return { v: params.get("v"), ch: params.get("ch") };
}

export default function LiveMatchesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [apiVersion, setApiVersion] = useState<ApiVersion>("v4");
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ApiVersion | null>(null);
  const [v1StreamData, setV1StreamData] = useState<{ url: string; type: string; clearkey: Record<string, string> | null } | null>(null);
  const [v1Error, setV1Error] = useState<string | null>(null);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const { copied, copy: handleShare } = useCopyButton();
  const channelsCache = useRef<Map<string, ChannelData[]>>(new Map());

  const cfg = VERSION_CONFIG[apiVersion];
  const apiBase = useMemo(() => getApiBaseUrl(), []);

  const selectAndReplaceUrl = useCallback((ch: ChannelData) => {
    setSelectedChannel(ch);
    setSelectedVersion(apiVersion);
    setV1StreamData(null);
    setV1Error(null);
    const id = cfg.id(ch);
    router.replace(`${pathname}?v=${apiVersion}&ch=${encodeURIComponent(id)}`, { scroll: false });
  }, [apiVersion, pathname, router, cfg]);

  useEffect(() => {
    const { v } = getUrlParams();
    if (v && ["v1", "v2", "v3", "v4"].includes(v)) setApiVersion(v as ApiVersion);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const rawBaseUrl = getApiBaseUrl();
    const baseUrl = rawBaseUrl ? sanitizeBaseUrl(rawBaseUrl) : "";
    (async () => {
      setLoading(true);
      setSelectedChannel(null);
      setSelectedVersion(null);
      setV1StreamData(null);
      setV1Error(null);
      try {
        const cached = channelsCache.current.get(apiVersion);
        let fetched: ChannelData[];
        if (cached) {
          fetched = cached;
        } else {
          const url = apiVersion === "v3"
            ? "/api/playlist?source=live-matches"
            : `${baseUrl}/api/${apiVersion}/channels${apiVersion === "v1" || apiVersion === "v2" ? "?limit=200" : "?alive=true"}`;
          const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
          if (!active) return;
          const body = res.ok ? await res.json() : {};
          fetched = apiVersion === "v3" ? (body?.channels || []) : (body?.data?.channels || []);
          channelsCache.current.set(apiVersion, fetched);
        }
        setChannels(fetched);
        if (fetched.length > 0) {
          const { ch: urlCh } = getUrlParams();
          const matchUrl = (ch: ChannelData) => String(cfg.id(ch)) === urlCh;
          let target = urlCh ? fetched.find(matchUrl) : null;
          target = target || fetched.find((ch: ChannelData) => cfg.alive(ch)) || fetched[0];
          selectAndReplaceUrl(target);
        }
      } catch {
        if (active) setChannels([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [apiVersion, cfg, selectAndReplaceUrl]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter((ch: ChannelData) => ch.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  const aliveCount = useMemo(
    () => channels.filter((ch: ChannelData) => cfg.alive(ch)).length,
    [channels, cfg],
  );

  useEffect(() => {
    if (!selectedChannel || selectedVersion !== "v1") return;
    const key = selectedChannel.key;
    if (!key) return;
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/v1/channel?key=${encodeURIComponent(key)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
        const data = await res.json();
        if (!active) return;
        const ch = data?.data;
        if (!ch?.stream_url) throw new Error("Empty stream URL");
        setV1StreamData({ url: ch.stream_url, type: ch.stream_type || "hls", clearkey: ch.drm_kid && ch.drm_key ? { [ch.drm_kid]: ch.drm_key } : null });
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (active) setV1Error(e instanceof Error ? e.message : "Failed to load stream");
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [selectedChannel, selectedVersion]);

  const playerConfig = useMemo(() => {
    if (!selectedChannel || selectedVersion !== apiVersion) return null;
    if (selectedVersion === "v1") {
      if (!v1StreamData?.url) return null;
      return {
        streamUrl: v1StreamData.url,
        streamType: v1StreamData.type,
        clearKeys: v1StreamData.clearkey,
        stats: [
          { label: "Server", value: "V1", icon: "zap" as const },
          { label: "Type", value: (v1StreamData.type || "HLS").toUpperCase(), icon: "shield" as const },
          { label: "Status", value: "LIVE", highlight: true as const, icon: "monitor" as const },
        ],
      };
    }
    if (selectedVersion === "v2") {
      const ch = selectedChannel as StreamingChannel;
      if (!ch.stream_url) return null;
      const needsProxy = ch.stream_url.includes("storage.googleapis.com") || ch.stream_url.includes("soccerball.st");
      const url = needsProxy && apiBase ? `${sanitizeBaseUrl(apiBase)}/api/v2/proxy?url=${encodeURIComponent(ch.stream_url)}` : ch.stream_url;
      return {
        streamUrl: url,
        streamType: ch.stream_type || "hls",
        clearKeys: ch.drm_kid && ch.drm_key ? { [ch.drm_kid]: ch.drm_key } : null,
        stats: [
          { label: "Server", value: "V2", icon: "zap" as const },
          { label: "Type", value: (ch.stream_type || "HLS").toUpperCase(), icon: "shield" as const },
          { label: "Status", value: "ACTIVE", highlight: true as const, icon: "monitor" as const },
        ],
      };
    }
    if (selectedVersion === "v4") {
      const ch = selectedChannel as StreamingChannel;
      if (!ch.stream_url) return null;
      return {
        streamUrl: ch.stream_url,
        streamType: ch.stream_type || "dash",
        clearKeys: ch.drm_kid && ch.drm_key ? { [ch.drm_kid]: ch.drm_key } : null,
        stats: [
          { label: "Server", value: "V4", icon: "zap" as const },
          { label: "Type", value: (ch.stream_type || "DASH").toUpperCase(), icon: "shield" as const },
          { label: "Status", value: "ACTIVE", highlight: true as const, icon: "monitor" as const },
        ],
      };
    }
    if (selectedVersion === "v3") {
      const ch = selectedChannel as V3Channel;
      if (!ch.url) return null;
      const rawUrl = ch.url;
      const streamType = ch.type === "dash" || rawUrl.includes(".mpd") ? "dash"
        : ch.type === "hls" ? "hls"
        : rawUrl.match(/\.ts($|\?)/) ? "direct"
        : ch.content_type === "video/mp2t" ? "direct"
        : "hls";
      const useProxy = streamType === "hls";
      const url = useProxy ? `/api/iptv/proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;
      const clearKeys = ch.kid && ch.key ? { [ch.kid]: ch.key } : null;
      return {
        streamUrl: url,
        streamType,
        clearKeys,
        stats: [
          { label: "Source", value: "Local", icon: "zap" as const },
          { label: "Type", value: streamType.toUpperCase(), icon: "shield" as const },
          { label: "Group", value: ch.group || "General", highlight: true as const, icon: "monitor" as const },
        ],
      };
    }
    return null;
  }, [selectedChannel, selectedVersion, apiVersion, v1StreamData, apiBase]);

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="relative border border-border-alt bg-card p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Tv className="w-3 h-3 text-red-500" />
                {cfg.label}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Live Matches<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                {aliveCount} active &middot; {channels.length.toLocaleString()} indexed
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsServerDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 border text-xs font-mono transition-all cursor-pointer shrink-0 bg-input text-fg-dim hover:text-fg hover:border-border-alt"
              >
                <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                Switch Server
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isServerDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isServerDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 min-w-[160px]">
                  {(["v1", "v2", "v3", "v4"] as ApiVersion[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => { setApiVersion(v); setIsServerDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${apiVersion === v
                          ? "text-red-400 bg-red-500/[0.03] font-semibold"
                          : "text-fg-dim hover:text-fg hover:bg-hover"
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${VERSION_CONFIG[v].color}`} />
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
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
            <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0 max-h-[calc(100dvh-20rem)]">
              <SearchInput value={searchQuery} onChange={setSearchQuery} />
              <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-1 mt-3 mb-1 shrink-0">
                {filteredChannels.length} channel{filteredChannels.length !== 1 ? "s" : ""}
              </div>
              {filteredChannels.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 relative">
                  <Virtuoso
                    className="!absolute inset-0 scrollbar-red"
                    data={filteredChannels}
                    itemContent={(idx, ch) => (
                      <div className="pb-1">
                        <ChannelListItem
                        item={{ name: ch.name, logo: ch.image_url || ch.logo, extra: cfg.label }}
                        selected={selectedChannel === ch && selectedVersion === apiVersion}
                        onClick={() => selectAndReplaceUrl(ch)}
                        showExtra
                      />
                    </div>
                  )}
                />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-4 w-full">
              <div className="relative lg:hidden w-full shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all shadow-md cursor-pointer"
                >
                  <Tv className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="min-w-0 text-center flex-1">
                    <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">{selectedChannel ? "Switch Channel" : "Select Channel"}</span>
                    <span className="font-mono text-xs font-bold text-fg truncate block">{selectedChannel?.name || "Tap to browse"}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-fg-dim transition-transform duration-200 ${isMobileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isMobileDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 max-h-[60dvh] flex flex-col">
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

                    {filteredChannels.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                      </div>
                    ) : (
                    <div className="flex-1 min-h-0 relative">
                      <Virtuoso
                        className="!absolute inset-0 scrollbar-red"
                        data={filteredChannels}
                        itemContent={(idx, ch) => (
                          <div className="px-1 pb-1">
                              <button
                                type="button"
                                onClick={() => { selectAndReplaceUrl(ch); setIsMobileDropdownOpen(false); }}
                                className={`w-full text-left border p-3 transition-all cursor-pointer group flex items-center justify-between ${selectedChannel === ch && selectedVersion === apiVersion
                                    ? "border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold"
                                    : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                                  }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="min-w-0">
                                    <div className="text-xs font-mono truncate">{ch.name}</div>
                                    <div className="text-[9px] font-mono text-fg-dim mt-0.5">{cfg.extra(ch)}</div>
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!selectedChannel || selectedVersion !== apiVersion ? (
                <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                  <div className="text-center space-y-3">
                    <Tv className="w-8 h-8 text-fg-dim mx-auto" />
                    <p className="font-mono text-sm text-fg-dim font-semibold">Select a channel</p>
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">Choose from the left panel</p>
                  </div>
                </div>
              ) : selectedVersion === "v1" && v1Error ? (
                <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                  <p className="font-mono text-xs text-red-500">{v1Error}</p>
                </div>
              ) : selectedVersion === "v1" && !v1StreamData ? (
                <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 text-red-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Decrypting stream...</span>
                  </div>
                </div>
              ) : !playerConfig ? (
                <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                  <p className="font-mono text-xs text-fg-dim">Stream unavailable</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{selectedChannel?.name}</h2>
                      </div>
                    </div>
                    <button
                      onClick={() => handleShare(window.location.href)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border-alt bg-input text-fg-dim hover:text-fg hover:border-border-alt text-xs font-mono transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Share"}
                    </button>
                  </div>
                  <VideoPlayer streamUrl={playerConfig.streamUrl} streamType={playerConfig.streamType} clearKeys={playerConfig.clearKeys} />
                  <StatsGrid items={playerConfig.stats} />
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
