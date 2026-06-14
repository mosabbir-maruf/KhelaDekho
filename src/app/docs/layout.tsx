import { DocsLayoutClient } from "@/components/ui/DocsLayoutClient";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TechArticle",
                        headline: "KhelaDekho Documentation",
                        description:
                            "Technical documentation for KhelaDekho — live sports streaming aggregator.",
                        url: "https://kheladekho.pages.dev/docs",
                        author: {
                            "@type": "Person",
                            name: "Mosabbir Maruf",
                            url: "https://github.com/mosabbir-maruf",
                        },
                        publisher: {
                            "@type": "Person",
                            name: "Mosabbir Maruf",
                        },
                        about: {
                            "@type": "SoftwareApplication",
                            name: "KhelaDekho",
                            applicationCategory: "Entertainment",
                        },
                    }),
                }}
            />
            <DocsLayoutClient>{children}</DocsLayoutClient>
        </>
    );
}
