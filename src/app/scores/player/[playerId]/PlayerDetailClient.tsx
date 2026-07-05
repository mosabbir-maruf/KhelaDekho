"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { GoalPlayerDetail } from "@/lib/api";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Shirt from "lucide-react/dist/esm/icons/shirt";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Flag from "lucide-react/dist/esm/icons/flag";
import Goal from "lucide-react/dist/esm/icons/goal";
import Target from "lucide-react/dist/esm/icons/target";
import Shield from "lucide-react/dist/esm/icons/shield";
import Activity from "lucide-react/dist/esm/icons/activity";
import Award from "lucide-react/dist/esm/icons/award";
import Clock from "lucide-react/dist/esm/icons/clock";

interface Props {
  initialPlayer?: GoalPlayerDetail;
  playerName?: string;
}

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: "Goalkeeper",
  DEFENDER: "Defender",
  MIDFIELDER: "Midfielder",
  ATTACKER: "Forward",
};

function StatRow({ label, value }: { label: string; value: number | string | null }) {
  if (value === null || value === undefined || value === 0 || value === "0") return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 hover:bg-hover/[0.05] px-1 transition-colors">
      <span className="text-[11px] font-mono text-fg-dim">{label}</span>
      <span className="text-xs font-mono text-fg font-semibold">{value}</span>
    </div>
  );
}

