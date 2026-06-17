"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tv from "lucide-react/dist/esm/icons/tv";
import Search from "lucide-react/dist/esm/icons/search";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import X from "lucide-react/dist/esm/icons/x";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Zap from "lucide-react/dist/esm/icons/zap";
import Shield from "lucide-react/dist/esm/icons/shield";
import Server from "lucide-react/dist/esm/icons/server";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Link from "next/link";
import { SERVER_URLS } from "@/data/m3uServers";
import { PageHero, LoadingSpinner } from "@/components/ui/PageHero";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

interface M3uEntry {
  name: string;
  url: string;
  originalUrl: string;
  logo: string | null;
  group: string | null;
}

interface ServerInfo {
  label: string;
  url: string;
  status: "idle" | "loading" | "ok" | "error";
  count: number;
}

function getServerLabel(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url.slice(0, 40);
  }
}

function getShortLabel(url: string): string {
  const match = url.match(/username=([^&]+)/);
  return match ? match[1].slice(0, 12) + "..." : url.slice(0, 20);
}

const PROXY_BASE = "/api/m3u-proxy?url=";

function proxyUrl(url: string): string {
  return `${PROXY_BASE}${encodeURIComponent(url)}`;
}

function parseM3u(text: string): M3uEntry[] {
  const lines = text.split("\n");
  const entries: M3uEntry[] = [];
  let currentExtinf: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF:")) {
      currentExtinf = line;
    } else if (line && !line.startsWith("#") && currentExtinf) {
      const logoMatch = currentExtinf.match(/tvg-logo="([^"]*)"/);
      const groupMatch = currentExtinf.match(/group-title="([^"]*)"/);
      const namePart = currentExtinf.split(",").pop()?.trim() || "Unknown";
      entries.push({
        name: namePart,
        url: line,
        originalUrl: line,
        logo: logoMatch?.[1] || null,
        group: groupMatch?.[1] || null,
      });
      currentExtinf = null;
    }
  }
  return entries;
}

