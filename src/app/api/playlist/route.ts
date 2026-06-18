import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DIRS: Record<string, string> = {
  "live-tv": path.join(process.cwd(), "playlist", "live-tv", "json"),
  "live-matches": path.join(process.cwd(), "playlist", "live-matches", "json"),
};

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") || "live-tv";
  const jsonDir = DIRS[source];

  if (!jsonDir) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    if (!fs.existsSync(jsonDir)) {
      return NextResponse.json({ channels: [] }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const files = fs.readdirSync(jsonDir).filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      return NextResponse.json({ channels: [] }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const all: unknown[] = [];

    for (const file of files) {
      const filePath = path.join(jsonDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          all.push(...data);
        }
      } catch {
        // skip invalid JSON
      }
    }

    return NextResponse.json({ channels: all }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return NextResponse.json({ channels: [] }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
