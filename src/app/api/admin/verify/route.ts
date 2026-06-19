export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret } = body;

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let defaultVersion = "v4";
    try {
      const processEnv = process.env as Record<string, unknown>;
      const KHELA_SETTINGS = processEnv.KHELA_SETTINGS as { get: (key: string, type?: string) => Promise<unknown>, put: (key: string, value: unknown) => Promise<void> } | undefined;
      if (KHELA_SETTINGS) {
        const savedVersion = await KHELA_SETTINGS.get("defaultVersion");
        if (typeof savedVersion === "string" && ["v1", "v2", "v3", "v4"].includes(savedVersion)) {
          defaultVersion = savedVersion;
        }
      }
    } catch (kvError) {
      console.error("Failed to read KV verification status:", kvError);
    }

    return NextResponse.json({ success: true, defaultVersion });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


