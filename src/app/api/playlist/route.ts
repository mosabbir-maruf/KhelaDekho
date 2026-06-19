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

const GITHUB_REPO = "mosabbir-maruf/KhelaDekho";

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

  const headers: Record<string, string> = {
    "User-Agent": "KhelaDekho-App",
    "Accept": "application/vnd.github.v3+json",
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers["Authorization"] = `token ${githubToken}`;
  }

  try {
    const listUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/KhelaDekho-Frontend/playlist/${source}`;
    // Cache for 60 seconds
    const fileListRes = await fetch(listUrl, { headers, next: { revalidate: 60 } });

    if (!fileListRes.ok) {
      throw new Error(`GitHub Directory API returned ${fileListRes.status}`);
    }

    const contents = await fileListRes.json();
    if (!Array.isArray(contents)) {
      throw new Error("Invalid response format from GitHub Content API");
    }

    // Identify target directories (json, m3u8)
    const subDirs = contents.filter(
      (item) => item.type === "dir" && (item.name === "json" || item.name === "m3u8")
    );

    // Fetch subdirectory contents concurrently
    const subDirsContents = await Promise.all(
      subDirs.map(async (dir) => {
        try {
          const res = await fetch(dir.url, { headers, next: { revalidate: 60 } });
          if (!res.ok) return [];
          const files = await res.json();
          return Array.isArray(files) ? files : [];
        } catch {
          return [];
        }
      })
    );

    // Flatten all files inside json/ and m3u8/
    const allFiles = subDirsContents.flat().filter((file) => file.type === "file");

    // Fetch and parse all file contents concurrently to avoid sequential loading slowness
    const channelsListArray = await Promise.all(
      allFiles.map(async (file) => {
        const rawUrl = file.download_url;
        if (!rawUrl) return [];

        try {
          const fileContentRes = await fetch(rawUrl, { next: { revalidate: 60 } });
          if (!fileContentRes.ok) return [];

          if (file.name.endsWith(".json")) {
            const jsonContent = await fileContentRes.json();
            return Array.isArray(jsonContent) ? jsonContent : [];
          } else if (file.name.endsWith(".m3u8") || file.name.endsWith(".m3u")) {
            const textContent = await fileContentRes.text();
            return parseM3u8(textContent);
          }
        } catch (err) {
          console.error(`Error parsing file ${file.name}:`, err);
        }
        return [];
      })
    );

    // Merge everything into a flat array
    const rawChannels = channelsListArray.flat();

    // Remove duplicates dynamically by streaming URL to ensure clean UI lists
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
    console.error("Error fetching playlists dynamically from GitHub:", error);
    return NextResponse.json({ channels: FALLBACK_DATA[source], fallback: true }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}


