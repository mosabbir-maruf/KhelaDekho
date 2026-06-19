"use client";

import { useState } from "react";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Server from "lucide-react/dist/esm/icons/server";
import Lock from "lucide-react/dist/esm/icons/lock";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import FileText from "lucide-react/dist/esm/icons/file-text";
import LinkIcon from "lucide-react/dist/esm/icons/link";
import ListVideo from "lucide-react/dist/esm/icons/list-video";
import Link from "next/link";


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [version, setVersion] = useState("v4");
  const [loading, setLoading] = useState(false);

  // Messages for Auth and Settings forms
  const [authError, setAuthError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Playlist Management States
  type PlaylistSource = { id: string; type: 'url' | 'raw'; content: string };
  const [activeTab, setActiveTab] = useState<'live-tv' | 'live-matches'>('live-tv');
  const [liveTvSources, setLiveTvSources] = useState<PlaylistSource[]>([]);
  const [liveMatchesSources, setLiveMatchesSources] = useState<PlaylistSource[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceType, setNewSourceType] = useState<'url' | 'raw'>('url');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [playlistMessage, setPlaylistMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchPlaylists = async (authSecret: string) => {
    try {
      const res = await fetch("/api/admin/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: authSecret, action: 'get' }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveTvSources(data.liveTvSources || []);
        setLiveMatchesSources(data.liveMatchesSources || []);
      }
    } catch (e) {
      console.error("Failed to fetch playlists");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.defaultVersion) {
          setVersion(data.defaultVersion);
        }
        setIsAuthenticated(true);
        fetchPlaylists(secret);
      } else {
        setAuthError("Invalid authentication key. Access denied.");
      }
    } catch (error) {
      setAuthError("Network error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, defaultVersion: version }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully updated default routing to ${version.toUpperCase()}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const savePlaylistsToKV = async (source: 'live-tv' | 'live-matches', data: PlaylistSource[]) => {
    setPlaylistLoading(true);
    setPlaylistMessage(null);
    try {
      const res = await fetch("/api/admin/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, action: 'update', payload: { source, data } }),
      });
      if (res.ok) {
        setPlaylistMessage({ type: 'success', text: `Successfully updated ${source} playlists!` });
      } else {
        setPlaylistMessage({ type: 'error', text: `Failed to update ${source} playlists` });
      }
    } catch (e) {
      setPlaylistMessage({ type: 'error', text: 'Network error saving playlists' });
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setNewSourceContent(content);
      }
    };
    reader.readAsText(file);
  };

  const handleAddSource = async () => {
    if (!newSourceContent.trim()) return;
    const newSource: PlaylistSource = {
      id: Math.random().toString(36).substring(7),
      type: newSourceType,
      content: newSourceContent.trim()
    };

    if (activeTab === 'live-tv') {
      const updated = [...liveTvSources, newSource];
      setLiveTvSources(updated);
      await savePlaylistsToKV('live-tv', updated);
    } else {
      const updated = [...liveMatchesSources, newSource];
      setLiveMatchesSources(updated);
      await savePlaylistsToKV('live-matches', updated);
    }

    setNewSourceContent('');
    setIsAddingSource(false);
  };

  const handleDeleteSource = async (id: string) => {
    if (activeTab === 'live-tv') {
      const updated = liveTvSources.filter(s => s.id !== id);
      setLiveTvSources(updated);
      await savePlaylistsToKV('live-tv', updated);
    } else {
      const updated = liveMatchesSources.filter(s => s.id !== id);
      setLiveMatchesSources(updated);
      await savePlaylistsToKV('live-matches', updated);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Inline Authentication Form */}
          <div className="border border-border-alt bg-card p-6 md:p-8 max-w-2xl mx-auto min-h-[350px] flex flex-col justify-center">
            <div className="mb-10 space-y-3">
              <h2 className="text-2xl font-mono font-bold text-fg flex items-center gap-3">
                <Lock className="w-6 h-6 text-red-500" /> Authentication Required
              </h2>
              <p className="text-base font-mono text-fg-dim">
                Submit your admin secret key to unlock dashboard access.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {authError && (
                <div className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-mono">
                  <p>{authError}</p>
                </div>
              )}

              <div className="space-y-2.5">
                <label htmlFor="secret" className="text-sm font-mono text-fg-dim uppercase tracking-widest">
                  Admin Secret Key <span className="text-red-500">*</span>
                </label>
                <input
                  id="secret"
                  type="password"
                  required
                  disabled={loading}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border-alt text-base font-mono text-fg focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50"
                  placeholder="Enter admin secret key..."
                  autoFocus
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white text-base font-mono font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying..." : "Unlock Dashboard"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">


        {/* Hero Section (Matched with About Page) */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <ShieldCheck className="w-3 h-3 text-red-500" />
                System Administration
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Control Panel<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                Configure edge proxy routing and default server infrastructure. Changes made here apply immediately to all clients.
              </p>

              {/* Inline Status Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs font-mono text-fg-dim pt-2 border-t border-border-alt/30">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Gateway: <strong className="text-emerald-400">ONLINE</strong></span>
                </div>
                <div className="text-fg-faint opacity-50">|</div>
                <div className="flex items-center gap-2">
                  <span>Session: <strong className="text-emerald-400">VERIFIED</strong></span>
                </div>
                <div className="text-fg-faint opacity-50">|</div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${version === "v1" ? "bg-yellow-500" :
                      version === "v2" ? "bg-green-500" :
                        version === "v3" ? "bg-cyan-500" :
                          "bg-purple-500"
                    }`} />
                  <span>Active Default: <strong className="text-fg">{version.toUpperCase()}</strong></span>
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Box */}
          <div className="border border-border-alt bg-card relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <h2 className="text-sm font-mono font-bold text-fg flex items-center gap-2">
                  <Server className="w-4 h-4 text-red-500" /> Live Matches Page Routing
                </h2>
                <p className="text-xs font-mono text-fg-dim">
                  Select default streaming server version for live football matches.
                </p>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-6">

                {/* Compact Version Selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(["v1", "v2", "v3", "v4"] as const).map((v) => {
                    const labels = { v1: "V1", v2: "V2", v3: "V3", v4: "V4" };
                    const dotColors = { v1: "bg-yellow-500", v2: "bg-green-500", v3: "bg-cyan-500", v4: "bg-purple-500" };
                    const activeBorders = {
                      v1: "border-yellow-500/50 text-yellow-400 bg-yellow-500/[0.03]",
                      v2: "border-green-500/50 text-green-400 bg-green-500/[0.03]",
                      v3: "border-cyan-500/50 text-cyan-400 bg-cyan-500/[0.03]",
                      v4: "border-purple-500/50 text-purple-400 bg-purple-500/[0.03]"
                    };
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVersion(v)}
                        className={`p-3 border font-mono text-xs text-center transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${version === v
                            ? `${activeBorders[v]} font-bold`
                            : "border-border-alt text-fg-dim bg-input hover:border-border hover:text-fg"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[v]}`} />
                        {labels[v]}
                      </button>
                    );
                  })}
                </div>

                {message && (
                  <div className={`p-3.5 text-xs font-mono border ${message.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                    {message.text}
                  </div>
                )}

                <div className="pt-5 border-t border-border-alt flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <span className="text-[10px] font-mono text-fg-faint">
                    * New match sessions connect via selected default.
                  </span>
                  <button
                    type="submit"
                    disabled={loading || !isAuthenticated}
                    className="w-full sm:w-auto px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-mono text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && isAuthenticated ? "Deploying..." : "Update Default"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Playlist Management Box */}
          <div className="border border-border-alt bg-card relative">
            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <h2 className="text-sm font-mono font-bold text-fg flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-red-500" /> Playlist Management
                </h2>
                <p className="text-xs font-mono text-fg-dim">
                  Manage external M3U8 URLs or raw playlists stored in Cloudflare KV.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-alt">
                <button
                  onClick={() => { setActiveTab('live-tv'); setPlaylistMessage(null); }}
                  className={`px-4 py-3 text-xs font-mono transition-colors ${activeTab === 'live-tv' ? 'border-b-2 border-red-500 text-fg font-bold' : 'text-fg-dim hover:text-fg'}`}
                >
                  Live TV
                </button>
                <button
                  onClick={() => { setActiveTab('live-matches'); setPlaylistMessage(null); }}
                  className={`px-4 py-3 text-xs font-mono transition-colors ${activeTab === 'live-matches' ? 'border-b-2 border-red-500 text-fg font-bold' : 'text-fg-dim hover:text-fg'}`}
                >
                  Live Matches
                </button>
              </div>

              <div className="space-y-4">
                {playlistMessage && (
                  <div className={`p-3.5 text-xs font-mono border ${playlistMessage.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                    {playlistMessage.text}
                  </div>
                )}

                {/* Sources List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {(activeTab === 'live-tv' ? liveTvSources : liveMatchesSources).map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-3 border border-border-alt bg-input group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {source.type === 'url' ? <LinkIcon className="w-4 h-4 text-cyan-500 shrink-0" /> : <FileText className="w-4 h-4 text-purple-500 shrink-0" />}
                        <div className="text-xs font-mono text-fg truncate">
                          {source.type === 'url' ? source.content : "Raw M3U8/JSON Content (Parsed dynamically)"}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        disabled={playlistLoading}
                        className="text-fg-dim hover:text-red-500 p-1.5 transition-colors disabled:opacity-50 shrink-0"
                        title="Delete Source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(activeTab === 'live-tv' ? liveTvSources : liveMatchesSources).length === 0 && (
                    <div className="p-6 border border-dashed border-border-alt text-center text-xs font-mono text-fg-dim">
                      No custom sources added. Falling back to default static files.
                    </div>
                  )}
                </div>

                {/* Add New Source UI */}
                {isAddingSource ? (
                  <div className="p-4 border border-border-alt bg-input/50 space-y-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewSourceType('url')}
                        className={`px-3 py-1.5 text-xs font-mono border ${newSourceType === 'url' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-border-alt text-fg-dim hover:text-fg'}`}
                      >
                        External URL
                      </button>
                      <button
                        onClick={() => setNewSourceType('raw')}
                        className={`px-3 py-1.5 text-xs font-mono border ${newSourceType === 'raw' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-border-alt text-fg-dim hover:text-fg'}`}
                      >
                        Raw Text Content
                      </button>
                    </div>

                    {newSourceType === 'url' ? (
                      <input
                        type="url"
                        value={newSourceContent}
                        onChange={(e) => setNewSourceContent(e.target.value)}
                        placeholder="https://example.com/playlist.m3u8"
                        className="w-full px-3 py-2 bg-input border border-border-alt text-xs font-mono text-fg focus:outline-none focus:border-red-500/50"
                      />
                    ) : (
                      <>
                        {newSourceType === 'raw' && (
                          <div className="pt-2 pb-1">
                            <label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-border-alt hover:border-red-500/50 hover:bg-red-500/5 cursor-pointer transition-all text-xs font-mono text-fg-dim">
                              <Plus className="w-4 h-4 mr-2" /> Select .json or .m3u8 file from device
                              <input
                                type="file"
                                accept=".json,.m3u8,.m3u,.txt"
                                className="hidden"
                                onChange={handleFileSelect}
                              />
                            </label>
                            <div className="text-center mt-2 mb-2 text-[10px] text-fg-faint">OR paste the content below:</div>
                          </div>
                        )}
                        <textarea
                          value={newSourceContent}
                          onChange={(e) => setNewSourceContent(e.target.value)}
                          placeholder="#EXTM3U..."
                          rows={5}
                          className="w-full px-3 py-2 bg-input border border-border-alt text-xs font-mono text-fg focus:outline-none focus:border-red-500/50 resize-y"
                        />
                      </>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => { setIsAddingSource(false); setNewSourceContent(''); }}
                        className="px-4 py-2 text-xs font-mono text-fg-dim hover:text-fg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddSource}
                        disabled={playlistLoading || !newSourceContent.trim()}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {playlistLoading ? "Saving..." : "Save Source"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingSource(true)}
                    className="w-full py-3 border border-dashed border-border-alt hover:border-red-500/50 hover:text-red-400 text-fg-dim text-xs font-mono transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add New Source
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
