export interface V3ChannelUrl {
  url: string;
  label: string;
}

export interface V3Channel {
  id: string;
  name: string;
  urls: V3ChannelUrl[];
  logo?: string;
  sourceLabel?: string;
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

function normalizeName(name: string): string {
  return name.replace(/\s*\((\d+p|HD|FHD|UHD|4K|HEVC)\)\s*$/i, "").trim();
}

function qualityLabel(name: string): string {
  const m = name.match(/\((\d+p|HD|FHD|UHD|4K|HEVC)\)\s*$/i);
  return m ? m[1].toUpperCase() : "HD";
}

export function parseM3u(text: string, sourceLabel: string): V3Channel[] {
  const textTrimmed = text.trim();
  if (textTrimmed.startsWith("[") || textTrimmed.startsWith('{"')) {
    try {
      const data = JSON.parse(textTrimmed);
      const arr = Array.isArray(data) ? data : data.channels || data.data || [];
      return arr.map((item: any, i: number) => ({
        id: `${sourceLabel}-${i}`,
        name: item.name || item.label || item.channel || `Channel ${i + 1}`,
        urls: [{ url: item.url || item.stream_url || item.file || "", label: "Auto" }].filter((u) => u.url),
        logo: item.logo || item.tvg_logo || item.image_url || item.icon || undefined,
        sourceLabel,
      })).filter((c: V3Channel) => c.urls.length > 0);
    } catch {}
  }

  const rawEntries: { name: string; url: string; logo?: string; qual: string }[] = [];
  let currentExtinf: string | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF:")) {
      currentExtinf = line;
    } else if (line && !line.startsWith("#") && currentExtinf) {
      const logoMatch = currentExtinf.match(/tvg-logo="([^"]*)"/);
      const fullName = currentExtinf.split(",").pop()?.trim() || "Unknown";
      rawEntries.push({
        name: fullName,
        url: line,
        logo: logoMatch?.[1] || undefined,
        qual: qualityLabel(fullName),
      });
      currentExtinf = null;
    }
  }

  const groups = new Map<string, { id: string; name: string; urls: V3ChannelUrl[]; logo?: string }>();
  let idx = 0;
  for (const e of rawEntries) {
    const base = normalizeName(e.name);
    const key = `${base}`;
    if (!groups.has(key)) {
      groups.set(key, { id: `${sourceLabel}-${idx++}`, name: base, urls: [], logo: e.logo });
    }
    const g = groups.get(key)!;
    g.urls.push({ url: e.url, label: e.qual });
    if (e.logo && !g.logo) g.logo = e.logo;
  }
  return Array.from(groups.values()).filter((g) => g.urls.length > 0).map((g) => ({ ...g, sourceLabel }));
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
    let arr = Array.isArray(data) ? data : data.channels || data.data || null;
    if (!arr && typeof data === "object" && data !== null) {
      arr = [];
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          arr.push(...data[key].map((item: any) => ({ ...item, _group: key })));
        }
      }
    }
    if (!Array.isArray(arr)) arr = [];
    return arr.map((item: any, i: number) => {
      const rawUrls = item.urls || (item.url ? [{ url: item.url, label: "Auto" }] : []) || item.sources?.map((s: any) => ({ url: s.url || s.file || "", label: s.label || "Auto" })) || [];
      return {
        id: `${source.label}-${i}`,
        name: item.name || item.label || item.channel || `Channel ${i + 1}`,
        urls: rawUrls.filter((u: any) => u.url).map((u: any) => ({ url: u.url, label: u.label || "Auto" })),
        logo: item.logo || item.tvg_logo || item.image_url || item.icon || undefined,
        sourceLabel: source.label,
      };
    }).filter((c: V3Channel) => c.urls.length > 0);
  }

  // github-txt — treat each line as a potential URL
  const urls = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  return urls.map((url, i) => ({
    id: `${source.label}-${i}`,
    name: url.split("/").pop() || `Stream ${i + 1}`,
    urls: [{ url, label: "Auto" }],
    sourceLabel: source.label,
  }));
}
