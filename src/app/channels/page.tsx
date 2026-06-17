"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { SearchInput } from "@/components/ui/SearchInput";
import { ChannelListItem } from "@/components/ui/ChannelListItem";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Tv from "lucide-react/dist/esm/icons/tv";

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
  const router = useRouter();
  const [apiVersion, setApiVersion] = useState<"v1" | "v2">("v2");
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      const chs = await fetchChannels(apiVersion, controller.signal);
      if (!active) return;
      setChannels(chs);
      setLoading(false);
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

  const isV1 = apiVersion === "v1";

  const navigateToChannel = useCallback((ch: any) => {
    const path = isV1
      ? `/v1/channel/${(ch as V1Channel).key}`
      : `/v2/channel/${(ch as V2Channel).id}`;
    router.push(path);
  }, [isV1, router]);

  const toggleVersion = useCallback(() => {
    setApiVersion((prev) => (prev === "v1" ? "v2" : "v1"));
  }, []);

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
                    selected={false}
                    onClick={() => navigateToChannel(ch)}
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

            <div className="flex-1 min-w-0 w-full flex items-center justify-center py-32 border border-border-alt bg-card">
              <div className="text-center space-y-3">
                <Tv className="w-8 h-8 text-fg-dim mx-auto" />
                <p className="font-mono text-sm text-fg-dim font-semibold">Select a channel</p>
                <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                  Choose from the left panel to start watching
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
