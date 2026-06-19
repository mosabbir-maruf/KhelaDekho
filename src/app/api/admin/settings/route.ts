export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { defaultVersion, secret } = body;

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['v1', 'v2', 'v3', 'v4'].includes(defaultVersion)) {
      return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
    }

    try {
      const processEnv = process.env as Record<string, unknown>;
      const KHELA_SETTINGS = processEnv.KHELA_SETTINGS as { get: (key: string, type?: string) => Promise<unknown>, put: (key: string, value: unknown) => Promise<void> } | undefined;
      if (KHELA_SETTINGS) {
        await KHELA_SETTINGS.put("defaultVersion", defaultVersion);
      }
    } catch (kvError) {
      console.error("Failed to update KV storage:", kvError);
      return NextResponse.json({ error: 'Failed to persist settings in KV Database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, defaultVersion });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


