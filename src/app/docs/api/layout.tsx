import type { Metadata } from "next";

const title = "KhelaDekho API";
const description = "Technical reference for the KhelaDekho API — live scores, match telemetry, channel proxying, and endpoints.";
const url = "https://kheladekho.pages.dev/docs/api";

export const metadata: Metadata = {
    title,
    description,
    keywords: ["kheladekho api", "live scores api", "football scores", "sports api", "xkey authentication", "fastapi endpoints", "cloudflare edge worker"],
    openGraph: {
        title: `${title} | KhelaDekho`,
        description,
        url,
        type: "article",
        images: [
            {
                url: "https://kheladekho.pages.dev/meta-graph.webp",
                width: 1200,
                height: 630,
                alt: "KhelaDekho — Live Sports Streaming Aggregator",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${title} | KhelaDekho`,
        description,
    },
    alternates: {
        canonical: url,
    },
};

export default function DecryptionApiLayout({ children }: { children: React.ReactNode }) {
    return children;
}
