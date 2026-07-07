import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

const baseUrl = SITE_URL;

const staticRoutes = [
    { url: baseUrl, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/live-matches`, changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${baseUrl}/search`, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${baseUrl}/docs/api`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/docs/architecture`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/docs/installation`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/docs/request`, changeFrequency: "monthly" as const, priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
    return staticRoutes.map((route) => ({
        ...route,
        lastModified: new Date(),
    }));
}
