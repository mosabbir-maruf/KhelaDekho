import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Football Hub",
    description: "Browse live matches, standings, top scorers, teams, and players from global football leagues.",
};

export default function FootballLayout({ children }: { children: React.ReactNode }) {
    return children;
}
