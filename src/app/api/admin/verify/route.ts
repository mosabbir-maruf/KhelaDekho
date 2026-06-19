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
      const processEnv = process.env as any;
      const KHELA_SETTINGS = processEnv.KHELA_SETTINGS;
      if (KHELA_SETTINGS) {
        const savedVersion = await KHELA_SETTINGS.get("defaultVersion");
        if (savedVersion && ["v1", "v2", "v3", "v4"].includes(savedVersion)) {
          defaultVersion = savedVersion;
        }
      }
    } catch (kvError) {
      console.error("Failed to read KV verification status:", kvError);
    }

    return NextResponse.json({ success: true, defaultVersion });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


