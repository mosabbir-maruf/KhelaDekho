import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret } = body;

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let defaultVersion = "v4";
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
      const data = await fs.readFile(filePath, 'utf8');
      const settings = JSON.parse(data);
      if (settings.defaultVersion) {
        defaultVersion = settings.defaultVersion;
      }
    } catch (e) {
      // Fallback to "v4" if settings.json does not exist yet
    }

    return NextResponse.json({ success: true, defaultVersion });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
