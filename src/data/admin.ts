export interface V3Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
}

export interface V3Source {
  label: string;
  type: "m3u8" | "github-json" | "github-txt";
  url: string;
  channels: V3Channel[];
  lastFetched: number;
}

export interface AdminConfig {
  enabled: { v1: boolean; v2: boolean; v3: boolean };
  sources: V3Source[];
}

const STORAGE_KEY = "khela_admin_config";

function defaultConfig(): AdminConfig {
  return { enabled: { v1: true, v2: true, v3: true }, sources: [] };
}

export function loadAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    return JSON.parse(raw);
  } catch {
    return defaultConfig();
  }
}

export function saveAdminConfig(config: AdminConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function getV3Channels(): V3Channel[] {
  const config = loadAdminConfig();
  if (!config.enabled.v3) return [];
  const seen = new Set<string>();
  const result: V3Channel[] = [];
  for (const source of config.sources) {
    for (const ch of source.channels) {
      if (!seen.has(ch.id)) {
        seen.add(ch.id);
        result.push(ch);
      }
    }
  }
  return result;
}

export function parseM3u(text: string, sourceLabel: string): V3Channel[] {
  const lines = text.split("\n");
  const entries: V3Channel[] = [];
  let currentName: string | null = null;
  let currentLogo: string | undefined;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF:")) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      currentLogo = logoMatch?.[1] || undefined;
      currentName = line.split(",").pop()?.trim() || "Unknown";
    } else if (line && !line.startsWith("#") && currentName) {
      entries.push({
        id: `${sourceLabel}-${entries.length}`,
        name: currentName,
        url: line,
        logo: currentLogo,
      });
      currentName = null;
      currentLogo = undefined;
    }
  }
  return entries;
}

export function isGithubUrl(url: string): boolean {
  return url.includes("github.com") || url.includes("raw.githubusercontent.com");
}

export function toRawGithubUrl(url: string): string {
  // Convert github.com/blob/* to raw.githubusercontent.com/*
  const blobMatch = url.match(/github\.com\/([^/]+\/[^/]+)\/blob\/(.+)/);
  if (blobMatch) return `https://raw.githubusercontent.com/${blobMatch[1]}/${blobMatch[2]}`;
  return url;
}

export async function fetchAndParseSource(source: V3Source): Promise<V3Channel[]> {
  const fetchUrl = toRawGithubUrl(source.url);
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  if (source.type === "m3u8") return parseM3u(text, source.label);

  if (source.type === "github-json") {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.channels || data.data || [];
    return arr.map((item: any, i: number) => ({
      id: `${source.label}-${i}`,
      name: item.name || item.label || `Channel ${i + 1}`,
      url: item.url || item.stream_url || item.file || "",
      logo: item.logo || item.tvg_logo || item.image_url || undefined,
    })).filter((c: V3Channel) => c.url);
  }

  // github-txt — treat each line as a potential URL
  const urls = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  return urls.map((url, i) => ({
    id: `${source.label}-${i}`,
    name: url.split("/").pop() || `Stream ${i + 1}`,
    url,
  }));
}
