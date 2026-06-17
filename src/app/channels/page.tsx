"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getApiBaseUrl, sanitizeBaseUrl } from "@/lib/api";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { SearchInput } from "@/components/ui/SearchInput";
import { ChannelListItem } from "@/components/ui/ChannelListItem";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { loadAdminConfig, getV3Channels } from "@/data/admin";
import type { V3Channel } from "@/data/admin";
import Tv from "lucide-react/dist/esm/icons/tv";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

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

interface V4Channel {
  id: string;
  name: string;
  logo: string | null;
  stream_url: string | null;
  stream_type: string;
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

type ApiVersion = "v1" | "v2" | "v3" | "v4";

function isAlive(ch: any, v: ApiVersion): boolean {
  if (v === "v1") return ch.status === "live";
  if (v === "v2" || v === "v4") return !!ch.stream_url;
  return true;
}

export default function ChannelsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [apiVersion, setApiVersion] = useState<ApiVersion>(() => loadAdminConfig().defaultVersion || "v4");
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ApiVersion | null>(null);
  const [v1StreamData, setV1StreamData] = useState<{ url: string; type: string; clearkey: any } | null>(null);
  const [v1Error, setV1Error] = useState<string | null>(null);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);

  const isV3 = apiVersion === "v3";

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
        if (apiVersion === "v3") {
          const cfg = loadAdminConfig();
          const list = cfg.enabled.v3 ? getV3Channels() : [];
          setChannels(list);
          if (list.length > 0) {
            setSelectedChannel(list[0]);
            setSelectedVersion(apiVersion);
            router.replace(`${pathname}?v=${apiVersion}&ch=${encodeURIComponent(list[0].id)}`, { scroll: false });
          }
        } else {
          const fetchLimit = apiVersion === "v1" ? "?limit=200" : apiVersion === "v4" ? "?alive=true" : "?limit=200";
          const res = await fetch(`${baseUrl}/api/${apiVersion}/channels${fetchLimit}`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          const body = res.ok ? await res.json() : { data: { channels: [] } };
          if (!active) return;
          const list = body?.data?.channels || [];
          setChannels(list);
          if (list.length > 0) {
            const first = list.find((ch: any) => isAlive(ch, apiVersion)) || list[0];
            setSelectedChannel(first);
            setSelectedVersion(apiVersion);
            setV1StreamData(null);
            setV1Error(null);
            const id = apiVersion === "v1" ? (first as V1Channel).key : apiVersion === "v2" ? String((first as V2Channel).id) : isV3 ? (first as V3Channel).id : (first as V4Channel).id;
            router.replace(`${pathname}?v=${apiVersion}&ch=${encodeURIComponent(id)}`, { scroll: false });
          }
        }
      } catch {
        if (active) setChannels([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [apiVersion]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter((ch: any) => ch.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  const aliveCount = useMemo(
    () => channels.filter((ch) => isAlive(ch, apiVersion)).length,
    [channels, apiVersion],
  );

  const selectChannel = useCallback((ch: any) => {
    setSelectedChannel(ch);
    setSelectedVersion(apiVersion);
    setV1StreamData(null);
    setV1Error(null);
    const id = apiVersion === "v1" ? (ch as V1Channel).key : apiVersion === "v2" ? String((ch as V2Channel).id) : isV3 ? (ch as V3Channel).id : (ch as V4Channel).id;
    router.replace(`${pathname}?v=${apiVersion}&ch=${encodeURIComponent(id)}`, { scroll: false });
  }, [apiVersion, router, pathname, isV3]);

  useEffect(() => {
    if (!selectedChannel || selectedVersion !== "v1") return;
    const key = (selectedChannel as V1Channel).key;
    if (!key) return;
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/stream?key=${encodeURIComponent(key)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!active) return;
        if (!data.url) throw new Error("Empty stream URL");
        setV1StreamData({ url: data.url, type: data.type || "hls", clearkey: data.clearkey || null });
      } catch (e: any) {
        if (e.name === "AbortError") return;
        if (active) setV1Error(e.message || "Failed to load stream");
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [selectedChannel, selectedVersion]);

  const label = isV3 ? "Admin Streams" : apiVersion === "v1" ? "Legacy Streams" : apiVersion === "v4" ? "V4 Streams" : "Browse Streams";

  const apiBase = getApiBaseUrl();

  const v3Channel = selectedVersion === "v3" ? (selectedChannel as V3Channel) : null;
  const v3QualityIdx = 0;
  const v3RawUrl = v3Channel?.urls?.[v3QualityIdx]?.url;
  const v3IsTs = v3RawUrl?.match(/\.ts($|\?)/);
  const v3Url = v3RawUrl && !v3IsTs && apiBase
    ? `${sanitizeBaseUrl(apiBase)}/api/v2/proxy?url=${encodeURIComponent(v3RawUrl)}`
    : v3RawUrl;

  const v2Ch = selectedVersion === "v2" ? (selectedChannel as V2Channel) : null;
  const rawUrl = v2Ch?.stream_url;
  const needsProxy = rawUrl && (rawUrl.includes("storage.googleapis.com") || rawUrl.includes("soccerball.st"));
  const v2Url = needsProxy && apiBase
    ? `${sanitizeBaseUrl(apiBase)}/api/v2/proxy?url=${encodeURIComponent(rawUrl)}`
    : rawUrl;

  const v4Ch = selectedVersion === "v4" ? (selectedChannel as V4Channel) : null;
  const v4RawUrl = v4Ch?.stream_url;
  const v4Url = v4RawUrl;

  const showPlayer = selectedChannel && selectedVersion === apiVersion;
  const v1Loading = selectedVersion === "v1" && !v1StreamData && !v1Error;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="relative border border-border-alt bg-card p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Tv className="w-3 h-3 text-red-500" />
                {label}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Channels<span className="text-red-500">.</span>
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
                <span className={`w-2 h-2 rounded-full ${isV3 ? "bg-blue-500" : apiVersion === "v1" ? "bg-yellow-500" : apiVersion === "v2" ? "bg-green-500" : "bg-purple-500"}`} />
                Switch Server
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isServerDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isServerDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 min-w-[160px]">
                  {(["v1", "v2", "v3", "v4"] as ApiVersion[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => { setApiVersion(v); setIsServerDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                        apiVersion === v
                          ? "text-red-400 bg-red-500/[0.03] font-semibold"
                          : "text-fg-dim hover:text-fg hover:bg-hover"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${v === "v3" ? "bg-blue-500" : v === "v1" ? "bg-yellow-500" : v === "v2" ? "bg-green-500" : "bg-purple-500"}`} />
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
            <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0">
              <SearchInput value={searchQuery} onChange={setSearchQuery} />
              <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-1 mt-3 mb-1 shrink-0">
                {filteredChannels.length} channel{filteredChannels.length !== 1 ? "s" : ""}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-red">
                {filteredChannels.map((ch: any) => (
                  <ChannelListItem
                    key={`${apiVersion}-${isV3 ? ch.id : apiVersion === "v1" ? ch.key : apiVersion === "v4" ? ch.id : ch.id}`}
                    item={{ name: ch.name, logo: isV3 ? null : ch.image_url || ch.logo, extra: isV3 ? `${ch.urls?.length || 1} sources` : apiVersion === "v1" ? (ch.category || "").toUpperCase() : (ch.stream_type || "").toUpperCase() }}
                    selected={selectedChannel === ch && selectedVersion === apiVersion}
                    onClick={() => selectChannel(ch)}
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
                      {filteredChannels.map((ch: any) => (
                        <button
                          key={`mobile-${isV3 ? ch.id : apiVersion === "v1" ? ch.key : ch.id}`}
                          type="button"
                          onClick={() => { selectChannel(ch); setIsMobileDropdownOpen(false); }}
                          className={`w-full text-left border p-3 transition-all cursor-pointer group flex items-center justify-between ${
                            selectedChannel === ch && selectedVersion === apiVersion
                              ? "border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold"
                              : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <div className="text-xs font-mono truncate">{ch.name}</div>
                              <div className="text-[9px] font-mono text-fg-dim mt-0.5">{isV3 ? `${ch.urls?.length || 1} sources` : apiVersion === "v1" ? (ch.category || "").toUpperCase() : (ch.stream_type || "").toUpperCase()}</div>
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

              {!showPlayer ? (
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
              ) : !v1StreamData?.url && !v2Url && !v3Url && !v4Url ? (
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
                        <p className="font-mono text-xs text-fg-dim">
                          {selectedVersion === "v1" ? `${(selectedChannel as V1Channel)?.category || ""} · LIVE` : selectedVersion === "v2" ? `${((selectedChannel as V2Channel)?.stream_type || "HLS").toUpperCase()} · ACTIVE` : selectedVersion === "v4" ? `${((selectedChannel as V4Channel)?.stream_type || "DASH").toUpperCase()} · ACTIVE` : `${v3Channel?.sourceLabel || "V3"} · ${v3Channel?.urls?.length || 1} source${(v3Channel?.urls?.length || 1) > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedVersion === "v1" && v1StreamData?.url ? <VideoPlayer streamUrl={v1StreamData.url} streamType={v1StreamData.type} clearKeys={v1StreamData.clearkey} /> : selectedVersion === "v1" && v1StreamData ? <p className="font-mono text-xs text-fg-dim text-center py-12">Stream unavailable</p> : null}
                  {selectedVersion === "v2" && v2Url ? <VideoPlayer streamUrl={v2Url} streamType={v2Ch?.stream_type || "hls"} clearKeys={v2Ch?.drm_kid && v2Ch?.drm_key ? { [v2Ch.drm_kid]: v2Ch.drm_key } : null} /> : null}
                  {selectedVersion === "v4" && v4Url ? <VideoPlayer streamUrl={v4Url} streamType={v4Ch?.stream_type || "dash"} clearKeys={v4Ch?.drm_kid && v4Ch?.drm_key ? { [v4Ch.drm_kid]: v4Ch.drm_key } : null} /> : null}
                  {selectedVersion === "v3" && v3Url ? (
                    <>
                      <VideoPlayer streamUrl={v3Url} streamType={v3IsTs ? "direct" : "hls"} clearKeys={null} />
                      <StatsGrid items={[
                        { label: "Source", value: v3Channel?.sourceLabel || "V3", icon: "zap" },
                        { label: "URLs", value: `${v3Channel?.urls?.length || 1}`, icon: "shield" },
                        { label: "Status", value: "ONLINE", highlight: true, icon: "monitor" },
                      ]} />
                    </>
                  ) : null}
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
