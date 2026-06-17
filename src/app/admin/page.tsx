"use client";
export const runtime = "edge";

import { useCallback, useState, useRef } from "react";
import { loadAdminConfig, saveAdminConfig, fetchAndParseSource, isGithubUrl, toRawGithubUrl, parseM3u } from "@/data/admin";
import type { AdminConfig, V3Source } from "@/data/admin";
import { PageHero } from "@/components/ui/PageHero";
import Tv from "lucide-react/dist/esm/icons/tv";
import Trash from "lucide-react/dist/esm/icons/trash";
import Plus from "lucide-react/dist/esm/icons/plus";
import Upload from "lucide-react/dist/esm/icons/upload";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Check from "lucide-react/dist/esm/icons/check";
import File from "lucide-react/dist/esm/icons/file";

export default function AdminPage() {
  const [config, setConfig] = useState<AdminConfig>(loadAdminConfig);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saved, setSaved] = useState(false);

  const updateConfig = useCallback((next: AdminConfig) => {
    setConfig(next);
    saveAdminConfig(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const toggleVersion = useCallback((v: "v1" | "v2" | "v3") => {
    updateConfig({ ...config, enabled: { ...config.enabled, [v]: !config.enabled[v] } });
  }, [config, updateConfig]);

  const deleteSource = useCallback((i: number) => {
    const next = { ...config, sources: config.sources.filter((_, idx) => idx !== i) };
    updateConfig(next);
  }, [config, updateConfig]);

  const addSource = useCallback(async () => {
    const label = newLabel.trim();
    const url = newUrl.trim();
    if (!label || !url) return;
    setFetchError("");
    setFetching(true);
    try {
      const gh = isGithubUrl(url);
      const text = await (await fetch(gh ? toRawGithubUrl(url) : url)).text();
      const isM3u = text.includes("#EXTM3U") || text.includes("#EXTINF:");
      const isJson = url.match(/\.json$/i) || text.trim().startsWith("[") || text.trim().startsWith("{");
      const source: V3Source = {
        label,
        url,
        type: isM3u ? "m3u8" : isJson ? "github-json" : "github-txt",
        channels: await fetchAndParseSource({
          label, url,
          type: isM3u ? "m3u8" : isJson ? "github-json" : "github-txt",
          channels: [],
          lastFetched: 0,
        }),
        lastFetched: Date.now(),
      };
      updateConfig({ ...config, sources: [...config.sources, source] });
      setNewLabel("");
      setNewUrl("");
    } catch (e: any) {
      setFetchError(e.message || "Failed to fetch");
    } finally {
      setFetching(false);
    }
  }, [newLabel, newUrl, config, updateConfig]);

  const refreshSource = useCallback(async (i: number) => {
    const old = config.sources[i];
    setFetching(true);
    try {
      const channels = await fetchAndParseSource(old);
      const next = { ...config, sources: config.sources.map((s, idx) => idx === i ? { ...s, channels, lastFetched: Date.now() } : s) };
      updateConfig(next);
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setFetching(false);
    }
  }, [config, updateConfig]);

  const totalV3 = config.sources.reduce((sum, s) => sum + s.channels.length, 0);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <PageHero
          icon={<Tv className="w-3 h-3 text-red-500" />}
          badge="Admin"
          title="Control Panel"
          description="Manage sources and API versions"
          hint={saved ? "Saved!" : "All data stored in browser localStorage"}
        />

        {/* API Toggles */}
        <div className="border border-border-alt bg-card p-6 space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-fg-dim">API Endpoints</h2>
          <div className="flex flex-wrap gap-3">
            {(["v1", "v2", "v3"] as const).map((v) => (
              <button
                key={v}
                onClick={() => toggleVersion(v)}
                className={`inline-flex items-center gap-2 px-4 py-2 border text-xs font-mono transition-all cursor-pointer ${
                  config.enabled[v]
                    ? "border-red-500/30 bg-red-500/[0.03] text-fg"
                    : "border-border-alt bg-input text-fg-dim hover:text-fg"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.enabled[v] ? "bg-green-500" : "bg-red-500"}`} />
                {v.toUpperCase()} {config.enabled[v] ? "ON" : "OFF"}
              </button>
            ))}
          </div>
        </div>

        {/* Add Source */}
        <div className="border border-border-alt bg-card p-6 space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-fg-dim">Add V3 Source</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. My IPTV)"
              className="bg-input border border-border-alt px-3 py-2 text-xs font-mono text-fg placeholder:text-fg-faint outline-none flex-1"
            />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="M3U URL or GitHub JSON/TXT URL"
              className="bg-input border border-border-alt px-3 py-2 text-xs font-mono text-fg placeholder:text-fg-faint outline-none flex-[2]"
            />
            <button
              onClick={addSource}
              disabled={fetching || !newLabel || !newUrl}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/30 bg-red-500/[0.03] text-xs font-mono text-fg hover:bg-red-500/[0.06] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add
            </button>
          </div>
          {fetchError && <p className="text-[10px] font-mono text-red-500">{fetchError}</p>}
          <p className="text-[10px] font-mono text-fg-faint">Supports M3U playlists, GitHub JSON arrays, or raw TXT URLs</p>
        </div>

        {/* Upload File */}
        <div className="border border-border-alt bg-card p-6 space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-fg-dim">Upload File</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-red-500/50"); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove("border-red-500/50"); }}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-red-500/50");
              const file = e.dataTransfer.files[0];
              if (!file) return;
              setFetchError("");
              setFetching(true);
              try {
                const text = await file.text();
                const label = file.name.replace(/\.(m3u8?|txt|json)$/i, "");
                const channels = parseM3u(text, `upload-${Date.now()}`);
                const type = file.name.match(/\.m3u8?$/i) ? "m3u8" : file.name.match(/\.json$/i) ? "github-json" : "github-txt";
                const source: V3Source = { label, url: `[upload] ${file.name}`, type, channels, lastFetched: Date.now() };
                updateConfig({ ...config, sources: [...config.sources, source] });
              } catch (e: any) {
                setFetchError(e.message || "Failed to parse file");
              } finally {
                setFetching(false);
              }
            }}
            className="border-2 border-dashed border-border-alt p-8 text-center transition-colors cursor-pointer hover:border-red-500/30"
          >
            <input
              type="file"
              accept=".m3u8,.m3u,.txt,.json"
              className="hidden"
              id="file-upload"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFetchError("");
                setFetching(true);
                try {
                  const text = await file.text();
                  const label = file.name.replace(/\.(m3u8?|txt|json)$/i, "");
                  const channels = parseM3u(text, `upload-${Date.now()}`);
                  const type = file.name.match(/\.m3u8?$/i) ? "m3u8" : file.name.match(/\.json$/i) ? "github-json" : "github-txt";
                  const source: V3Source = { label, url: `[upload] ${file.name}`, type, channels, lastFetched: Date.now() };
                  updateConfig({ ...config, sources: [...config.sources, source] });
                } catch (e: any) {
                  setFetchError(e.message || "Failed to parse file");
                } finally {
                  setFetching(false);
                }
                e.target.value = "";
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
              {fetching ? <Loader2 className="w-6 h-6 text-red-500 animate-spin" /> : <Upload className="w-6 h-6 text-fg-dim" />}
              <span className="font-mono text-xs text-fg-dim">Drag & drop or click to upload .m3u8 / .m3u / .txt / .json</span>
            </label>
          </div>
        </div>

        {/* Sources List */}
        <div className="space-y-3">
          {config.sources.length === 0 && (
            <div className="text-center py-12 font-mono text-[10px] text-fg-faint uppercase tracking-widest">No sources added yet</div>
          )}
          {config.sources.map((source, i) => (
            <div key={i} className="border border-border-alt bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-mono text-xs font-bold text-fg truncate">{source.label}</h3>
                  <p className="font-mono text-[9px] text-fg-faint truncate">{source.url}</p>
                  <p className="font-mono text-[9px] text-fg-dim">{source.channels.length} channels · {source.type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => refreshSource(i)} disabled={fetching} className="text-[10px] font-mono text-fg-dim hover:text-fg border border-border-alt px-2 py-1 transition-all cursor-pointer">Refresh</button>
                  <button onClick={() => deleteSource(i)} className="text-red-500 hover:text-red-400 transition-all cursor-pointer"><Trash className="w-4 h-4" /></button>
                </div>
              </div>
              {source.channels.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-red">
                  {source.channels.slice(0, 20).map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2 text-[10px] font-mono text-fg-dim">
                      {ch.logo && <img src={ch.logo} alt="" className="w-4 h-4 object-cover rounded" />}
                      <span className="truncate">{ch.name}</span>
                    </div>
                  ))}
                  {source.channels.length > 20 && <div className="text-[9px] font-mono text-fg-faint text-center">+{source.channels.length - 20} more</div>}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-fg-dim">
          <Check className="w-3 h-3 text-green-500" />
          {totalV3} channels from {config.sources.length} sources · API: V1={config.enabled.v1 ? "ON" : "OFF"} V2={config.enabled.v2 ? "ON" : "OFF"} V3={config.enabled.v3 ? "ON" : "OFF"}
        </div>
      </div>
    </div>
  );
}
