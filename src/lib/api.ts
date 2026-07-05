interface TeamInfo {
  name: string;
  flag_url: string | null;
}

export interface Match {
  match_id: string;
  group: string;
  stage: string;
  team1: TeamInfo;
  team2: TeamInfo;
  start_time: string | null;
  end_time: string | null;
  status: "live" | "upcoming" | "finished";
  score1?: number;
  score2?: number;
}

export interface ChannelInfo {
  key: string;
  name: string;
  image_url: string | null;
  category: string;
  quality: string;
  status: string;
  sort_order: number;
  total_views: number;
  live_viewers: number;
  resolution: string;
  source_types: string[];
}

export interface StreamSource {
  index: number;
  url: string;
  type: string;
  is_primary: boolean;
  name?: string;
  platform?: string;
}

interface ClearKeyData {
  kid?: string;
  key?: string;
  keys?: Record<string, string>;
}

export interface StreamResponse {
  key: string;
  name: string;
  url: string;
  type: "dash" | "hls" | string;
  drm: string | null;
  clearkey: ClearKeyData | null;
  sources?: StreamSource[];
  expires_at: string | null;
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

const DEFAULT_API_URL = "";

// Helper to get base API URL from environment variables or default
const isDebugMode = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG === "true";

export function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getXKey(): string {
  if (typeof window !== "undefined") {
    const injected = (window as Window & { __KHELADEKHO_XKEY?: string }).__KHELADEKHO_XKEY;
    if (injected) return injected;
  }
  return process.env.XKEY || "";
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (isDebugMode) {
      const stored = localStorage.getItem("kheladekho_api_url");
      if (stored) return stored;
    }
    const injected = (window as Window & { __KHELADEKHO_API_URL?: string }).__KHELADEKHO_API_URL;
    if (injected) return injected;
    return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  }
  return process.env.KHELADEKHO_API_URL || DEFAULT_API_URL;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.append(key, String(value));
  }
  return query.toString();
}

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const rawBaseUrl = getApiBaseUrl();
    if (!rawBaseUrl) return null;
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const xkey = getXKey();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      ...options,
      headers: {
        Accept: "application/json",
        ...(xkey ? { "xkey": xkey } : {}),
        ...options.headers,
      },
      next: { revalidate: 10 },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.error(`API Fetch Error: Status ${res.status} for path ${path}`);
      await res.text().catch(() => {}); // Consume body to release socket
      return null;
    }
    const body: Envelope<T> = await res.json();
    return body.success ? body.data : null;
  } catch (err) {
    console.error(`Fetch exception for ${path}:`, err);
    return null;
  }
}

// Fetch all matches
export async function getMatches(params: {
  status?: string;
  group?: string;
  stage?: string;
  limit?: number;
  offset?: number;
} = {}, options?: RequestInit): Promise<{ matches: Match[]; total: number; cached_at: string } | null> {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  return fetchAPI<{ matches: Match[]; total: number; cached_at: string }>(
    `/api/v1/matches${query ? `?${query}` : ""}`,
    options
  );
}

// Fetch channels list
export async function getChannels(params: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
} = {}, options?: RequestInit): Promise<{ channels: ChannelInfo[]; total: number; cached_at: string } | null> {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  return fetchAPI<{ channels: ChannelInfo[]; total: number; cached_at: string }>(
    `/api/v1/channels${query ? `?${query}` : ""}`,
    options
  );
}

// Fetch live channels list
export async function getLiveChannels(options?: RequestInit): Promise<{ channels: ChannelInfo[]; total: number; cached_at: string } | null> {
  return fetchAPI<{ channels: ChannelInfo[]; total: number; cached_at: string }>("/api/v1/channels/live", options);
}

// V4: Proxybdix channel types
export interface V4Channel {
  id: string;
  name: string;
  logo: string | null;
  stream_url: string | null;
  stream_type: string;
  drm_kid: string | null;
  drm_key: string | null;
  is_alive: boolean;
  cached_at: string;
}


// Fetch v4 channels
export async function getV4Channels(params: {
  q?: string;
  alive?: boolean;
} = {}, options?: RequestInit): Promise<{ channels: V4Channel[]; total: number; cached_at: string } | null> {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  return fetchAPI<{ channels: V4Channel[]; total: number; cached_at: string }>(
    `/api/v4/channels${query ? `?${query}` : ""}`,
    options
  );
}



