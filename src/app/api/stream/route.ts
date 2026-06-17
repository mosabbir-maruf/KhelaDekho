export const runtime = "edge";

import { NextResponse, NextRequest } from "next/server";

export const runtime = "edge";

import { NextResponse, NextRequest } from "next/server";

async function signHMACSHA256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ success: false, error: "Missing key parameter" }, { status: 400 });
  }

  const secretKey = process.env.KHELADEKHO_SECRET_KEY;
  const rawWorkerUrl = process.env.KHELADEKHO_API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  const workerUrl = rawWorkerUrl.replace(/\/+$/, "");

  if (!workerUrl) {
    return NextResponse.json({ success: false, error: "API URL not configured — set KHELADEKHO_API_URL or NEXT_PUBLIC_API_URL" }, { status: 500 });
  }

  if (!secretKey) {
    return NextResponse.json({ success: false, error: "HMAC secret not configured — set KHELADEKHO_SECRET_KEY" }, { status: 500 });
  }

  const path = `/api/v1/channels/${key}/stream`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await signHMACSHA256(secretKey, `${timestamp}:${path}`);

  try {
    const res = await fetch(`${workerUrl}${path}`, {
      headers: {
        "X-Signature-Token": signature,
        "X-Signature-Timestamp": timestamp,
        Accept: "application/json",
      },
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