export default function PlayerDetailClient({ initialPlayer, playerName }: Props) {
  const router = useRouter();
  const [player] = useState(initialPlayer);
  const [expandedSeason, setExpandedSeason] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!player) {
    return (
      <div className="min-h-screen bg-page text-fg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/scores");
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-dim hover:text-fg transition-colors mb-5 uppercase tracking-wider bg-transparent border-0 p-0 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Scores
          </button>
          <div className="flex flex-col items-center justify-center py-20 border border-border-alt bg-card rounded-xl shadow-xl">
            <Shirt className="w-12 h-12 text-fg-faint mb-4 animate-pulse" />
            <h1 className="text-lg font-mono font-bold uppercase tracking-wider mb-2">{playerName || "Player Not Found"}</h1>
            <p className="text-xs font-mono text-fg-dim">Could not retrieve telemetry for this player.</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = player.stats || [];
  const currentSeason = stats[expandedSeason];

  return (
    <div className="min-h-screen bg-page text-fg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/scores");
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-dim hover:text-fg transition-colors uppercase tracking-wider bg-transparent border-0 p-0 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Scores
        </button>

        {/* Player Profile Header Card */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-6 md:p-8 rounded-xl shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.02] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Profile Avatar / Shirt Placeholder */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-input border border-border-alt flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {player.image_url ? (
                  <Image src={player.image_url} alt={player.name} width={112} height={112} className="object-cover w-full h-full" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
                ) : (
                  <Shirt className="w-10 h-10 text-fg-dim" />
                )}
              </div>

              {/* Bio block */}
              <div className="space-y-3 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fg font-mono leading-none truncate">
                  {player.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-mono text-fg-dim">
                  {player.shirt_number && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-hover border border-border-alt text-[10px] uppercase font-bold text-fg">
                      <Shirt className="w-3.5 h-3.5 text-red-500" /> #{player.shirt_number}
                    </span>
                  )}
                  {player.position && (
                    <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/25 rounded text-[10px] uppercase tracking-wider font-bold text-red-400">
                      {POSITION_LABELS[player.position] || player.position}
                    </span>
                  )}
                  {player.age && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-fg-dim">
                      <Calendar className="w-3.5 h-3.5 text-fg-faint" /> {player.age} Years ({player.date_of_birth || "N/A"})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nationality & Club crest links */}
            <div className="flex flex-wrap items-center justify-center gap-6 shrink-0 border-t border-border/80 md:border-t-0 md:border-l md:pl-8 pt-4 md:pt-0">
              {player.nationality_name && (
                <div className="flex flex-col items-center md:items-start gap-1">
                  <span className="text-[8px] font-mono text-fg-faint uppercase tracking-widest">Nationality</span>
                  <div className="flex items-center gap-2">
                    {player.nationality_image_url && (
                      <Image src={player.nationality_image_url} alt="" width={18} height={13} className="object-cover rounded-sm border border-border-alt shadow-sm" unoptimized style={{ width: "auto", height: "auto" }} />
                    )}
                    <span className="text-xs font-mono font-semibold text-fg">{player.nationality_name}</span>
                  </div>
                </div>
              )}

              {player.current_team_name && (
                <div className="flex flex-col items-center md:items-start gap-1">
                  <span className="text-[8px] font-mono text-fg-faint uppercase tracking-widest">Current Club</span>
                  <Link href={`/scores/team/${player.current_team_id}?name=${encodeURIComponent(player.current_team_name)}`} className="flex items-center gap-2 group cursor-pointer">
                    {player.current_team_image_url ? (
                      <Image src={player.current_team_image_url} alt="" width={18} height={18} className="object-contain" unoptimized style={{ width: "auto", height: "auto" }} />
                    ) : (
                      <Goal className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs font-mono font-semibold text-fg group-hover:text-red-400 transition-colors border-b border-transparent group-hover:border-red-500/30">{player.current_team_name}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Season / Competition Switcher */}
        {stats.length > 0 && (
          <div className="border border-border-alt bg-card/60 backdrop-blur p-4 rounded-xl shadow-lg space-y-3">
            <div className="text-[9px] font-mono text-fg-faint uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-500" /> Available Season Campaigns
            </div>
            
            <div className="flex items-center gap-2">
              {/* Left Arrow Button */}
              <button
                onClick={() => {
                  scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
                }}
                className="p-1.5 rounded border border-border-alt bg-card/80 text-fg-dim hover:text-fg hover:border-red-500/20 transition-all shrink-0 cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Scroll Container */}
              <div
                ref={scrollContainerRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {stats.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setExpandedSeason(i)}
                    className={`px-3 py-1.5 text-[11px] font-mono rounded-sm border whitespace-nowrap transition-all cursor-pointer ${
                      i === expandedSeason
                        ? "bg-red-500 border-red-500 text-white font-bold shadow-md shadow-red-500/10"
                        : "bg-card border-border-alt text-fg-dim hover:text-fg hover:border-red-500/20"
                    }`}
                  >
                    {s.competition_name} {s.season_name}
                  </button>
                ))}
              </div>

              {/* Right Arrow Button */}
              <button
                onClick={() => {
                  scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
                }}
                className="p-1.5 rounded border border-border-alt bg-card/80 text-fg-dim hover:text-fg hover:border-red-500/20 transition-all shrink-0 cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Responsive Body Panels */}
        {currentSeason ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Categorized Detailed Stats */}
            <div className="lg:col-span-8 space-y-6">
              <div className="border border-border-alt bg-card rounded-xl shadow-xl overflow-hidden">
                
                {/* Panel Header */}
                <div className="flex items-center gap-3 px-5 py-4 bg-white/[0.01] border-b border-border/80">
                  {currentSeason.competition_image_url ? (
                    <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-hover border border-border-alt p-1">
                      <Image src={currentSeason.competition_image_url} alt="" width={22} height={22} className="object-contain" unoptimized style={{ width: "auto", height: "auto" }} />
                    </span>
                  ) : (
                    <span className="w-6 h-6 shrink-0 rounded bg-border-alt" />
                  )}
                  <div>
                    <h2 className="text-xs font-mono font-bold text-fg uppercase tracking-wider">{currentSeason.competition_name} Campaign</h2>
                    <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest mt-0.5">{currentSeason.season_name} • Detailed Stat Logs</p>
                  </div>
                  {currentSeason.team_image_url && (
                    <Image src={currentSeason.team_image_url} alt="" width={22} height={22} className="object-contain ml-auto opacity-70 border border-border-alt p-0.5 bg-hover rounded" unoptimized style={{ width: "auto", height: "auto" }} />
                  )}
                </div>

                {/* Categorized detailed breakdown */}
                <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Attacking Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-fg font-semibold pb-1.5 border-b border-border/80 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-red-500" />
                      Attacking Profile
                    </h3>
                    <div className="space-y-1">
                      <StatRow label="Goals" value={currentSeason.goals} />
                      <StatRow label="Minutes per Goal" value={currentSeason.minutes_per_goal} />
                      <StatRow label="Penalty Goals" value={currentSeason.penalty_goals} />
                      <StatRow label="Own Goals" value={currentSeason.own_goals} />
                      <StatRow label="Goals Outside Box" value={currentSeason.goals_outside_box} />
                      <StatRow label="Freekick Goals" value={currentSeason.freekick_goals} />
                      <StatRow label="Shots on Target" value={currentSeason.shots_on_target} />
                      <StatRow label="Shots off Target" value={currentSeason.shots_off_target} />
                      <StatRow label="Blocked Shots" value={currentSeason.blocked_shots} />
                      <StatRow label="Hit Woodwork" value={currentSeason.hit_woodwork} />
                    </div>
                  </div>

                  {/* Distribution Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-fg font-semibold pb-1.5 border-b border-border/80 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-red-500" />
                      Distribution
                    </h3>
                    <div className="space-y-1">
                      <StatRow label="Assists" value={currentSeason.assists} />
                      <StatRow label="Crosses" value={currentSeason.crosses} />
                      <StatRow label="Successful Crosses" value={currentSeason.successful_crosses} />
                      <StatRow label="Corners" value={currentSeason.corners} />
                    </div>

                    {/* Defensive Metrics */}
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-fg font-semibold pb-1.5 border-b border-border/80 pt-4 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-red-500" />
                      Defensive profile
                    </h3>
                    <div className="space-y-1">
                      <StatRow label="Tackles" value={currentSeason.tackles} />
                      <StatRow label="Clearances" value={currentSeason.clearances} />
                      <StatRow label="Saves" value={currentSeason.saves} />
                      <StatRow label="Clean Sheets" value={currentSeason.clean_sheets} />
                      <StatRow label="Goals Conceded" value={currentSeason.goals_conceded} />
                      {currentSeason.saves > 0 && <StatRow label="Penalty Saves" value={currentSeason.penalty_saves} />}
                    </div>
                  </div>

                  {/* Discipline / Gameplay Metrics */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-fg font-semibold pb-1.5 border-b border-border/80 flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-red-500" />
                      Discipline & Gameplay
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                      <div>
                        <StatRow label="Appearances" value={currentSeason.appearances} />
                        <StatRow label="Starting XI" value={currentSeason.starting_eleven} />
                        <StatRow label="Yellow Cards" value={currentSeason.yellow_cards} />
                        <StatRow label="Red Cards" value={currentSeason.red_cards} />
                        <StatRow label="Offsides" value={currentSeason.offsides} />
                      </div>
                      <div>
                        <StatRow label="Fouls Committed" value={currentSeason.fouls_committed} />
                        <StatRow label="Fouls Suffered" value={currentSeason.fouls_suffered} />
                        <StatRow label="Penalties Missed" value={currentSeason.penalties_missed} />
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Right Column: Key Metrics Sidebar */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
              
              {/* Highlight Metrics Panel */}
              <div className="border border-border-alt bg-card p-5 rounded-xl shadow-xl space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-fg font-semibold flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  Key Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-input/20 border border-border-alt rounded p-4 text-center">
                    <div className="text-xl font-mono font-black text-red-500">{currentSeason.goals || 0}</div>
                    <div className="text-[9px] font-mono text-fg-faint uppercase tracking-wider mt-1">Goals</div>
                  </div>
                  <div className="bg-input/20 border border-border-alt rounded p-4 text-center">
                    <div className="text-xl font-mono font-black text-fg">{currentSeason.assists || 0}</div>
                    <div className="text-[9px] font-mono text-fg-faint uppercase tracking-wider mt-1">Assists</div>
                  </div>
                  <div className="bg-input/20 border border-border-alt rounded p-4 text-center">
                    <div className="text-xl font-mono font-black text-fg">{currentSeason.appearances || 0}</div>
                    <div className="text-[9px] font-mono text-fg-faint uppercase tracking-wider mt-1">Matches</div>
                  </div>
                  <div className="bg-input/20 border border-border-alt rounded p-4 text-center">
                    <div className="text-sm font-mono font-black text-fg truncate flex items-center justify-center h-7" title={currentSeason.minutes_played?.toLocaleString()}>
                      <Clock className="w-3 h-3 text-fg-dim mr-1 shrink-0" />
                      {currentSeason.minutes_played || 0}
                    </div>
                    <div className="text-[9px] font-mono text-fg-faint uppercase tracking-wider mt-1">Minutes</div>
                  </div>
                </div>
              </div>

              {/* Edge provider statistics disclaimer */}
              <div className="border border-border-alt bg-card p-5 rounded-xl shadow-xl space-y-3 text-xs font-mono leading-relaxed text-fg-dim">
                <div className="flex items-center gap-2 text-fg font-semibold mb-1 uppercase tracking-widest text-[10px]">
                  <Activity className="w-3.5 h-3.5 text-red-500" />
                  Telemetry Source
                </div>
                <p>
                  {`> Stats logs represent campaigns for selected league seasons, computed via edge databases and decrypted in real-time from league data sheets.`}
                </p>
                <div className="pt-3 border-t border-border/80 text-[10px] text-fg-faint flex flex-col gap-1 uppercase">
                  <span>Data Node: Active</span>
                  <span>Sync Interval: Hourly</span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          stats.length === 0 && (
            <div className="bg-card border border-border-alt rounded-xl p-16 text-center font-mono shadow-lg">
              <Shirt className="w-10 h-10 mx-auto mb-4 text-fg-faint" />
              <div className="text-sm font-bold text-fg-dim uppercase tracking-wider mb-2">No statistics found</div>
              <div className="text-xs text-fg-faint">No detailed telemetry is available for this player profile.</div>
            </div>
          )
        )}

      </div>
    </div>
  );
}