// --- Goal.com Scores (v5) ---

export interface GoalTeamInfo {
  id: string;
  name: string;
  code: string;
  short: string;
  image_url: string | null;
}

export interface GoalPeriod {
  type: string;
  minute: number;
  extra: number;
}

export interface GoalRound {
  name: string;
  display: boolean;
}

export interface GoalMatch {
  id: string;
  start_date: string;
  status: "LIVE" | "RESULT" | "FIXTURE" | "POSTPONED";
  score_team_a: number | null;
  score_team_b: number | null;
  agg_team_a: number | null;
  agg_team_b: number | null;
  penalty_team_a: number | null;
  penalty_team_b: number | null;
  team_a: GoalTeamInfo;
  team_b: GoalTeamInfo;
  round: GoalRound | null;
  period: GoalPeriod | null;
  red_cards_team_a: number;
  red_cards_team_b: number;
  venue: string | null;
  slug: string;
  last_updated_at: string | null;
}

export interface GoalCompetition {
  id: string;
  name: string;
  area: string;
  image_url: string | null;
  matches: GoalMatch[];
}

export interface GoalScoresData {
  competitions: GoalCompetition[];
  total_matches: number;
  cached_at: string;
}

export async function getGoalScores(params: {
  date?: string;
  competition?: string;
  status?: "live" | "result" | "fixture";
} = {}, options?: RequestInit): Promise<GoalScoresData | null> {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  return fetchAPI<GoalScoresData>(
    `/api/goal/scores${query ? `?${query}` : ""}`,
    options
  );
}

export async function getGoalLiveScores(date?: string, options?: RequestInit): Promise<GoalScoresData | null> {
  const q = date ? `?date=${date}` : "";
  return fetchAPI<GoalScoresData>(`/api/goal/scores/live${q}`, options);
}

export async function getGoalFixtures(date?: string, options?: RequestInit): Promise<GoalScoresData | null> {
  const q = date ? `?date=${date}` : "";
  return fetchAPI<GoalScoresData>(`/api/goal/scores/fixtures${q}`, options);
}

export async function getGoalResults(date?: string, options?: RequestInit): Promise<GoalScoresData | null> {
  const q = date ? `?date=${date}` : "";
  return fetchAPI<GoalScoresData>(`/api/goal/scores/results${q}`, options);
}

export async function getGoalCompetitions(date?: string, options?: RequestInit): Promise<{
  competitions: { id: string; name: string; area: string; image_url: string | null; match_count: number }[];
  total: number;
  cached_at: string;
} | null> {
  const q = date ? `?date=${date}` : "";
  return fetchAPI(`/api/goal/competitions${q}`, options);
}

// --- Match Detail ---

export interface GoalPlayerInfo {
  id: string;
  name: string;
  image_url: string | null;
}

export interface GoalMatchEvent {
  type: string;
  side: string | null;
  period: GoalPeriod | null;
  player: GoalPlayerInfo | null;
  scorer: GoalPlayerInfo | null;
  assist: GoalPlayerInfo | null;
  in_player: GoalPlayerInfo | null;
  out_player: GoalPlayerInfo | null;
  outcome: string | null;
  decision: string | null;
}

export interface GoalLineupPlayer {
  player: GoalPlayerInfo | null;
  position: string | null;
  shirt_number: number | null;
  score: number | null;
  is_substitute: boolean;
  formation_position: string | null;
}

export interface GoalTeamLineup {
  formation: string | null;
  starting_xi: GoalLineupPlayer[];
  substitutes: GoalLineupPlayer[];
}

export interface GoalLineups {
  team_a: GoalTeamLineup | null;
  team_b: GoalTeamLineup | null;
}

export interface GoalCommentaryItem {
  type: string;
  period: GoalPeriod | null;
  text: string;
  player: GoalPlayerInfo | null;
  side: string | null;
}

export interface GoalTopPlayer {
  player: GoalPlayerInfo;
  score: number;
  team_side: string;
}

export interface GoalH2HStats {
  team_a_goals: number;
  team_a_wins: number;
  team_b_goals: number;
  team_b_wins: number;
  draws: number;
  games_over_two_and_half: number;
  games_both_teams_scored: number;
}

