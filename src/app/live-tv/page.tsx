"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LOGO_BASE, LOGO_MAP, getCategory } from "@/data/liveTv";
import { useCopyButton } from "@/hooks/useCopyButton";
import { getApiBaseUrl, getXKey } from "@/lib/api";
import { SearchInput } from "@/components/ui/SearchInput";
import { ChannelListItem } from "@/components/ui/ChannelListItem";

import { Virtuoso } from "react-virtuoso";
import Tv from "lucide-react/dist/esm/icons/tv";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Play from "lucide-react/dist/esm/icons/play";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";

const VideoPlayer = dynamic(() => import("@/components/ui/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })), { ssr: false });

interface V5Channel {
  id: string;
  name: string;
  image: string;
  category: string;
  country: string;
}

interface DisplayChannel {
  id: string;
  name: string;
  category: string;
  country: string;
  logoUrl: string | null;
  isDefault?: boolean;
  source: 'v5' | 'kv';
  v5Id?: string;
  directUrl?: string;
}

const CATEGORY_LABELS = ['All', 'Sports', 'News', 'Kids', 'Entertainment', 'Music', 'General'] as const;
type Category = (typeof CATEGORY_LABELS)[number];

const COUNTRY_NAMES: Record<string, string> = {
  us: 'United States', gb: 'United Kingdom', fr: 'France', pl: 'Poland',
  it: 'Italy', de: 'Germany', cz: 'Czech Republic', ca: 'Canada',
  es: 'Spain', pt: 'Portugal', gr: 'Greece', il: 'Israel',
  bg: 'Bulgaria', za: 'South Africa', rs: 'Serbia', sk: 'Slovakia',
  dk: 'Denmark', mx: 'Mexico', se: 'Sweden', nl: 'Netherlands',
  tr: 'Turkey', br: 'Brazil', ro: 'Romania', hr: 'Croatia',
  ar: 'Argentina', nz: 'New Zealand', qa: 'Qatar', au: 'Australia',
  ae: 'UAE', my: 'Malaysia', sa: 'Saudi Arabia', cy: 'Cyprus',
  ru: 'Russia', in: 'India', ie: 'Ireland', pk: 'Pakistan',
  at: 'Austria', ba: 'Bosnia', hu: 'Hungary', eg: 'Egypt',
  bd: 'Bangladesh', cl: 'Chile', no: 'Norway', uy: 'Uruguay',
  co: 'Colombia', intl: 'International',
};

function countryName(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  return COUNTRY_NAMES[code] || code.toUpperCase();
}

function detectCat(name: string): string | null {
  const n = ' ' + name.toLowerCase() + ' ';
  if (/music|mtv|vh1|radio|hits|rhythm|beat|concert|band|billboard/i.test(n)) return 'Music';
  return null;
}

function getLogoUrl(name: string): string | null {
  const key = name.toLowerCase().trim().replace(/\s+/g, " ");
  const filename = LOGO_MAP[key];
  if (filename) return LOGO_BASE + encodeURIComponent(filename);
  return null;
}

function Logo({ src, name, className }: { src: string | null; name: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-[#181818] ${className || ''}`}>
        <Tv className="w-1/2 h-1/2 text-red-500/40" />
      </div>
    );
  }
  return <img draggable={false} src={src} alt="" loading="lazy" className={`w-full h-full object-contain ${className || ''}`} onError={() => setErr(true)} />;
}

export default function LiveTvPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<DisplayChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<DisplayChannel | null>(null);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activeCountry, setActiveCountry] = useState("All");
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<any>(null);
  const mobileVirtuosoRef = useRef<any>(null);
  const lastScrolledKeyRef = useRef<string | null>(null);
  const { copied, copy: handleShare } = useCopyButton();


  function getUrlCh(): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("ch");
  }

  // -------- Fetch channels --------
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    (async () => {
      let useV5 = true;
      try {
        const settingsRes = await fetch(`/api/admin/settings`, { signal: controller.signal });
        if (settingsRes.ok) {
          const sv = (await settingsRes.json()).defaultVersion;
          if (sv === 'v3') useV5 = false;
        }
      } catch {}

      if (active && useV5) {
        try {
          const apiBase = getApiBaseUrl().replace(/\/+$/, '');
          const xkey = getXKey();
          const headers: Record<string, string> = { 'Accept': 'application/json' };
          if (xkey) headers['xkey'] = xkey;

          const v5Res = await fetch(`${apiBase}/api/v5/tv/channels`, {
            signal: controller.signal,
            headers,
          });
          if (v5Res.ok) {
            const body = await v5Res.json();
            const list: V5Channel[] = body?.data?.channels || [];
            if (!active) return;
            if (list.length > 0) {
              const chs: DisplayChannel[] = list.map(ch => ({
                id: ch.id,
                name: ch.name,
                category: detectCat(ch.name) || ch.category || 'General',
                country: ch.country || 'intl',
                logoUrl: ch.image || getLogoUrl(ch.name),
                source: 'v5' as const,
                v5Id: ch.id,
              }));
              setChannels(chs);
              const urlCh = getUrlCh();
              const match = urlCh ? chs.find(c => c.name === urlCh) : null;
              if (match) setSelectedChannel(match);
              setLoading(false);
              return;
            }
          }
        } catch {}
      }

      try {
        const res = await fetch(`/api/playlist?source=live-tv`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch channels");
        const body = await res.json();
        if (!active) return;
        const chs: DisplayChannel[] = (body?.channels || []).map((ch: Record<string, unknown>, i: number) => ({
          id: `kv-${i}`,
          name: ch.name as string,
          category: getCategory(ch.name as string),
          country: '',
          logoUrl: getLogoUrl(ch.name as string),
          source: 'kv' as const,
          directUrl: ch.url as string,
          isDefault: !!ch.isDefault,
        }));
        setChannels(chs);
        if (chs.length > 0) {
          const urlCh = getUrlCh();
          const match = urlCh ? chs.find((c) => c.name === urlCh) : null;
          if (match) setSelectedChannel(match);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (active) setFetchError("Failed to load channels. Check your connection.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; controller.abort(); };
  }, []);

  // -------- Resolve stream when channel selected --------
  const streamKeyRef = useRef(0);
  useEffect(() => {
    if (!selectedChannel) return;
    const key = ++streamKeyRef.current;

    if (selectedChannel.source === 'v5') {
      setIsResolving(true);
      setResolvedStreamUrl(null);
      const apiBase = getApiBaseUrl().replace(/\/+$/, '');
      const xkey = getXKey();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (xkey) headers['xkey'] = xkey;
      const controller = new AbortController();

      fetch(`${apiBase}/api/v5/tv/channel/${selectedChannel.v5Id}/stream`, { signal: controller.signal, headers })
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(body => {
          if (key !== streamKeyRef.current) return;
          const streamUrl = body?.data?.stream_url;
          if (streamUrl) setResolvedStreamUrl(streamUrl.startsWith('http') ? streamUrl : apiBase + streamUrl);
        })
        .catch(() => { if (key === streamKeyRef.current) setResolvedStreamUrl(null); })
        .finally(() => { if (key === streamKeyRef.current) setIsResolving(false); });

      return () => controller.abort();
    }

    if (selectedChannel.source === 'kv' && selectedChannel.directUrl) {
      const url = selectedChannel.directUrl;
      setResolvedStreamUrl(url.startsWith("http://") ? `/api/iptv/proxy?url=${encodeURIComponent(url)}` : url);
      setIsResolving(false);
    }
  }, [selectedChannel]);

  // -------- Derived data --------
  const isBrowseMode = !selectedChannel;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: channels.length };
    for (const ch of channels) {
      counts[ch.category] = (counts[ch.category] || 0) + 1;
    }
    return counts;
  }, [channels]);

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: channels.length };
    for (const ch of channels) {
      if (ch.country) {
        const cn = countryName(ch.country);
        counts[cn] = (counts[cn] || 0) + 1;
      }
    }
    return counts;
  }, [channels]);

  const sortedCountries = useMemo(() => {
    return Object.entries(countryCounts)
      .filter(([k]) => k !== 'All')
      .sort(([, a], [, b]) => b - a);
  }, [countryCounts]);

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (activeCategory !== "All") {
      result = result.filter((ch) => ch.category === activeCategory);
    }
    if (activeCountry !== "All") {
      result = result.filter((ch) => countryName(ch.country) === activeCountry);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ch) => ch.name.toLowerCase().includes(q));
    }
    return result;
  }, [channels, activeCategory, activeCountry, searchQuery]);

  const similarChannels = useMemo(() => {
    if (!selectedChannel) return [];
    return channels.filter(ch => ch.category === selectedChannel.category && ch.id !== selectedChannel.id);
  }, [channels, selectedChannel]);

  const listItems = useMemo(() => {
    return filteredChannels.map(ch => ({
      key: ch.id,
      name: ch.name,
      logo: ch.logoUrl,
      extra: `${ch.category.toUpperCase()} · ${countryName(ch.country)}`,
    }));
  }, [filteredChannels]);

  const selectedKey = selectedChannel?.id ?? null;

  // Auto-scroll to the playing channel and reset filters if it's filtered out
  useEffect(() => {
    if (!selectedKey) {
      lastScrolledKeyRef.current = null;
      return;
    }
    
    // Only scroll or adjust filters if the selected channel has actually changed
    if (selectedKey !== lastScrolledKeyRef.current) {
      const idx = listItems.findIndex(it => it.key === selectedKey);
      if (idx !== -1) {
        lastScrolledKeyRef.current = selectedKey;
        const timer = setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({ index: idx, align: "center", behavior: "smooth" });
          mobileVirtuosoRef.current?.scrollToIndex({ index: idx, align: "center", behavior: "smooth" });
        }, 200);
        return () => clearTimeout(timer);
      } else {
        // Reset filters to reveal the channel, ref will be updated on the next cycle
        setActiveCategory("All");
        setActiveCountry("All");
        setSearchQuery("");
      }
    }
  }, [selectedKey, listItems]);

  const listCount = filteredChannels.length;

  // -------- Actions --------
  const selectChannel = useCallback((ch: DisplayChannel) => {
    setSelectedChannel(ch);
    setResolvedStreamUrl(null);
    setIsMobileDropdownOpen(false);
    router.replace(`?ch=${encodeURIComponent(ch.name)}`, { scroll: false });
  }, [router]);

  const backToBrowse = useCallback(() => {
    setSelectedChannel(null);
    setResolvedStreamUrl(null);
    setSearchQuery("");
    setActiveCategory("All");
    setActiveCountry("All");
    router.replace(`/live-tv`, { scroll: false });
  }, [router]);

  const onItemClick = useCallback((key: string) => {
    const ch = channels.find(c => c.id === key);
    if (ch) {
      selectChannel(ch);
      setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [channels, selectChannel]);

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        {/* ─── Hero ─── */}
        <div className="relative border border-border-alt bg-card p-8 md:p-12">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Tv className="w-3 h-3 text-red-500" />
                {isBrowseMode ? `${channels.length} Channels` : selectedChannel?.category || 'TV'}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                {isBrowseMode ? 'Live TV' : selectedChannel?.name}<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                {isBrowseMode
                  ? `${channels.length} channel${channels.length !== 1 ? 's' : ''} available`
                  : `${selectedChannel?.category} · Click a channel to watch`
                }
              </p>
            </div>
            {!isBrowseMode && (
              <button
                onClick={backToBrowse}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                Browse Channels
              </button>
            )}
          </div>

          {!isBrowseMode && (
          <p className="text-[11px] font-mono text-yellow-500/80 leading-relaxed text-center mt-3">
            Stream buffering? Switch channel or server.
          </p>
          )}
        </div>

        {/* ─── Loading ─── */}
        {loading ? (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch animate-pulse">
            <div className="hidden lg:flex lg:flex-col lg:w-72 shrink-0 space-y-4">
              <div className="h-10 bg-hover border border-border-alt" />
              <div className="h-4 w-20 bg-hover" />
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-hover border border-border-alt/50" />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-4 w-full">
              <div className="border border-border-alt bg-card p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-border-alt pb-4">
                  <div className="w-8 h-8 bg-hover border border-border-alt" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-hover" />
                    <div className="h-3 w-56 bg-hover" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-video bg-hover border border-border-alt" />
                  ))}
                </div>
              </div>
            </div>
          </div>

        ) : fetchError ? (
          <div className="flex items-center justify-center border border-border-alt bg-card py-20">
            <div className="text-center space-y-3 px-6">
              <div className="border border-red-500/20 bg-red-500/5 px-6 py-4">
                <p className="font-mono text-xs text-red-500 uppercase tracking-widest">[ LOAD_ERROR ]</p>
                <p className="font-mono text-[10px] text-fg-dim mt-2">{fetchError}</p>
              </div>
            </div>
          </div>

        ) : isBrowseMode ? (
          <>
            <div className="border border-border-alt bg-card divide-y divide-border-alt">
              {/* Search */}
              <div className="flex items-center gap-3 px-4 py-3">
                <Search className="w-4 h-4 text-fg-faint shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels..."
                  className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="px-4 py-3 space-y-2.5">
                <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_LABELS.map((cat) => {
                    const count = categoryCounts[cat] || 0;
                    const isActiveCat = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
                        className={`text-[10px] font-mono tracking-wider px-2.5 py-1.5 border transition-all cursor-pointer ${
                          isActiveCat
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'border-border-alt bg-card text-fg-dim hover:border-red-500/20 hover:text-red-300 hover:bg-red-500/[0.02]'
                        }`}
                      >
                        {cat}
                        <span className={`ml-1.5 ${isActiveCat ? 'text-red-400/60' : 'text-fg-faint'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Country */}
              <div className="px-4 py-3 space-y-2.5">
                <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest">Country</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { setActiveCountry("All"); setSearchQuery(""); }}
                    className={`text-[10px] font-mono tracking-wider px-2.5 py-1.5 border transition-all cursor-pointer ${
                      activeCountry === "All"
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : 'border-border-alt bg-card text-fg-dim hover:border-red-500/20 hover:text-red-300 hover:bg-red-500/[0.02]'
                    }`}
                  >
                    All
                    <span className={`ml-1.5 ${activeCountry === "All" ? 'text-red-400/60' : 'text-fg-faint'}`}>{countryCounts.All}</span>
                  </button>
                  {sortedCountries.slice(0, showAllCountries ? undefined : 12).map(([name, count]) => (
                    <button
                      key={name}
                      onClick={() => { setActiveCountry(name); setSearchQuery(""); }}
                      className={`text-[10px] font-mono tracking-wider px-2.5 py-1.5 border transition-all cursor-pointer ${
                        activeCountry === name
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'border-border-alt bg-card text-fg-dim hover:border-red-500/20 hover:text-red-300 hover:bg-red-500/[0.02]'
                      }`}
                    >
                      {name}
                      <span className={`ml-1.5 ${activeCountry === name ? 'text-red-400/60' : 'text-fg-faint'}`}>{count}</span>
                    </button>
                  ))}
                  {sortedCountries.length > 12 && (
                    <button
                      onClick={() => setShowAllCountries(!showAllCountries)}
                      className="text-[10px] font-mono tracking-wider px-2.5 py-1.5 border border-border-alt bg-card text-fg-faint hover:text-fg-dim transition-all cursor-pointer"
                    >
                      {showAllCountries ? 'Less' : `+${sortedCountries.length - 12}`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Channel Grid */}
            {filteredChannels.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredChannels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      selectChannel(ch);
                      setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    className="group border border-border-alt bg-card hover:border-red-500/30 hover:shadow-[0_0_12px_rgba(239,68,68,0.06)] transition-all duration-200 cursor-pointer text-left"
                  >
                    <div className="aspect-video bg-gradient-to-br from-[#111] to-[#1a1a1a] relative overflow-hidden">
                      <Logo src={ch.logoUrl} name={ch.name} className="p-5 group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/60 bg-red-500/20 text-red-300 text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 backdrop-blur-sm">
                          <Play className="w-3 h-3" />
                          Watch
                        </span>
                      </div>
                      <div className="absolute top-1.5 left-1.5">
                        <span className="px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest border border-border-alt bg-black/60 text-fg-dim">
                          {ch.category}
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 border-t border-border-alt">
                      <p className="text-xs font-mono font-semibold text-fg truncate group-hover:text-red-400 transition-colors">{ch.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-20 border border-border-alt bg-card">
                <div className="text-center space-y-3">
                  <Search className="w-8 h-8 text-fg-faint/30 mx-auto" />
                  <p className="font-mono text-sm text-fg-dim font-semibold">No channels found</p>
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                    {searchQuery ? `No channels match "${searchQuery}"` : 'No channels in this category'}
                  </p>
                </div>
              </div>
            )}
          </>

        ) : (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-6 lg:overflow-hidden">
            <div className="hidden lg:block relative h-full">
              <div className="absolute inset-0 flex flex-col overflow-y-auto scrollbar-red">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Filter channels..." />
                <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-1 mt-3 mb-1 shrink-0">
                  {listCount} channel{listCount !== 1 ? 's' : ''}
                </div>
                {listCount === 0 ? (
                  <div className="text-center py-10">
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 relative">
                    <Virtuoso
                      ref={virtuosoRef}
                      className="!absolute inset-0 scrollbar-red"
                      data={listItems}
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
            </div>

            {/* ── Center: Player + Details + Similar ── */}
            <div ref={playerRef} className="min-w-0 space-y-4">
              {/* Mobile picker */}
              <div className="relative lg:hidden w-full shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all shadow-md cursor-pointer"
                >
                  <Tv className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="min-w-0 text-center flex-1">
                    <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">Now Playing</span>
                    <span className="font-mono text-xs font-bold text-fg truncate block">{selectedChannel?.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-fg-dim transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMobileDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 h-[40dvh] flex flex-col">
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
                    {listCount === 0 ? (
                      <div className="text-center py-8">
                        <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 relative">
                        <Virtuoso
                          ref={mobileVirtuosoRef}
                          className="!absolute inset-0 scrollbar-red"
                          data={listItems}
                          itemContent={(idx, it) => (
                            <div className="px-1 pb-1">
                              <button
                                type="button"
                                onClick={() => { onItemClick(it.key); setIsMobileDropdownOpen(false); }}
                                className={`w-full text-left border p-3 transition-all cursor-pointer flex items-center justify-between ${
                                  it.key === selectedKey
                                    ? 'border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold'
                                    : 'border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-mono truncate">{it.name}</div>
                                  <div className="text-[9px] font-mono text-fg-dim mt-0.5">{it.extra}</div>
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

              {/* Player header */}
              <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 border border-border-alt bg-hover flex items-center justify-center overflow-hidden shrink-0">
                    <Logo src={selectedChannel?.logoUrl || null} name={selectedChannel?.name || ''} className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-mono text-sm font-bold text-fg truncate">{selectedChannel?.name}</h2>
                    <p className="text-[10px] font-mono text-fg-dim uppercase tracking-widest">{selectedChannel?.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(window.location.href)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border-alt bg-input text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] text-[10px] font-mono transition-all cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>
              </div>

              {/* Video Player */}
              {isResolving ? (
                <div className="aspect-video flex items-center justify-center border border-border-alt bg-card">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
                    <p className="font-mono text-[10px] text-fg-dim uppercase tracking-widest">Resolving stream...</p>
                  </div>
                </div>
              ) : resolvedStreamUrl ? (
                <VideoPlayer streamUrl={resolvedStreamUrl} streamType="hls" clearKeys={null} />
              ) : (
                <div className="aspect-video flex items-center justify-center border border-border-alt bg-card">
                  <div className="text-center space-y-3">
                    <Tv className="w-8 h-8 text-fg-faint/30 mx-auto" />
                    <p className="font-mono text-xs text-fg-dim font-semibold">Stream unavailable</p>
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">Try another channel</p>
                  </div>
                </div>
              )}

            </div>

            <div className="hidden lg:block relative h-full">
              <div className="absolute inset-0 flex flex-col overflow-y-auto scrollbar-red border border-border-alt bg-card divide-y divide-border-alt">
                {/* Search */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Search className="w-4 h-4 text-fg-faint shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_LABELS.map((cat) => {
                      const count = categoryCounts[cat] || 0;
                      const isActiveCat = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
                          className={`text-[10px] font-mono tracking-wider px-2.5 py-1.5 border transition-all cursor-pointer ${
                            isActiveCat
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : 'border-border-alt bg-card text-fg-dim hover:border-red-500/20 hover:text-red-300 hover:bg-red-500/[0.02]'
                          }`}
                        >
                          {cat}
                          <span className={`ml-1.5 ${isActiveCat ? 'text-red-400/60' : 'text-fg-faint'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Country */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest">Country</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedCountries.map(([name, count]) => (
                      <button
                        key={name}
                        onClick={() => { setActiveCountry(name); setSearchQuery(""); }}
                        className={`text-[10px] font-mono tracking-wider px-2.5 py-1.5 border transition-all cursor-pointer ${
                          activeCountry === name
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'border-border-alt bg-card text-fg-dim hover:border-red-500/20 hover:text-red-300 hover:bg-red-500/[0.02]'
                        }`}
                      >
                        {name}
                        <span className={`ml-1.5 ${activeCountry === name ? 'text-red-400/60' : 'text-fg-faint'}`}>{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {similarChannels.length > 0 && (
            <div className="pt-8 border-t border-border-alt group/more">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <p className="text-xs font-mono text-fg font-semibold tracking-wide">
                  More in <span className="text-red-400">{selectedChannel?.category}</span>
                </p>
                <div className="h-px flex-1 bg-border-alt/50" />
              </div>
              <div className="relative">
                <div className="absolute left-0 z-10 opacity-0 group-hover/more:opacity-100 transition-opacity" style={{ top: '36%', transform: 'translateY(-50%)' }}>
                  <button
                    onClick={() => { const el = document.getElementById('more-scroll'); if (el) el.scrollBy({ left: -400, behavior: 'smooth' }); }}
                    className="flex items-center justify-center w-10 h-10 bg-black/70 border border-border-alt text-fg-dim hover:text-fg hover:border-red-500/30 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute right-0 z-10 opacity-0 group-hover/more:opacity-100 transition-opacity" style={{ top: '36%', transform: 'translateY(-50%)' }}>
                  <button
                    onClick={() => { const el = document.getElementById('more-scroll'); if (el) el.scrollBy({ left: 400, behavior: 'smooth' }); }}
                    className="flex items-center justify-center w-10 h-10 bg-black/70 border border-border-alt text-fg-dim hover:text-fg hover:border-red-500/30 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
                <div id="more-scroll" className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                  {similarChannels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      selectChannel(ch);
                      setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    className="group shrink-0 w-28"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-[#141414] to-[#1c1c1c] border border-border-alt flex items-center justify-center overflow-hidden group-hover:border-red-500/40 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.08)] transition-all duration-300">
                      <Logo src={ch.logoUrl} name={ch.name} className="p-4 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="mt-2 px-0.5">
                      <p className="text-xs font-mono font-semibold text-fg truncate leading-tight group-hover:text-red-400 transition-colors">
                        {ch.name}
                      </p>
                      <p className="text-[9px] font-mono text-fg-faint mt-0.5 truncate">{countryName(ch.country)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
