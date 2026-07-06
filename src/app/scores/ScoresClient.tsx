"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { GoalScoresData, GoalCompetition, GoalMatch } from "@/lib/api";
import { getGoalScores } from "@/lib/api";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Search from "lucide-react/dist/esm/icons/search";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Activity from "lucide-react/dist/esm/icons/activity";
import Filter from "lucide-react/dist/esm/icons/filter";

type Tab = "all" | "live" | "fixtures" | "results";

interface Props {
  initialData?: GoalScoresData;
  currentDate?: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "fixtures", label: "Scheduled" },
  { key: "results", label: "Finished" },
];

const TAB_STATUS: Record<Exclude<Tab, "all">, GoalMatch["status"]> = {
  live: "LIVE",
  fixtures: "FIXTURE",
  results: "RESULT",
};

// Filter a dataset down to competitions/matches with a given status.
function filterByStatus(data: GoalScoresData | undefined, status: GoalMatch["status"]): GoalCompetition[] {
  if (!data) return [];
  return data.competitions
    .map((c) => ({ ...c, matches: c.matches.filter((m) => m.status === status) }))
    .filter((c) => c.matches.length > 0);
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return fmt(new Date());
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatUpdated(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function liveMinute(match: GoalMatch): string {
  if (!match.period) return "LIVE";
  if (match.period.type === "HALF_TIME") return "HT";
  if (match.period.extra > 0) return `${match.period.minute}+${match.period.extra}'`;
  return `${match.period.minute}'`;
}

/* ---------------- Team logo ---------------- */

function TeamLogo({ team, size = 16 }: { team: GoalMatch["team_a"]; size?: number }) {
  return (
    <span className="shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      {team.image_url ? (
        <Image src={team.image_url} alt={team.name} width={size} height={size} className="object-contain" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
      ) : (
        <span className="text-[8px] text-fg-dim uppercase font-semibold">{team.code || team.name.slice(0, 3)}</span>
      )}
    </span>
  );
}

/* ---------------- Match row ---------------- */

