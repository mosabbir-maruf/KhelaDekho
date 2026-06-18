import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

import banglaLiveTv from "../../../../playlist/live-tv/json/bangla.json" with { type: "json" };
import fifaLiveMatches from "../../../../playlist/live-matches/json/fifa.json" with { type: "json" };
import sportsLiveMatches from "../../../../playlist/live-matches/json/sports.json" with { type: "json" };

const DATA: Record<string, unknown[]> = {
  "live-tv": (Array.isArray(banglaLiveTv) ? banglaLiveTv : (banglaLiveTv as Record<string, unknown>).channels || []) as unknown[],
  "live-matches": [
    ...(Array.isArray(fifaLiveMatches) ? fifaLiveMatches : []),
    ...(Array.isArray(sportsLiveMatches) ? sportsLiveMatches : []),
  ],
};

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") || "live-tv";
  const channels = DATA[source] || [];

  return NextResponse.json({ channels }, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
