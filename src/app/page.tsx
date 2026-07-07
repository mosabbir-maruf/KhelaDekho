import Link from "next/link";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Users from "lucide-react/dist/esm/icons/users";
import Globe from "lucide-react/dist/esm/icons/globe";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Tablet from "lucide-react/dist/esm/icons/tablet";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import { CopyButton } from "@/components/ui/CopyButton";
import { getGoalScores } from "@/lib/api";
import type { GoalMatch } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import LiveScoresClient from "./LiveScoresClient";
import { FeedMatch } from "./ScoreCard";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;



function HeroStatusBadge({ liveMatch }: { liveMatch: GoalMatch | null }) {
  // A live match links through to the live-matches page; the idle fallback is
  // a plain, non-clickable status banner.
  if (liveMatch) {
    return (
      <Link
        href="/live-matches"
        className="inline-flex items-center border border-border-alt bg-card px-3 py-1.5 text-xs font-mono text-fg-dim mb-6 shadow-2xl hover:border-red-500/30 hover:text-fg transition-colors"
      >
        <span className="flex items-center gap-2 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-red-400 font-bold">Live</span>
          <span className="text-fg truncate max-w-[220px] sm:max-w-none normal-case tracking-normal">
            {liveMatch.team_a.name} vs {liveMatch.team_b.name}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <div className="inline-flex items-center border border-border-alt bg-card px-3 py-1.5 text-xs font-mono text-fg-dim mb-6 shadow-2xl">
      <span className="flex items-center gap-2 tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        {`> Edge Proxy Connection Status: Nominal`}
      </span>
    </div>
  );
}

export default async function Home() {
  const data = await getGoalScores();
  const feed: FeedMatch[] = [];
  for (const c of data?.competitions || []) {
    for (const m of c.matches) {
      feed.push({ match: m, competition: c.name, competitionImage: c.image_url });
    }
  }
  const live = feed.filter(f => f.match.status === "LIVE");
  const fixtures = feed.filter(f => f.match.status === "FIXTURE");
  const results = feed.filter(f => f.match.status === "RESULT");
  const display = live.length > 0 ? live : fixtures.length > 0 ? fixtures : results;
  const label = live.length > 0
    ? `${live.length} match${live.length > 1 ? "es" : ""} in play right now`
    : fixtures.length > 0 ? "Upcoming fixtures" : "Recent results";
  const liveMatch = live[0]?.match ?? null;

  return (
    <div className="relative flex min-h-dvh flex-col bg-input text-fg selection:bg-white/20">
      {/* Ultra-subtle, clean background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <main className="flex-1 w-full relative z-10">
        {/* Deep Tech IDE-style Hero Section */}
        <section className="mx-auto flex flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 pt-28 lg:pt-28 px-4 sm:px-6 lg:px-8">
          <HeroStatusBadge liveMatch={liveMatch} />

          <h1 className="text-center text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1] mt-2 mb-4 max-w-[800px]">
            Watch Live Matches & TV Channels <br className="hidden sm:block" />
            <span className="text-fg-dim">Anytime, Anywhere.</span>
          </h1>

          <span className="max-w-[750px] text-center text-lg text-fg-dim sm:text-lg font-medium leading-relaxed">
            Access all live matches and sports TV channels in high definition, aggregated from public sources and optimized for all devices.
          </span>

          <div className="flex w-full items-center justify-center flex-col sm:flex-row gap-3 sm:gap-4 py-4 mt-6">
            <Link
              href="/live-tv"
              className="inline-flex items-center justify-center rounded-sm text-xs font-mono uppercase tracking-widest font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 disabled:pointer-events-none disabled:opacity-50 bg-white text-black hover:bg-neutral-200 h-10 px-8 py-2 border border-transparent shadow shadow-white/20 w-full sm:w-auto"
            >
              [ Stream TV Live ]
            </Link>
            <Link
              href="/live-matches"
              className="inline-flex items-center justify-center rounded-sm text-xs font-mono uppercase tracking-widest font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 disabled:pointer-events-none disabled:opacity-50 border border-border-alt bg-transparent hover:bg-hover h-10 px-8 py-2 text-fg-muted w-full sm:w-auto"
            >
              <Trophy className="mr-3 h-4 w-4 text-fg-dim" />
              FIFA World Cup
            </Link>
          </div>

          {/* Visit URL */}
          <div className="flex w-full items-center justify-center mt-6 px-2 sm:px-0">
            <div className="flex items-center justify-between border border-border-alt bg-card pl-4 pr-1.5 py-1.5 font-mono text-sm text-fg-dim w-full sm:w-auto shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-red-500/50" />
              <div className="flex items-center space-x-3 mr-4 sm:mr-8 text-fg-muted min-w-0 overflow-hidden">
                <Globe className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-fg text-[12px] sm:text-[13px] truncate">Visit us: {SITE_URL}</span>
              </div>
              <CopyButton text={SITE_URL} />
            </div>
          </div>
        </section>

        <LiveScoresClient initialData={{ display, liveCount: live.length, label }} />

        {/* Why KhelaDekho? */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-8">
          <div className="flex flex-col items-center text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-fg mb-3">Why KhelaDekho?</h2>
            <p className="text-fg-dim text-sm font-mono max-w-[500px]">
              Built for speed, privacy, and reliability on the edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border-alt bg-card p-6 flex flex-col space-y-4 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-mono font-semibold text-fg tracking-wide">Edge Token Security</h3>
                <p className="text-xs font-mono text-fg-dim leading-relaxed">
                  Stream requests are validated at the Cloudflare edge, preventing hotlinking and unauthorized access.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border-alt bg-card p-6 flex flex-col space-y-4 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-mono font-semibold text-fg tracking-wide">Edge-Native Delivery</h3>
                <p className="text-xs font-mono text-fg-dim leading-relaxed">
                  Streams are decrypted and served from Cloudflare edge nodes with &lt;30ms latency, ensuring minimal buffering worldwide.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border-alt bg-card p-6 flex flex-col space-y-4 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-mono font-semibold text-fg tracking-wide">Decrypted Transparency</h3>
                <p className="text-xs font-mono text-fg-dim leading-relaxed">
                  All decryption happens transparently at the proxy layer. No client-side DRM plugins or binary blobs required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Device Compatibility */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 border-t border-border-alt">
          <div className="flex flex-col items-center text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-fg mb-3">Device Compatibility</h2>
            <p className="text-fg-dim text-sm font-mono max-w-[500px]">
              Works seamlessly across all your devices with native HTML5 playback.
            </p>
          </div>

          <div className="max-w-[800px] mx-auto">
            <div className="rounded-2xl border border-border-alt bg-card overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-alt">
                <div className="flex flex-col items-center py-6 sm:py-8 px-4">
                  <Monitor className="w-8 h-8 text-fg-dim mb-3" />
                  <span className="text-xs font-mono font-semibold text-fg uppercase tracking-wider mb-1">Desktop</span>
                  <span className="text-[10px] font-mono text-fg-faint text-center">Chrome · Firefox · Safari · Edge</span>
                </div>
                <div className="flex flex-col items-center py-6 sm:py-8 px-4">
                  <Smartphone className="w-8 h-8 text-fg-dim mb-3" />
                  <span className="text-xs font-mono font-semibold text-fg uppercase tracking-wider mb-1">Mobile</span>
                  <span className="text-[10px] font-mono text-fg-faint text-center">iOS · Android · PWA</span>
                </div>
                <div className="flex flex-col items-center py-6 sm:py-8 px-4">
                  <Tablet className="w-8 h-8 text-fg-dim mb-3" />
                  <span className="text-xs font-mono font-semibold text-fg uppercase tracking-wider mb-1">Tablet</span>
                  <span className="text-[10px] font-mono text-fg-faint text-center">iPadOS · Android · PiP</span>
                </div>
              </div>
              <div className="border-t border-border-alt grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-alt">
                <div className="py-3 text-center">
                  <span className="text-[10px] font-mono text-fg-faint uppercase tracking-widest">DASH · HLS · DRM</span>
                </div>
                <div className="py-3 text-center">
                  <span className="text-[10px] font-mono text-fg-faint uppercase tracking-widest">Adaptive Bitrate</span>
                </div>
                <div className="py-3 text-center">
                  <span className="text-[10px] font-mono text-fg-faint uppercase tracking-widest">Split View Ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 border-t border-border-alt">
          <div className="flex flex-col items-center text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-fg mb-3">Frequently Asked Questions</h2>
            <p className="text-fg-dim text-sm font-mono max-w-[500px]">
              Quick answers to common questions about the platform.
            </p>
          </div>

          <div className="max-w-[700px] mx-auto space-y-3">
            {[
              {
                q: "What is KhelaDekho?",
                a: "KhelaDekho is a live sports streaming aggregation platform that indexes publicly available broadcast links and presents them in a clean, searchable interface with edge-native decryption.",
              },
              {
                q: "Do I need to install anything?",
                a: "No. Everything runs in your browser using native HTML5 video playback. No plugins, extensions, or binary blobs required.",
              },
              {
                q: "Is it free to use?",
                a: "Yes. KhelaDekho is completely free and open-source. You can browse channels, view match schedules, and watch streams at no cost.",
              },
              {
                q: "How does stream decryption work?",
                a: "Streams are proxied and decrypted at the Cloudflare edge layer. The client never handles raw decryption keys.",
              },
              {
                q: "What sports and leagues are available?",
                a: "We aggregate broadcasts across cricket, football, and more. Content availability depends on public broadcast sources indexed at query time.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-border-alt bg-card group overflow-hidden hover:border-white/10 transition-colors"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none select-none">
                  <span className="text-sm font-mono font-semibold text-fg pr-4">{item.q}</span>
                  <HelpCircle className="w-4 h-4 text-fg-dim shrink-0 group-open:hidden" />
                  <span className="w-4 h-4 text-fg-dim shrink-0 hidden group-open:inline-flex items-center justify-center text-xs">−</span>
                </summary>
                <div className="px-6 pb-4 text-xs font-mono text-fg-dim leading-relaxed border-t border-border pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Premium Bottom CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 lg:py-32 border-t border-border-alt relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 w-full">
            {/* Top Stats Bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-fg-faint uppercase tracking-widest mb-8 px-1">
              <span>SYS_TRANSMISSION_NOMINAL</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All Systems Online
              </span>
            </div>

            {/* Main CTA Card */}
            <div className="border border-border-alt bg-card relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

              {/* CTA Header Strip */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-fg-dim tracking-widest uppercase">
                    Lobby.Lounge
                  </span>
                </div>
                <span className="text-[10px] font-mono text-fg-faint tracking-widest">beta-2.1.1</span>
              </div>

              {/* CTA Content */}
              <div className="flex flex-col items-center text-center px-4 sm:px-6 py-12 md:py-20 space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-mono tracking-widest uppercase text-fg">
                    Access Channels
                  </h2>
                  <p className="text-fg-dim text-xs sm:text-sm font-mono max-w-[500px] leading-relaxed mx-auto">
                    {`> Connect to global broadcasts and DRM protected sports transmissions immediately. Live view updates and active client telemetry indicators are rendered dynamically.`}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2 w-full max-w-[500px]">
                  <Link
                    href="/live-matches"
                    className="w-full sm:flex-1 inline-flex items-center justify-center bg-white text-black hover:bg-neutral-200 h-12 px-8 py-2 font-mono text-xs uppercase tracking-widest font-bold transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                  >
                    [ Live Matches ]
                  </Link>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 sm:gap-0 px-4 sm:px-6 py-3 border-t border-border bg-white/[0.01] text-[10px] font-mono text-fg-faint tracking-widest uppercase">
                <span>Edge latency: &lt; 30ms</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
