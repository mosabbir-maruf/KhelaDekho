"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import { getGoalScores } from "@/lib/api";
import { MatchCard, FeedMatch } from "./ScoreCard";

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
