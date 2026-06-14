import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search",
    description: "Search the KhelaDekho streaming index for active channels and scheduled matches. Find live sports streams instantly.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return children;
}
