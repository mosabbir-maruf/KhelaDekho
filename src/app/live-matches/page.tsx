export const runtime = 'edge';

import LiveMatchesClient from './LiveMatchesClient';
import { logger } from '@/lib/logger';
import { DEFAULT_STREAM_VERSION, isStreamVersion, type StreamVersion } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let defaultVersion: StreamVersion = DEFAULT_STREAM_VERSION;

  try {
    // Cloudflare Edge binding lookup
    const processEnv = process.env as Record<string, unknown>;
    const KHELA_SETTINGS = processEnv.KHELA_SETTINGS as { get: (key: string, type?: string) => Promise<unknown> } | undefined;
    if (KHELA_SETTINGS) {
      const savedVersion = await KHELA_SETTINGS.get("defaultVersion");
      if (isStreamVersion(savedVersion)) {
        defaultVersion = savedVersion;
      }
    }
  } catch (error) {
    logger.error("Failed to read default version from KV:", error);
  }

  return <LiveMatchesClient initialVersion={defaultVersion} />;
}
