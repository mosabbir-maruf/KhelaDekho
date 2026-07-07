"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getApiBaseUrl, getXKey, sanitizeBaseUrl } from "@/lib/api";
import { SearchInput } from "@/components/ui/SearchInput";
import { ChannelListItem } from "@/components/ui/ChannelListItem";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { useCopyButton } from "@/hooks/useCopyButton";
import { Virtuoso } from "react-virtuoso";
import Tv from "lucide-react/dist/esm/icons/tv";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Share2 from "lucide-react/dist/esm/icons/share-2";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

type ApiVersion = "v2" | "v3" | "v4" | "v5";

interface TeamInfo {
  name: string;
  logo: string | null;
}

interface MatchItem {
  id: string;
  slug: string;
  name: string;
  sport: string;
  status: string;
  is_live: boolean;
  start_date: string | null;
  poster: string | null;
  team_a: TeamInfo | null;
  team_b: TeamInfo | null;
}

interface V2Channel {
  id: string;
  name: string;
  server: string;
}

interface ChannelData {
  name: string;
  logo?: string | null;
  image_url?: string | null;
  group?: string;
  stream_url?: string | null;
  stream_type?: string;
  url?: string;
  id?: string | number;
  isDefault?: boolean;
  kid?: string;
  key?: string;
  drm_kid?: string | null;
  drm_key?: string | null;
  content_type?: string;
  useProxy?: boolean;
  referer?: string;
  origin?: string;
  "user-agent"?: string;
}

interface ResolvedStream {
  streamUrl: string;
  streamType: string;
  clearKeys: Record<string, string> | null;
}

interface ListItem {
  key: string;
  name: string;
  logo: string | null;
  extra: string;
}

const VERSION_META: Record<ApiVersion, { color: string; label: string }> = {
  v2: { color: "bg-green-500", label: "V2 Matches" },
  v3: { color: "bg-cyan-500", label: "V3 Streams" },
  v4: { color: "bg-purple-500", label: "V4 Streams" },
  v5: { color: "bg-rose-500", label: "V5 Streams" },
};

function channelKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getUrlParams() {
  if (typeof window === "undefined") return { v: null, m: null, ch: null };
  const params = new URLSearchParams(window.location.search);
  return { v: params.get("v"), m: params.get("m"), ch: params.get("ch") };
}

