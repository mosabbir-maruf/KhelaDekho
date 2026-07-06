import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/CodeBlock";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Activity from "lucide-react/dist/esm/icons/activity";
import Link from "next/link";

const title = "Architecture";
const description = "How KhelaDekho works under the hood — the streaming pipeline from source aggregation to decryption to playback.";
const url = "https://kheladekho.pages.dev/docs/architecture";

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title: `${title} | KhelaDekho`,
        description,
        url,
        type: "article",
        images: [
            {
                url: "https://kheladekho.pages.dev/meta-graph.webp",
                width: 1200,
                height: 630,
                alt: "KhelaDekho — Live Sports Streaming Aggregator",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${title} | KhelaDekho`,
        description,
    },
    alternates: {
        canonical: url,
    },
};

export default function ArchitecturePage() {
    return (
        <div className="space-y-16 w-full">
            {/* Hero Banner */}
            <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                            <Activity className="w-3 h-3 text-red-500" />
                            SYS_ARCHITECTURE
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                            Architecture
                        </h1>
                        <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                            How KhelaDekho works under the hood — the streaming pipeline from source aggregation to decryption to playback.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all shrink-0"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
                    </Link>
                </div>
            </div>

            {/* Pipeline Overview */}
            <section className="space-y-6">
                <h2 className="text-xl font-mono tracking-widest uppercase text-fg">The Pipeline</h2>
                <div className="border border-border-alt bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-border-alt">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                        <span className="text-[10px] font-mono text-fg-faint tracking-widest uppercase">data_flow</span>
                    </div>
                    <div className="p-6 font-mono text-sm space-y-4">
                        <div className="flex flex-wrap items-center gap-3 text-fg-dim">
                            <span className="px-3 py-1.5 border border-blue-500/20 bg-blue-500/5 text-blue-400">Client Request</span>
                            <span className="text-fg-faint">→</span>
                            <span className="px-3 py-1.5 border border-purple-500/20 bg-purple-500/5 text-purple-400">X-Key Auth</span>
                            <span className="text-fg-faint">→</span>
                            <span className="px-3 py-1.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">Provider Scrape / Edge Proxy</span>
                            <span className="text-fg-faint">→</span>
                            <span className="px-3 py-1.5 border border-orange-500/20 bg-orange-500/5 text-orange-400">Cached JSON</span>
                            <span className="text-fg-faint">→</span>
                            <span className="px-3 py-1.5 border border-red-500/20 bg-red-500/5 text-red-400">Scores / HLS / DASH</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Layer 1: Frontend */}
            <section className="space-y-6">
                <div className="space-y-2">
                    <div className="text-xs font-mono text-fg-faint tracking-widest uppercase">Layer 01</div>
                    <h2 className="text-xl font-mono tracking-widest uppercase text-fg">Frontend UI (Next.js)</h2>
                </div>
                <p className="text-fg-dim font-mono text-sm leading-relaxed">
                    The presentation layer is built with Next.js and Tailwind CSS. It focuses on a premium, glassmorphic aesthetic while rendering live scores and sports channels. API requests carry the shared xkey, injected server-side so it never ships in client bundles.
                </p>
                <CodeBlock code={`// V1 serves live scores from the configured provider
const scores = await getGoalScores();          // GET /api/v1/scores
// competitions[].matches[] -> teams, score, status, period`} />
            </section>

            {/* Layer 2: API Gateway */}
            <section className="space-y-6">
                <div className="space-y-2">
                    <div className="text-xs font-mono text-fg-faint tracking-widest uppercase">Layer 02</div>
                    <h2 className="text-xl font-mono tracking-widest uppercase text-fg">FastAPI Gateway</h2>
                </div>
                <p className="text-fg-dim font-mono text-sm leading-relaxed">
                    The same API is available as a Python FastAPI app and a Cloudflare Worker. Both validate the shared xkey, use an in-memory TTL cache with stampede protection, and fetch upstream data concurrently over HTTPX / fetch.
                </p>
                <div className="border border-border-alt bg-card p-5 space-y-3">
                    <div className="text-xs font-mono text-fg-faint uppercase tracking-widest">Key Features</div>
                    <ul className="space-y-2 text-sm font-mono text-fg-dim">
                        <li className="flex gap-3">
                            <span className="text-red-500 mt-0.5">▸</span>
                            <span><strong>Single X-Key Auth</strong> — One shared key guards every endpoint (proxy routes exempt).</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-red-500 mt-0.5">▸</span>
                            <span><strong>TTL Caching</strong> — Provider responses are cached briefly to reduce upstream load.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-red-500 mt-0.5">▸</span>
                            <span><strong>Rate Limiting</strong> — Sliding-window IP-based tracking on data endpoints; proxy routes are exempt.</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Layer 3: Edge Decryption */}
            <section className="space-y-6">
                <div className="space-y-2">
                    <div className="text-xs font-mono text-fg-faint tracking-widest uppercase">Layer 03</div>
                    <h2 className="text-xl font-mono tracking-widest uppercase text-fg">Streaming Servers (V2 / V3 / V4 / V5)</h2>
                </div>
                <p className="text-fg-dim font-mono text-sm leading-relaxed">
                    For channel streams, Cloudflare Workers proxy HLS/DASH segments from source CDNs and rewrite manifests to bypass CORS and Referer checks. ClearKey DRM parameters are passed through to the player for supported channels.
                </p>
                <div className="border border-border-alt bg-card p-5 space-y-3">
                    <div className="text-xs font-mono text-fg-faint uppercase tracking-widest">The Live Matches page offers four servers</div>
                    <ul className="space-y-2 text-sm font-mono text-fg-dim">
                        <li className="flex gap-3">
                            <span className="text-red-500 mt-0.5">▸</span>
                            <span><strong>V2 &amp; V4</strong> — channel providers proxied through the backend API (<code>/api/v2/*</code>, <code>/api/v4/*</code>).</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-red-500 mt-0.5">▸</span>
                            <span><strong>V5</strong> — match-first API (<code>/api/v5/matches/*</code>) and DLHD 24/7 TV channel list (<code>/api/v5/tv/channels</code> and <code>/api/v5/tv/channel/:id/stream</code>). The Live TV page now sources from the V5 DLHD channel list (878+ channels with auto-categorization). On channel selection, the stream URL is resolved on demand and proxied through <code>/api/v5/proxy</code>.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-red-500 mt-0.5">▸</span>
                            <span><strong>V3</strong> — a self-hosted playlist (M3U8 or JSON) stored in Cloudflare KV and managed from the admin panel. Served by the frontend route <code>/api/playlist</code>, which merges sources, de-duplicates channels, and applies per-channel overrides. Used as a fallback data source for the Live TV page when V5 is unavailable.</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Docs Pagination */}
            <div className="pt-8 mt-12 border-t border-border-alt flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link href="/docs/api" className="flex items-center gap-3 text-sm font-mono text-fg-dim hover:text-fg border border-border-alt bg-card hover:bg-hover px-4 py-3 rounded-lg transition-colors w-full sm:w-auto group">
                    <ArrowLeft className="w-4 h-4" />
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] text-fg-faint uppercase tracking-widest group-hover:text-fg-dim transition-colors">Previous</span>
                        <span>KhelaDekho API</span>
                    </div>
                </Link>

                <Link href="/docs/installation" className="flex items-center justify-end gap-3 text-sm font-mono text-fg border border-border-alt bg-hover hover:bg-hover-alt px-4 py-3 rounded-lg transition-colors w-full sm:w-auto ml-auto group">
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] text-fg-faint uppercase tracking-widest group-hover:text-fg-dim transition-colors">Next</span>
                        <span>Installation Guide</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-red-500" />
                </Link>
            </div>
        </div>
    );
}
