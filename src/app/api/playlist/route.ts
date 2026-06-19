import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Statically bundled fallback data in case GitHub API fails, rate-limits, or token is missing.
import liveTvBanglaFallback from "@/../playlist/live-tv/json/bangla.json" with { type: "json" };
import liveMatchesFifaFallback from "@/../playlist/live-matches/json/fifa.json" with { type: "json" };
import liveMatchesSportsFallback from "@/../playlist/live-tv/json/sports.json" with { type: "json" };

const FALLBACK_DATA: Record<string, unknown[]> = {
  "live-tv": [
    ...(Array.isArray(liveTvBanglaFallback) ? liveTvBanglaFallback : []),
  ],
  "live-matches": [
    ...(Array.isArray(liveMatchesFifaFallback) ? liveMatchesFifaFallback : []),
    ...(Array.isArray(liveMatchesSportsFallback) ? liveMatchesSportsFallback : []),
  ],
};

// Utility to parse M3U8 string to JSON format
function parseM3u8(text: string): { name: string; url: string; group?: string }[] {
  const channels: { name: string; url: string; group?: string }[] = [];
  const lines = text.split(/\r?\n/);
  let currentName = "";
  let currentGroup = "";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      const groupMatch = line.match(/group-title="([^"]+)"/);
      if (groupMatch) {
        currentGroup = groupMatch[1];
      }

      const commaIndex = line.lastIndexOf(",");
      if (commaIndex !== -1) {
        currentName = line.substring(commaIndex + 1).trim();
      }
    } else if (line.startsWith("http://") || line.startsWith("https://")) {
      if (currentName) {
        channels.push({
          name: currentName,
          url: line,
          ...(currentGroup ? { group: currentGroup } : {}),
        });
      }
      currentName = "";
      currentGroup = "";
    }
  }
  return channels;
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") || "live-tv";

  if (source !== "live-tv" && source !== "live-matches") {
    return NextResponse.json({ channels: [] }, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const processEnv = process.env as any;
    const KHELA_SETTINGS = processEnv.KHELA_SETTINGS;

    if (!KHELA_SETTINGS) {
       console.error("KV Database not bound. Falling back.");
       return NextResponse.json({ channels: FALLBACK_DATA[source], fallback: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const sources = await KHELA_SETTINGS.get(`playlist_sources_${source}`, "json") || [];
    
    if (!Array.isArray(sources) || sources.length === 0) {
      // If KV is empty, return fallback data
      return NextResponse.json({ channels: FALLBACK_DATA[source], fallback: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // Fetch and parse all sources
    const channelsListArray = await Promise.all(
      sources.map(async (src: { id: string; type: 'url' | 'raw'; content: string }) => {
        try {
          if (src.type === 'url') {
            const res = await fetch(src.content, { next: { revalidate: 60 } });
            if (!res.ok) return [];
            
            // Check if JSON
            if (src.content.endsWith('.json') || res.headers.get('content-type')?.includes('json')) {
              const jsonContent = await res.json();
              return Array.isArray(jsonContent) ? jsonContent : [];
            }
            // Assume M3U8
            const textContent = await res.text();
            return parseM3u8(textContent);

          } else if (src.type === 'raw') {
            // Check if it's JSON array
            try {
              const json = JSON.parse(src.content);
              if (Array.isArray(json)) return json;
            } catch (e) {
              // Not json, assume M3U8
            }
            return parseM3u8(src.content);
          }
        } catch (err) {
          console.error(`Error parsing source ${src.id}:`, err);
        }
        return [];
      })
    );

    // Merge everything into a flat array
    const rawChannels = channelsListArray.flat();

    // Remove duplicates dynamically
    const seenUrls = new Set<string>();
    const uniqueChannels = [];

    for (const ch of rawChannels) {
      const url = ch.url || ch.stream_url;
      if (url) {
        const normalizedUrl = url.trim().toLowerCase();
        if (!seenUrls.has(normalizedUrl)) {
          seenUrls.add(normalizedUrl);
          uniqueChannels.push(ch);
        }
      } else {
        uniqueChannels.push(ch);
      }
    }

    const finalChannels = uniqueChannels.length > 0 ? uniqueChannels : FALLBACK_DATA[source];

    return NextResponse.json({ channels: finalChannels }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    console.error("Error fetching playlists dynamically from KV:", error);
    return NextResponse.json({ channels: FALLBACK_DATA[source], fallback: true }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
