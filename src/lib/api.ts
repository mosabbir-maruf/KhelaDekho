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

interface PlatformStats {
  live_viewers: number;
  all_views: number;
  active_channels: number;
  total_channels: number;
  fetched_at: string;
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
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      next: { revalidate: 10 },
    });
    if (!res.ok) {
      console.error(`API Fetch Error: Status ${res.status} for path ${path}`);
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

// Fetch platform transmission stats
export async function getPlatformStats(options?: RequestInit): Promise<{ stats: PlatformStats; cached_at: string } | null> {
  return fetchAPI<{ stats: PlatformStats; cached_at: string }>("/api/v1/stats", options);
}


