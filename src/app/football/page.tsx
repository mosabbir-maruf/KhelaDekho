"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Search from "lucide-react/dist/esm/icons/search";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Users from "lucide-react/dist/esm/icons/users";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Zap from "lucide-react/dist/esm/icons/zap";

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY;

function getTodayBD() {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + 6);
  return d.toISOString().split("T")[0];
}

async function fetchDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const q = new URLSearchParams(params);
    const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/${endpoint}?${q}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

const LEAGUES = [
  { id: "4328", name: "Premier League", season: "2024-2025" },
  { id: "4335", name: "La Liga", season: "2024-2025" },
  { id: "4332", name: "Serie A", season: "2024-2025" },
  { id: "4331", name: "Bundesliga", season: "2024-2025" },
  { id: "4334", name: "Ligue 1", season: "2024-2025" },
  { id: "4429", name: "FIFA World Cup", season: "2026" },
  { id: "4480", name: "Champions League", season: "2024-2025" },
];

const POPULAR_CLUBS = ["Arsenal", "Chelsea", "Liverpool", "Manchester_City", "Manchester_United", "Barcelona", "Real_Madrid", "Bayern_Munich", "Juventus", "Paris_SG"];
const POPULAR_NATIONAL = ["England", "Brazil", "Argentina", "France", "Germany", "Spain", "Portugal", "Italy", "Netherlands", "Belgium"];
const POPULAR_PLAYERS = ["Messi", "Ronaldo", "Mbappe", "Haaland", "De_Bruyne", "Salah", "Vinicius", "Bellingham", "Kane", "Neymar"];

type Tab = "matches" | "standings" | "leagues" | "teams" | "players";
type DetailType = "team" | "player" | "league" | "match";

interface MatchData {
  idEvent?: string;
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string;
  intAwayScore?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  strStatus?: string;
  strLeague?: string;
  strVenue?: string;
  strCity?: string;
  strCountry?: string;
  dateEvent?: string;
  strTimestamp?: string;
  strGroup?: string;
  intRound?: string;
  strSeason?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
}

interface TeamData {
  idTeam?: string;
  strTeam?: string;
  strBadge?: string;
  strLogo?: string;
  strBanner?: string;
  strFanart1?: string;
  strLeague?: string;
  strCountry?: string;
  intFormedYear?: string;
  strStadium?: string;
  intStadiumCapacity?: string;
}

interface PlayerData {
  idPlayer?: string;
  strPlayer?: string;
  strPosition?: string;
  strNumber?: string;
  strTeam?: string;
  strTeam2?: string;
  strNationality?: string;
  dateBorn?: string;
  strBirthLocation?: string;
  strHeight?: string;
  strWeight?: string;
  strSide?: string;
  strDescriptionEN?: string;
  strStatus?: string;
  strKit?: string;
  strCutout?: string;
  strThumb?: string;
  strRender?: string;
  strBanner?: string;
}

interface LeagueData {
  idLeague?: string;
  strLeague?: string;
  strBadge?: string;
  strSport?: string;
  strCountry?: string;
}

interface StandingData {
  idStanding?: string;
  idTeam?: string;
  strTeam?: string;
  intRank?: string;
  intPlayed?: string;
  intWin?: string;
  intDraw?: string;
  intLoss?: string;
  intGoalsFor?: string;
  intGoalsAgainst?: string;
  intGoalDifference?: string;
  intPoints?: string;
  strForm?: string;
  strBadge?: string;
}

type DetailDataType = MatchData & TeamData & PlayerData & LeagueData;

interface DetailExtra {
  recent: MatchData[];
  upcoming: MatchData[];
  squad: (PlayerData | TeamData)[];
}

interface EventsResponse {
  events?: MatchData[];
}

interface TableResponse {
  table?: StandingData[];
}

interface LeaguesResponse {
  leagues?: LeagueData[];
}

interface TeamsResponse {
  teams?: TeamData[];
}

interface PlayersResponse {
  player?: PlayerData[];
}

interface EventsLastResponse {
  results?: MatchData[];
}

interface PlayerLookupResponse {
  players?: PlayerData[];
}

interface GroupedMatchesProps {
  matches: MatchData[];
  openDetail: (type: DetailType, id: string, name: string) => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "matches", label: "Matches" },
  { key: "standings", label: "Standings" },
  { key: "leagues", label: "Leagues" },
  { key: "teams", label: "Teams" },
  { key: "players", label: "Players" },
];

const statusBadge = (s: string | undefined) => {
  if (s === "LIVE" || s === "1H" || s === "HT" || s === "2H")
    return <span className="flex items-center gap-1 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />LIVE</span>;
  if (s === "FT" || s === "AET") return <span className="text-emerald-400">FT</span>;
  return <span className="text-fg-dim">{s === "NS" ? "SCHEDULED" : s}</span>;
};

function parseBD(ts: string): Date {
  const normalized = ts.includes("T") ? ts : ts.replace(" ", "T");
  const hasTz = /[Z+-]\d{2}:\d{2}$/.test(normalized) || normalized.endsWith("Z");
  const d = new Date(hasTz ? normalized : normalized + "Z");
  d.setUTCHours(d.getUTCHours() + 6);
  return d;
}