function MatchRow({ match }: { match: GoalMatch }) {
  const isLive = match.status === "LIVE";
  const isResult = match.status === "RESULT";
  const showScore = isLive || isResult;
  const href = match.slug ? `/scores/${match.slug}/${match.id}` : "#";

  const a = match.score_team_a;
  const b = match.score_team_b;
  const loserA = isResult && a !== null && b !== null && a < b;
  const loserB = isResult && a !== null && b !== null && b < a;

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between p-4 hover:bg-hover transition-all relative overflow-hidden ${
        isLive ? "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-red-500/70" : ""
      }`}
    >
      <div className="flex-1 flex items-center gap-6 min-w-0">
        {/* Status / Timing rail */}
        <div className="w-16 shrink-0 flex flex-col items-center justify-center text-center">
          {isLive ? (
            <span className="text-[10px] font-bold text-red-500 tracking-wider animate-pulse">{liveMinute(match)}</span>
          ) : isResult ? (
            <span className="text-[10px] font-mono font-bold text-fg-dim bg-input/80 border border-border-alt px-1.5 py-0.5 rounded">FT</span>
          ) : match.status === "POSTPONED" ? (
            <span className="text-[9px] font-mono font-semibold text-amber-500 bg-amber-500/5 border border-amber-500/20 px-1.5 py-0.5 rounded">POSTP</span>
          ) : (
            <span className="text-[11px] font-mono text-fg-dim tracking-tight tabular-nums">{formatKickoff(match.start_date)}</span>
          )}
        </div>

        {/* Teams and Logos */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Team A */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded bg-hover border border-border-alt p-0.5">
                <TeamLogo team={match.team_a} size={16} />
              </span>
              <span className={`text-xs font-mono ${loserA ? "text-fg-dim line-through decoration-fg-faint" : "text-fg font-medium"}`}>
                {match.team_a.name}
              </span>
              {match.red_cards_team_a > 0 && (
                <span className="shrink-0 w-2.5 h-3.5 rounded-[2px] bg-red-500 border border-red-600 shadow mr-1 flex items-center justify-center text-[8px] text-white font-bold" title={`${match.red_cards_team_a} red card(s)`}>R</span>
              )}
            </div>
            {showScore && (
              <span className={`text-xs font-mono font-bold tabular-nums ${loserA ? "text-fg-dim" : "text-fg"}`}>{a}</span>
            )}
          </div>

          {/* Team B */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded bg-hover border border-border-alt p-0.5">
                <TeamLogo team={match.team_b} size={16} />
              </span>
              <span className={`text-xs font-mono ${loserB ? "text-fg-dim line-through decoration-fg-faint" : "text-fg font-medium"}`}>
                {match.team_b.name}
              </span>
              {match.red_cards_team_b > 0 && (
                <span className="shrink-0 w-2.5 h-3.5 rounded-[2px] bg-red-500 border border-red-600 shadow mr-1 flex items-center justify-center text-[8px] text-white font-bold" title={`${match.red_cards_team_b} red card(s)`}>R</span>
              )}
            </div>
            {showScore && (
              <span className={`text-xs font-mono font-bold tabular-nums ${loserB ? "text-fg-dim" : "text-fg"}`}>{b}</span>
            )}
          </div>
        </div>
      </div>

      {/* penalties (if any) */}
      {match.penalty_team_a !== null && (
        <div className="w-10 shrink-0 flex flex-col items-center justify-center gap-1.5 py-1.5 border-l border-border/80 text-[10px] text-fg-faint font-mono tabular-nums">
          <span>({match.penalty_team_a})</span>
          <span>({match.penalty_team_b})</span>
        </div>
      )}

      {/* right arrow click cue */}
      <div className="pl-4 flex items-center text-fg-faint">
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

/* ---------------- Competition group ---------------- */

function CompetitionGroup({ competition }: { competition: GoalCompetition }) {
  const [open, setOpen] = useState(true);
  if (competition.matches.length === 0) return null;

  const liveCount = competition.matches.filter((m) => m.status === "LIVE").length;

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border-alt rounded-xl overflow-hidden shadow-lg transition-all hover:border-border duration-300">
      {/* league header */}
      <div className="flex items-center gap-3 px-4 h-12 bg-white/[0.01] border-b border-border/80">
        {competition.image_url ? (
          <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-hover border border-border-alt p-1">
            <Image src={competition.image_url} alt={competition.name} width={24} height={24} className="object-contain" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
          </span>
        ) : (
          <span className="w-6 h-6 shrink-0 rounded bg-border-alt" />
        )}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {competition.area && (
            <span className="shrink-0 text-[9px] font-mono bg-input/80 border border-border-alt px-1.5 py-0.5 rounded text-fg-dim tracking-widest font-semibold leading-none">{competition.area.toUpperCase()}</span>
          )}
          <span className="text-sm font-mono font-semibold text-fg truncate">{competition.name}</span>
        </div>
        {liveCount > 0 && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 tracking-wider font-mono uppercase shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            {liveCount} LIVE
          </span>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-1.5 text-fg-dim hover:text-fg hover:bg-hover rounded transition-colors shrink-0 cursor-pointer"
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? "" : "-rotate-90"}`} />
        </button>
      </div>

      {open && (
        <div className="divide-y divide-border/60">
          {competition.matches.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Day selector ---------------- */

function DayStrip({ currentDate, onDateChange }: { currentDate: string; onDateChange: (d: string) => void }) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [days, setDays] = useState<string[]>([]);

  // Keep the list of days static to prevent teardowns/jumps during adjacent selects.
  // We only regenerate the list of 29 days (14 before, 14 after) if the selected date falls outside.
  useEffect(() => {
    if (days.includes(currentDate)) return;

    const centerDate = new Date(currentDate + "T12:00:00Z");
    const list: string[] = [];
    for (let i = -14; i <= 14; i++) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() + i);
      list.push(fmt(d));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(list);
  }, [currentDate, days]);

  // Smoothly center the active date within the horizontal scroll window
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeBtn = containerRef.current?.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentDate, days]);

  const shift = (delta: number) => {
    const d = new Date(currentDate + "T12:00:00Z");
    d.setDate(d.getDate() + delta);
    onDateChange(fmt(d));
  };

  const label = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00Z");
    return {
      wd: d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
      day: d.getUTCDate(),
      isToday: dateStr === fmt(today),
    };
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => shift(-1)}
        className="p-2 rounded border border-border-alt bg-card/65 text-fg-dim hover:text-fg hover:bg-hover hover:border-red-500/20 transition-all shrink-0 cursor-pointer"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={containerRef}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {days.map((d) => {
          const { wd, day, isToday } = label(d);
          const active = d === currentDate;
          return (
            <button
              key={d}
              data-active={active}
              onClick={() => onDateChange(d)}
              className={`min-w-[54px] sm:min-w-[62px] flex flex-col items-center justify-center py-2 px-1.5 rounded border transition-all cursor-pointer ${
                active
                  ? "bg-red-500 border-red-500 text-white font-bold shadow-md shadow-red-500/10 scale-102 z-10"
                  : "bg-card/50 border-border-alt text-fg-dim hover:text-fg hover:border-red-500/10 hover:bg-hover"
              }`}
            >
              <span className={`text-[8px] font-mono tracking-wider ${active ? "text-white/80" : "text-fg-faint"}`}>
                {isToday && !active ? "TODAY" : wd}
              </span>
              <span className="text-xs font-mono font-bold tabular-nums leading-tight mt-0.5">{day}</span>
            </button>
          );
        })}
      </div>

      <div className="relative shrink-0 flex items-center">
        <button
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="p-2 rounded border border-border-alt bg-card/65 text-fg-dim hover:text-fg hover:bg-hover hover:border-red-500/20 transition-all cursor-pointer"
          aria-label="Pick a date"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={currentDate}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
          aria-hidden
        />
      </div>

      <button
        onClick={() => shift(1)}
        className="p-2 rounded border border-border-alt bg-card/65 text-fg-dim hover:text-fg hover:bg-hover hover:border-red-500/20 transition-all shrink-0 cursor-pointer"
        aria-label="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ---------------- Loading skeleton ---------------- */

