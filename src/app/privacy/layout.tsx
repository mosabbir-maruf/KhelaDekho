import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "KhelaDekho privacy policy — no registration required, no tracking cookies, and your preferences stay local.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
