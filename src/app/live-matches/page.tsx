export const runtime = 'edge';

import LiveMatchesClient from './LiveMatchesClient';
import { getFootballLiveMatches, FootballMatch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let defaultVersion = "v4";

  try {
    // Cloudflare Edge binding lookup
    const processEnv = process.env as Record<string, unknown>;
    const KHELA_SETTINGS = processEnv.KHELA_SETTINGS as { get: (key: string, type?: string) => Promise<unknown> } | undefined;
    if (KHELA_SETTINGS) {
      const savedVersion = await KHELA_SETTINGS.get("defaultVersion");
      if (typeof savedVersion === "string" && ["v1", "v2", "v3", "v4"].includes(savedVersion)) {
        defaultVersion = savedVersion;
      }
    }
  } catch (error) {
    console.error("Failed to read default version from KV:", error);
  }

  let liveMatches: FootballMatch[] = [];
  try {
    const sportsRes = await getFootballLiveMatches();
    if (sportsRes?.matches) {
      liveMatches = sportsRes.matches;
    }
  } catch (error) {
    console.error("Failed to fetch SportsDB live matches:", error);
  }

  return <LiveMatchesClient initialVersion={defaultVersion as "v1" | "v2" | "v3" | "v4"} initialLiveMatches={liveMatches} />;
}


