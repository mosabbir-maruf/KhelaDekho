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
