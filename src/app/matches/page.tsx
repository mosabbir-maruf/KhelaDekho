"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";
import Search from "lucide-react/dist/esm/icons/search";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Link from "next/link";
import Image from "next/image";
import { event } from "@/lib/analytics";

interface V2Team {
  name: string;
  logo: string | null;
}

interface V2Event {
  id: string;
  parent: string;
  enc_parent: string;
  sport: string;
  league: string;
  round: string;
  team_a: V2Team;
  team_b: V2Team;
  starts_at: string | null;
  is_live: boolean;
  status: string;
  league_icon: string | null;
  priority: number;
}

async function fetchV2Events(signal: AbortSignal, status?: string): Promise<V2Event[]> {
  const rawBaseUrl = getApiBaseUrl();
  if (!rawBaseUrl) return [];
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const path = status ? `/api/v2/events/${status}` : "/api/v2/events";
  const res = await fetch(`${baseUrl}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body?.data?.events || [];
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return { time: "TBD", date: "TBD" };
  const d = new Date(dateStr);
  return {
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<V2Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "live" || statusParam === "upcoming" || statusParam === "finished") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(statusParam);
    }
    const searchParam = searchParams.get("search");
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchV2Events(controller.signal, activeTab !== "all" ? activeTab : undefined);
        if (active) { setEvents(data); setLoading(false); }
      } catch {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [activeTab]);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.team_a.name.toLowerCase().includes(q) ||
      ev.team_b.name.toLowerCase().includes(q) ||
      ev.league.toLowerCase().includes(q) ||
      ev.sport.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg font-mono uppercase tracking-widest">
            Live Matches
          </h1>
          <p className="text-xs font-mono text-fg-dim mt-1">
            Browse live events, upcoming schedules, and finished standings.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-fg-dim hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-border pb-4">
        <div className="flex bg-card border border-border-alt p-1 font-mono text-xs max-w-full overflow-x-auto shrink-0">
          {(["all", "live", "upcoming", "finished"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                router.replace("/matches");
              }}
              className={`px-4 py-2 uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                activeTab === tab ? "bg-white text-black font-bold" : "text-fg-dim hover:text-fg"
              }`}
            >
              {tab === "all" ? "All" : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border border-border-alt bg-card px-3 py-2 max-w-md w-full">
          <Search className="w-4 h-4 text-fg-dim shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams or leagues..."
            className="bg-transparent text-xs text-fg font-mono placeholder:text-fg-faint outline-none w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="border border-border bg-card p-16 text-center font-mono text-xs text-fg-dim uppercase tracking-widest">
          [ NO_EVENTS_FOUND ]
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((ev, idx) => {
            const isLive = ev.status === "live";
            const isFinished = ev.status === "finished";
            const { time, date } = formatTime(ev.starts_at);

            return (
              <div
                key={`${ev.id}-${idx}`}
                className="rounded-xl border border-border-alt bg-card p-6 flex flex-col relative overflow-hidden group shadow-2xl min-h-[240px]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono text-fg-faint">
                    <span>
                      {ev.league} {ev.round ? `• ${ev.round}` : ""} • {ev.sport}
                    </span>
                    {isLive && (
                      <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-500 tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        LIVE
                      </span>
                    )}
                    {isFinished && (
                      <span className="inline-flex items-center gap-1 bg-neutral-800 px-2 py-0.5 text-[9px] text-fg-dim">
                        <CheckCircle className="w-3 h-3 text-fg-dim" />
                        FT
                      </span>
                    )}
                    {ev.status === "upcoming" && (
                      <span className="inline-flex items-center gap-1 bg-card border border-border px-2 py-0.5 text-[9px] text-fg-dim">
                        <Clock className="w-3 h-3" />
                        UPCOMING
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center my-6 gap-2">
                    <div className="flex items-center justify-center gap-4 text-center">
                      <div className="flex flex-col items-center gap-1 w-24">
                        {ev.team_a.logo ? (
                          <Image
                            src={ev.team_a.logo}
                            alt={ev.team_a.name}
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
                        <span className="text-xs font-semibold text-fg truncate max-w-[90px]">
                          {ev.team_a.name}
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center font-mono">
                        {isLive ? (
                          <div className="text-lg font-bold text-red-500 bg-red-500/5 border border-red-500/10 px-3 py-1">
                            LIVE
                          </div>
                        ) : (
                          <div className="text-xs font-mono text-fg-faint uppercase tracking-widest">VS</div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1 w-24">
                        {ev.team_b.logo ? (
                          <Image
                            src={ev.team_b.logo}
                            alt={ev.team_b.name}
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
                        <span className="text-xs font-semibold text-fg truncate max-w-[90px]">
                          {ev.team_b.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-border pt-4 flex justify-between items-center text-xs font-mono text-fg-dim">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
                      {ev.league}
                    </span>
                    {isLive ? (
                      <Link
                        href="/live-matches"
                        onClick={() => event("match_view", { match_id: ev.id, team1: ev.team_a.name, team2: ev.team_b.name })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 text-fg font-bold hover:bg-red-600 transition-colors uppercase tracking-widest text-[9px]"
                      >
                        [ Tune In ]
                      </Link>
                    ) : (
                      <span className="text-fg-dim">{date} @ {time}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60dvh]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
        <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">
          Loading events...
        </span>
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}
