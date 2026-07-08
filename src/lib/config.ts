// Single source of truth for shared frontend configuration.

// Streaming server versions offered on the live-matches page.
export const STREAM_VERSIONS = ["v2", "v3", "v4", "v5"] as const;
export type StreamVersion = (typeof STREAM_VERSIONS)[number];

export function isStreamVersion(value: unknown): value is StreamVersion {
  return typeof value === "string" && (STREAM_VERSIONS as readonly string[]).includes(value);
}

// Default streaming server when none is stored.
export const DEFAULT_STREAM_VERSION: StreamVersion = "v4";

// Production site URL (used for OG tags, sitemap, canonical links, etc.)
export const SITE_URL = "https://kheladekho.pages.dev";

export interface SportConfig {
  slug: string;
  label: string;
  urlSlug?: string;
}

// Supported V5 sport slugs and their display labels.
export const SPORTS: SportConfig[] = [
  { slug: "football", label: "Football" },
  { slug: "cricket", label: "Cricket" },
  { slug: "motorsports", label: "Motorsports" },
  { slug: "basketball", label: "Basketball" },
  { slug: "fight", label: "Fight" },
  { slug: "rugby", label: "Rugby" },
  { slug: "tennis", label: "Tennis" },
  { slug: "golf", label: "Golf" },
  { slug: "american-football", label: "American Football" },
  { slug: "afl", label: "AFL" },
  { slug: "volleyball", label: "Volleyball" },
  { slug: "24/7-streams", label: "24/7 Streams", urlSlug: "24-7-streams" },
];

export function getSportLabel(slug: string): string {
  return SPORTS.find(s => s.slug === slug)?.label || slug;
}

export function getSportUrl(slug: string): string {
  if (slug === "football") return "/live-matches";
  const sport = SPORTS.find(s => s.slug === slug);
  if (sport?.urlSlug) return `/${sport.urlSlug}`;
  return `/${slug}`;
}

export const DEFAULT_SPORT = "football";

// Sports excluded from navigation dropdowns (but still accessible via direct links).
export const NON_NAV_SPORT_SLUGS: ReadonlySet<string> = new Set(["24/7-streams"]);

export function isNonNavSport(slug: string): boolean {
  return NON_NAV_SPORT_SLUGS.has(slug);
}

// Sports shown in navigation dropdowns/menus.
export const NAV_SPORTS: readonly SportConfig[] = SPORTS.filter(s => !NON_NAV_SPORT_SLUGS.has(s.slug));

// Poster images for 24/7 entertainment channels (served from frontend /public).
export const POSTER_247_MAP: Record<string, string> = {
  "Rally TV": "/V5-24:7-Assets/rallytv.webp",
  "24/7 The Simpsons": "/V5-24:7-Assets/simpsons.webp",
  "24/7 SpongeBob Squarepants": "/V5-24:7-Assets/SpongeBob.webp",
  "24/7 Family Guy": "/V5-24:7-Assets/FamilyGuy.webp",
};
