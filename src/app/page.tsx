import Link from "next/link";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Users from "lucide-react/dist/esm/icons/users";
import Globe from "lucide-react/dist/esm/icons/globe";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Tablet from "lucide-react/dist/esm/icons/tablet";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import Image from "next/image";
import { CopyButton } from "@/components/ui/CopyButton";
import { getPlatformStats, getFootballLiveMatches, type FootballMatch } from "@/lib/api";

export const revalidate = 10;

function formatMatchTimeBD(ts: string): string {
  const d = new Date(ts);
  d.setHours(d.getHours() + 6);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default async function Home() {
  const [platformStatsData, footballLiveData] = await Promise.all([
    getPlatformStats(),
    getFootballLiveMatches(),
  ]);

  const stats = platformStatsData?.stats || {
    live_viewers: 0,
    all_views: 0,
    active_channels: 0,
    total_channels: 0,
  };
  const footballMatches: FootballMatch[] = footballLiveData?.matches || [];

  return (
    <div className="relative flex min-h-dvh flex-col bg-input text-fg selection:bg-white/20">
      {/* Ultra-subtle, clean background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <main className="flex-1 w-full relative z-10">
        {/* Deep Tech IDE-style Hero Section */}
        <section className="mx-auto flex flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 pt-28 lg:pt-28 px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center border border-border-alt bg-card px-3 py-1.5 text-xs font-mono text-fg-dim mb-6 shadow-2xl">
            <span className="flex items-center gap-2 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              {(() => {
                const liveMatch = footballMatches.find(m => m.strStatus === "LIVE" || m.strStatus === "1H" || m.strStatus === "2H" || m.strStatus === "HT");
                return liveMatch ? `> Live Now: ${liveMatch.strHomeTeam} vs ${liveMatch.strAwayTeam}` : `> Edge Proxy Connection Status: Nominal`;
              })()}
            </span>
          </div>

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
                <span className="text-fg text-[12px] sm:text-[13px] truncate">Visit us: https://kheladekho.pages.dev</span>
              </div>
              <CopyButton text="https://kheladekho.pages.dev" />
            </div>
          </div>
        </section>

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
                  Streams are decrypted and served from Cloudflare edge nodes with &lt;15ms latency, ensuring minimal buffering worldwide.
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

        {/* Football Matches */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-32 border-t border-border-alt">
          <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8 md:mb-12">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl font-mono uppercase tracking-widest">Football Matches</h2>
            <p className="text-fg-dim text-lg max-w-[600px] font-mono">
              Today&apos;s global football fixtures with scores and broadcast details.
            </p>
          </div>

          {footballMatches.length === 0 ? (
            <div className="rounded-xl border border-border-alt bg-card p-10 text-center font-mono text-fg-faint text-sm">
              NO_FOOTBALL_FIXTURES_FOUND
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {footballMatches.slice(0, 4).map((match, idx) => {
                const isLive = match.strStatus === "LIVE" || match.strStatus === "1H" || match.strStatus === "HT" || match.strStatus === "2H";
                const isFinished = match.strStatus === "FT" || match.strStatus === "AET" || match.strStatus === "Pen";
                const isScheduled = match.strStatus === "NS" || match.strStatus === "TBD";
                const homeScore = match.intHomeScore;
                const awayScore = match.intAwayScore;

                return (
                  <div
                    key={match.idEvent}
                    className="rounded-xl border border-border-alt bg-card p-6 flex flex-col relative overflow-hidden group shadow-2xl min-h-[240px]"
                  >
                    <Link href={match.idEvent ? `/football?match=${match.idEvent}` : "#"} className="absolute inset-0 z-0" aria-label={`View ${match.strHomeTeam} vs ${match.strAwayTeam}`} />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative flex-1 flex flex-col justify-between pointer-events-none">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono text-fg-faint">
                        <span>{match.strLeague || "Unknown League"}</span>
                        <div className="flex items-center gap-2">
                          {isLive && (
                            <span className="flex items-center gap-1 text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              LIVE
                            </span>
                          )}
                          {isFinished && (
                            <span className="text-emerald-400">FT</span>
                          )}
                          {isScheduled && (
                            <span className="text-fg-dim">SCHEDULED</span>
                          )}
                          <span>MATCH_{String(idx + 1).padStart(2, "0")}</span>
                        </div>
                      </div>

                      {/* Scoreboard block */}
                      <div className="flex flex-col items-center justify-center my-6 gap-2">
                        <div className="flex items-center justify-center gap-4 text-center">
                          <Link href={match.idHomeTeam ? `/football?team=${match.idHomeTeam}` : "#"} className="flex flex-col items-center gap-1 w-28 cursor-pointer hover:opacity-80 relative z-20 pointer-events-auto">
                            {match.strHomeTeamBadge ? (
                              <Image
                                src={match.strHomeTeamBadge}
                                alt={match.strHomeTeam}
                                width={40}
                                height={28}
                                className="object-cover border border-border-alt shadow"
                                unoptimized
                              />
                            ) : (
                              <div className="w-10 h-7 bg-input flex items-center justify-center text-[8px] font-mono text-fg-dim">
                                FLAG
                              </div>
                            )}
                            <span className="text-xs font-semibold text-fg truncate max-w-[100px] hover:text-red-400 transition-colors">
                              {match.strHomeTeam}
                            </span>
                          </Link>

                          <div className="text-lg font-mono font-bold text-fg shrink-0 tabular-nums">
                            {homeScore !== null && homeScore !== "null" ? homeScore : "-"}
                            <span className="text-fg-dim mx-1">-</span>
                            {awayScore !== null && awayScore !== "null" ? awayScore : "-"}
                          </div>

                          <Link href={match.idAwayTeam ? `/football?team=${match.idAwayTeam}` : "#"} className="flex flex-col items-center gap-1 w-28 cursor-pointer hover:opacity-80 relative z-20 pointer-events-auto">
                            {match.strAwayTeamBadge ? (
                              <Image
                                src={match.strAwayTeamBadge}
                                alt={match.strAwayTeam}
                                width={40}
                                height={28}
                                className="object-cover border border-border-alt shadow"
                                unoptimized
                              />
                            ) : (
                              <div className="w-10 h-7 bg-input flex items-center justify-center text-[8px] font-mono text-fg-dim">
                                FLAG
                              </div>
                            )}
                            <span className="text-xs font-semibold text-fg truncate max-w-[100px] hover:text-red-400 transition-colors">
                              {match.strAwayTeam}
                            </span>
                          </Link>
                        </div>
                      </div>

                      <div className="mt-auto border-t border-border pt-4 flex justify-between items-center text-xs font-mono text-fg-dim">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
                          {match.strVenue || "TBD"}
                        </span>
                        <span className="text-fg-dim">
                          {match.dateEvent ? new Date(match.dateEvent).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "TBD"} @ {match.strTimestamp ? formatMatchTimeBD(match.strTimestamp) : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center mt-8 md:mt-12">
            <Link
              href="/football"
              className="inline-flex items-center justify-center rounded-sm text-xs font-mono uppercase tracking-widest font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/30 border border-border-alt bg-transparent hover:bg-hover h-10 px-8 py-2 text-fg-muted hover:text-fg hover:border-red-500/20"
            >
              [ View All Matches ]
            </Link>
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
                <span className="text-[10px] font-mono text-fg-faint tracking-widest">beta-1.0.1</span>
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
                <span>Active Channels: {stats.active_channels}</span>
                <span>Decrypted feeds: {stats.total_channels}</span>
                <span className="hidden sm:inline">Edge latency: &lt; 15ms</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
