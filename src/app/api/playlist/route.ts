import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Import all JSON playlist files below.
// To add a new JSON file: just add another import line here and merge into DATA.
import liveTvBangla from "@/../playlist/live-tv/json/bangla.json" with { type: "json" };
import liveMatchesFifa from "@/../playlist/live-matches/json/fifa.json" with { type: "json" };
import liveMatchesSports from "@/../playlist/live-matches/json/sports.json" with { type: "json" };

const DATA: Record<string, unknown[]> = {
  "live-tv": [
    ...(Array.isArray(liveTvBangla) ? liveTvBangla : []),
  ],
  "live-matches": [
    ...(Array.isArray(liveMatchesFifa) ? liveMatchesFifa : []),
    ...(Array.isArray(liveMatchesSports) ? liveMatchesSports : []),
  ],
};

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") || "live-tv";
  const channels = DATA[source] || [];

  return NextResponse.json({ channels }, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
