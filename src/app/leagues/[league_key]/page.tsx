"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMatches, getChannels, Match, ChannelInfo } from "@/lib/api";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Tv from "lucide-react/dist/esm/icons/tv";
import Link from "next/link";



export default function LeaguePage() {
  const params = useParams();
  const leagueKey = params.league_key as string;

  const [matches, setMatches] = useState<Match[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const query = leagueKey.replace(/-/g, " ");

  useEffect(() => {
    if (!leagueKey) return;

    const load = async () => {
      setLoading(true);
      try {
        const [matchResult, channelResult] = await Promise.all([
          getMatches(),
          getChannels(),
        ]);
        const allMatches = matchResult?.matches || [];
        const allChannels = channelResult?.channels || [];

        const q = query.toLowerCase();
        const filteredMatches = allMatches.filter(
          (m) =>
            (m.stage || "").toLowerCase().includes(q) ||
            (m.group || "").toLowerCase().includes(q)
        );
        const filteredChannels = allChannels.filter(
          (c) =>
            c.category.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q)
        );

        setMatches(filteredMatches);
        setChannels(filteredChannels);
      } catch (err) {
        console.error("Failed to load league data:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [leagueKey, query]);

  const title = leagueKey
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
        <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg font-mono uppercase tracking-widest">
            {title}
          </h1>
          <p className="text-xs font-mono text-fg-dim mt-1">
            {matches.length} matches &bull; {channels.length} channels
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-fg-dim hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border-alt bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-hover">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-fg flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fg-dim" />
                Matches
              </h3>
            </div>

            {matches.length === 0 ? (
              <div className="text-center font-mono text-[10px] text-fg-faint py-10">
                NO_MATCHES_FOUND
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {matches.map((match) => (
                  <div key={match.match_id} className="p-4 hover:bg-hover transition-colors">
                    <div className="flex justify-between items-center text-[10px] font-mono text-fg-dim uppercase mb-2">
                      <span>{match.stage}</span>
                      <span className={match.status === "live" ? "text-red-500 font-bold" : "text-fg-dim"}>
                        {match.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-mono text-fg">
                      <span className="truncate max-w-[120px]">{match.team1.name}</span>
                      <span className="text-[10px] text-fg-dim shrink-0 px-2">vs</span>
                      <span className="truncate max-w-[120px]">{match.team2.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border-alt bg-card p-5 flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <Tv className="w-4 h-4 text-red-500" />
              <h4 className="font-mono text-xs font-semibold tracking-wider text-fg uppercase">
                Channels
              </h4>
            </div>

            {channels.length === 0 ? (
              <div className="text-center font-mono text-[10px] text-fg-faint py-10">
                NO_CHANNELS_FOUND
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {channels.map((ch) => (
                  <Link
                    key={ch.key}
                    href={`/live/${ch.key}`}
                    className="block border border-border bg-input p-3 hover:border-white/10 transition-colors"
                  >
                    <div className="text-xs font-mono text-fg truncate">{ch.name}</div>
                    <div className="text-[9px] font-mono text-fg-dim mt-1">
                      {ch.category} &bull; {ch.live_viewers} viewers
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