function formatMatchTimeBD(ts: string): string {
  const d = parseBD(ts);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function matchDateBD(m: MatchData): string {
  if (!m.strTimestamp) return m.dateEvent ?? "";
  return parseBD(m.strTimestamp).toISOString().split("T")[0];
}

const formDots = (f: string) => {
  if (!f) return null;
  return <span className="flex gap-[2px]">{f.split("").map((c, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${c === "W" ? "bg-emerald-500" : c === "L" ? "bg-red-500" : "bg-neutral-600"}`} />)}</span>;
};

const CACHE_TTL = { matches: 30_000, default: Infinity };

function GroupedMatches({ matches, openDetail }: GroupedMatchesProps) {
  const [filter, setFilter] = useState("all");
  const today = getTodayBD();
  const isLive = (s: string | undefined) => s && ["LIVE", "1H", "HT", "2H", "ET"].includes(s);
  const isFinished = (s: string | undefined) => s && ["FT", "AET", "PEN"].includes(s);

  const allGroups = [
    { key: "live", label: "Live Now", matches: matches.filter(m => isLive(m.strStatus)), live: true },
    { key: "scheduled", label: "Scheduled Today", matches: matches.filter(m => !isLive(m.strStatus) && !isFinished(m.strStatus) && matchDateBD(m) === today) },
    { key: "upcoming", label: "Upcoming", matches: matches.filter(m => matchDateBD(m) > today) },
    { key: "finished", label: "Finished", matches: matches.filter(m => isFinished(m.strStatus)) },
  ];
  const groups = filter === "all"
    ? [...allGroups].sort((a, b) => b.matches.length - a.matches.length || (a.live ? -1 : 0))
    : allGroups.filter(g => g.key === filter && g.matches.length > 0);

  const filters = [
    { key: "all", label: "All" },
    { key: "live", label: "Live", count: allGroups.find(g => g.key === "live")?.matches.length },
    { key: "scheduled", label: "Today", count: allGroups.find(g => g.key === "scheduled")?.matches.length },
    { key: "upcoming", label: "Upcoming", count: allGroups.find(g => g.key === "upcoming")?.matches.length },
    { key: "finished", label: "Finished", count: allGroups.find(g => g.key === "finished")?.matches.length },
  ];

  const filterButtons = filters.map(f => (
    <button key={f.key} onClick={() => setFilter(f.key)}
      className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${filter === f.key ? "bg-white text-black border-white font-bold" : "border-border-alt text-fg-dim hover:text-fg hover:border-white/20"}`}>
      {f.label}{f.count !== undefined ? ` (${f.count})` : ""}
    </button>
  ));

  if (groups.length === 0) {
    const emptyMsg: Record<string, string> = {
      live: "NO_LIVE_MATCHES",
      scheduled: "NO_MATCHES_SCHEDULED_TODAY",
      upcoming: "NO_UPCOMING_MATCHES",
      finished: "NO_FINISHED_MATCHES",
    };
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center">{filterButtons}</div>
        <div className="border border-border bg-card p-16 text-center font-mono text-xs text-fg-dim uppercase tracking-widest">[ {emptyMsg[filter] || "NO_MATCHES_FOUND"} ]</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 items-center">{filterButtons}</div>
      {groups.map(group => (
        <div key={group.key} className="space-y-4">
          <h3 className="text-xs font-mono font-semibold text-fg-dim uppercase tracking-widest flex items-center gap-2">
            {group.live && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
            {group.label}
            <span className="text-fg-faint text-[10px] font-mono">({group.matches.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.matches.length === 0 ? (
              <div className="md:col-span-2 border border-dashed border-border-alt bg-card/50 p-8 text-center font-mono text-xs text-fg-faint uppercase tracking-widest">[ NO_{group.key.toUpperCase()}_MATCHES ]</div>
            ) : group.matches.map((m, idx) => (
              <button key={m.idEvent || idx} onClick={() => openDetail("match", m.idEvent!, m.strEvent || `${m.strHomeTeam} vs ${m.strAwayTeam}`)} className="rounded-xl border border-border-alt bg-card p-6 flex flex-col relative overflow-hidden group shadow-2xl min-h-[220px] text-left w-full cursor-pointer">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono text-fg-faint">
                    <span>{m.strLeague || "Unknown"}</span>
                    <div className="flex items-center gap-2">{statusBadge(m.strStatus)}</div>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-center my-4">
                    <div onClick={(e) => { e.stopPropagation(); if (m.idHomeTeam) openDetail("team", m.idHomeTeam!, m.strHomeTeam!); }} className="flex flex-col items-center gap-1 w-28 cursor-pointer hover:opacity-80" role="button" tabIndex={0}>
                      {m.strHomeTeamBadge ? <Image src={m.strHomeTeamBadge!} alt={m.strHomeTeam!} width={36} height={26} className="object-cover border border-border-alt shadow" unoptimized /> : <div className="w-9 h-6 bg-input flex items-center justify-center text-[8px] font-mono text-fg-dim">FLAG</div>}
                      <span className="text-xs font-semibold text-fg truncate max-w-[100px] hover:text-red-400">{m.strHomeTeam!}</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-fg tabular-nums">{m.intHomeScore ?? "-"}<span className="text-fg-dim mx-1">-</span>{m.intAwayScore ?? "-"}</div>
                    <div onClick={(e) => { e.stopPropagation(); if (m.idAwayTeam) openDetail("team", m.idAwayTeam!, m.strAwayTeam!); }} className="flex flex-col items-center gap-1 w-28 cursor-pointer hover:opacity-80" role="button" tabIndex={0}>
                      {m.strAwayTeamBadge ? <Image src={m.strAwayTeamBadge!} alt={m.strAwayTeam!} width={36} height={26} className="object-cover border border-border-alt shadow" unoptimized /> : <div className="w-9 h-6 bg-input flex items-center justify-center text-[8px] font-mono text-fg-dim">FLAG</div>}
                      <span className="text-xs font-semibold text-fg truncate max-w-[100px] hover:text-red-400">{m.strAwayTeam!}</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center text-xs font-mono text-fg-dim">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />{m.strVenue || "TBD"}</span>
                    <span>{matchDateBD(m)} @ {m.strTimestamp ? formatMatchTimeBD(m.strTimestamp) : "TBD"}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FootballPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("matches");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [league, setLeague] = useState(LEAGUES[0]);
  const cacheRef = useRef<Record<string, { data: unknown[]; ts: number }>>({});
  const [teamCategory, setTeamCategory] = useState<"clubs" | "national">("clubs");

  const [detail, setDetail] = useState<{ type: DetailType; id: string; name: string } | null>(null);
  const [detailStack, setDetailStack] = useState<{ type: DetailType; id: string; name: string }[]>([]);
  const [detailData, setDetailData] = useState<DetailDataType | null>(null);
  const [detailExtra, setDetailExtra] = useState<DetailExtra>({ recent: [], upcoming: [], squad: [] });
  const [detailCache, setDetailCache] = useState<Record<string, { data: DetailDataType | null; extra: DetailExtra }>>({});

  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (!initialLoadRef.current) return;
    initialLoadRef.current = false;
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("match");
    const playerId = params.get("player");
    const teamId = params.get("team");
    if (matchId) { openDetail("match", matchId, ""); return; }
    if (playerId) { openDetail("player", playerId, ""); return; }
    if (teamId) { openDetail("team", teamId, ""); return; }
    const tabParam = params.get("tab") as Tab | null;
    if (tabParam && TABS.find(t => t.key === tabParam)) { setTab(tabParam); }
    const leagueParam = params.get("league");
    if (leagueParam) { const l = LEAGUES.find(le => le.id === leagueParam); if (l) setLeague(l); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (detail) {
      params.set(detail.type, detail.id);
    } else {
      params.set("tab", tab);
      if (tab === "standings") params.set("league", league.id);
    }
    const q = params.toString();
    router.replace(`/football${q ? "?" + q : ""}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, league, detail]);

  useEffect(() => {
    if (detail) return;
    let active = true;
    (async () => {
      setLoading(true);
      setData([]);

      const key = tab === "teams" ? `${tab}:${teamCategory}` : `${tab}:${league.id}:${league.season}`;
      const cached = cacheRef.current[key];
      const now = Date.now();

      if (tab === "leagues" && cacheRef.current["leagues"]) {
        if (active) { setData(cacheRef.current["leagues"].data); setLoading(false); }
        return;
      }
      if (tab === "players" && cacheRef.current["players"]) {
        if (active) { setData(cacheRef.current["players"].data); setLoading(false); }
        return;
      }
      if (cached && (tab !== "matches" || now - cached.ts < CACHE_TTL.matches)) {
        if (active) { setData(cached.data); setLoading(false); }
        return;
      }

      if (tab === "matches") {
        const dates = [0, 1, 2, 3].map(offset => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          return d.toISOString().split("T")[0];
        });
        const results = await Promise.all(
          dates.map(day => fetchDB<EventsResponse>("eventsday.php", { d: day, s: "Soccer" }))
        );
        const merged = results.flatMap(r => r?.events || []);
        const seen = new Set<string>();
        const deduped = merged.filter(m => {
          if (!m.idEvent || seen.has(m.idEvent)) return false;
          seen.add(m.idEvent);
          return true;
        });
        if (active) {
          setData(deduped);
          cacheRef.current[key] = { data: deduped, ts: Date.now() };
        }
      } else if (tab === "standings") {
        const r = await fetchDB<TableResponse>("lookuptable.php", { l: league.id, s: league.season });
        if (active) {
          const t = r?.table || [];
          setData(t);
          cacheRef.current[key] = { data: t, ts: Date.now() };
        }
      } else if (tab === "leagues") {
        const results = await Promise.all(LEAGUES.map(l => fetchDB<LeaguesResponse>("lookupleague.php", { id: l.id })));
        const full = results.filter(Boolean).map(r => r!.leagues?.[0]).filter(Boolean);
        if (active) {
          setData(full);
          cacheRef.current["leagues"] = { data: full, ts: Date.now() };
        }
      } else if (tab === "teams") {
        const names = teamCategory === "clubs" ? POPULAR_CLUBS : POPULAR_NATIONAL;
        const results = await Promise.all(
          names.map(name => fetchDB<TeamsResponse>("searchteams.php", { t: name.replace(/_/g, " ") }))
        );
        const all = results.filter(Boolean).map(r => r!.teams?.[0]).filter(Boolean);
        if (active) {
          setData(all);
          cacheRef.current[key] = { data: all, ts: Date.now() };
        }
      } else if (tab === "players") {
        const results = await Promise.all(
          POPULAR_PLAYERS.map(name => fetchDB<PlayersResponse>("searchplayers.php", { p: name.replace(/_/g, " ") }))
        );
        const all = results.filter(Boolean).map(r => r!.player?.[0]).filter(Boolean);
        if (active) {
          setData(all);
          cacheRef.current["players"] = { data: all, ts: Date.now() };
        }
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [tab, league, teamCategory, detail]);

  const doSearch = async (type: "teams" | "players") => {
    if (!searchQ.trim()) return;
    setLoading(true);
    setDetail(null);
    const ep = type === "teams" ? "searchteams.php" : "searchplayers.php";
    const p = type === "teams" ? "t" : "p";
    const r = await fetchDB<{ teams?: TeamData[]; player?: PlayerData[] }>(ep, { [p]: searchQ });
    setData(type === "players" ? (r?.player || []) : (r?.teams || []));
    setLoading(false);
  };

  const fetchDetail = async (type: DetailType, id: string, name: string) => {
    setDetail({ type, id, name });
    setLoading(true);
    setDetailData(null);
    setDetailExtra({ recent: [], upcoming: [], squad: [] });

    const ck = `${type}:${id}`;
    if (detailCache[ck]) {
      setDetailData(detailCache[ck].data);
      setDetailExtra(detailCache[ck].extra);
      setLoading(false);
      return;
    }

    if (type === "team") {
      const [info, last, next, players] = await Promise.all([
        fetchDB<TeamsResponse>("lookupteam.php", { id }),
        fetchDB<EventsLastResponse>("eventslast.php", { id }),
        fetchDB<EventsResponse>("eventsnext.php", { id }),
        fetchDB<PlayersResponse>("lookup_all_players.php", { id }),
      ]);
      const d = info?.teams?.[0] || null;
      const e = { recent: (last?.results || []).slice(0, 5), upcoming: (next?.events || []).slice(0, 5), squad: players?.player || [] };
      setDetailData(d); setDetailExtra(e);
      setDetailCache(prev => ({ ...prev, [ck]: { data: d, extra: e } }));
    } else if (type === "league") {
      const res = await fetchDB<TeamsResponse>("search_all_teams.php", { l: name.replace(/ /g, "_") });
      const d = { strLeague: name, strBadge: "", strCountry: "", strSport: "Soccer" };
      const e = { recent: [], upcoming: [], squad: res?.teams || [] };
      setDetailData(d); setDetailExtra(e);
      setDetailCache(prev => ({ ...prev, [ck]: { data: d, extra: e } }));
    } else if (type === "match") {
      const r = await fetchDB<EventsResponse>("lookupevent.php", { id });
      const d = r?.events?.[0] || null;
      setDetailData(d);
      setDetailCache(prev => ({ ...prev, [ck]: { data: d, extra: { recent: [], upcoming: [], squad: [] } } }));
    } else {
      const info = await fetchDB<PlayerLookupResponse>("lookupplayer.php", { id });
      const d = info?.players?.[0] || null;
      setDetailData(d);
      setDetailCache(prev => ({ ...prev, [ck]: { data: d, extra: { recent: [], upcoming: [], squad: [] } } }));
    }
    setLoading(false);
  };

  const openDetail = async (type: DetailType, id: string, name: string) => {
    if (detail) setDetailStack(prev => [...prev, detail]);
    await fetchDetail(type, id, name);
  };

  // --- Detail views ---
  if (detail) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <button onClick={() => {
          if (detailStack.length > 0) {
            const prev = detailStack[detailStack.length - 1];
            setDetailStack(s => s.slice(0, -1)); setDetail(prev);
            const ck = `${prev.type}:${prev.id}`;
            const cached = detailCache[ck];
            if (cached) { setDetailData(cached.data); setDetailExtra(cached.extra); }
          } else { setDetail(null); setDetailStack([]); }
        }} className="inline-flex items-center gap-2 text-xs font-mono text-fg-dim hover:text-fg transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
        : !detailData ? <div className="border border-border bg-card p-16 text-center font-mono text-xs text-fg-dim uppercase tracking-widest">[ NO_DETAILS_FOUND ]</div>
        : detail.type === "match" ? <MatchDetail />
        : detail.type === "league" ? <LeagueDetail />
        : detail.type === "team" ? <TeamDetail />
        : <PlayerDetail />}
      </div>
    );
  }

  function MatchDetail() {
    if (!detailData) return null;
    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-border-alt bg-card p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt text-[10px] font-mono uppercase tracking-widest">{statusBadge(detailData.strStatus)} {detailData.strLeague}</div>
            <div className="w-full max-w-[500px] flex items-center justify-center gap-6">
              <button onClick={() => detailData.idHomeTeam && openDetail("team", detailData.idHomeTeam!, detailData.strHomeTeam!)} className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 flex-1">
                {detailData.strHomeTeamBadge ? <Image src={detailData.strHomeTeamBadge!} alt={detailData.strHomeTeam!} width={64} height={44} className="object-cover border border-border-alt shadow" unoptimized /> : <div className="w-16 h-11 bg-input flex items-center justify-center text-xs font-mono text-fg-dim">FLAG</div>}
                <span className="text-base font-mono font-bold text-fg hover:text-red-400">{detailData.strHomeTeam!}</span>
              </button>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-mono font-bold text-fg tabular-nums">{detailData.intHomeScore ?? "-"}<span className="text-fg-dim mx-1">-</span>{detailData.intAwayScore ?? "-"}</span>
                <span className="text-[10px] font-mono text-fg-dim uppercase mt-1">{detailData.strStatus === "NS" ? "Upcoming" : "Score"}</span>
              </div>
              <button onClick={() => detailData.idAwayTeam && openDetail("team", detailData.idAwayTeam!, detailData.strAwayTeam!)} className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 flex-1">
                {detailData.strAwayTeamBadge ? <Image src={detailData.strAwayTeamBadge!} alt={detailData.strAwayTeam!} width={64} height={44} className="object-cover border border-border-alt shadow" unoptimized /> : <div className="w-16 h-11 bg-input flex items-center justify-center text-xs font-mono text-fg-dim">FLAG</div>}
                <span className="text-base font-mono font-bold text-fg hover:text-red-400">{detailData.strAwayTeam}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: "Venue", value: detailData.strVenue }, { label: "City", value: detailData.strCity }, { label: "Country", value: detailData.strCountry }, { label: "Date", value: detailData.strTimestamp ? matchDateBD(detailData) : detailData.dateEvent }, { label: "Time", value: detailData.strTimestamp ? formatMatchTimeBD(detailData.strTimestamp) : null }, { label: "Group", value: detailData.strGroup }, { label: "Round", value: detailData.intRound }, { label: "Season", value: detailData.strSeason }].filter(s => s.value).map((s, i) => (
            <div key={i} className="rounded-lg border border-border-alt bg-card p-3">
              <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest">{s.label}</p>
              <p className="text-sm font-mono text-fg font-semibold mt-0.5 truncate">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function LeagueDetail() {
    if (!detailData || !detail) return null;
    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-border-alt bg-card p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
          <div className="relative z-10"><h1 className="text-2xl sm:text-3xl font-mono font-bold text-fg uppercase tracking-widest">{detailData.strLeague || detail.name}</h1><p className="text-xs font-mono text-fg-dim mt-2">{detailExtra.squad.length} teams</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(detailExtra.squad as TeamData[]).map((t) => (
            <button key={t.idTeam} onClick={() => openDetail("team", t.idTeam!, t.strTeam!)} className="rounded-xl border border-border-alt bg-card p-4 flex items-center gap-4 relative overflow-hidden group shadow-2xl cursor-pointer hover:border-red-500/20 transition-colors text-left w-full">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
              {t.strBadge ? <Image src={t.strBadge} alt={t.strTeam!} width={40} height={40} className="object-contain shrink-0 relative z-10" unoptimized /> : <div className="w-10 h-10 bg-input flex items-center justify-center shrink-0 relative z-10"><Trophy className="w-4 h-4 text-fg-dim" /></div>}
              <div className="relative z-10"><span className="text-sm font-mono font-semibold text-fg">{t.strTeam}</span></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function TeamDetail() {
    if (!detailData) return null;
    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-border-alt bg-card p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
          {(detailData.strBanner || detailData.strFanart1) && <Image src={(detailData.strBanner || detailData.strFanart1)!} alt="" width={1200} height={300} className="absolute inset-0 w-full h-full object-cover opacity-10" unoptimized />}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {detailData.strBadge ? <Image src={detailData.strBadge!} alt={detailData.strTeam!} width={80} height={80} className="object-contain shrink-0" unoptimized /> : detailData.strLogo ? <Image src={detailData.strLogo!} alt={detailData.strTeam!} width={80} height={80} className="object-contain shrink-0" unoptimized /> : <div className="w-20 h-20 bg-input flex items-center justify-center shrink-0"><Trophy className="w-8 h-8 text-fg-dim" /></div>}
            <div>
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-fg uppercase tracking-widest">{detailData.strTeam}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs font-mono text-fg-dim">
                {detailData.strLeague && <span>{detailData.strLeague}</span>}
                {detailData.strCountry && <span>{detailData.strCountry}</span>}
                {detailData.intFormedYear && <span>Founded: {detailData.intFormedYear}</span>}
              </div>
              {detailData.strStadium && <p className="flex items-center gap-1.5 text-[10px] font-mono text-fg-faint mt-2"><MapPin className="w-3 h-3" /> {detailData.strStadium}{detailData.intStadiumCapacity ? ` (${Number(detailData.intStadiumCapacity).toLocaleString()})` : ""}</p>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border-alt bg-card p-6 relative overflow-hidden">
            <h3 className="text-xs font-mono font-semibold text-fg-dim uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Recent Matches</h3>
            {detailExtra.recent.length === 0 ? <p className="text-[10px] font-mono text-fg-faint">No recent matches</p> : <div className="space-y-3">{detailExtra.recent.map((m, i) => (
              <div key={m.idEvent || i} className="flex items-center justify-between py-2 border-b border-border-alt last:border-0 text-xs font-mono">
                <div className="flex-1 min-w-0">
                  <span className="text-fg truncate block">
                    <button onClick={() => m.idHomeTeam && openDetail("team", m.idHomeTeam!, m.strHomeTeam!)} className="hover:text-red-400 transition-colors cursor-pointer">{m.strHomeTeam}</button>
                    <span className="text-fg-dim"> vs </span>
                    <button onClick={() => m.idAwayTeam && openDetail("team", m.idAwayTeam!, m.strAwayTeam!)} className="hover:text-red-400 transition-colors cursor-pointer">{m.strAwayTeam}</button>
                  </span>
                  <span className="text-[10px] text-fg-faint">{m.strLeague} • {matchDateBD(m)}</span>
                </div>
                <span className="text-fg-dim font-bold tabular-nums ml-3">{m.intHomeScore ?? "?"} - {m.intAwayScore ?? "?"}</span>
              </div>
            ))}</div>}
          </div>
          <div className="rounded-xl border border-border-alt bg-card p-6 relative overflow-hidden">
            <h3 className="text-xs font-mono font-semibold text-fg-dim uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Upcoming</h3>
            {detailExtra.upcoming.length === 0 ? <p className="text-[10px] font-mono text-fg-faint">No upcoming matches</p> : <div className="space-y-3">{detailExtra.upcoming.map((m, i) => (
              <div key={m.idEvent || i} className="flex items-center justify-between py-2 border-b border-border-alt last:border-0 text-xs font-mono">
                <div className="flex-1 min-w-0">
                  <span className="text-fg truncate block">
                    <button onClick={() => m.idHomeTeam && openDetail("team", m.idHomeTeam!, m.strHomeTeam!)} className="hover:text-red-400 transition-colors cursor-pointer">{m.strHomeTeam}</button>
                    <span className="text-fg-dim"> vs </span>
                    <button onClick={() => m.idAwayTeam && openDetail("team", m.idAwayTeam!, m.strAwayTeam!)} className="hover:text-red-400 transition-colors cursor-pointer">{m.strAwayTeam}</button>
                  </span>
                  <span className="text-[10px] font-mono text-fg-faint">{m.strLeague} • {matchDateBD(m)} @ {m.strTimestamp ? formatMatchTimeBD(m.strTimestamp) : "TBD"}</span>
                </div>
              </div>
            ))}</div>}
          </div>
        </div>
        {detailExtra.squad.length > 0 && <SquadSection />}
      </div>
    );
  }

  function SquadSection() {
    const squad = detailExtra.squad as PlayerData[];
    const cat = (pos: string) => { const p = (pos || "").toLowerCase(); if (p.includes("goal")) return "gk"; if (p.includes("back") || p.includes("defend")) return "def"; if (p.includes("midfield") || p.includes("mid")) return "mid"; return "fwd"; };
    const groups: Record<string, PlayerData[]> = { gk: [], def: [], mid: [], fwd: [] };
    squad.forEach((p) => { groups[cat(p.strPosition || "")].push(p); });
    const labels: Record<string, string> = { gk: "GK", def: "DEF", mid: "MID", fwd: "FWD" };

    const PlayerDot = ({ p }: { p: PlayerData }) => (
      <button onClick={() => openDetail("player", p.idPlayer!, p.strPlayer!)} className="flex flex-col items-center gap-0.5 group/player cursor-pointer" title={`${p.strPlayer ?? ""} — ${p.strPosition || "—"}`}>
        {p.strCutout ? <Image src={p.strCutout!} alt={p.strPlayer!} width={40} height={40} className="rounded-full border-2 border-border-alt group-hover/player:border-red-500/50 object-cover transition-colors" unoptimized /> : p.strThumb ? <Image src={p.strThumb!} alt={p.strPlayer!} width={40} height={40} className="rounded-full border-2 border-border-alt group-hover/player:border-red-500/50 object-cover transition-colors" unoptimized /> : <div className="w-10 h-10 rounded-full border-2 border-border-alt bg-input flex items-center justify-center group-hover/player:border-red-500/50 transition-colors"><Users className="w-4 h-4 text-fg-dim" /></div>}
        <span className="text-[8px] font-mono text-fg font-semibold leading-tight text-center max-w-[60px] truncate">{p.strPlayer?.split(" ").pop()}</span>
      </button>
    );

    const Pitch = () => (
      <div className="relative w-full aspect-[3/4] max-w-[280px] md:max-w-[400px] mx-auto">
        <div className="absolute inset-0 rounded-lg border-[3px] border-border-alt bg-gradient-to-b from-emerald-900/40 to-emerald-950/30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#22c55e10_1px,transparent_1px),linear-gradient(to_bottom,#22c55e10_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-border-alt/50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] h-[28%] rounded-t-full border-t-2 border-x-2 border-border-alt/60" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[55%] h-[28%] rounded-b-full border-b-2 border-x-2 border-border-alt/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] rounded-full border-2 border-border-alt/60" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border-alt/50" />
          <div className="absolute top-0 left-[15%] right-[15%] h-[2px] bg-border-alt/60" />
          <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-border-alt/60" />
          <div className="absolute top-1/2 left-[25%] right-[25%] h-px bg-border-alt/30" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-between py-[10%] px-[8%]">
          <div className="flex justify-center gap-1 flex-wrap">{groups.fwd.slice(0, 3).map((p) => <PlayerDot key={p.idPlayer} p={p} />)}</div>
          <div className="flex justify-center gap-2 flex-wrap">{groups.mid.slice(0, 4).map((p) => <PlayerDot key={p.idPlayer} p={p} />)}</div>
          <div className="flex justify-center gap-2 flex-wrap">{groups.def.slice(0, 4).map((p) => <PlayerDot key={p.idPlayer} p={p} />)}</div>
          <div className="flex justify-center">{groups.gk.slice(0, 1).map((p) => <PlayerDot key={p.idPlayer} p={p} />)}</div>
        </div>
      </div>
    );

    const Roster = ({ mobile }: { mobile?: boolean }) => (
      <div className="space-y-4">
        {Object.entries(groups).map(([group, players]) => (
          <div key={group}>
            <span className="text-[9px] font-mono text-fg-faint uppercase tracking-widest block mb-2">{labels[group]}</span>
            <div className="space-y-1.5">{players.map((p: PlayerData) => (
              <button key={p.idPlayer} onClick={() => openDetail("player", p.idPlayer!, p.strPlayer!)} className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-hover transition-colors text-left group/row">
                <span className="text-[10px] font-mono font-bold text-fg-dim w-5 tabular-nums shrink-0">{p.strNumber || "—"}</span>
                {p.strCutout ? <Image src={p.strCutout!} alt={p.strPlayer!} width={24} height={24} className="rounded-full border border-border-alt shrink-0 object-cover" unoptimized /> : <div className="w-6 h-6 rounded-full bg-input flex items-center justify-center shrink-0"><Users className="w-3 h-3 text-fg-dim" /></div>}
                <span className="text-xs font-mono text-fg font-semibold truncate flex-1">{p.strPlayer}</span>
                {mobile ? <span className="text-[9px] font-mono text-fg-dim shrink-0">{p.strPosition || "—"}</span> : <span className="text-[9px] font-mono text-fg-dim hidden sm:inline shrink-0">{p.strPosition || "—"}</span>}
              </button>
            ))}</div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="rounded-xl border border-border-alt bg-card p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-mono font-semibold text-fg-dim uppercase tracking-widest flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Squad ({detailExtra.squad.length} players)</h3>
          <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest">Click any player to view profile</p>
        </div>
        <div className="md:hidden space-y-6"><Pitch /><Roster mobile /></div>
        <div className="hidden md:flex gap-6">
          <div className="w-1/2 shrink-0"><Pitch /></div>
          <div className="w-1/2 max-h-[500px] overflow-y-auto"><Roster /></div>
        </div>
      </div>
    );
  }

  function PlayerDetail() {
    if (!detailData) return null;
    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-border-alt bg-card p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
          {detailData.strBanner && <Image src={detailData.strBanner!} alt="" width={1200} height={300} className="absolute inset-0 w-full h-full object-cover opacity-10" unoptimized />}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {detailData.strRender ? <Image src={detailData.strRender!} alt={detailData.strPlayer!} width={100} height={100} className="object-contain shrink-0" unoptimized /> : detailData.strCutout ? <Image src={detailData.strCutout!} alt={detailData.strPlayer!} width={80} height={80} className="object-cover rounded-full border-2 border-border-alt shrink-0" unoptimized /> : detailData.strThumb ? <Image src={detailData.strThumb!} alt={detailData.strPlayer!} width={80} height={80} className="object-cover rounded-full border-2 border-border-alt shrink-0" unoptimized /> : <div className="w-20 h-20 rounded-full bg-input border-2 border-border-alt flex items-center justify-center shrink-0"><Users className="w-8 h-8 text-fg-dim" /></div>}
            <div>
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-fg uppercase tracking-widest">{detailData.strPlayer!}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs font-mono text-fg-dim">
                {detailData.strPosition && <span>{detailData.strPosition}</span>}
                {detailData.strNumber && <span>#{detailData.strNumber}</span>}
                {detailData.strTeam && <span>Club: {detailData.strTeam}</span>}
                {detailData.strTeam2 && <span>National: {detailData.strTeam2}</span>}
                {detailData.strNationality && <span>{detailData.strNationality}</span>}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-xs font-mono text-fg-faint">
                {detailData.dateBorn && <span>Born: {detailData.dateBorn}</span>}
                {detailData.strBirthLocation && <span>{detailData.strBirthLocation}</span>}
                {detailData.strHeight && <span>{detailData.strHeight}</span>}
                {detailData.strWeight && <span>{detailData.strWeight}</span>}
                {detailData.strSide && <span>Foot: {detailData.strSide}</span>}
              </div>
            </div>
          </div>
        </div>
        {detailData.strDescriptionEN && (
          <div className="rounded-xl border border-border-alt bg-card p-6 relative overflow-hidden">
            <h3 className="text-xs font-mono font-semibold text-fg-dim uppercase tracking-widest mb-3">Biography</h3>
            <p className="text-xs font-mono text-fg-dim leading-relaxed whitespace-pre-line line-clamp-6">{detailData.strDescriptionEN}</p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: "Position", value: detailData.strPosition }, { label: "Jersey", value: detailData.strNumber ? `#${detailData.strNumber}` : null }, { label: "Foot", value: detailData.strSide }, { label: "Height", value: detailData.strHeight }, { label: "Weight", value: detailData.strWeight }, { label: "Nationality", value: detailData.strNationality }, { label: "Born", value: detailData.dateBorn }, { label: "Birth Place", value: detailData.strBirthLocation }, { label: "Club", value: detailData.strTeam }, { label: "National Team", value: detailData.strTeam2 }, { label: "Status", value: detailData.strStatus }, { label: "Kit", value: detailData.strKit }].filter(s => s.value).map((s, i) => (
            <div key={i} className="rounded-lg border border-border-alt bg-card p-3">
              <p className="text-[9px] font-mono text-fg-faint uppercase tracking-widest">{s.label}</p>
              <p className="text-sm font-mono text-fg font-semibold mt-0.5 truncate">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Main listing view ---
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim"><Zap className="w-3 h-3 text-red-500" />Football Data</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">Football<span className="text-red-500">.</span> Hub</h1>
            <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">Get live matches, standings, leagues, teams and player profiles for football globally.</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"><ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge</Link>
        </div>
      </div>

      <div className="-mx-4 sm:mx-0 overflow-x-auto pb-1">
        <div className="inline-flex md:flex bg-card border border-border-alt p-1 font-mono text-xs min-w-max md:min-w-full ml-4 sm:ml-0 mr-4 sm:mr-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setData([]); setSearchQ(""); }}
              className={`px-3 sm:px-4 py-2 md:flex-1 text-center uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 cursor-pointer ${tab === t.key ? "bg-white text-black font-bold" : "text-fg-dim hover:text-fg"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === "standings" && (
        <div className="flex flex-wrap gap-2 items-center">
          {LEAGUES.map((l) => (
            <button key={l.id} onClick={() => setLeague(l)} className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${league.id === l.id ? "bg-white text-black border-white font-bold" : "border-border-alt text-fg-dim hover:text-fg hover:border-white/20"}`}>{l.name}</button>
          ))}
          <span className="text-[10px] font-mono text-fg-dim ml-2">Season: {league.season}</span>
        </div>
      )}
      {tab === "teams" && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setTeamCategory("clubs")} className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${teamCategory === "clubs" ? "bg-white text-black border-white font-bold" : "border-border-alt text-fg-dim hover:text-fg hover:border-white/20"}`}>Club Teams</button>
          <button onClick={() => setTeamCategory("national")} className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${teamCategory === "national" ? "bg-white text-black border-white font-bold" : "border-border-alt text-fg-dim hover:text-fg hover:border-white/20"}`}>National Teams</button>
          <div className="flex flex-1 items-center gap-2 border border-border-alt bg-card px-3 py-2 min-w-0">
            <Search className="w-4 h-4 text-fg-dim shrink-0" /><input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doSearch("teams"); }} placeholder="Or search any team..." className="bg-transparent text-xs text-fg font-mono placeholder:text-fg-faint outline-none w-full" />
          </div>
          <button onClick={() => doSearch("teams")} className="px-4 py-2 bg-white text-black font-mono text-xs uppercase tracking-widest font-bold cursor-pointer shrink-0">[ Search ]</button>
        </div>
      )}
      {tab === "players" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 border border-border-alt bg-card px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-fg-dim shrink-0" /><input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doSearch("players"); }} placeholder="Or search any player..." className="bg-transparent text-xs text-fg font-mono placeholder:text-fg-faint outline-none w-full" />
          </div>
          <button onClick={() => doSearch("players")} className="px-4 py-2 bg-white text-black font-mono text-xs uppercase tracking-widest font-bold cursor-pointer text-center shrink-0">[ Search ]</button>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
      : data.length === 0 ? <div className="border border-border bg-card p-16 text-center font-mono text-xs text-fg-dim uppercase tracking-widest">[ NO_DATA_FOUND ]</div>
      : tab === "standings" ? (
        <div className="rounded-xl border border-border-alt bg-card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-border-alt bg-white/[0.01] text-[10px] text-fg-faint uppercase tracking-widest">
                <th className="py-3 px-3 text-left w-10">#</th><th className="py-3 px-3 text-left">Team</th><th className="py-3 px-2 text-center w-10">P</th><th className="py-3 px-2 text-center w-10">W</th><th className="py-3 px-2 text-center w-10">D</th><th className="py-3 px-2 text-center w-10">L</th><th className="py-3 px-2 text-center hidden sm:table-cell w-10">GF</th><th className="py-3 px-2 text-center hidden sm:table-cell w-10">GA</th><th className="py-3 px-2 text-center w-10">GD</th><th className="py-3 px-3 text-center w-12 font-bold">Pts</th><th className="py-3 px-3 text-left hidden md:table-cell w-20">Form</th>
              </tr></thead>
              <tbody className="divide-y divide-border-alt">{data.map((t, i) => { const row = t as StandingData; return (
                <tr key={row.idStanding || i} className="hover:bg-hover transition-colors">
                  <td className="py-3 px-3 text-fg-dim font-bold">{row.intRank || i + 1}</td>
                  <td className="py-3 px-3"><div className="flex items-center gap-3">
                    {row.strBadge ? <Image src={row.strBadge!} alt={row.strTeam!} width={24} height={24} className="object-contain shrink-0" unoptimized /> : <div className="w-6 h-6 bg-input flex items-center justify-center"><Trophy className="w-3 h-3 text-fg-dim" /></div>}
                    <button onClick={() => row.idTeam && openDetail("team", row.idTeam!, row.strTeam ?? "")} className="text-fg font-semibold truncate max-w-[140px] sm:max-w-none hover:text-red-400 transition-colors cursor-pointer">{row.strTeam}</button>
                  </div></td>
                  <td className="py-3 px-2 text-center text-fg-dim tabular-nums">{row.intPlayed}</td><td className="py-3 px-2 text-center text-fg-dim tabular-nums">{row.intWin}</td><td className="py-3 px-2 text-center text-fg-dim tabular-nums">{row.intDraw}</td><td className="py-3 px-2 text-center text-fg-dim tabular-nums">{row.intLoss}</td>
                  <td className="py-3 px-2 text-center text-fg-dim tabular-nums hidden sm:table-cell">{row.intGoalsFor}</td><td className="py-3 px-2 text-center text-fg-dim tabular-nums hidden sm:table-cell">{row.intGoalsAgainst}</td><td className="py-3 px-2 text-center tabular-nums">{row.intGoalDifference}</td>
                  <td className="py-3 px-3 text-center font-bold text-fg tabular-nums">{row.intPoints}</td><td className="py-3 px-3 hidden md:table-cell">{formDots(row.strForm ?? "")}</td>
                </tr>
              ); })}</tbody>
            </table>
          </div>
        </div>
      )
      : tab === "matches" ? <GroupedMatches matches={data as MatchData[]} openDetail={openDetail} />
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item, idx) => {
            if (tab === "leagues") {
              const l = item as LeagueData;
              return (
              <button key={l.idLeague || idx} onClick={() => openDetail("league", l.idLeague!, l.strLeague!)} className="rounded-xl border border-border-alt bg-card p-6 flex items-center gap-4 relative overflow-hidden group shadow-2xl cursor-pointer hover:border-red-500/20 transition-colors text-left w-full">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                {l.strBadge ? <Image src={l.strBadge!} alt={l.strLeague!} width={48} height={48} className="object-contain shrink-0 relative z-10" unoptimized /> : <div className="w-12 h-12 bg-input flex items-center justify-center shrink-0 relative z-10"><Trophy className="w-5 h-5 text-fg-dim" /></div>}
                <div className="relative z-10 flex-1 min-w-0"><h3 className="text-sm font-mono font-semibold text-fg truncate">{l.strLeague}</h3><p className="text-[10px] font-mono text-fg-dim mt-1">{l.strSport || "Soccer"} • {l.strCountry || "International"}</p></div>
              </button>
            );}
            if (tab === "teams") {
              const t = item as TeamData;
              return (
              <button key={t.idTeam || idx} onClick={() => openDetail("team", t.idTeam!, t.strTeam!)} className="rounded-xl border border-border-alt bg-card p-6 flex items-center gap-4 relative overflow-hidden group shadow-2xl cursor-pointer hover:border-red-500/20 transition-colors text-left w-full">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                {(t.strBadge || t.strLogo) ? <Image src={(t.strBadge || t.strLogo)!} alt={t.strTeam!} width={48} height={48} className="object-contain shrink-0 relative z-10" unoptimized /> : <div className="w-12 h-12 bg-input flex items-center justify-center shrink-0 relative z-10"><Trophy className="w-5 h-5 text-fg-dim" /></div>}
                <div className="relative z-10 flex-1 min-w-0"><h3 className="text-sm font-mono font-semibold text-fg truncate">{t.strTeam}</h3><p className="text-[10px] font-mono text-fg-dim mt-1">{t.strLeague || "Unknown"} • {t.strCountry || "Unknown"}</p>{t.strStadium && <p className="text-[10px] font-mono text-fg-faint mt-0.5">Stadium: {t.strStadium}</p>}</div>
              </button>
            );}
            if (tab === "players") {
              const p = item as PlayerData;
              return (
              <button key={p.idPlayer || idx} onClick={() => openDetail("player", p.idPlayer!, p.strPlayer!)} className="rounded-xl border border-border-alt bg-card p-4 flex items-center gap-4 relative overflow-hidden group shadow-2xl cursor-pointer hover:border-red-500/20 transition-colors text-left w-full">
                {p.strCutout ? <Image src={p.strCutout!} alt={p.strPlayer!} width={44} height={44} className="object-cover rounded-full border border-border-alt shrink-0 relative z-10" unoptimized /> : p.strThumb ? <Image src={p.strThumb!} alt={p.strPlayer!} width={44} height={44} className="object-cover rounded-full border border-border-alt shrink-0 relative z-10" unoptimized /> : <div className="w-11 h-11 rounded-full bg-input flex items-center justify-center shrink-0 relative z-10"><Users className="w-5 h-5 text-fg-dim" /></div>}
                <div className="relative z-10 flex-1 min-w-0"><h3 className="text-sm font-mono font-semibold text-fg truncate">{p.strPlayer}</h3><p className="text-[10px] font-mono text-fg-dim mt-1">{p.strPosition || "Unknown"} • {p.strTeam || "N/A"}</p>{p.strNationality && <p className="text-[10px] font-mono text-fg-faint mt-0.5">{p.strNationality}</p>}</div>
              </button>
            );}
            return null;
          })}
        </div>
      )}
    </div>
  );
}
