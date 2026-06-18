export const runtime = "edge";

import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ success: false, error: "Missing key parameter" }, { status: 400 });
  }

  const workerUrl = (process.env.KHELADEKHO_API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  if (!workerUrl) {
    return NextResponse.json({ success: false, error: "API URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${workerUrl}/api/v1/channels/${encodeURIComponent(key)}/stream`, {
      headers: { Accept: "application/json" },
    });

    const body = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { data: null, error: `Upstream error: ${res.status}` },
        { status: res.status },
      );
    }

    let parsed;
    try { parsed = JSON.parse(body); } catch {
      return NextResponse.json({ data: null, error: "Invalid upstream response" }, { status: 502 });
    }

    const stream = parsed?.data;
    if (!stream?.url) {
      return NextResponse.json({ data: null, error: "No stream URL" }, { status: 502 });
    }

    const clearkey = stream.clearkey;
    return NextResponse.json({
      data: {
        name: `Channel ${key}`,
        stream_url: stream.url,
        stream_type: stream.type || "hls",
        drm_kid: clearkey?.kid || null,
        drm_key: clearkey?.key || null,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