export default function M3uTestPage() {
  const [entries, setEntries] = useState<M3uEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<M3uEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [serverStatus, setServerStatus] = useState<Record<string, ServerInfo>>({});
  const [activeServerUrl, setActiveServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const servers = useMemo(() => {
    const map = new Map<string, { label: string; urls: string[] }>();
    for (const url of SERVER_URLS) {
      const host = getServerLabel(url);
      if (!map.has(host)) map.set(host, { label: host, urls: [] });
      map.get(host)!.urls.push(url);
    }
    return Array.from(map.values());
  }, []);

  const loadServer = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setActiveServerUrl(url);
    setServerStatus((prev) => ({
      ...prev,
      [url]: { ...prev[url], label: getShortLabel(url), url, status: "loading", count: 0 },
    }));

    try {
      const res = await fetch(proxyUrl(url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseM3u(text).map((e) => ({ ...e, url: proxyUrl(e.url) }));
      setEntries(parsed);
      if (parsed.length > 0) setSelectedEntry(parsed[0]);
      setServerStatus((prev) => ({
        ...prev,
        [url]: { label: getShortLabel(url), url, status: "ok", count: parsed.length },
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fetch failed";
      setError(msg);
      setEntries([]);
      setServerStatus((prev) => ({
        ...prev,
        [url]: { label: getShortLabel(url), url, status: "error", count: 0 },
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, searchQuery]);

  const selectEntry = useCallback((entry: M3uEntry) => {
    setSelectedEntry(entry);
  }, []);

  const totalEntries = entries.length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-12 flex-1">
        {/* Hero */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Server className="w-3 h-3 text-red-500" />
                M3U Test
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                M3U Playground<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                Test IPTV playlist URLs, fetch and play channels.
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
            Select a server below to load its channel list.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-6 flex-1 min-h-0 overflow-hidden grid-rows-[1fr]">
          {/* Left: Server list */}
          <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card overflow-hidden min-h-0">
            <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-3 py-2 border-b border-border-alt shrink-0">
              Servers ({SERVER_URLS.length})
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 p-2 scrollbar-red">
              {servers.map((server) => (
                <div key={server.label}>
                  <div className="text-[10px] font-mono text-fg-faint uppercase tracking-wider px-2 py-1 border-b border-border-alt mb-1">
                    {server.label}
                  </div>
                  <div className="space-y-1">
                    {server.urls.map((url) => {
                      const status = serverStatus[url];
                      return (
                        <button
                          key={url}
                          onClick={() => loadServer(url)}
                          className={`w-full text-left border p-2 transition-all cursor-pointer group ${
                            activeServerUrl === url
                              ? "border-red-500/30 bg-red-500/[0.03]"
                              : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {status?.status === "loading" ? (
                              <Loader2 className="w-3 h-3 text-yellow-500 animate-spin shrink-0" />
                            ) : status?.status === "ok" ? (
                              <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                            ) : status?.status === "error" ? (
                              <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                            ) : (
                              <Server className="w-3 h-3 text-fg-dim shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-mono font-semibold truncate text-fg group-hover:text-red-400 transition-colors">
                                {getShortLabel(url)}
                              </div>
                              {status && status.count > 0 && (
                                <div className="text-[9px] font-mono text-fg-dim">
                                  {status.count} channels
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Player */}
          <div className="min-w-0 w-full min-h-0 flex flex-col gap-3">
            {loading ? (
              <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                <div className="flex flex-col items-center gap-3 py-16">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                  <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Loading playlist...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                <div className="text-center space-y-3 py-16">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                  <p className="font-mono text-sm text-red-500 font-semibold">Failed to load</p>
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">{error}</p>
                </div>
              </div>
            ) : selectedEntry ? (
              <>
                <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedEntry.logo ? (
                        <img src={selectedEntry.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Tv className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-mono text-lg font-bold text-fg tracking-tight truncate">{selectedEntry.name}</h2>
                      {selectedEntry.group && (
                        <p className="font-mono text-xs text-fg-dim">{selectedEntry.group}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-fg-dim shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-fg font-bold">STREAM</span>
                    </span>
                  </div>
                </div>

                <VideoPlayer
                  streamUrl={selectedEntry.url}
                  streamType={selectedEntry.originalUrl.match(/\.ts($|\?)/) ? "direct" : "hls"}
                  clearKeys={null}
                />

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
                    <p className="font-mono text-sm font-bold text-fg">{totalEntries}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Channels</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                <div className="text-center space-y-3 py-16">
                  <div className="w-12 h-12 rounded-xl border border-border-alt bg-hover flex items-center justify-center mx-auto">
                    <Server className="w-6 h-6 text-fg-dim" />
                  </div>
                  <p className="font-mono text-sm text-fg-dim font-semibold">Select a server</p>
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                    Choose from the left panel to load channels
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Channel list */}
          <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card overflow-hidden min-h-0">
            <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-3 py-2 border-b border-border-alt shrink-0">
              {totalEntries} channel{totalEntries !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2 border-b border-border-alt bg-card px-3 py-2 shrink-0">
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
            <div className="flex-1 overflow-y-auto min-h-0 space-y-1 p-2 scrollbar-red">
              {filteredEntries.map((entry, i) => (
                <button
                  key={`${entry.name}-${i}`}
                  onClick={() => selectEntry(entry)}
                  className={`w-full text-left border p-3 transition-all cursor-pointer group ${
                    selectedEntry?.url === entry.url
                      ? "border-red-500/30 bg-red-500/[0.03]"
                      : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`relative w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden transition-all ${
                      selectedEntry?.url === entry.url
                        ? "border-red-500/20 bg-red-500/10"
                        : "border-border-alt bg-hover group-hover:border-red-500/20 group-hover:bg-red-500/10"
                    }`}>
                      {entry.logo ? (
                        <img src={entry.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Tv className={`w-3.5 h-3.5 transition-colors ${
                          selectedEntry?.url === entry.url ? "text-red-400" : "text-fg-dim group-hover:text-red-400"
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-mono font-semibold truncate transition-colors ${
                        selectedEntry?.url === entry.url ? "text-red-400" : "text-fg group-hover:text-red-400"
                      }`}>
                        {entry.name}
                      </div>
                      {entry.group && (
                        <div className="text-[9px] font-mono text-fg-dim mt-0.5">
                          {entry.group.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredEntries.length === 0 && (
                <div className="text-center py-10">
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                    {entries.length === 0 ? "No channels loaded" : "No channels found"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
