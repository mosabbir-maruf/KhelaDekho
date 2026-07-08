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

// Supported V5 sport slugs and their display labels.
export const SPORTS = [
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
] as const;

export function getSportLabel(slug: string): string {
  return SPORTS.find(s => s.slug === slug)?.label || slug;
}

export const DEFAULT_SPORT = "football";
