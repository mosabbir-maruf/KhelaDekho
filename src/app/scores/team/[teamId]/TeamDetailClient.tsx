"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { GoalTeamDetail, GoalMatch } from "@/lib/api";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Trophy from "lucide-react/dist/esm/icons/trophy";

interface Props {
  initialTeam?: GoalTeamDetail;
  teamName?: string;
}

function formatDateDisplay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function getStatusBadge(match: GoalMatch): { label: string; className: string } {
  if (match.status === "LIVE") return { label: "LIVE", className: "text-red-400 border-red-500/30 bg-red-500/10" };
  if (match.status === "RESULT") return { label: "FT", className: "text-fg-dim border-border-alt bg-input/30" };
  return { label: formatTime(match.start_date), className: "text-fg-faint border-border-alt bg-input/20" };
}

export default function TeamDetailClient({ initialTeam, teamName }: Props) {
  const router = useRouter();
  const [team] = useState(initialTeam);

  if (!team) {
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
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-12 h-12 text-fg-dim mb-4" />
            <h1 className="text-lg font-mono font-bold mb-2">{teamName || "Team Not Found"}</h1>
            <p className="text-xs font-mono text-fg-dim">Could not load team details.</p>
          </div>
        </div>
      </div>
    );
  }

  const matches = team.recent_matches || [];

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

        {/* Header */}
        <div className="bg-input/20 border border-border-alt rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-input/50 border border-border-alt flex items-center justify-center overflow-hidden shrink-0">
              {team.image_url ? (
                <Image src={team.image_url} alt={team.name} width={80} height={80} className="object-contain w-full h-full" unoptimized loading="eager" style={{ width: "auto", height: "auto" }} />
              ) : (
                <Trophy className="w-8 h-8 text-fg-dim" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-mono font-bold text-fg truncate">{team.name}</h1>
              <p className="text-xs font-mono text-fg-dim mt-1">
                {team.short_name && <span className="mr-3">Short: {team.short_name}</span>}
                {team.long_name && team.long_name !== team.name && <span>{team.long_name}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-input/20 border border-border-alt rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-alt">
            <Calendar className="w-3.5 h-3.5 text-fg-dim" />
            <span className="text-[10px] font-mono text-fg-faint uppercase tracking-widest">Recent Matches</span>
            <span className="text-[10px] font-mono text-fg-faint ml-auto">{matches.length} matches</span>
          </div>

          {matches.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs font-mono text-fg-dim">No recent matches found.</p>
            </div>
          )}

          <div className="space-y-2">
            {matches.map((match) => {
              const badge = getStatusBadge(match);
              const isTeamA = match.team_a.id === team.id;
              const teamScore = isTeamA ? match.score_team_a : match.score_team_b;
              const opponentScore = isTeamA ? match.score_team_b : match.score_team_a;
              const opponent = isTeamA ? match.team_b : match.team_a;
              const hasScore = match.status === "RESULT" || match.status === "LIVE";

              return (
                <Link
                  key={match.id}
                  href={`/scores/${match.slug}/${match.id}`}
                  className="flex items-center gap-3 py-2.5 px-3 bg-input/30 border border-border-alt rounded hover:border-red-500/20 transition-colors text-xs font-mono"
                >
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${badge.className}`}>
                    {badge.label}
                  </span>
                  {opponent.image_url && (
                    <Image src={opponent.image_url} alt="" width={18} height={18} className="object-contain shrink-0" unoptimized style={{ width: "auto", height: "auto" }} />
                  )}
                  <span className="flex-1 truncate text-fg-dim">
                    <span className="text-fg font-semibold">{team.name}</span>
                    <span className="text-fg-faint mx-1">vs</span>
                    <span>{opponent.name}</span>
                  </span>
                  {hasScore && teamScore !== null && opponentScore !== null && (
                    <span className="font-bold text-fg tabular-nums">
                      {teamScore}-{opponentScore}
                    </span>
                  )}
                  {match.round?.display && match.round.name && (
                    <span className="text-[9px] text-fg-faint hidden sm:block">{match.round.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
