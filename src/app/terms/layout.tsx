import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms & Conditions",
    description: "Terms and conditions for using the KhelaDekho platform. Read about user responsibilities, disclaimers, and service description.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
