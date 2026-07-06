export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { DEFAULT_STREAM_VERSION, isStreamVersion } from '@/lib/config';

// Public read: returns the admin-configured default streaming server so the
// (static) live-matches page can honor it client-side. No secret required.
export async function GET() {
  let defaultVersion: string = DEFAULT_STREAM_VERSION;
  try {
    const processEnv = process.env as Record<string, unknown>;
    const KHELA_SETTINGS = processEnv.KHELA_SETTINGS as { get: (key: string, type?: string) => Promise<unknown> } | undefined;
    if (KHELA_SETTINGS) {
      const saved = await KHELA_SETTINGS.get("defaultVersion");
      if (isStreamVersion(saved)) defaultVersion = saved;
    }
  } catch (error) {
    logger.error("Failed to read default version from KV:", error);
  }
  return NextResponse.json(
    { defaultVersion },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { defaultVersion, secret } = body;

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isStreamVersion(defaultVersion)) {
      return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
    }

    try {
      const processEnv = process.env as Record<string, unknown>;
      const KHELA_SETTINGS = processEnv.KHELA_SETTINGS as { get: (key: string, type?: string) => Promise<unknown>, put: (key: string, value: unknown) => Promise<void> } | undefined;
      if (KHELA_SETTINGS) {
        await KHELA_SETTINGS.put("defaultVersion", defaultVersion);
      }
    } catch (kvError) {
      logger.error("Failed to update KV storage:", kvError);
      return NextResponse.json({ error: 'Failed to persist settings in KV Database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, defaultVersion });
  } catch (error) {
    logger.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