export interface GoalMatchDetail {
  id: string;
  status: string;
  competition_name: string;
  competition_area: string;
  competition_image_url: string | null;
  start_date: string;
  venue: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  score_team_a: number | null;
  score_team_b: number | null;
  half_time_team_a: number | null;
  half_time_team_b: number | null;
  full_time_team_a: number | null;
  full_time_team_b: number | null;
  extra_time_team_a: number | null;
  extra_time_team_b: number | null;
  agg_team_a: number | null;
  agg_team_b: number | null;
  penalty_team_a: number | null;
  penalty_team_b: number | null;
  team_a: GoalTeamInfo;
  team_b: GoalTeamInfo;
  team_a_colors: string[] | null;
  team_b_colors: string[] | null;
  round: GoalRound | null;
  period: GoalPeriod | null;
  events: GoalMatchEvent[];
  lineups: GoalLineups | null;
  commentary: GoalCommentaryItem[];
  top_players: GoalTopPlayer[];
  h2h: GoalH2HStats | null;
  h2h_matches: GoalMatch[];
  stats: GoalMatchStats | null;
  scorers_team_a: GoalMatchEvent[];
  scorers_team_b: GoalMatchEvent[];
  red_cards_team_a: number;
  red_cards_team_b: number;
  last_updated_at: string | null;
}

export interface GoalStatItem {
  type: string;
  team_a: number;
  team_b: number;
}

export interface GoalMatchStats {
  summary: GoalStatItem[];
  attacking: GoalStatItem[];
  passing: GoalStatItem[];
  duels: GoalStatItem[];
  defence: GoalStatItem[];
  discipline: GoalStatItem[];
}

export interface GoalMatchDetailResponse {
  match: GoalMatchDetail;
  cached_at: string;
}

export async function getGoalMatchDetail(matchId: string, slug: string, options?: RequestInit): Promise<GoalMatchDetail | null> {
  return fetchAPI<GoalMatchDetailResponse>(
    `/api/goal/matches/${matchId}?slug=${slug}`,
    options
  ).then(r => r?.match ?? null);
}

// --- Player Detail ---

export interface GoalPlayerSeasonStats {
  competition_name: string;
  competition_image_url: string | null;
  season_name: string;
  team_image_url: string | null;
  appearances: number;
  starting_eleven: number;
  minutes_played: number;
  goals: number;
  minutes_per_goal: number | null;
  assists: number;
  own_goals: number;
  penalty_goals: number;
  penalties_missed: number;
  shots_on_target: number;
  shots_off_target: number;
  blocked_shots: number;
  goals_outside_box: number;
  hit_woodwork: number;
  freekick_goals: number;
  offsides: number;
  corners: number;
  crosses: number;
  successful_crosses: number;
  tackles: number;
  clearances: number;
  yellow_cards: number;
  red_cards: number;
  fouls_committed: number;
  fouls_suffered: number;
  goals_conceded: number;
  clean_sheets: number;
  saves: number;
  penalty_saves: number;
}

export interface GoalPlayerDetail {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  shirt_number: number | null;
  position: string | null;
  age: number | null;
  date_of_birth: string | null;
  nationality_name: string | null;
  nationality_image_url: string | null;
  image_url: string | null;
  current_team_name: string | null;
  current_team_id: string | null;
  current_team_image_url: string | null;
  stats: GoalPlayerSeasonStats[];
}

export interface GoalPlayerDetailResponse {
  player: GoalPlayerDetail;
  cached_at: string;
}

export async function getGoalPlayerDetail(playerId: string, playerName?: string, options?: RequestInit): Promise<GoalPlayerDetail | null> {
  const q = playerName ? `?player_name=${encodeURIComponent(playerName)}` : "";
  return fetchAPI<GoalPlayerDetailResponse>(
    `/api/goal/player/${playerId}${q}`,
    options
  ).then(r => r?.player ?? null);
}

// --- Team Detail ---

export interface GoalTeamDetail {
  id: string;
  name: string;
  long_name: string;
  short_name: string;
  image_url: string | null;
  recent_matches: GoalMatch[];
}

export interface GoalTeamDetailResponse {
  team: GoalTeamDetail;
  cached_at: string;
}

export async function getGoalTeamDetail(teamId: string, teamName?: string, options?: RequestInit): Promise<GoalTeamDetail | null> {
  const q = teamName ? `?team_name=${encodeURIComponent(teamName)}` : "";
  return fetchAPI<GoalTeamDetailResponse>(
    `/api/goal/team/${teamId}${q}`,
    options
  ).then(r => r?.team ?? null);
}


