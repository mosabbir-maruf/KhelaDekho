export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, action, payload } = body;

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const processEnv = process.env as any;
    const KHELA_SETTINGS = processEnv.KHELA_SETTINGS;

    if (!KHELA_SETTINGS) {
       return NextResponse.json({ error: 'KV Database not bound' }, { status: 500 });
    }

    if (action === 'get') {
      const liveTvSources = await KHELA_SETTINGS.get("playlist_sources_live-tv", "json") || [];
      const liveMatchesSources = await KHELA_SETTINGS.get("playlist_sources_live-matches", "json") || [];
      return NextResponse.json({ liveTvSources, liveMatchesSources });
    }

    if (action === 'update') {
      const { source, data } = payload;
      if (source !== 'live-tv' && source !== 'live-matches') {
        return NextResponse.json({ error: 'Invalid source type' }, { status: 400 });
      }
      await KHELA_SETTINGS.put(`playlist_sources_${source}`, JSON.stringify(data));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in admin playlists route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