export default function LiveMatchesClient({ initialVersion, initialSport }: { initialVersion: ApiVersion; initialSport?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [apiVersion, setApiVersion] = useState<ApiVersion>(initialVersion);
  const [versionResolved, setVersionResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [sport, setSport] = useState(initialSport || "football");

  // V3 / V4 flat channels
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ApiVersion | null>(null);

  // V2 match-centric state
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [v2Match, setV2Match] = useState<MatchItem | null>(null);
  const [v2Channels, setV2Channels] = useState<V2Channel[]>([]);
  const [v2Selected, setV2Selected] = useState<V2Channel | null>(null);
  const [v2Stream, setV2Stream] = useState<ResolvedStream | null>(null);
  const [v2StreamLoading, setV2StreamLoading] = useState(false);
  const [v2StreamError, setV2StreamError] = useState(false);

  const apiBaseUrl = (getApiBaseUrl() || "").replace(/\/+$/, "");
  const { copied, copy: handleShare } = useCopyButton();
  const listCache = useRef<Map<string, ChannelData[]>>(new Map());
  const virtuosoRef = useRef<any>(null);
  const mobileVirtuosoRef = useRef<any>(null);
  const lastScrolledKeyRef = useRef<string | null>(null);

  const meta = VERSION_META[apiVersion];
  const inMatchList = (apiVersion === "v2" || apiVersion === "v5") && !v2Match;
  const isMatchCentric = apiVersion === "v2" || apiVersion === "v5";

  const authHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { Accept: "application/json" };
    const xkey = getXKey();
    if (xkey) h["xkey"] = xkey;
    return h;
  }, []);

  // -------- Server resolution: ?v= wins, else admin default --------
  useEffect(() => {
    let active = true;
    const { v } = getUrlParams();
    if (v && ["v2", "v3", "v4", "v5"].includes(v)) {
      setApiVersion(v as ApiVersion);
      setVersionResolved(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: { Accept: "application/json" } });
        if (res.ok) {
          const body = await res.json();
          if (active && ["v2", "v3", "v4", "v5"].includes(body?.defaultVersion)) {
            setApiVersion(body.defaultVersion as ApiVersion);
          }
        }
      } catch {
        /* fall back to initialVersion */
      } finally {
        if (active) setVersionResolved(true);
      }
    })();
    return () => { active = false; };
  }, []);

  // -------- V3 / V4 flat channel loading --------
  const selectFlatChannel = useCallback((ch: ChannelData) => {
    setSelectedChannel(ch);
    setSelectedVersion(apiVersion);
    const id = String(ch.id ?? channelKey(ch.name));
    router.replace(`${pathname}?v=${apiVersion}&ch=${encodeURIComponent(id)}`, { scroll: false });
  }, [apiVersion, pathname, router]);

  useEffect(() => {
    if (!versionResolved || apiVersion === "v2" || apiVersion === "v5") return;
    let active = true;
    const controller = new AbortController();
    const rawBaseUrl = getApiBaseUrl();
    const baseUrl = rawBaseUrl ? sanitizeBaseUrl(rawBaseUrl) : "";
    (async () => {
      setLoading(true);
      setSelectedChannel(null);
      setSelectedVersion(null);
      try {
        const cached = listCache.current.get(apiVersion);
        let fetched: ChannelData[];
        if (cached) {
          fetched = cached;
        } else if (apiVersion === "v3") {
          const res = await fetch("/api/playlist?source=live-matches", { signal: controller.signal, headers: { Accept: "application/json" } });
          const body = res.ok ? await res.json() : {};
          fetched = body?.channels || [];
          try {
            const v4Res = await fetch(`${baseUrl}/api/v4/channels?alive=true`, { signal: controller.signal, headers: authHeaders() });
            if (v4Res.ok) {
              const v4Body = await v4Res.json();
              const v4Channels: Array<{
                id: string | number;
                name: string;
                stream_url?: string;
                stream_type?: string;
                drm_kid?: string;
                drm_key?: string;
              }> = v4Body?.data?.channels || [];
              const toInject = v4Channels.filter(ch => ch.name === "🏆 Iphone-2" || ch.name === "🏆 Android-windows-TV-1");
              const existingNames = new Set(fetched.map(c => c.name));
              const uniqueInjects = toInject
                .filter(ch => !existingNames.has(ch.name))
                .map(ch => ({ name: ch.name, url: ch.stream_url, type: ch.stream_type, group: "Featured", kid: ch.drm_kid, key: ch.drm_key, id: `v4-inject-${ch.id}` }));
              fetched = [...uniqueInjects, ...fetched];
            }
          } catch { /* v4 inject optional */ }
        } else {
          const res = await fetch(`${baseUrl}/api/v4/channels?alive=true`, { signal: controller.signal, headers: authHeaders() });
          if (!active) return;
          const body = res.ok ? await res.json() : {};
          fetched = body?.data?.channels || [];
        }
        listCache.current.set(apiVersion, fetched);
        if (!active) return;
        setChannels(fetched);
        if (fetched.length > 0) {
          const { ch: urlCh } = getUrlParams();
          const idOf = (ch: ChannelData) => String(ch.id ?? channelKey(ch.name));
          const target = (urlCh && fetched.find(ch => idOf(ch) === urlCh))
            || fetched.find(ch => ch.isDefault)
            || fetched[0];
          if (target) selectFlatChannel(target);
        }
      } catch {
        if (active) setChannels([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [apiVersion, versionResolved, selectFlatChannel, authHeaders]);

  // -------- V2 / V5: match list loading --------
  useEffect(() => {
    if (!versionResolved || (apiVersion !== "v2" && apiVersion !== "v5")) return;
    let active = true;
    const controller = new AbortController();
    const baseUrl = apiBaseUrl;
    (async () => {
      setLoading(true);
      try {
        const versionPath = apiVersion === "v5" ? "v5" : "v2";
        const sportQ = apiVersion === "v5" ? `?sport=${sport}` : "";
        const res = await fetch(`${baseUrl}/api/${versionPath}/matches${sportQ}`, { signal: controller.signal, headers: authHeaders() });
        const body = res.ok ? await res.json() : {};
        const list: MatchItem[] = body?.data?.matches || [];
        if (!active) return;
        setMatches(list);
        const { m } = getUrlParams();
        if (m) {
          const found = list.find(x => x.slug === m);
          if (found) setV2Match(found);
        }
      } catch {
        if (active) setMatches([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [apiVersion, sport, versionResolved, apiBaseUrl, authHeaders]);

  // -------- V2 / V5: resolve a channel's stream on demand --------
  const resolveV2 = useRef<AbortController | null>(null);
  const selectV2Channel = useCallback(async (ch: V2Channel) => {
    if (!v2Match) return;
    resolveV2.current?.abort();
    const controller = new AbortController();
    resolveV2.current = controller;
    setV2Selected(ch);
    setV2Stream(null);
    setV2StreamError(false);
    setV2StreamLoading(true);
    try {
      const versionPath = apiVersion === "v5" ? "v5" : "v2";
      const res = await fetch(`${apiBaseUrl}/api/${versionPath}/matches/${encodeURIComponent(v2Match.slug)}/stream?ch=${encodeURIComponent(ch.id)}`, { signal: controller.signal, headers: authHeaders() });
      const body = res.ok ? await res.json() : {};
      const d = body?.data;
      if (d?.stream_url) {
        const url = String(d.stream_url).startsWith("http") ? d.stream_url : apiBaseUrl + d.stream_url;
        setV2Stream({
          streamUrl: url,
          streamType: d.stream_type || "hls",
          clearKeys: d.drm_kid && d.drm_key ? { [d.drm_kid]: d.drm_key } : null,
        });
      } else {
        setV2StreamError(true);
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setV2StreamError(true);
    } finally {
      if (!controller.signal.aborted) setV2StreamLoading(false);
    }
  }, [apiBaseUrl, apiVersion, v2Match, authHeaders]);

  // -------- V2 / V5: channels for the opened match --------
  useEffect(() => {
    if ((apiVersion !== "v2" && apiVersion !== "v5") || !v2Match) return;
    let active = true;
    const controller = new AbortController();
    (async () => {
      setV2Channels([]);
      setV2Selected(null);
      setV2Stream(null);
      setV2StreamError(false);
      try {
        const versionPath = apiVersion === "v5" ? "v5" : "v2";
        const res = await fetch(`${apiBaseUrl}/api/${versionPath}/matches/${encodeURIComponent(v2Match.slug)}/channels`, { signal: controller.signal, headers: authHeaders() });
        const body = res.ok ? await res.json() : {};
        if (!active) return;
        const channelList = body?.data?.channels || [];
        setV2Channels(channelList);
        if (channelList.length > 0) {
          selectV2Channel(channelList[0]);
        }
      } catch {
        if (active) setV2Channels([]);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [apiVersion, v2Match, apiBaseUrl, authHeaders, selectV2Channel]);

  const openMatch = useCallback((m: MatchItem) => {
    setV2Match(m);
    setSearchQuery("");
    router.replace(`${pathname}?v=${apiVersion}&m=${encodeURIComponent(m.slug)}`, { scroll: false });
  }, [pathname, router, apiVersion]);

  const backToMatches = useCallback(() => {
    setV2Match(null);
    setV2Selected(null);
    setV2Stream(null);
    setSearchQuery("");
    router.replace(`${pathname}?v=${apiVersion}`, { scroll: false });
  }, [pathname, router, apiVersion]);

  const switchServer = useCallback((v: ApiVersion) => {
    setApiVersion(v);
    setIsServerDropdownOpen(false);
    setV2Match(null);
    setV2Selected(null);
    setV2Stream(null);
    setSearchQuery("");
  }, []);

  // -------- Normalized list items for the current view --------
  const listItems: ListItem[] = useMemo(() => {
    if (isMatchCentric) {
      if (!v2Match) {
        return matches.map((m) => ({
          key: m.slug,
          name: m.team_a && m.team_b ? `${m.team_a.name} vs ${m.team_b.name}` : m.name,
          logo: m.poster || m.team_a?.logo || null,
          extra: m.is_live ? "LIVE" : (m.sport || "MATCH"),
        }));
      }
      return v2Channels.map((c) => ({ key: c.id, name: c.name, logo: null, extra: c.server }));
    }
    return channels.map((c) => ({
      key: String(c.id ?? channelKey(c.name)),
      name: c.name,
      logo: c.image_url || c.logo || null,
      extra: (apiVersion === "v3" ? c.group : c.stream_type)?.toUpperCase() || meta.label,
    }));
  }, [apiVersion, isMatchCentric, v2Match, matches, v2Channels, channels, meta.label]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return listItems;
    const q = searchQuery.toLowerCase();
    return listItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [listItems, searchQuery]);

  const selectedKey = useMemo(() => {
    if (isMatchCentric) return v2Selected?.id ?? null;
    if (!selectedChannel || selectedVersion !== apiVersion) return null;
    return String(selectedChannel.id ?? channelKey(selectedChannel.name));
  }, [apiVersion, isMatchCentric, v2Selected, selectedChannel, selectedVersion]);

  // Auto-scroll to the playing channel and reset search query if it's filtered out
  useEffect(() => {
    if (!selectedKey) {
      lastScrolledKeyRef.current = null;
      return;
    }

    if (selectedKey !== lastScrolledKeyRef.current) {
      const idx = filteredItems.findIndex(it => it.key === selectedKey);
      if (idx !== -1) {
        lastScrolledKeyRef.current = selectedKey;
        const timer = setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({ index: idx, align: "center", behavior: "smooth" });
          mobileVirtuosoRef.current?.scrollToIndex({ index: idx, align: "center", behavior: "smooth" });
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setSearchQuery("");
      }
    }
  }, [selectedKey, filteredItems]);

  const onItemClick = useCallback((key: string) => {
    if (isMatchCentric) {
      if (!v2Match) {
        const m = matches.find((x) => x.slug === key);
        if (m) openMatch(m);
      } else {
        const c = v2Channels.find((x) => x.id === key);
        if (c) selectV2Channel(c);
      }
      return;
    }
    const c = channels.find((x) => String(x.id ?? channelKey(x.name)) === key);
    if (c) selectFlatChannel(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiVersion, isMatchCentric, v2Match, matches, v2Channels, channels, openMatch, selectV2Channel, selectFlatChannel]);

  // -------- Player config --------
  const playerConfig = useMemo(() => {
    if (isMatchCentric) {
      if (!v2Selected || !v2Stream) return null;
      const labelVer = apiVersion === "v5" ? "V5" : "V2";
      return {
        streamUrl: v2Stream.streamUrl,
        streamType: v2Stream.streamType,
        clearKeys: v2Stream.clearKeys,
        title: v2Selected.name,
        stats: [
          { label: "Server", value: labelVer, icon: "zap" as const },
          { label: "Type", value: v2Stream.streamType.toUpperCase(), icon: "shield" as const },
          { label: "Status", value: "ACTIVE", highlight: true as const, icon: "monitor" as const },
        ],
      };
    }
    if (!selectedChannel || selectedVersion !== apiVersion) return null;
    if (apiVersion === "v4") {
      const ch = selectedChannel;
      if (!ch.stream_url) return null;
      const isDash = (ch.stream_type || "dash") === "dash";
      const url = ch.stream_url.startsWith("http")
        ? (isDash ? `${apiBaseUrl}/api/v2/proxy?url=${encodeURIComponent(ch.stream_url)}&source=v4` : ch.stream_url)
        : apiBaseUrl + ch.stream_url;
      return {
        streamUrl: url,
        streamType: ch.stream_type || "dash",
        clearKeys: ch.drm_kid && ch.drm_key ? { [ch.drm_kid]: ch.drm_key } : null,
        title: ch.name,
        stats: [
          { label: "Server", value: "V4", icon: "zap" as const },
          { label: "Type", value: (ch.stream_type || "dash").toUpperCase(), icon: "shield" as const },
          { label: "Status", value: "ACTIVE", highlight: true as const, icon: "monitor" as const },
        ],
      };
    }
    const ch = selectedChannel;
    if (!ch.url) return null;
    const rawUrl = ch.url;
    const streamType = ch.stream_type === "dash" || rawUrl.includes(".mpd") ? "dash"
      : ch.stream_type === "hls" ? "hls"
      : rawUrl.match(/\.ts($|\?)/) ? "direct"
      : ch.content_type === "video/mp2t" ? "direct"
      : "hls";
    const shouldProxy = rawUrl.startsWith("http://") || ch.useProxy === true;
    let url = rawUrl;
    if (shouldProxy) {
      const params = new URLSearchParams({ url: rawUrl });
      if (ch.referer) params.set("referer", ch.referer);
      if (ch.origin) params.set("origin", ch.origin);
      if (ch["user-agent"]) params.set("ua", ch["user-agent"]);
      url = `/api/iptv/proxy?${params.toString()}`;
    }
    return {
      streamUrl: url,
      streamType,
      clearKeys: ch.kid && ch.key ? { [ch.kid]: ch.key } : null,
      title: ch.name,
      stats: [
        { label: "Source", value: "Local", icon: "zap" as const },
        { label: "Type", value: streamType.toUpperCase(), icon: "shield" as const },
        { label: "Group", value: ch.group || "General", highlight: true as const, icon: "monitor" as const },
      ],
    };
  }, [apiVersion, isMatchCentric, v2Selected, v2Stream, selectedChannel, selectedVersion, apiBaseUrl]);

  const listCount = filteredItems.length;
  const listNoun = inMatchList ? "match" : "channel";
  const hasActiveSelection = isMatchCentric ? !!v2Selected : (!!selectedChannel && selectedVersion === apiVersion);
  const activeTitle = isMatchCentric ? v2Selected?.name : selectedChannel?.name;

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="relative border border-border-alt bg-card p-8 md:p-12">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Tv className="w-3 h-3 text-red-500" />
                {meta.label}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Live Matches<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                {inMatchList ? `${matches.length} match${matches.length !== 1 ? "es" : ""} available` : `${listCount} channel${listCount !== 1 ? "s" : ""} indexed`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {apiVersion === "v5" && (
                <div className="flex border border-border-alt">
                  {["football", "cricket"].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setSport(s);
                        setV2Match(null);
                        setSearchQuery("");
                        router.replace(`/live-matches?v=v5${s === "football" ? "" : `&s=${s}`}`, { scroll: false });
                      }}
                      className={`px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
                        sport === s
                          ? "bg-red-500/10 text-red-300 border-b-2 border-red-500"
                          : "bg-input text-fg-dim hover:text-fg"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setIsServerDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt text-xs font-mono transition-all cursor-pointer shrink-0 bg-input text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03]"
                >
                  <span className={`w-2 h-2 rounded-full ${meta.color}`} />
                  Switch Server
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isServerDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isServerDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 min-w-[160px]">
                    {(["v2", "v3", "v4", "v5"] as ApiVersion[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => switchServer(v)}
                        className={`w-full text-left px-4 py-2 text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${apiVersion === v
                            ? "text-red-400 bg-red-500/[0.03] font-semibold"
                            : "text-fg-dim hover:text-fg hover:bg-hover"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${VERSION_META[v].color}`} />
                        {v.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-yellow-500/80 leading-relaxed text-center mt-3">
            Stream buffering? Switch channel or server.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch animate-pulse">
            {/* Sidebar list skeleton (only visible when not in V2 match selection view) */}
            {!inMatchList && (
              <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0 space-y-4">
                <div className="h-10 bg-hover border border-border-alt rounded" />
                <div className="h-4 w-20 bg-hover rounded" />
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-hover rounded border border-border-alt/50" />
                  ))}
                </div>
              </div>
            )}
            {/* Main Area Skeleton */}
            <div className="flex-1 min-w-0 space-y-4 w-full">
              {inMatchList ? (
                /* Matches selection grid skeleton */
                <div className="border border-border-alt bg-card p-6 md:p-8 space-y-6 rounded-xl">
                  <div className="flex items-center gap-3 border-b border-border-alt pb-4">
                    <div className="w-8 h-8 rounded-lg bg-hover border border-border-alt" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-hover rounded" />
                      <div className="h-3 w-56 bg-hover rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-36 border border-border-alt bg-input rounded-xl p-5 flex flex-col justify-between" />
                    ))}
                  </div>
                </div>
              ) : (
                /* Player view skeleton */
                <>
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4 rounded-xl">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-xl bg-hover border border-border-alt" />
                      <div className="space-y-2 flex-1">
                        <div className="h-5 w-48 bg-hover rounded" />
                        {apiVersion === "v2" && <div className="h-3.5 w-32 bg-hover rounded" />}
                      </div>
                    </div>
                  </div>
                  <div className="aspect-video bg-hover border border-border-alt rounded-xl w-full" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-card border border-border-alt rounded-xl" />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Desktop list panel */}
            {!inMatchList && (
              <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0 max-h-[calc(100dvh-12rem)]">
                {isMatchCentric && v2Match && (
                  <button
                    onClick={backToMatches}
                    className="flex items-center gap-2 mb-3 px-3 py-2 border border-red-500 bg-red-500/10 text-xs font-mono font-bold text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer shrink-0 rounded"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to matches
                  </button>
                )}
                <SearchInput value={searchQuery} onChange={setSearchQuery} />
                <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-1 mt-3 mb-1 shrink-0">
                  {listCount} {listNoun}{listCount !== 1 ? "s" : ""}
                </div>
                {listCount === 0 ? (
                  <div className="text-center py-10">
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No {listNoun}s found</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 relative">
                    <Virtuoso
                      ref={virtuosoRef}
                      className="!absolute inset-0 scrollbar-red"
                      data={filteredItems}
                      itemContent={(idx, it) => (
                        <div className="pb-1">
                          <ChannelListItem
                            item={{ name: it.name, logo: it.logo, extra: it.extra }}
                            selected={it.key === selectedKey}
                            onClick={() => onItemClick(it.key)}
                            showExtra
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Main area */}
            <div className="flex-1 min-w-0 space-y-4 w-full">
              {/* Mobile picker */}
              {!inMatchList && (
                <div className="relative lg:hidden w-full shrink-0">
                  {isMatchCentric && v2Match && (
                    <button
                      onClick={backToMatches}
                      className="flex items-center gap-2 mb-3 px-3 py-2 border border-red-500 bg-red-500/10 text-xs font-mono font-bold text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer w-full justify-center rounded"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to matches
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all shadow-md cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="min-w-0 text-center flex-1">
                      <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">
                        {inMatchList ? "Select Match" : "Select Channel"}
                      </span>
                      <span className="font-mono text-xs font-bold text-fg truncate block">
                        {activeTitle || (inMatchList ? "Tap to browse matches" : "Tap to browse")}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-fg-dim transition-transform duration-200 ${isMobileDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isMobileDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 h-[60dvh] flex flex-col">
                      <div className="flex items-center gap-2 border-b border-border-alt px-3 py-2 bg-card shrink-0">
                        <Search className="w-3.5 h-3.5 text-fg-dim shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={inMatchList ? "Search match..." : "Search channel..."}
                          className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg">
                            <X className="w-3" />
                          </button>
                        )}
                      </div>
                      {listCount === 0 ? (
                        <div className="text-center py-8">
                          <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No {listNoun}s found</p>
                        </div>
                      ) : (
                        <div className="flex-1 min-h-0 relative">
                          <Virtuoso
                            ref={mobileVirtuosoRef}
                            className="!absolute inset-0 scrollbar-red"
                            data={filteredItems}
                            itemContent={(idx, it) => (
                              <div className="px-1 pb-1">
                                <button
                                  type="button"
                                  onClick={() => { onItemClick(it.key); if (!inMatchList) setIsMobileDropdownOpen(false); }}
                                  className={`w-full text-left border p-3 transition-all cursor-pointer group flex items-center justify-between ${it.key === selectedKey
                                      ? "border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold"
                                      : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                                    }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="min-w-0">
                                      <div className="text-xs font-mono truncate">{it.name}</div>
                                      <div className="text-[9px] font-mono text-fg-dim mt-0.5">{it.extra}</div>
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
              )}

              {/* Player / prompts */}
              {inMatchList ? (
                <div className="border border-border-alt bg-card p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b border-border-alt pb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <Tv className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <h2 className="font-mono text-sm font-bold text-fg uppercase tracking-wider">Select a Live Match</h2>
                      <p className="font-mono text-[10px] text-fg-dim">Choose from the currently active events below to view stream channels</p>
                    </div>
                  </div>
                  {matches.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-mono text-xs text-fg-dim">No live matches currently available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {matches.map((m) => {
                        const hasTeams = m.team_a && m.team_b;
                        return (
                          <button
                            key={m.slug}
                            type="button"
                            onClick={() => openMatch(m)}
                            className="w-full text-left border border-border-alt bg-input hover:border-red-500/30 hover:bg-red-500/[0.01] transition-all duration-300 rounded-xl cursor-pointer group flex flex-col p-5 space-y-4 hover:shadow-[0_4px_20px_rgba(239,68,68,0.03)]"
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between w-full">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-red-500/30 bg-red-500/10 text-[9px] font-mono uppercase text-red-400 font-bold rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                {m.is_live ? "LIVE" : "UPCOMING"}
                              </span>
                              <span className="font-mono text-[9px] text-fg-faint uppercase tracking-widest">
                                {m.sport || "Football"}
                              </span>
                            </div>

                            {/* Card Body: Teams Info */}
                            {hasTeams ? (
                              <div className="flex items-center gap-4 py-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {m.team_a?.logo ? (
                                    <img draggable={false} src={m.team_a.logo} alt={m.team_a.name} className="w-8 h-8 rounded-full border border-border-alt object-cover bg-[#000]" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full border border-border-alt bg-hover flex items-center justify-center font-mono text-[10px] text-fg-dim">A</div>
                                  )}
                                  <span className="font-mono text-xs font-bold text-fg truncate group-hover:text-red-400 transition-colors">{m.team_a?.name}</span>
                                </div>
                                <span className="font-mono text-[10px] text-fg-faint font-bold shrink-0">VS</span>
                                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                                  <span className="font-mono text-xs font-bold text-fg truncate group-hover:text-red-400 transition-colors">{m.team_b?.name}</span>
                                  {m.team_b?.logo ? (
                                    <img draggable={false} src={m.team_b.logo} alt={m.team_b.name} className="w-8 h-8 rounded-full border border-border-alt object-cover bg-[#000]" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full border border-border-alt bg-hover flex items-center justify-center font-mono text-[10px] text-fg-dim">B</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="py-2">
                                <h3 className="font-mono text-sm font-bold text-fg group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                                  {m.name}
                                </h3>
                              </div>
                            )}

                            {/* Card Footer */}
                            <div className="w-full border-t border-border-alt/50 pt-3 flex items-center justify-between text-[10px] font-mono">
                              <span className="truncate max-w-[180px] text-fg-dim">
                                {m.name}
                              </span>
                              <span className="px-2.5 py-1 border border-border-alt bg-card text-fg-dim font-bold rounded group-hover:text-red-500 group-hover:border-red-500/30 group-hover:bg-red-500/[0.02] transition-all flex items-center gap-1">
                                [ View Channels ]
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : !hasActiveSelection ? (
                <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
                  <div className="text-center space-y-3">
                    <Tv className="w-8 h-8 text-fg-dim mx-auto" />
                    <p className="font-mono text-sm text-fg-dim font-semibold">Select a channel</p>
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">Choose from the left panel</p>
                  </div>
                </div>
              ) : isMatchCentric && v2StreamLoading ? (
                <div className="flex items-center justify-center border border-border-alt bg-card aspect-video w-full">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 text-red-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Resolving stream...</span>
                  </div>
                </div>
              ) : !playerConfig ? (
                <div className="flex items-center justify-center border border-red-500/20 bg-red-500/[0.02] rounded-xl aspect-video w-full">
                  <div className="text-center space-y-4 px-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                       <h3 className="font-mono text-sm font-bold text-red-500 uppercase tracking-wider">Stream Connection Failed</h3>
                      <p className="font-mono text-[10px] text-fg-dim mt-1.5 leading-relaxed max-w-sm mx-auto">
                        {isMatchCentric && v2StreamError 
                          ? "This channel is currently offline or unreachable. Please try switching to another server or backup channel." 
                          : "Stream details could not be resolved."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-mono text-lg font-bold text-fg tracking-tight truncate">{activeTitle}</h2>
                        {isMatchCentric && v2Match && (
                          <p className="font-mono text-[10px] text-fg-dim uppercase tracking-widest truncate">{v2Match.name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleShare(window.location.href)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border-alt bg-input text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] text-xs font-mono transition-all cursor-pointer shrink-0"
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
