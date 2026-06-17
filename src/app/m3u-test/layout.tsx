import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "M3U Test",
  description: "Test M3U playlist streams from various IPTV servers.",
};

export default function M3uTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
