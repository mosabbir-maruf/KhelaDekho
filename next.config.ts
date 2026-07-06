import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: ["shaka-player", "hls.js"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  crossOrigin: "anonymous",
};

export default nextConfig;
