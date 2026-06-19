export const runtime = "edge";

import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY;
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

interface CacheEntry {
  data: unknown;
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 120_000;

interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strBadge: string | null;
  strCountry: string | null;
  strLeague: string | null;
}

interface SportsDBPlayer {
  idPlayer: string;
  strPlayer: string;
  strThumb: string | null;
  strTeam: string | null;
  strNationality: string | null;
  strPosition: string | null;
}

interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strLeague: string | null;
  dateEvent: string | null;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
}

interface TeamsResponse {
  teams: SportsDBTeam[];
}

interface PlayersResponse {
  player: SportsDBPlayer[];
}

interface EventsResponse {
  events: SportsDBEvent[];
}

interface ResultItem {
  id: string;
  name: string;
}

interface TeamResult extends ResultItem {
  badge: string | null;
  country: string | null;
  league: string | null;
}

interface PlayerResult extends ResultItem {
  thumb: string | null;
  team: string | null;
  nationality: string | null;
  position: string | null;
}

interface EventResult extends ResultItem {
  homeTeam: string;
  awayTeam: string;
  league: string | null;
  date: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
}

async function fetchCached<T>(
  url: string,
  key: string,
  ttl = CACHE_TTL
): Promise<T | null> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && now - entry.ts < ttl) return entry.data as T;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: T = await res.json();
    cache.set(key, { data, ts: now });
    if (cache.size > 500) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
    return data;
  } catch {
    return null;
  }
}

function dedupTeams(items: SportsDBTeam[]): TeamResult[] {
  const seen = new Set<string>();
  const result: TeamResult[] = [];
  for (const t of items) {
    if (!t.idTeam || seen.has(t.idTeam)) continue;
    seen.add(t.idTeam);
    result.push({
      id: t.idTeam,
      name: t.strTeam || "",
      badge: t.strBadge || null,
      country: t.strCountry || null,
      league: t.strLeague || null,
    });
  }
  return result;
}

function dedupPlayers(items: SportsDBPlayer[]): PlayerResult[] {
  const seen = new Set<string>();
  const result: PlayerResult[] = [];
  for (const p of items) {
    if (!p.idPlayer || seen.has(p.idPlayer)) continue;
    seen.add(p.idPlayer);
    result.push({
      id: p.idPlayer,
      name: p.strPlayer || "",
      thumb: p.strThumb || null,
      team: p.strTeam || null,
      nationality: p.strNationality || null,
      position: p.strPosition || null,
    });
  }
  return result;
}

function dedupEvents(items: SportsDBEvent[]): EventResult[] {
  const seen = new Set<string>();
  const result: EventResult[] = [];
  for (const e of items) {
    if (!e.idEvent || seen.has(e.idEvent)) continue;
    seen.add(e.idEvent);
    result.push({
      id: e.idEvent,
      name: e.strEvent || `${e.strHomeTeam || ""} vs ${e.strAwayTeam || ""}`,
      homeTeam: e.strHomeTeam || "",
      awayTeam: e.strAwayTeam || "",
      league: e.strLeague || null,
      date: e.dateEvent || null,
      homeBadge: e.strHomeTeamBadge || null,
      awayBadge: e.strAwayTeamBadge || null,
    });
  }
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2 || !API_KEY) {
    return NextResponse.json({ teams: [], players: [], events: [] });
  }

  const encoded = encodeURIComponent(q);

  const [teamsRes, playersRes, eventsRes] = await Promise.all([
    fetchCached<TeamsResponse>(
      `${BASE}/searchteams.php?t=${encoded}`,
      `t:${q}`
    ),
    fetchCached<PlayersResponse>(
      `${BASE}/searchplayers.php?p=${encoded}`,
      `p:${q}`
    ),
    fetchCached<EventsResponse>(
      `${BASE}/searchevents.php?e=${encoded}`,
      `e:${q}`
    ),
  ]);

  return NextResponse.json({
    teams: dedupTeams(teamsRes?.teams ?? []),
    players: dedupPlayers(playersRes?.player ?? []),
    events: dedupEvents(eventsRes?.events ?? []),
  });
}
