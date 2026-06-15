export const runtime = "edge";

import { NextResponse, NextRequest } from "next/server";

const DEFAULT_WORKER_URL = "";

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
  if (!secretKey) {
    return NextResponse.json({ success: false, error: "Server secret configuration missing" }, { status: 500 });
  }

  const rawWorkerUrl = process.env.KHELADEKHO_API_URL || DEFAULT_WORKER_URL;
  const workerUrl = rawWorkerUrl.replace(/\/+$/, "");
  const path = `/api/v1/channels/${key}/stream`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}:${path}`;

  const signature = await signHMACSHA256(secretKey, message);

  try {
    const res = await fetch(`${workerUrl}${path}`, {
      headers: {
        "X-Signature-Token": signature,
        "X-Signature-Timestamp": timestamp,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { success: false, error: `Upstream error: ${res.status} - ${errorText}` },
        { status: res.status },
      );
    }

    const data = await res.json();

    if (data && data.success) {
      return NextResponse.json(data.data);
    }

    return NextResponse.json(
      { success: false, error: data?.error?.message || "Invalid response from upstream" },
      { status: 502 },
    );
  } catch (err: unknown) {
    console.error("Stream Proxy Route Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
