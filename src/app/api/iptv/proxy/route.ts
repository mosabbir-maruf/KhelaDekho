import { NextRequest, NextResponse } from "next/server";

function resolve(relative: string, base: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
    };

    const range = request.headers.get("range");
    if (range) upstreamHeaders["Range"] = range;

    try {
      const parsed = new URL(targetUrl);
      upstreamHeaders["Referer"] = `${parsed.origin}/`;
      upstreamHeaders["Origin"] = parsed.origin;
    } catch {}

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let currentUrl = targetUrl;
    let response: Response | null = null;

    for (let i = 0; i < 5; i++) {
      const res = await fetch(currentUrl, {
        headers: upstreamHeaders,
        signal: controller.signal,
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) { response = res; break; }
        currentUrl = resolve(location, currentUrl);
        await res.text().catch(() => {});
        continue;
      }
      response = res;
      break;
    }

    clearTimeout(timeout);

    if (!response) {
      return NextResponse.json({ error: "Failed to fetch target" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "";
    const isM3U = contentType.includes("mpegurl") || contentType.includes("mpeg-url") ||
      /\.m3u8?$/i.test(targetUrl.split(/[?#]/)[0]);
    const isMPD = contentType.includes("dash+xml") || /\.mpd$/i.test(targetUrl.split(/[?#]/)[0]);

    if (isM3U) {
      const text = await response.text();
      const proxyBase = `${origin}/api/iptv/proxy`;

      const rewritten = text.split(/\r?\n/).map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith("#")) {
          return line.replace(
            /URI=(?:"([^"]+)"|'([^']+)'|([^,\s]+))/g,
            (_, qD, qS, unq) => {
              const uri = qD || qS || unq;
              if (!uri) return _;
              const resolved = resolve(uri, targetUrl);
              return `URI="${proxyBase}?url=${encodeURIComponent(resolved)}"`;
            }
          );
        }

        const resolved = resolve(trimmed, targetUrl);
        return `${proxyBase}?url=${encodeURIComponent(resolved)}`;
      }).join("\n");

      return new Response(rewritten, {
        status: 200,
        headers: {
          "Content-Type": contentType || "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Range",
          "Access-Control-Expose-Headers": "Content-Range, Content-Length",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    if (isMPD) {
      const text = await response.text();
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": contentType || "application/dash+xml",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Range",
          "Access-Control-Expose-Headers": "Content-Range, Content-Length",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const respHeaders: Record<string, string> = {
      "Content-Type": contentType || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Range",
      "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
    };

    const cl = response.headers.get("content-length");
    if (cl) respHeaders["Content-Length"] = cl;

    const cr = response.headers.get("content-range");
    if (cr) respHeaders["Content-Range"] = cr;

    const ar = response.headers.get("accept-ranges");
    if (ar) respHeaders["Accept-Ranges"] = ar;

    return new Response(response.body, {
      status: response.status,
      headers: respHeaders,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Upstream timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Range",
      "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
      "Access-Control-Max-Age": "86400",
    },
  });
}
