"use client";

import { useEffect, useState, useMemo } from "react";
import { getMatches, getChannels, getGoalScores, Match, ChannelInfo, GoalMatch } from "@/lib/api";
import Search from "lucide-react/dist/esm/icons/search";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Tv from "lucide-react/dist/esm/icons/tv";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Link from "next/link";
import { event } from "@/lib/analytics";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [goalMatches, setGoalMatches] = useState<(GoalMatch & { comp_name?: string })[]>([]);

  // Load search databases on mount
  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      setLoading(true);
      try {
        const [mResult, chResult] = await Promise.all([
          getMatches({}, { signal: controller.signal }),
          getChannels({}, { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setMatches(mResult?.matches || []);
        setChannels(chResult?.channels || []);

        // Fetch goal scores across multiple dates for broader search
        const goalAll: (GoalMatch & { comp_name?: string })[] = [];
        const seen = new Set<string>();
        const today = new Date();
        for (let i = -3; i <= 5; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split("T")[0];
          try {
            const gr = await getGoalScores({ date: dateStr });
            for (const c of gr?.competitions || []) {
              for (const m of c.matches) {
                if (!seen.has(m.id)) {
                  seen.add(m.id);
                  goalAll.push({ ...m, comp_name: c.name });
                }
              }
            }
          } catch {}
        }
        setGoalMatches(goalAll);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load search directory databases:", err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadData();
    return () => controller.abort();
  }, []);

  // Filter channels based on query
  const filteredChannels = useMemo(() => {
    if (!query.trim()) return channels;
    const q = query.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.quality.toLowerCase().includes(q)
    );
  }, [query, channels]);

  // Filter matches based on query
  const filteredMatches = useMemo(() => {
    if (!query.trim()) return matches;
    const q = query.toLowerCase();
    return matches.filter(
      (m) =>
        m.team1.name.toLowerCase().includes(q) ||
        m.team2.name.toLowerCase().includes(q) ||
        (m.group || "").toLowerCase().includes(q) ||
        (m.stage || "").toLowerCase().includes(q)
    );
  }, [query, matches]);

  // Filter goal matches
  const filteredGoalMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return goalMatches.filter(
      (m) =>
        m.team_a.name.toLowerCase().includes(q) ||
        m.team_b.name.toLowerCase().includes(q) ||
        (m.comp_name || "").toLowerCase().includes(q)
    );
  }, [query, goalMatches]);

  const totalResults = filteredChannels.length + filteredMatches.length + filteredGoalMatches.length;

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      event("search", { search_query: query.trim(), result_count: totalResults });
    }, 500);
    return () => clearTimeout(timer);
  }, [query, totalResults]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header and Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg font-mono uppercase tracking-widest">
            Search Anything..
          </h1>
          <p className="text-xs font-mono text-fg-dim mt-1">
            Query the streaming index for active channels and scheduled matches — search anything.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-fg-dim hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
        </Link>
      </div>

      {/* Main Search Bar */}
      <div className="flex items-center gap-3 border border-border-alt bg-card px-4 py-3 shadow-2xl">
        <Search className="w-5 h-5 text-fg-dim shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Search Anything.."
          className="bg-transparent text-sm text-fg font-mono placeholder:text-fg-faint outline-none w-full"
        />
        {query.trim() && (
          <button
            onClick={() => setQuery("")}
            className="text-xs font-mono text-fg-dim hover:text-fg transition-colors cursor-pointer"
          >
            [ Clear ]
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Results Summary */}
          {query.trim() && (
            <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest border-b border-border pb-2">
              Found {totalResults} matching entries
            </div>
          )}

          {/* Channels Section */}
          {filteredChannels.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-fg-dim uppercase tracking-widest flex items-center gap-2 font-mono whitespace-nowrap shrink-0">
                <Tv className="w-4 h-4 text-red-500 shrink-0" />
                Live Channels ({filteredChannels.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChannels.map((ch) => (
                  <Link
                    key={ch.key}
                    href={`/live/${ch.key}`}
                    className="border border-border-alt bg-card p-4 flex justify-between items-center hover:border-white/20 transition-all group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-fg font-mono group-hover:text-red-400 transition-colors">
                        {ch.name}
                      </div>
                      <span className="text-[10px] font-mono text-fg-dim">
                        {ch.category} • Quality: {ch.quality}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-fg-dim">
                      {ch.live_viewers.toLocaleString()} view
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Matches Section */}
          {filteredMatches.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-fg-dim uppercase tracking-widest flex items-center gap-2 font-mono whitespace-nowrap shrink-0">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                Matches ({filteredMatches.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMatches.map((m) => (
                  <Link
                    key={m.match_id}
                    href={`/scores`}
                    className="border border-border-alt bg-card p-4 flex flex-col justify-between hover:border-white/20 transition-all"
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono text-fg-dim uppercase mb-2">
                      <span>{m.stage}</span>
                      <span
                        className={m.status === "live" ? "text-red-500 font-bold" : "text-fg-dim"}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-fg">
                      {m.team1.name} vs {m.team2.name}
                    </div>
                    {m.group && (
                      <span className="text-[9px] font-mono text-fg-faint mt-2 uppercase">
                        Group: {m.group}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Goal Matches Section */}
          {filteredGoalMatches.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-fg-dim uppercase tracking-widest flex items-center gap-2 font-mono">
                <Calendar className="w-4 h-4 text-red-400 shrink-0" />
                Live Scores ({filteredGoalMatches.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGoalMatches.map((m) => (
                  <Link
                    key={m.id}
                    href={m.slug ? `/scores/${m.slug}/${m.id}` : "/scores"}
                    className="border border-border-alt bg-card p-4 flex items-center justify-between hover:border-red-500/20 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      {m.comp_name && <div className="text-[9px] font-mono text-fg-faint uppercase tracking-wider mb-1 truncate">{m.comp_name}</div>}
                      <div className="text-xs font-mono text-fg font-semibold truncate">{m.team_a.name}</div>
                      <div className="text-xs font-mono text-fg font-semibold truncate">{m.team_b.name}</div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-sm font-mono font-bold text-fg tabular-nums">
                        {m.score_team_a ?? "-"}:{m.score_team_b ?? "-"}
                      </div>
                      <span className={`text-[10px] font-mono ${m.status === "LIVE" ? "text-red-400" : "text-fg-faint"}`}>
                        {m.status === "LIVE" ? "LIVE" : m.status === "RESULT" ? "FT" : "SCHEDULED"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No results fallback */}
          {query.trim() && totalResults === 0 && (
            <div className="border border-border bg-card p-8 sm:p-16 text-center font-mono text-xs text-fg-dim uppercase tracking-widest">
              <div className="mb-2">[ NO_SEARCH_RESULTS_MATCHED ]</div>
              <div className="text-fg-faint text-[10px] normal-case">Try searching for a team, league, or channel name.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
