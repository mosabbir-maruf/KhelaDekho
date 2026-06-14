import type { Metadata } from "next";

const title = "Decryption & Scraper API";
const description = "Technical documentation for the KhelaDekho Scraper and stream decryption API endpoints, signature authentication, and client integrations.";
const url = "https://kheladekho.pages.dev/docs/api";

export const metadata: Metadata = {
    title,
    description,
    keywords: ["kheladekho api", "decryption api", "stream decryption", "sports scraper api", "signature authentication", "hmac-sha256", "fastapi endpoints", "cloudflare edge worker"],
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