function ScoresSkeleton() {
  // Pure-CSS placeholder (animate-pulse) shown only while the first fetch is
  // in flight. No timers or artificial delays.
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-card/40 border border-border-alt rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center gap-3 px-4 h-12 bg-white/[0.01] border-b border-border/80">
            <div className="w-6 h-6 rounded bg-hover animate-pulse" />
            <div className="h-3 w-14 rounded bg-hover animate-pulse" />
            <div className="h-3.5 w-40 rounded bg-hover animate-pulse" />
          </div>
          <div className="divide-y divide-border/60">
            {[0, 1].map((r) => (
              <div key={r} className="flex items-center gap-6 p-4">
                <div className="w-12 h-3 rounded bg-hover animate-pulse shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-hover animate-pulse" />
                    <div className="h-3 w-32 rounded bg-hover animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-hover animate-pulse" />
                    <div className="h-3 w-28 rounded bg-hover animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Main ---------------- */

export default function ScoresClient({ initialData, currentDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [date, setDate] = useState(currentDate || searchParams?.get("date") || todayStr());
  const [query, setQuery] = useState("");
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  // False until the first fetch settles (success OR failure) so we show a
  // skeleton on initial load instead of a premature "no matches" state.
  const [hasLoaded, setHasLoaded] = useState(!!initialData);

  const fetchData = useCallback(async (dateStr?: string) => {
    setRefreshing(true);
    try {
      const next = await getGoalScores({ date: dateStr });
      if (next) setData(next);
    } finally {
      setRefreshing(false);
      setHasLoaded(true);
    }
  }, []);

  // Fetch immediately on mount and whenever the date changes, then poll.
  useEffect(() => {
    fetchData(date);
    const interval = setInterval(() => fetchData(date), 30000);
    return () => clearInterval(interval);
  }, [date, fetchData]);

  const handleDateChange = useCallback(
    (newDate: string) => {
      setDate(newDate);
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("date", newDate);
      router.push(`/scores?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Tab views are derived from the single dataset (no extra requests).
  const tabCompetitions = useMemo(() => {
    if (activeTab === "all") return data?.competitions || [];
    return filterByStatus(data, TAB_STATUS[activeTab]);
  }, [activeTab, data]);

  const competitions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabCompetitions;
    return tabCompetitions
      .map((c) => {
        const compMatch = c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q);
        const matches = compMatch
          ? c.matches
          : c.matches.filter(
              (m) => m.team_a.name.toLowerCase().includes(q) || m.team_b.name.toLowerCase().includes(q)
            );
        return { ...c, matches };
      })
      .filter((c) => c.matches.length > 0);
  }, [tabCompetitions, query]);

  const totalMatches = competitions.reduce((s, c) => s + c.matches.length, 0);
  const totalLive = useMemo(
    () =>
      (data?.competitions || []).reduce(
        (s, c) => s + c.matches.filter((m) => m.status === "LIVE").length,
        0
      ),
    [data]
  );

  return (
    <div className="min-h-dvh bg-page text-fg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6 sm:space-y-8 lg:space-y-10">
        
        {/* Redesigned Hero section matching About page */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Trophy className="w-3 h-3 text-red-500" />
                Live Telemetry
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Match<span className="text-red-500">.</span> Scores
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                Real-time global match scores, upcoming fixtures, historical results and live event telemetry updated instantly at the edge.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
            </Link>
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Feed Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Control panel for filters & date selector */}
            <div className="border border-border-alt bg-card/50 backdrop-blur p-4 rounded-xl space-y-4 shadow-xl">
              <DayStrip currentDate={date} onDateChange={handleDateChange} />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/80">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-sm transition-all border cursor-pointer ${
                        activeTab === tab.key
                          ? "bg-red-500 border-red-500 text-white font-bold"
                          : "bg-card border-border-alt text-fg-dim hover:text-fg hover:bg-hover"
                      }`}
                    >
                      {tab.label}
                      {tab.key === "live" && totalLive > 0 && (
                        <span className="ml-1.5 text-[9px] text-white bg-red-600 px-1 rounded-sm">LIVE</span>
                      )}
                    </button>
                  ))}
                </div>

                 {/* Mobile Search & Refresh Group */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 justify-end w-full sm:w-auto">
                  {/* Mobile-only Search input */}
                  <div className="relative w-full sm:max-w-[200px] lg:hidden">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-faint" />
                    <input
                      type="text"
                      placeholder="Search matches..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-1.5 bg-input border border-border-alt text-[11px] font-mono text-fg placeholder:text-fg-faint focus:outline-none focus:border-red-500/50 rounded-sm transition-colors"
                    />
                  </div>

                  {/* Refresh indicator */}
                  <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest flex items-center gap-2 shrink-0">
                    {refreshing ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        Refreshed feed
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {data?.cached_at ? `Updated ${formatUpdated(data.cached_at)}` : "Nominal State"}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Competitions / Match Rows */}
            {!hasLoaded ? (
              <ScoresSkeleton />
            ) : competitions.length === 0 ? (
              <div className="rounded-xl border border-border-alt bg-card p-16 text-center font-mono shadow-xl">
                <Calendar className="w-8 h-8 mx-auto mb-4 text-fg-faint" />
                <div className="text-sm font-bold text-fg-dim uppercase tracking-wider mb-2">No matches found</div>
                <div className="text-xs text-fg-faint">
                  {query
                    ? `No entries match search query "${query}".`
                    : activeTab === "live"
                    ? "No matches are live at this transmission interval."
                    : "No fixtures scheduled for this date."}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {competitions.map((comp) => (
                  <CompetitionGroup key={comp.id} competition={comp} />
                ))}
              </div>
            )}
            
            {/* Feed metadata */}
            {hasLoaded && (
              <div className="text-center text-[10px] font-mono uppercase tracking-widest text-fg-faint pt-4">
                [ {totalMatches} {totalMatches === 1 ? "match" : "matches"} found across {competitions.length} {competitions.length === 1 ? "competition" : "competitions"} ]
              </div>
            )}
          </div>

          {/* Right Side: Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            
            {/* Search Widget - Desktop Only */}
            <div className="hidden lg:block border border-border-alt bg-card p-5 rounded-xl shadow-xl space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-fg font-semibold flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-red-500" />
                Search Filter
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search team or league..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-input border border-border-alt rounded-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-red-500/50 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="border border-border-alt bg-card p-5 rounded-xl shadow-xl space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-fg font-semibold flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-red-500" />
                Quick Shortcuts
              </h3>
              <div className="flex flex-wrap gap-2">
                {(data?.competitions || []).map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => setQuery(comp.name)}
                    className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-all cursor-pointer ${
                      query.toLowerCase() === comp.name.toLowerCase()
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-hover border-border-alt text-fg-dim hover:text-fg hover:border-red-500/30"
                    }`}
                  >
                    {comp.name}
                  </button>
                ))}
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    Clear Filter [x]
                  </button>
                )}
              </div>
            </div>

            {/* Telemetry info block */}
            <div className="border border-border-alt bg-card p-5 rounded-xl shadow-xl space-y-3 text-xs font-mono leading-relaxed text-fg-dim">
              <div className="flex items-center gap-2 text-fg font-semibold mb-1 uppercase tracking-widest text-[10px]">
                <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                Telemetry Stats
              </div>
              <p>
                {`> Scores are fetched from active edge providers and decrypted in real-time. Matches matching the 'LIVE' status support interactive commentary and lineups.`}
              </p>
              <div className="pt-3 border-t border-border/80 text-[10px] text-fg-faint flex flex-col gap-1.5 uppercase">
                <span>Connections: Nominal</span>
                <span>Latency: &lt;12ms</span>
                <span>Coverage: Global Leagues</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
