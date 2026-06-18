export const runtime = "edge";

import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const workerUrl = (process.env.KHELADEKHO_API_URL || "").replace(/\/+$/, "");
  if (!workerUrl) return NextResponse.json({ error: "API URL not configured" }, { status: 500 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${workerUrl}/api/v1/channels/${encodeURIComponent(key)}/stream`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const body = await res.text();
    if (!res.ok) return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });

    let data;
    try { data = JSON.parse(body); } catch {
      return NextResponse.json({ error: "Invalid upstream response" }, { status: 502 });
    }

    const stream = data?.data;
    if (!stream?.url) return NextResponse.json({ error: "No stream URL" }, { status: 502 });

    return NextResponse.json({
      stream_url: stream.url,
      stream_type: stream.type || "hls",
      drm_kid: stream.clearkey?.kid || null,
      drm_key: stream.clearkey?.key || null,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
