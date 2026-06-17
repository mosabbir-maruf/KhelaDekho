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
        { success: false, error: `Upstream error: ${res.status} — ${body.slice(0, 200)}` },
        { status: res.status },
      );
    }

    let data;
    try { data = JSON.parse(body); } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON from upstream" }, { status: 502 });
    }

    if (data?.success && data.data?.url) {
      return NextResponse.json(data.data);
    }

    return NextResponse.json(
      { success: false, error: data?.error?.message || "Upstream returned no stream URL" },
      { status: 502 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
