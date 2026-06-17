import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live TV",
  description: "Browse and watch live TV channels from the free m3u8 directory.",
};

export default function LiveTvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
