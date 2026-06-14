import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "KhelaDekho — Live Sports Streaming Aggregator",
        short_name: "KhelaDekho",
        description:
            "Aggregating, decrypting, and rendering live sports streaming feeds at the edge.",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a0a",
        theme_color: "#0a0a0a",
        icons: [
            {
                src: "/logo.png",
                sizes: "192x192 512x512",
                type: "image/png",
            },
        ],
    };
}
