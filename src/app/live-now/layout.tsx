import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Now",
  description: "Watch live matches with multiple stream sources aggregated from KickBD.",
};

export default function LiveNowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
