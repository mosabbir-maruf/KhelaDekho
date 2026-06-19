"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { FootballMatch } from "@/lib/api";

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY;

function getTargetDates() {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + 6); // BD Time
  const today = d.toISOString().split("T")[0];
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().split("T")[0];
  return [yesterday, today];
}

interface LiveScoreTickerProps {
  initialMatches?: FootballMatch[];
  isNavbar?: boolean;
}

export function LiveScoreTicker({ initialMatches, isNavbar = false }: LiveScoreTickerProps) {
  const [data, setData] = useState<{ events?: FootballMatch[] } | null>(null);

  useEffect(() => {
    if (initialMatches || !API_KEY) return;

    let mounted = true;
    const fetchData = async () => {
      try {
        const dates = getTargetDates();
        const fetchPromises = dates.map(date => 
          fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsday.php?d=${date}&s=Soccer`, { headers: { Accept: "application/json" } })
            .then(res => res.ok ? res.json() : { events: [] })
            .catch(() => ({ events: [] }))
        );
        
        const results = await Promise.all(fetchPromises);
        let allEvents: FootballMatch[] = [];
        results.forEach(res => {
          if (res.events) allEvents = [...allEvents, ...res.events];
        });
        
        if (mounted) setData({ events: allEvents });
      } catch (err) {
        console.error("Failed to fetch live matches:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 minute refresh
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [initialMatches]);

  const matches: FootballMatch[] = useMemo(() => {
    let list: FootballMatch[] = [];
    if (initialMatches) {
      list = initialMatches;
    } else if (data?.events) {
      const seen = new Set<string>();
      list = data.events.filter((e: FootballMatch) => {
        const uid = e.idEvent;
        if (!uid || seen.has(uid)) return false;
        seen.add(uid);
        return true;
      });
    }

    return list.filter(
      m => 
        m.intHomeScore !== null && 
        m.intAwayScore !== null && 
        !["Match Finished", "Finished", "FT", "Not Started", "Postponed", "Cancelled", "TBA"].includes(m.strStatus)
    );
  }, [initialMatches, data]);

  if (matches.length === 0) return null;

  const content = (
    <div className={`flex items-center ${isNavbar ? "gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" : "justify-center overflow-x-auto gap-6 custom-scrollbar snap-x pb-2 mask-edges w-full"}`}>
      {matches.map((match, i) => (
        <div key={match.idEvent || i} className={`snap-start shrink-0 inline-flex items-center ${isNavbar ? "gap-1.5 text-[9px] px-2 py-1" : "gap-2 text-[10px] px-3 py-1.5"} font-mono uppercase tracking-widest bg-input/30 border border-border-alt/50 shadow-sm rounded-sm pointer-events-auto select-none group hover:border-red-500/50 hover:bg-red-500/5 transition-colors`}>
          {match.strHomeTeamBadge && <img src={match.strHomeTeamBadge} alt="" draggable={false} className="w-3.5 h-3.5 object-contain select-none pointer-events-none" />}
          <span className="text-fg-dim font-bold group-hover:text-fg transition-colors">{match.strHomeTeam}</span>
          <span className="font-bold text-red-500 tabular-nums">{match.intHomeScore !== null ? match.intHomeScore : "-"}</span>
          <span className="text-fg-faint mx-0.5">-</span>
          <span className="font-bold text-red-500 tabular-nums">{match.intAwayScore !== null ? match.intAwayScore : "-"}</span>
          <span className="text-fg-dim font-bold group-hover:text-fg transition-colors">{match.strAwayTeam}</span>
          {match.strAwayTeamBadge && <img src={match.strAwayTeamBadge} alt="" draggable={false} className="w-3.5 h-3.5 object-contain select-none pointer-events-none" />}
        </div>
      ))}
    </div>
  );

  if (isNavbar) {
    return (
      <div className="hidden md:flex items-center mx-3 group" title="View Live Matches">
        <Link href="/live-matches" className="flex items-center hover:opacity-80 transition-opacity">
          {content}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mt-6 z-10 overflow-hidden select-none pointer-events-none md:pointer-events-auto w-full">
      {content}
    </div>
  );
}
