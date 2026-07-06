import type { Metadata } from "next";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Link from "next/link";
import { RequestAccessForm } from "@/components/ui/RequestAccessForm";

const title = "Request Access";
const description = "Request access to KhelaDekho's private API and repositories.";
const url = "https://kheladekho.pages.dev/docs/request";

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title: `${title} | KhelaDekho`,
        description,
        url,
        type: "article",
        images: [
            {
                url: "https://kheladekho.pages.dev/meta-graph.webp",
                width: 1200,
                height: 630,
                alt: "KhelaDekho — Live Sports Streaming Aggregator",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${title} | KhelaDekho`,
        description,
    },
    alternates: {
        canonical: url,
    },
};

export default function RequestAccessPage() {
    return (
        <div className="space-y-16 w-full">
            {/* Hero Banner */}
            <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12 mb-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                            <ShieldCheck className="w-3 h-3 text-red-500" />
                            AUTHORIZATION
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                            Request Access
                        </h1>
                        <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                            In order to interact with the API or view the backend repository, you must request production credentials.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all shrink-0"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
                    </Link>
                </div>
            </div>

            {/* Request Form */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-hover" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-fg-faint">
                        Production Credentials
                    </span>
                    <div className="h-px flex-1 bg-hover" />
                </div>
                <RequestAccessForm />
            </section>

            {/* Docs Pagination (Last Page) */}
            <div className="pt-8 mt-12 border-t border-border-alt flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link href="/docs/api" className="flex items-center gap-3 text-sm font-mono text-fg-dim hover:text-fg border border-border-alt bg-card hover:bg-hover px-4 py-3 rounded-lg transition-colors w-full sm:w-auto group">
                    <ArrowLeft className="w-4 h-4" />
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] text-fg-faint uppercase tracking-widest group-hover:text-fg-dim transition-colors">Back to Start</span>
                        <span>KhelaDekho API</span>
                    </div>
                </Link>

                <Link prefetch={false} href="/" className="flex items-center justify-end gap-3 text-sm font-mono text-fg border border-border-alt bg-hover hover:bg-hover-alt px-4 py-3 rounded-lg transition-colors w-full sm:w-auto ml-auto group">
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] text-fg-faint uppercase tracking-widest group-hover:text-fg-dim transition-colors">Finish</span>
                        <span>Go to Home</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-red-500" />
                </Link>
            </div>
        </div>
    );
}
