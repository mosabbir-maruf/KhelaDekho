import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function GET() {
    const repo = "Open-Dev-Society/kheladekho";
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "KhelaDekho-App",
    };

    if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
            headers,
            next: { revalidate: 300 }, // Revalidate every 5 minutes
        });

        if (!res.ok) {
            // If it failed with a token, try without a token (public rate limit applies)
            if (headers["Authorization"]) {
                const publicRes = await fetch(`https://api.github.com/repos/${repo}`, {
                    headers: {
                        Accept: "application/vnd.github+json",
                        "User-Agent": "KhelaDekho-App",
                    },
                    next: { revalidate: 300 },
                });
                if (!publicRes.ok) {
                    await publicRes.text().catch(() => {});
                    return NextResponse.json({ stars: 0 });
                }
                const data = await publicRes.json();
                return NextResponse.json({ stars: data.stargazers_count ?? 0 });
            }
            await res.text().catch(() => {});
            return NextResponse.json({ stars: 0 });
        }

        const data = await res.json();
        return NextResponse.json({ stars: data.stargazers_count ?? 0 });
    } catch (error) {
        logger.error("Error fetching stars:", error);
        return NextResponse.json({ stars: null });
    }
}
