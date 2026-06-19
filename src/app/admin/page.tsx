"use client";

import { useState } from "react";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Server from "lucide-react/dist/esm/icons/server";
import Lock from "lucide-react/dist/esm/icons/lock";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Link from "next/link";


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [version, setVersion] = useState("v4");
  const [loading, setLoading] = useState(false);

  // Messages for Auth and Settings forms
  const [authError, setAuthError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        setMessage({ type: 'success', text: `Successfully updated default proxy to ${version.toUpperCase()}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
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
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    version === "v1" ? "bg-yellow-500" :
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
                      className={`p-3 border font-mono text-xs text-center transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                        version === v
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
                <div className={`p-3.5 text-xs font-mono border ${
                  message.type === 'success'
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

      </div>
    </div>
  );
}
