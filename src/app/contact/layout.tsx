import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact",
    description: "Get in touch with the KhelaDekho team. Send us a message or reach out via email for support, feedback, or inquiries.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}
