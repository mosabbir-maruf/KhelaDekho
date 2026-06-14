import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Matches",
    description: "Browse live football matches, upcoming schedules, and finished standings. Filter by status and search teams or groups.",
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
