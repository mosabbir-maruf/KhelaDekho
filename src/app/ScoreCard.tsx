"use client";

import Link from "next/link";
import Image from "next/image";
import type { GoalMatch } from "@/lib/api";

export interface FeedMatch {
  match: GoalMatch;
  competition: string;
  competitionImage: string | null;
}

export function ScoreTeamLogo({ team }: { team: GoalMatch["team_a"] }) {
  if (team.image_url) {
    return (
      <span className="w-9 h-9 rounded-full bg-input/40 border border-border-alt flex items-center justify-center overflow-hidden shrink-0">
        <Image src={team.image_url} alt={team.name} width={28} height={28} className="object-contain" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
      </span>
    );
  }
  return (
    <span className="w-9 h-9 rounded-full bg-input/40 border border-border-alt flex items-center justify-center shrink-0 text-[9px] font-mono font-bold text-fg-dim uppercase">
      {team.code || team.short || team.name.slice(0, 3)}
    </span>
  );
}

export function MatchCard({ item }: { item: FeedMatch }) {
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
    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-faint">{formatMatchTimeBD(m.start_date)}</span>
  );

  return (
    <Link
      prefetch={false}
      href={m.slug ? `/scores/${m.slug}/${m.id}` : "#"}
      className="group relative flex flex-col rounded-xl border border-border-alt bg-card overflow-hidden hover:border-red-500/25 hover:bg-red-500/[0.015] transition-all"
    >
      {isLive && <span className="absolute top-0 left-0 h-full w-[2px] bg-red-500/60" />}

      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border-alt/70 bg-input/10">
        <span className="flex items-center gap-2 min-w-0">
          {competitionImage && (
            <Image src={competitionImage} alt="" width={14} height={14} className="object-contain shrink-0" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
          )}
          <span className="text-[10px] font-mono text-fg-faint uppercase tracking-widest truncate">
            {m.round?.name || competition}
          </span>
        </span>
        {statusNode}
      </div>

      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <ScoreTeamLogo team={m.team_a} />
          <span className="text-sm font-medium text-fg truncate">{m.team_a.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 px-2">
          <span className={`text-lg font-bold tabular-nums ${m.score_team_a !== null ? "text-fg" : "text-fg-faint"}`}>
            {m.score_team_a ?? "-"}
          </span>
          <span className="text-fg-faint text-xs">:</span>
          <span className={`text-lg font-bold tabular-nums ${m.score_team_b !== null ? "text-fg" : "text-fg-faint"}`}>
            {m.score_team_b ?? "-"}
          </span>
        </div>

        <div className="flex-1 flex items-center gap-2.5 min-w-0 justify-end">
          <span className="text-sm font-medium text-fg truncate text-right">{m.team_b.name}</span>
          <ScoreTeamLogo team={m.team_b} />
        </div>
      </div>
    </Link>
  );
}

function formatMatchTimeBD(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
