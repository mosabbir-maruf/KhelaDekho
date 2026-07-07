"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import { getGoalScores } from "@/lib/api";
import type { GoalMatch } from "@/lib/api";

interface FeedMatch {
  match: GoalMatch;
  competition: string;
  competitionImage: string | null;
}

function MatchCard({ item }: { item: FeedMatch }) {
  const { match: m, competition, competitionImage } = item;
  const isLive = m.status === "LIVE";
  const isResult = m.status === "RESULT";

  const statusNode = isLive ? (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {m.period?.type === "HALF_TIME" ? "HT" : `${m.period?.minute ?? 0}${m.period && m.period.extra > 0 ? `+${m.period.extra}` : ""}'`}
    </span>
  ) : isResult ? (
    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">Full Time</span>
  ) : (
    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-faint">{formatTime(m.start_date)}</span>
  );

  return (
    <Link
      prefetch={false}
      href={m.slug ? `/scores/${m.slug}/${m.id}` : "#"}
      className="group relative flex flex-col rounded-xl border border-border-alt bg-card overflow-hidden hover:border-red-500/25 hover:bg-red-500/[0.015] transition-all"
    >
      {isLive && <span className="absolute top-0 left-0 h-full w-[2px] bg-red-500/60" />}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          {competitionImage && (
            <img draggable={false} src={competitionImage} alt="" className="w-4 h-4 object-contain rounded-sm" />
          )}
          <span className="text-[10px] font-mono text-fg-faint uppercase tracking-wider truncate">{competition}</span>
        </div>
        {statusNode}
      </div>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <TeamLogo team={m.team_a} />
          <span className="text-sm font-semibold font-mono text-fg truncate">{m.team_a?.name || "?"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 px-2">
          <span className={`text-lg font-bold tabular-nums ${m.score_team_a !== null ? "text-fg" : "text-fg-faint"}`}>
            {m.score_team_a ?? "-"}
          </span>
          <span className="text-xs text-fg-faint">:</span>
          <span className={`text-lg font-bold tabular-nums ${m.score_team_b !== null ? "text-fg" : "text-fg-faint"}`}>
            {m.score_team_b ?? "-"}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0">
          <span className="text-sm font-semibold font-mono text-fg truncate text-right">{m.team_b?.name || "?"}</span>
          <TeamLogo team={m.team_b} />
        </div>
      </div>
    </Link>
  );
}

function TeamLogo({ team }: { team: GoalMatch["team_a"] }) {
  if (!team) return null;
  if (team.image_url) {
    return (
      <span className="w-7 h-7 rounded-full bg-input/40 border border-border-alt flex items-center justify-center overflow-hidden shrink-0">
        <img draggable={false} src={team.image_url} alt={team.name} className="w-6 h-6 object-contain" />
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-full bg-input/40 border border-border-alt flex items-center justify-center shrink-0 text-[9px] font-mono font-bold text-fg-dim uppercase">
      {team.code || team.short || team.name?.slice(0, 3)}
    </span>
  );
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function LiveScoresClient({ initialData }: { initialData: { display: FeedMatch[]; liveCount: number; label: string } }) {
  const [data, setData] = useState(initialData);

  const refresh = useCallback(async () => {
    try {
      const scores = await getGoalScores();
      const feed: FeedMatch[] = [];
      for (const c of scores?.competitions || []) {
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
      setData({ display, liveCount: live.length, label });
    } catch {}
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 border-t border-border-alt">
      <div className="flex flex-col items-center text-center mb-14">
        <span className="inline-flex items-center gap-2 border border-border-alt bg-card px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-fg-dim mb-5">
          {data.liveCount > 0 ? (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
          {data.liveCount > 0 ? "Live Now" : "Match Feed"}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-fg mb-3">Live Scores</h2>
        <p className="text-fg-dim text-sm font-mono max-w-[500px]">{data.label}</p>
      </div>

      <div className="max-w-[820px] mx-auto">
        {data.display.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.display.slice(0, 6).map((item) => (
              <MatchCard key={item.match.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border-alt bg-card py-16 text-center">
            <Trophy className="w-8 h-8 text-fg-faint mx-auto mb-4" />
            <p className="text-sm font-mono text-fg-dim">No matches available right now.</p>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Link
            href="/scores"
            className="inline-flex items-center justify-center bg-white text-black hover:bg-neutral-200 h-12 px-8 py-2 font-mono text-xs uppercase tracking-widest font-bold transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            [ View Full Schedule ]
          </Link>
        </div>
      </div>
    </section>
  );
}
