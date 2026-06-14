"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getMatches, Match, getLiveChannels } from "@/lib/api";
import Search from "lucide-react/dist/esm/icons/search";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Link from "next/link";
import Image from "next/image";
import { event } from "@/lib/analytics";

function MatchesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveChannelKey, setLiveChannelKey] = useState("");

  // Filters State
  const [activeTab, setActiveTab] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync URL search parameters
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "live" || statusParam === "upcoming" || statusParam === "finished") {
      setActiveTab(statusParam);
    }

    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Load matches & channels
  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      try {
        const matchesData = await getMatches();
        setMatches(matchesData?.matches || []);

        const channelsData = await getLiveChannels();
        if (channelsData?.channels && channelsData.channels.length > 0) {
          setLiveChannelKey(channelsData.channels[0].key);
        }
      } catch (err) {
        console.error("Failed to load match listings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
  }, []);

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    // 1. Tab Status Filter
    if (activeTab !== "all" && match.status !== activeTab) return false;

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const t1 = match.team1.name.toLowerCase();
      const t2 = match.team2.name.toLowerCase();
      const grp = (match.group || "").toLowerCase();
      if (!t1.includes(q) && !t2.includes(q) && !grp.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header and Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg font-mono uppercase tracking-widest">
            Match Schedule
          </h1>
          <p className="text-xs font-mono text-fg-dim mt-1">
            Browse live football matches, upcoming schedules, and finished standings.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-fg-dim hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
        </Link>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-border pb-4">
        {/* Status Tabs */}
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
              {tab === "all" ? "All Matches" : tab}
            </button>
          ))}
        </div>

        {/* Text Search input */}
        <div className="flex items-center gap-2 border border-border-alt bg-card px-3 py-2 max-w-md w-full">
          <Search className="w-4 h-4 text-fg-dim shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams or groups..."
            className="bg-transparent text-xs text-fg font-mono placeholder:text-fg-faint outline-none w-full"
          />
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="border border-border bg-card p-16 text-center font-mono text-xs text-fg-dim uppercase tracking-widest">
          [ NO_MATCHES_INDEXED ]
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMatches.map((match) => {
            const isLive = match.status === "live";
            const isFinished = match.status === "finished";
            const isUpcoming = match.status === "upcoming";

            const startTime = match.start_time ? new Date(match.start_time) : null;
            const formattedTime = startTime
              ? startTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
              : "TBD";
            const formattedDate = startTime
              ? startTime.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "TBD";

            return (
              <div
                key={match.match_id}
                className="rounded-xl border border-border-alt bg-card p-6 flex flex-col relative overflow-hidden group shadow-2xl min-h-[240px]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  {/* Card Header */}
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono text-fg-faint">
                    <span>
                      {match.stage} {match.group ? `• ${match.group}` : ""}
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

                    {isUpcoming && (
                      <span className="inline-flex items-center gap-1 bg-card border border-border px-2 py-0.5 text-[9px] text-fg-dim">
                        <Clock className="w-3 h-3" />
                        UPCOMING
                      </span>
                    )}
                  </div>

                  {/* Scoreboard Block */}
                  <div className="flex flex-col items-center justify-center my-6 gap-2">
                    <div className="flex items-center justify-center gap-4 text-center">
                      {/* Team 1 */}
                      <div className="flex flex-col items-center gap-1 w-24">
                        {match.team1.flag_url ? (
                          <Image
                            src={match.team1.flag_url}
                            alt={match.team1.name}
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
                          {match.team1.name}
                        </span>
                      </div>

                      {/* Score or VS */}
                      <div className="flex flex-col items-center justify-center font-mono">
                        {isFinished ? (
                          <div className="text-lg font-bold text-fg-dim bg-hover border border-border-alt px-3 py-1">
                            {match.score1 ?? 0} - {match.score2 ?? 0}
                          </div>
                        ) : isLive ? (
                          <div className="text-lg font-bold text-red-500 bg-red-500/5 border border-red-500/10 px-3 py-1">
                            {match.score1 ?? 0} - {match.score2 ?? 0}
                          </div>
                        ) : (
                          <div className="text-xs font-mono text-fg-faint uppercase tracking-widest">VS</div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex flex-col items-center gap-1 w-24">
                        {match.team2.flag_url ? (
                          <Image
                            src={match.team2.flag_url}
                            alt={match.team2.name}
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
                          {match.team2.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto border-t border-border pt-4 flex justify-between items-center text-xs font-mono text-fg-dim">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
                      {match.group || "Stage Series"}
                    </span>
                    {isLive && liveChannelKey ? (
                      <Link
                        href={`/live/${liveChannelKey}`}
                        onClick={() => event("match_view", { match_id: match.match_id, team1: match.team1.name, team2: match.team2.name })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 text-fg font-bold hover:bg-red-600 transition-colors uppercase tracking-widest text-[9px]"
                      >
                        [ Tune In ]
                      </Link>
                    ) : (
                      <span className="text-fg-dim">
                        {formattedDate} @ {formattedTime}
                      </span>
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
        <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">
          Mounting Schedule Lobby...
        </span>
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}
