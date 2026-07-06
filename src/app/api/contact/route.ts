import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "edge";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 3;
const MAX_NAME_LENGTH = 128;
const MAX_MESSAGE_LENGTH = 2048;

const rateMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return NextResponse.json(
      { error: "Server not configured." },
      { status: 500 }
    );
  }

  let body: { name?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { name, email, message } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Name must be under ${MAX_NAME_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json(
      { error: "Invalid email format." },
      { status: 400 }
    );
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }
  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const safeName = name.trim();
  const safeEmail = email.trim();
  const safeMessage = message.trim();
  const origin = request.headers.get("origin") || request.nextUrl.origin || "";

  const text = [
    `KhelaDekho`,
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
    `Message: ${safeMessage}`,
    `Website: ${origin}`,
  ].join("\n");

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
        }),
      }
    );

    if (!telegramRes.ok) {
      logger.error("Telegram send failed:", await telegramRes.text());
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Telegram error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
