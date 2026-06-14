import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Channels",
    description: "Browse live TV channels and sports streams aggregated from public sources. Watch football, cricket, and more in HD.",
};

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
