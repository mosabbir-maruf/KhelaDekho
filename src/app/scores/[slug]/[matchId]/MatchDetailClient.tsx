"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type {
  GoalMatchDetail,
  GoalMatchEvent,
  GoalMatchStats,
  GoalTeamLineup,
  GoalLineupPlayer,
  GoalCommentaryItem,
  GoalMatch,
} from "@/lib/api";
import { getGoalMatchDetail } from "@/lib/api";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Shield from "lucide-react/dist/esm/icons/shield";

type Tab = "summary" | "events" | "stats" | "lineups" | "commentary" | "ratings";

interface Props {
  slug: string;
  matchId: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "events", label: "Events" },
  { key: "stats", label: "Stats" },
  { key: "lineups", label: "Lineups" },
  { key: "commentary", label: "Commentary" },
  { key: "ratings", label: "Ratings" },
];

/* ---------------- helpers ---------------- */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function eventMinute(e: { period: GoalMatchEvent["period"] }): string {
  if (!e.period) return "";
  const extra = e.period.extra > 0 ? `+${e.period.extra}` : "";
  return `${e.period.minute}${extra}'`;
}

function SoccerBall({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="currentColor" />
      <path
        d="M12 6.2l3.1 2.3-1.2 3.7h-3.8L8.9 8.5 12 6.2z M12 6.2V3.2 M15.1 8.5l2.9-1 M13.9 12.2l1.9 2.5 M10.1 12.2l-1.9 2.5 M8.9 8.5L6 7.5 M13.9 14.7l.9 2.8 M10.1 14.7l-.9 2.8"
        stroke="var(--color-page)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Card({ color, className = "w-3 h-4" }: { color: string; className?: string }) {
  return <span className={`inline-block rounded-[3px] shrink-0 shadow-sm border border-black/10 ${className}`} style={{ backgroundColor: color }} />;
}

function EventIcon({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  if (type.includes("GOAL")) return <SoccerBall className={`${className} text-emerald-500`} />;
  if (type.includes("CARD_YELLOW") || type === "YELLOW_CARD") return <Card color="#eab308" />;
  if (type.includes("CARD_RED") || type === "RED_CARD") return <Card color="#dc2626" />;
  if (type.includes("SUBSTITUTION"))
    return (
      <span className="inline-flex items-center shrink-0">
        <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
        <ArrowDown className="w-3.5 h-3.5 -ml-1 text-red-500" />
      </span>
    );
  if (type.includes("VAR")) return <Monitor className={`${className} text-sky-500`} />;
  return <span className="w-2 h-2 rounded-full bg-fg-dim shrink-0" />;
}

function ratingColor(score: number): string {
  if (score >= 8) return "#10b981"; // Emerald
  if (score >= 7) return "#22c55e"; // Green
  if (score >= 6) return "#f59e0b"; // Amber
  return "#ef4444"; // Red
}

function isHome(side: string | null): boolean {
  return side === "TEAM_A";
}

/* ---------------- Player rating pill ---------------- */

function RatingPill({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg font-extrabold text-white tabular-nums shadow-xs ${
        size === "md" ? "text-xs w-10 h-7" : "text-[10px] w-8 h-5.5"
      }`}
      style={{ backgroundColor: ratingColor(score) }}
    >
      {score.toFixed(1)}
    </span>
  );
}

/* ---------------- Event timeline (left-aligned) ---------------- */

function periodLabel(type: string): string | null {
  switch (type) {
    case "PERIOD_FIRST_HALF":
      return "Match Started";
    case "PERIOD_HALF_TIME":
      return "Half Time";
    case "PERIOD_SECOND_HALF":
      return "Second Half";
    case "PERIOD_MATCH_END":
      return "Full Time";
    default:
      return null;
  }
}

function EventTimeline({ events, full = false }: { events: GoalMatchEvent[]; full?: boolean }) {
  const highlightTypes = (t: string) => t.includes("GOAL") || t.includes("CARD") || t.includes("VAR");
  const allowed = (t: string) => (full ? true : highlightTypes(t) || t.includes("SUBSTITUTION"));
  const items = events.filter((e) => (full ? allowed(e.type) || e.type.includes("PERIOD") : allowed(e.type)));

  if (items.length === 0) {
    return <div className="text-sm text-fg-dim py-8 text-center">No major match events to show.</div>;
  }

  const desc = (e: GoalMatchEvent): { main: string; sub?: string } => {
    if (e.scorer) return { main: e.scorer.name, sub: e.assist ? `Assist: ${e.assist.name}` : "Goal" };
    if (e.type.includes("SUBSTITUTION"))
      return { main: `In: ${e.in_player?.name || "—"}`, sub: e.out_player ? `Out: ${e.out_player.name}` : "Substitution" };
    if (e.player) return { main: e.player.name, sub: e.type.replace(/_/g, " ").toLowerCase() };
    if (e.type.includes("VAR")) return { main: "VAR Decision", sub: `${e.decision || ""} ${e.outcome || ""}`.trim() };
    return { main: e.type.replace(/_/g, " ").toLowerCase() };
  };

  return (
    <div className="relative pl-1">
      {/* Timeline main line */}
      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border/80" />
      <div className="flex flex-col gap-4">
        {items.map((e, i) => {
          const pLabel = e.type.includes("PERIOD") ? periodLabel(e.type) : null;
          if (pLabel) {
            return (
              <div key={i} className="flex items-center my-2 pl-3">
                <span className="text-[11px] font-extrabold text-fg-muted uppercase tracking-wider bg-card border border-border-alt rounded-full px-4 py-1 shadow-sm">
                  {pLabel}
                </span>
              </div>
            );
          }
          const home = isHome(e.side);
          const d = desc(e);

          return (
            <div key={i} className="relative pl-14 group">
              {/* Point bubble */}
              <div className="absolute left-6 top-2.5 w-7 h-7 rounded-full bg-card border-2 border-border-alt flex items-center justify-center -translate-x-1/2 z-10 shadow-xs group-hover:scale-105 transition-transform duration-200">
                <EventIcon type={e.type} />
              </div>

              {/* Detail box */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-input/10 border border-border/60 hover:border-border-alt transition-all duration-200 hover:bg-input/20">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Time */}
                  <span className="text-[11px] font-extrabold text-fg bg-card border border-border-alt rounded-md px-2 py-0.5 min-w-[36px] text-center tabular-nums shadow-2xs">
                    {eventMinute(e)}
                  </span>
                  
                  {/* Details */}
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-fg truncate">
                      {e.scorer ? (
                        <Link href={`/scores/player/${e.scorer.id}?name=${encodeURIComponent(e.scorer.name)}`} className="hover:text-red-400 transition-colors">{d.main}</Link>
                      ) : e.player ? (
                        <Link href={`/scores/player/${e.player.id}?name=${encodeURIComponent(e.player.name)}`} className="hover:text-red-400 transition-colors">{d.main}</Link>
                      ) : e.in_player ? (
                        <span>{d.main}</span>
                      ) : (
                        d.main
                      )}
                    </div>
                    {d.sub && <div className="text-[11px] text-fg-dim truncate capitalize">{d.sub}</div>}
                  </div>
                </div>

                {/* Side Tag */}
                {e.side && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-faint bg-input/50 border border-border-alt rounded-md px-2 py-1 select-none">
                    {home ? "Home" : "Away"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Stats ---------------- */

const STAT_LABELS: Record<string, string> = {
  POSSESSION: "Possession",
  EXPECTED_GOAL: "Expected Goals (xG)",
  SHOT_TOTAL: "Total Shots",
  SHOT_ON_TARGET: "Shots on Target",
  SHOT_OFF_TARGET: "Shots off Target",
  SHOT_BLOCKED: "Blocked Shots",
  COUNTER_ATTACK: "Counter Attacks",
  CORNER_TOTAL: "Corners",
  CROSS_TOTAL: "Crosses",
  PASS_TOTAL: "Passes",
  AIR_CHALLENGES_WON: "Aerial Duels Won",
  AIR_CHALLENGES_LOST: "Aerial Duels Lost",
  GOAL_KICK: "Goal Kicks",
  SAVE_TOTAL: "Saves",
  FREE_KICK: "Free Kicks",
  CLEARANCE_TOTAL: "Clearances",
  INTERCEPTION_TOTAL: "Interceptions",
  YELLOW_CARD_TOTAL: "Yellow Cards",
  RED_CARD_TOTAL: "Red Cards",
};

type StatCategory = "summary" | "attacking" | "passing" | "duels" | "defence" | "discipline";

const STAT_CATEGORIES: { key: StatCategory; label: string }[] = [
  { key: "summary", label: "Overview" },
  { key: "attacking", label: "Attack" },
  { key: "passing", label: "Passing" },
  { key: "duels", label: "Duels" },
  { key: "defence", label: "Defence" },
  { key: "discipline", label: "Discipline" },
];

function formatNum(n: number, type: string): string {
  if (type === "POSSESSION") return `${Math.round(n)}%`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function StatBar({ type, a, b, colorA, colorB }: { type: string; a: number; b: number; colorA: string; colorB: string }) {
  const label = STAT_LABELS[type] || type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const total = a + b;
  const ratio = total > 0 ? a / total : 0.5;
  const aWins = a > b;
  const bWins = b > a;

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
        <span className={`w-14 text-left tabular-nums ${aWins ? "text-fg" : "text-fg-dim"}`}>
          {formatNum(a, type)}
        </span>
        <span className="text-[11px] text-fg-muted uppercase tracking-wider text-center flex-1">{label}</span>
        <span className={`w-14 text-right tabular-nums ${bWins ? "text-fg" : "text-fg-dim"}`}>
          {formatNum(b, type)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 h-2 bg-input/40 rounded-full p-0.5 overflow-hidden">
        <div className="flex-1 flex justify-end">
          <div 
            className="h-1 rounded-l-full transition-all duration-500" 
            style={{ 
              width: `${ratio * 100}%`,
              backgroundColor: colorA
            }} 
          />
        </div>
        <div className="flex-1 flex justify-start">
          <div 
            className="h-1 rounded-r-full transition-all duration-500" 
            style={{ 
              width: `${(1 - ratio) * 100}%`,
              backgroundColor: colorB
            }} 
          />
        </div>
      </div>
    </div>
  );
}

function StatsPanel({ stats, colorA, colorB }: { stats: GoalMatchStats | null; colorA: string; colorB: string }) {
  const [category, setCategory] = useState<StatCategory>("summary");
  if (!stats) return <div className="text-sm text-fg-dim py-8 text-center">No statistics available for this match.</div>;

  const items = stats[category] || [];

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1.5 border-b border-border/50">
        {STAT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-200 ${
              category === c.key
                ? "bg-fg text-page shadow-sm scale-105"
                : "bg-card border border-border-alt text-fg-dim hover:text-fg hover:border-fg-dim hover:bg-hover"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-fg-dim py-8 text-center">No stats data found for this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {items.map((s, i) => (
            <StatBar key={i} type={s.type} a={s.team_a} b={s.team_b} colorA={colorA} colorB={colorB} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Lineups (pitch view) ---------------- */

interface PlayerMarks {
  goals: number;
  yellow: boolean;
  red: boolean;
  subOff: boolean;
  subOn: boolean;
}

function buildPlayerMarks(events: GoalMatchEvent[]): Record<string, PlayerMarks> {
  const map: Record<string, PlayerMarks> = {};
  const get = (id?: string | null): PlayerMarks | null => {
    if (!id) return null;
    if (!map[id]) map[id] = { goals: 0, yellow: false, red: false, subOff: false, subOn: false };
    return map[id];
  };
  for (const e of events) {
    if (e.type.includes("GOAL") && !e.type.includes("MISS")) {
      const m = get(e.scorer?.id);
      if (m) m.goals += 1;
    }
    if (e.type.includes("CARD_YELLOW") || e.type === "YELLOW_CARD") {
      const m = get(e.player?.id);
      if (m) m.yellow = true;
    }
    if (e.type.includes("CARD_RED") || e.type === "RED_CARD") {
      const m = get(e.player?.id);
      if (m) m.red = true;
    }
    if (e.type.includes("SUBSTITUTION")) {
      const off = get(e.out_player?.id);
      if (off) off.subOff = true;
      const on = get(e.in_player?.id);
      if (on) on.subOn = true;
    }
  }
  return map;
}

function hexTextColor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111827" : "#ffffff";
}

function buildLines(team: GoalTeamLineup): GoalLineupPlayer[][] {
  const xi = team.starting_xi;
  if (xi.length === 0) return [];
  const rawFormation = team.formation || "";
  const parts = rawFormation.includes("-")
    ? rawFormation.split("-").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n))
    : rawFormation.split("").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
  if (parts.length === 0) return [xi];
  const lines: GoalLineupPlayer[][] = [[xi[0]]]; // GK
  let idx = 1;
  for (const count of parts) {
    lines.push(xi.slice(idx, idx + count));
    idx += count;
  }
  if (idx < xi.length) lines.push(xi.slice(idx));
  return lines;
}

function PlayerMarkers({ marks }: { marks?: PlayerMarks }) {
  if (!marks) return null;
  return (
    <>
      {marks.subOff && (
        <span
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[5.5px] border-l-transparent border-r-transparent border-t-red-500 filter drop-shadow-sm"
          title="Substituted off"
        />
      )}
      {(marks.yellow || marks.red) && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-3.5 rounded-[1.5px] border border-black/20 shadow-sm"
          style={{ backgroundColor: marks.red ? "#dc2626" : "#eab308" }}
          title={marks.red ? "Red card" : "Yellow card"}
        />
      )}
      {marks.goals > 0 && (
        <span
          className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center bg-white rounded-full w-4 h-4 shadow border border-black/10"
          title={`${marks.goals} goal(s)`}
        >
          <SoccerBall className="w-3 h-3 text-black" />
          {marks.goals > 1 && (
            <span className="absolute -top-1.5 -right-1.5 text-[8px] font-extrabold text-white bg-black rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
              {marks.goals}
            </span>
          )}
        </span>
      )}
    </>
  );
}

function PitchPlayer({ p, color, textColor, marks }: { p: GoalLineupPlayer; color: string; textColor: string; marks?: PlayerMarks }) {
  const name = p.player?.name || "";
  const short = name.includes(" ") ? `${name.split(" ")[0][0]}. ${name.split(" ").slice(-1)[0]}` : name;
  const inner = (
    <div className="flex flex-col items-center gap-1.5 w-[56px] sm:w-18 group/player">
      <div className="relative">
        <span
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-[11px] sm:text-xs font-extrabold border-2 border-white/80 shadow-md group-hover/player:scale-110 group-hover/player:border-white transition-all duration-350"
          style={{ backgroundColor: color, color: textColor }}
        >
          {p.shirt_number ?? ""}
        </span>
        <PlayerMarkers marks={marks} />
      </div>
      <span className="text-[9px] sm:text-[11px] text-white font-semibold truncate max-w-full text-center leading-tight [text-shadow:0_1.5px_3px_rgba(0,0,0,0.9)] tracking-wide group-hover/player:text-amber-300 transition-colors duration-200">
        {short}
      </span>
    </div>
  );
  return p.player?.id ? (
    <Link href={`/scores/player/${p.player.id}?name=${encodeURIComponent(name)}`} className="hover:scale-105 transition-transform duration-200">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function HalfPitch({
  team,
  color,
  textColor,
  marks,
  away,
}: {
  team: GoalTeamLineup;
  color: string;
  textColor: string;
  marks: Record<string, PlayerMarks>;
  away: boolean;
}) {
  const lines = buildLines(team);
  const mobileClass = away ? "flex-col-reverse" : "flex-col";
  const desktopClass = away ? "md:flex-row-reverse" : "md:flex-row";
  return (
    <div className={`flex-1 flex ${mobileClass} ${desktopClass} md:h-full w-full py-0`}>
      {lines.map((line, i) => (
        <div key={i} className="flex-1 flex flex-row md:flex-col justify-around items-center px-2 md:px-0 py-2">
          {line.map((p, j) => (
            <PitchPlayer key={j} p={p} color={color} textColor={textColor} marks={p.player?.id ? marks[p.player.id] : undefined} />
          ))}
        </div>
      ))}
    </div>
  );
}

function formatFormation(f: string): string {
  if (!f) return "";
  if (f.includes("-")) return f;
  if (/^\d+$/.test(f)) {
    return f.split("").join("-");
  }
  return f;
}

function TeamFormationHeader({ team, formation, align }: { team: GoalMatchDetail["team_a"]; formation: string | null; align: "left" | "right" }) {
  const crest = team.image_url ? (
    <span className="w-7 h-7 shrink-0 flex items-center justify-center bg-card rounded-lg p-0.5 border border-border-alt shadow-sm">
      <Image src={team.image_url} alt="" width={24} height={24} className="object-contain" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
    </span>
  ) : (
    <Shield className="w-5 h-5 text-fg-dim shrink-0" />
  );
  const codeText = team.code || team.name.slice(0, 3).toUpperCase();
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}>
      {crest}
      <span className="text-sm font-bold text-white min-w-0 font-mono">
        <span className="hidden md:inline">{team.name}</span>
        <span className="md:hidden inline">{codeText}</span>
      </span>
      {formation && (
        <span className="text-[11px] sm:text-[12px] font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-md tabular-nums shrink-0 inline-block">
          {formatFormation(formation)}
        </span>
      )}
    </div>
  );
}

function SubList({ team, label, marks, teamColor }: { team: GoalTeamLineup; label: string; marks: Record<string, PlayerMarks>; teamColor: string }) {
  if (team.substitutes.length === 0) return null;
  return (
    <div className="bg-card border border-border-alt rounded-2xl p-4.5 shadow-sm space-y-3.5">
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <div className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: teamColor }} />
        <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">{label} · Substitutes</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {team.substitutes.map((p, i) => {
          const m = p.player?.id ? marks[p.player.id] : undefined;
          return (
            <Link
              key={i}
              href={p.player?.id ? `/scores/player/${p.player.id}?name=${encodeURIComponent(p.player?.name || "")}` : "#"}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-hover border border-transparent hover:border-border transition-all duration-200"
            >
              <span className="w-6 text-center text-xs font-bold text-fg-dim tabular-nums bg-input/40 border border-border-alt rounded py-0.5">{p.shirt_number ?? ""}</span>
              <span className="flex-1 text-[13px] font-medium text-fg truncate">{p.player?.name || "Unknown"}</span>
              {m?.subOn && <ArrowUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
              {m && m.goals > 0 && <SoccerBall className="w-3.5 h-3.5 text-fg shrink-0" />}
              {m?.yellow && <Card color="#eab308" className="w-2.5 h-3.5" />}
              {m?.red && <Card color="#dc2626" className="w-2.5 h-3.5" />}
              {p.score != null && <RatingPill score={p.score} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Lineups({ match }: { match: GoalMatchDetail }) {
  const a = match.lineups?.team_a;
  const b = match.lineups?.team_b;
  const colorA = match.team_a_colors?.[0] || "#ef4444";
  const colorB = match.team_b_colors?.[0] || "#3b82f6";
  const textA = hexTextColor(colorA);
  const textB = hexTextColor(colorB);
  const marks = buildPlayerMarks(match.events);

  if (!a && !b) {
    return <div className="text-sm text-fg-dim py-8 text-center">Lineups not available for this match yet.</div>;
  }

  const hasPitch = a && b && a.starting_xi.length > 0 && b.starting_xi.length > 0;

  return (
    <div className="space-y-6">
      {hasPitch && (
        <div className="rounded-2xl overflow-hidden border border-border-alt shadow-md">
          {/* formation header bar */}
          <div className="flex items-center justify-between gap-4 sm:gap-6 px-4.5 py-3 bg-gradient-to-r from-neutral-800 to-neutral-900 border-b border-neutral-700/50">
            <div className="min-w-0 shrink-0">
              <TeamFormationHeader team={match.team_a} formation={a!.formation} align="left" />
            </div>
            {/* Center label (desktop only) */}
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest shrink-0 select-none hidden md:inline-block">Formation</span>
            {/* Middle gap spacer (mobile/tablet only, hidden on desktop where label is shown) */}
            <div className="w-3 shrink-0 md:hidden" />
            <div className="min-w-0 flex justify-end shrink-0">
              <TeamFormationHeader team={match.team_b} formation={b!.formation} align="right" />
            </div>
          </div>

          {/* pitch */}
          <div
            className="relative w-full flex flex-col md:flex-row min-h-[680px] md:min-h-0 aspect-[3/5.8] md:aspect-[16/10] overflow-hidden py-6 md:py-0"
            style={{
              background:
                "radial-gradient(ellipse at center, #1b8a3e 0%, #136a2e 70%, #0d5222 100%)",
            }}
          >
            {/* stripes (vertical on mobile, horizontal/vertical overlay on desktop) */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_9%,transparent_9%,transparent_18%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_9%,transparent_9%,transparent_18%)] pointer-events-none md:hidden" />
            
            {/* border markings */}
            <div className="absolute inset-2 border border-white/20 rounded-sm pointer-events-none" />
            
            {/* corner arcs */}
            <div className="absolute top-2 left-2 w-3 h-3 border-r border-b border-white/20 rounded-br-full pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-l border-b border-white/20 rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-r border-t border-white/20 rounded-tr-full pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-l border-t border-white/20 rounded-tl-full pointer-events-none" />
            
            {/* center line (horizontal on mobile, vertical on desktop) */}
            <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-white/20 -translate-y-1/2 md:hidden pointer-events-none" />
            <div className="absolute top-2 bottom-2 left-1/2 w-0.5 bg-white/20 -translate-x-1/2 hidden md:block pointer-events-none" />
            
            {/* center circle */}
            <div className="absolute left-1/2 top-1/2 w-20 h-20 sm:w-24 sm:h-24 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white/35 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            {/* penalty boxes: top/bottom on mobile, left/right on desktop */}
            {/* Left Penalty Box (Home) - Desktop Only */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-28 sm:w-20 sm:h-44 border border-l-0 border-white/20 hidden md:block pointer-events-none" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-14 sm:w-7 sm:h-22 border border-l-0 border-white/20 hidden md:block pointer-events-none" />
            
            {/* Right Penalty Box (Away) - Desktop Only */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-28 sm:w-20 sm:h-44 border border-r-0 border-white/20 hidden md:block pointer-events-none" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-14 sm:w-7 sm:h-22 border border-r-0 border-white/20 hidden md:block pointer-events-none" />

            {/* Top Penalty Box (Home) - Mobile Only */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-14 border border-t-0 border-white/20 md:hidden pointer-events-none" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 border border-t-0 border-white/20 md:hidden pointer-events-none" />

            {/* Bottom Penalty Box (Away) - Mobile Only */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-14 border border-b-0 border-white/20 md:hidden pointer-events-none" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-5 border border-b-0 border-white/20 md:hidden pointer-events-none" />

            <HalfPitch team={a!} color={colorA} textColor={textA} marks={marks} away={false} />
            <HalfPitch team={b!} color={colorB} textColor={textB} marks={marks} away />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {a && <SubList team={a} label={match.team_a.code || match.team_a.name} marks={marks} teamColor={colorA} />}
        {b && <SubList team={b} label={match.team_b.code || match.team_b.name} marks={marks} teamColor={colorB} />}
      </div>
    </div>
  );
}

/* ---------------- Commentary ---------------- */

function Commentary({ items }: { items: GoalCommentaryItem[] }) {
  if (items.length === 0) return <div className="text-sm text-fg-dim py-8 text-center">No commentary matches available.</div>;
  return (
    <div className="space-y-2">
      {items.map((c, i) => {
        const min = c.period ? `${c.period.minute}${c.period.extra > 0 ? `+${c.period.extra}` : ""}'` : "";
        const isGoal = c.type?.includes("GOAL");
        const isCard = c.type?.includes("CARD") || c.type?.includes("YELLOW") || c.type?.includes("RED");

        return (
          <div
            key={i}
            className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all duration-200 ${
              isGoal 
                ? "bg-emerald-500/5 border-emerald-500/25 shadow-xs" 
                : isCard
                ? "bg-amber-500/5 border-amber-500/25 shadow-xs"
                : "bg-input/10 border-border/40 hover:bg-input/20"
            }`}
          >
            {/* Minute tag */}
            <span className="w-10 shrink-0 text-xs font-bold text-fg-dim tabular-nums bg-card border border-border-alt rounded-md px-1.5 py-0.5 text-center shadow-2xs">
              {min || "—"}
            </span>

            {/* Icon */}
            {isGoal && (
              <span className="shrink-0 p-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500">
                <SoccerBall className="w-4 h-4 text-emerald-500" />
              </span>
            )}
            
            {isCard && (
              <span className="shrink-0 pt-0.5">
                <Card color={c.type.includes("RED") ? "#dc2626" : "#eab308"} className="w-3 h-4" />
              </span>
            )}

            {/* Text details */}
            <div className="flex-1 text-[13px] leading-relaxed">
              {c.player && (
                <Link
                  href={`/scores/player/${c.player.id}?name=${encodeURIComponent(c.player.name)}`}
                  className="font-bold text-fg hover:text-red-500 transition-colors mr-1.5 underline decoration-dotted"
                >
                  {c.player.name}
                </Link>
              )}
              <span className="text-fg-muted">{c.text}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Ratings ---------------- */

function Ratings({ match }: { match: GoalMatchDetail }) {
  const players = match.top_players;
  if (players.length === 0) return <div className="text-sm text-fg-dim py-8 text-center">No player ratings available.</div>;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const best = sorted[0];

  return (
    <div className="space-y-6">
      {best && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-transparent p-5 shadow-md">
          {/* Background glow */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/35 shrink-0 shadow-inner">
              <Trophy className="w-6 h-6 text-amber-500" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Player of the Match</div>
              <Link
                href={`/scores/player/${best.player.id}?name=${encodeURIComponent(best.player.name)}`}
                className="text-base font-extrabold text-fg hover:text-amber-500 transition-colors truncate block leading-snug"
              >
                {best.player.name}
              </Link>
              <span className="text-xs font-semibold text-fg-muted">
                {best.team_side === "TEAM_A" ? match.team_a.name : match.team_b.name}
              </span>
            </div>
            <RatingPill score={best.score} size="md" />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="text-xs font-bold text-fg-dim uppercase tracking-wider px-3 mb-2">Squad Performances</div>
        {sorted.map((tp, i) => {
          const rankingBadge = 
            i === 0 ? "bg-amber-500/20 text-amber-600 border-amber-500/30" :
            i === 1 ? "bg-slate-300/20 text-slate-500 border-slate-300/30" :
            i === 2 ? "bg-amber-700/20 text-amber-700 border-amber-700/30" :
            "bg-input text-fg-faint border-transparent";

          return (
            <Link
              key={i}
              href={`/scores/player/${tp.player.id}?name=${encodeURIComponent(tp.player.name)}`}
              className="flex items-center gap-3.5 py-2.5 px-3 rounded-xl hover:bg-hover border border-transparent hover:border-border transition-all duration-200"
            >
              <span className={`w-6 h-6 rounded-full border text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums ${rankingBadge}`}>
                {i + 1}
              </span>
              
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-bold text-fg truncate block hover:text-red-500 transition-colors">{tp.player.name}</span>
                <span className="text-[10px] font-semibold text-fg-dim">
                  {tp.team_side === "TEAM_A" ? match.team_a.name : match.team_b.name}
                </span>
              </div>
              <RatingPill score={tp.score} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Summary ---------------- */

function Summary({ match }: { match: GoalMatchDetail }) {
  const topStats = match.stats?.summary?.slice(0, 4) || [];
  const colorA = match.team_a_colors?.[0] || "#ef4444";
  const colorB = match.team_b_colors?.[0] || "#3b82f6";

  return (
    <div className="space-y-8">
      {/* score breakdown */}
      {(match.half_time_team_a !== null || match.penalty_team_a !== null || match.agg_team_a !== null) && (
        <div className="flex flex-wrap gap-2.5 pb-2.5 border-b border-border/50">
          {match.half_time_team_a !== null && (
            <span className="text-[11px] font-bold text-fg bg-card border border-border-alt rounded-lg px-3.5 py-1.5 shadow-2xs">
              Half Time: {match.half_time_team_a}–{match.half_time_team_b}
            </span>
          )}
          {match.extra_time_team_a !== null && (
            <span className="text-[11px] font-bold text-fg bg-card border border-border-alt rounded-lg px-3.5 py-1.5 shadow-2xs">
              Extra Time: {match.extra_time_team_a}–{match.extra_time_team_b}
            </span>
          )}
          {match.penalty_team_a !== null && (
            <span className="text-[11px] font-bold text-fg bg-card border border-border-alt rounded-lg px-3.5 py-1.5 shadow-2xs">
              Penalties: {match.penalty_team_a}–{match.penalty_team_b}
            </span>
          )}
          {match.agg_team_a !== null && (
            <span className="text-[11px] font-bold text-fg bg-card border border-border-alt rounded-lg px-3.5 py-1.5 shadow-2xs">
              Aggregate: {match.agg_team_a}–{match.agg_team_b}
            </span>
          )}
        </div>
      )}

      {/* events */}
      <div>
        <h3 className="text-xs font-bold text-fg-dim uppercase tracking-wider mb-4 px-1">Key Match Events</h3>
        <EventTimeline events={match.events} />
      </div>

      {/* key stats preview */}
      {topStats.length > 0 && (
        <div className="pt-2">
          <h3 className="text-xs font-bold text-fg-dim uppercase tracking-wider mb-4 px-1">Key Stats</h3>
          <div className="bg-input/5 border border-border-alt rounded-2xl p-4.5 space-y-2">
            {topStats.map((s, i) => (
              <StatBar key={i} type={s.type} a={s.team_a} b={s.team_b} colorA={colorA} colorB={colorB} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Scoreboard components ---------------- */

function TeamBlock({ team, align, glowColor }: { team: GoalMatchDetail["team_a"]; align: "left" | "right"; glowColor: string }) {
  const logo = team.image_url ? (
    <div 
      className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-input/50 border border-border-alt transition-transform duration-300 group-hover:scale-105 shadow-sm p-1.5"
      style={{ filter: `drop-shadow(0 4px 10px ${glowColor}20)` }}
    >
      <Image src={team.image_url} alt={team.name} width={68} height={68} className="object-contain" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
    </div>
  ) : (
    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-input/50 border border-border-alt text-fg-dim shadow-sm">
      <Shield className="w-8 h-8 opacity-75" />
    </div>
  );

  return (
    <Link
      href={`/scores/team/${team.id}?name=${encodeURIComponent(team.name)}`}
      className={`group flex flex-col items-center gap-3 flex-1 min-w-0 ${align === "left" ? "sm:items-end" : "sm:items-start"}`}
    >
      {logo}
      <span className={`text-sm sm:text-[15px] font-bold text-fg text-center group-hover:text-red-500 transition-colors leading-tight px-1 ${align === "left" ? "sm:text-right" : "sm:text-left"}`}>
        {team.name}
      </span>
    </Link>
  );
}

function H2HMatchesList({ matches }: { matches: GoalMatch[] }) {
  if (!matches || matches.length === 0) return null;
  return (
    <div className="bg-card border border-border-alt rounded-2xl p-5 space-y-3.5 shadow-sm">
      <div className="text-xs font-bold text-fg-dim uppercase tracking-wider pb-2 border-b border-border/50">
        Recent Meetings
      </div>
      <div className="space-y-2">
        {matches.slice(0, 5).map((m, idx) => {
          const formattedDate = new Date(m.start_date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-input/10 border border-border/40 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-fg-dim">{formattedDate}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-bold text-fg max-w-[100px] truncate">{m.team_a.code || m.team_a.name}</span>
                  <span className="font-bold text-fg-faint">vs</span>
                  <span className="font-bold text-fg max-w-[100px] truncate">{m.team_b.code || m.team_b.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-center bg-card border border-border-alt rounded-lg px-2.5 py-1 font-extrabold text-fg tabular-nums shadow-3xs">
                {m.score_team_a ?? "-"} – {m.score_team_b ?? "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Main ---------------- */

export default function MatchDetailClient({ slug, matchId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [match, setMatch] = useState<GoalMatchDetail | undefined>(undefined);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync tab from URL on mount/update
  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab;
    if (tabParam && ["summary", "events", "stats", "lineups", "commentary", "ratings"].includes(tabParam)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = useCallback((tabKey: Tab) => {
    setActiveTab(tabKey);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabKey);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  const refreshMatch = useCallback(async () => {
    try {
      const detail = await getGoalMatchDetail(matchId, slug);
      if (detail) setMatch(detail);
    } catch {}
  }, [matchId, slug]);

  useEffect(() => {
    let active = true;
    refreshMatch().then(() => { if (active) setInitialLoading(false); });
    const interval = setInterval(() => refreshMatch(), 30000);
    return () => { active = false; clearInterval(interval); };
  }, [refreshMatch]);

  if (!match) {
    return (
      <div className="flex min-h-dvh flex-col bg-page text-fg">
        <main className="flex-1 w-full container mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-16">
          <div className="rounded-2xl border border-border-alt bg-card p-14 text-center max-w-lg mx-auto shadow-sm">
            {initialLoading ? (
              <div>
                <SoccerBall className="w-12 h-12 mx-auto mb-4 text-fg-dim animate-spin" />
                <div className="text-base font-bold text-fg-muted mb-4">Loading match details...</div>
              </div>
            ) : (
              <div>
                <SoccerBall className="w-12 h-12 mx-auto mb-4 text-fg-faint animate-pulse" />
                <div className="text-base font-bold text-fg-muted mb-4">Match details could not be found.</div>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && window.history.length > 1) {
                      router.back();
                    } else {
                      router.push("/scores");
                    }
                  }}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-fg text-page font-bold rounded-xl text-sm transition-transform hover:scale-102 cursor-pointer"
                >
                  Back to Scores
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  const colorA = match.team_a_colors?.[0] || "#ef4444";
  const colorB = match.team_b_colors?.[0] || "#3b82f6";

  const isLive = match.status === "LIVE";
  const isResult = match.status === "RESULT";
  const statusText = isLive
    ? match.period
      ? `${match.period.type === "FIRST_HALF" ? "1st Half" : match.period.type === "SECOND_HALF" ? "2nd Half" : match.period.type === "HALF_TIME" ? "Half Time" : "Live"} ${match.period.type !== "HALF_TIME" ? `${match.period.minute}'` : ""}`
      : "Live"
    : isResult
    ? "Full Time"
    : formatTime(match.start_date);

  return (
    <div className="flex min-h-dvh flex-col bg-page text-fg">
      <main className="flex-1 w-full container mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-16">
        
        {/* Back Link */}
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
          <ChevronLeft className="w-4 h-4" />
          Back to Scores
        </button>

        {/* Scoreboard Widget */}
        <div className="bg-card border border-border-alt rounded-2xl overflow-hidden mb-6 shadow-sm">
          {/* Competition Header */}
          <div className="flex items-center justify-center gap-2 py-3 px-4 border-b border-border bg-input/20 text-xs font-bold text-fg-dim">
            {match.competition_image_url && (
              <Image src={match.competition_image_url} alt="" width={18} height={18} className="object-contain" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
            )}
            <span className="truncate">
              {match.competition_area} · {match.competition_name}
              {match.round?.name ? ` · ${match.round.name}` : ""}
            </span>
          </div>

          {/* Teams and Score Grid */}
          <div className="flex items-start gap-2 px-4 sm:px-10 py-8">
            <TeamBlock team={match.team_a} align="left" glowColor={colorA} />

            <div className="flex flex-col items-center px-4 shrink-0 pt-2">
              <div className="flex items-center gap-4 sm:gap-6 text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight">
                <span className="drop-shadow-xs">{match.score_team_a ?? "-"}</span>
                <span className="text-fg-faint text-2xl font-light">:</span>
                <span className="drop-shadow-xs">{match.score_team_b ?? "-"}</span>
              </div>
              <span
                className={`mt-4 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-2 border shadow-2xs transition-all duration-350 ${
                  isLive
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : isResult
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                    : "bg-input text-fg-dim border-border-alt"
                }`}
              >
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                {statusText}
              </span>

              {/* Scorers */}
              {((match.scorers_team_a?.length || 0) + (match.scorers_team_b?.length || 0)) > 0 && (
                <div className="mt-3 flex flex-col items-center gap-1 text-xs font-mono">
                  {match.scorers_team_a?.map((s, i) => (
                    <span key={i} className="text-fg-dim">
                      ⚽ {s.scorer ? (
                        <Link href={`/scores/player/${s.scorer.id}?name=${encodeURIComponent(s.scorer.name)}`} className="hover:text-red-400 transition-colors">{s.scorer.name}</Link>
                      ) : "?"} {s.period?.minute ? `${s.period.minute}'` : ""}
                    </span>
                  ))}
                  {match.scorers_team_b?.map((s, i) => (
                    <span key={i} className="text-fg-dim">
                      ⚽ {s.scorer ? (
                        <Link href={`/scores/player/${s.scorer.id}?name=${encodeURIComponent(s.scorer.name)}`} className="hover:text-red-400 transition-colors">{s.scorer.name}</Link>
                      ) : "?"} {s.period?.minute ? `${s.period.minute}'` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <TeamBlock team={match.team_b} align="right" glowColor={colorB} />
          </div>
        </div>

        {/* 2-Column Responsive Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Main Column (Interactive tabs & panels) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Sticky Tabs Bar */}
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 border-b border-border/70">
              <div className="flex items-center gap-2 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-250 ${
                      activeTab === tab.key
                        ? "bg-fg text-page shadow-sm scale-102"
                        : "bg-card border border-border-alt text-fg-dim hover:text-fg hover:border-fg-dim"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Panel Content Box */}
            <div className="bg-card border border-border-alt rounded-2xl p-5 sm:p-6 shadow-sm">
              {activeTab === "summary" && <Summary match={match} />}
              {activeTab === "events" && <EventTimeline events={match.events} full />}
              {activeTab === "stats" && <StatsPanel stats={match.stats} colorA={colorA} colorB={colorB} />}
              {activeTab === "lineups" && <Lineups match={match} />}
              {activeTab === "commentary" && <Commentary items={match.commentary} />}
              {activeTab === "ratings" && <Ratings match={match} />}
            </div>

          </div>

          {/* Right / Sidebar Column (Metadata, Stadium, H2H Overview) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            
            {/* Match details card */}
            <div className="bg-card border border-border-alt rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="text-xs font-bold text-fg-dim uppercase tracking-wider pb-2 border-b border-border/50">
                Match Details
              </div>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3.5 text-[13px]">
                  <Calendar className="w-4.5 h-4.5 text-fg-dim mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-fg">{formatDate(match.start_date)}</div>
                    <div className="text-xs text-fg-dim font-medium">{formatTime(match.start_date)} (Local)</div>
                  </div>
                </div>

                {match.venue && (
                  <div className="flex items-start gap-3.5 text-[13px]">
                    <MapPin className="w-4.5 h-4.5 text-fg-dim mt-0.5 shrink-0" />
                    <div>
                      {match.venue_lat && match.venue_lng ? (
                        <a
                          href={`https://www.google.com/maps?q=${match.venue_lat},${match.venue_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-fg hover:text-red-500 transition-colors underline decoration-dotted"
                        >
                          {match.venue}
                        </a>
                      ) : (
                        <div className="font-bold text-fg">{match.venue}</div>
                      )}
                    </div>
                  </div>
                )}

                {match.round?.name && (
                  <div className="flex items-start gap-3.5 text-[13px]">
                    <Trophy className="w-4.5 h-4.5 text-fg-dim mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-fg">{match.round.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* H2H Statistics Card */}
            {match.h2h && (
              <div className="bg-card border border-border-alt rounded-2xl p-5 space-y-4.5 shadow-sm">
                <div className="text-xs font-bold text-fg-dim uppercase tracking-wider pb-2 border-b border-border/50">
                  Head to Head Stats
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-fg-dim uppercase tracking-wider mb-2">
                    <span className="truncate max-w-[100px]">{match.team_a.code || match.team_a.name} ({match.h2h.team_a_wins})</span>
                    <span>Draws ({match.h2h.draws})</span>
                    <span className="truncate max-w-[100px]">{match.team_b.code || match.team_b.name} ({match.h2h.team_b_wins})</span>
                  </div>
                  {(() => {
                    const totalWins = match.h2h.team_a_wins + match.h2h.draws + match.h2h.team_b_wins;
                    const aPct = totalWins > 0 ? (match.h2h.team_a_wins / totalWins) * 100 : 33.3;
                    const dPct = totalWins > 0 ? (match.h2h.draws / totalWins) * 100 : 33.3;
                    const bPct = totalWins > 0 ? (match.h2h.team_b_wins / totalWins) * 100 : 33.3;
                    return (
                      <div className="w-full h-3 rounded-full flex overflow-hidden border border-border-alt p-0.5 bg-input/30">
                        <div style={{ width: `${aPct}%`, backgroundColor: colorA }} className="h-full rounded-l-full" title={`${aPct.toFixed(0)}% wins`} />
                        <div style={{ width: `${dPct}%` }} className="h-full bg-slate-400/80" title={`${dPct.toFixed(0)}% draws`} />
                        <div style={{ width: `${bPct}%`, backgroundColor: colorB }} className="h-full rounded-r-full" title={`${bPct.toFixed(0)}% wins`} />
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-input/10 border border-border/50 rounded-xl p-3.5 text-center">
                    <div className="text-lg font-black text-fg">{match.h2h.games_over_two_and_half}</div>
                    <div className="text-[9px] font-extrabold text-fg-dim uppercase tracking-widest mt-1">Over 2.5 Goals</div>
                  </div>
                  <div className="bg-input/10 border border-border/50 rounded-xl p-3.5 text-center">
                    <div className="text-lg font-black text-fg">{match.h2h.games_both_teams_scored}</div>
                    <div className="text-[9px] font-extrabold text-fg-dim uppercase tracking-widest mt-1">Both Scored (BTTS)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Historic meetings list */}
            {match.h2h_matches && match.h2h_matches.length > 0 && (
              <H2HMatchesList matches={match.h2h_matches} />
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
