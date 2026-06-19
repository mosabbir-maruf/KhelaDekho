export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret } = body;

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since we are running on Cloudflare Edge, local file reads (fs) are not supported.
    // We default to "v4".
    const defaultVersion = "v4";

    return NextResponse.json({ success: true, defaultVersion });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

