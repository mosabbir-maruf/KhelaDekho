"use client";

import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Scale from "lucide-react/dist/esm/icons/scale";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Ban from "lucide-react/dist/esm/icons/ban";
import Link from "next/link";

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "Acceptance of Terms",
    content:
      "By accessing or using KhelaDekho, you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the platform. These terms apply to all visitors, users, and contributors.",
  },
  {
    id: "service",
    icon: Scale,
    title: "Service Description",
    content:
      "KhelaDekho is a streaming aggregation platform that indexes publicly available sports broadcast links. We do not host, store, or transmit any copyrighted content. All streams are sourced from third-party public endpoints and are provided for informational purposes only.",
  },
  {
    id: "responsibilities",
    icon: Ban,
    title: "User Responsibilities",
    content:
      "Users agree not to misuse the platform for any unlawful purpose. This includes but is not limited to unauthorized reproduction, distribution, or commercial exploitation of the aggregated content.",
  },
  {
    id: "warranties",
    icon: AlertTriangle,
    title: "Disclaimer of Warranties",
    content:
      'The platform is provided "as is" without any warranty. We make no guarantees regarding the availability, accuracy, or legality of third-party streams indexed on the platform.',
  },
  {
    id: "liability",
    icon: ShieldCheck,
    title: "Limitation of Liability",
    content:
      "KhelaDekho and its contributors shall not be liable for any damages arising from the use or inability to use the platform. Users access third-party content at their own risk.",
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "Changes to Terms",
    content:
      "We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 sm:space-y-16">
        {/* Header */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <FileText className="w-3 h-3 text-red-500" />
                Legal Document
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Terms<span className="text-red-500">.</span> Conditions
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-xl leading-relaxed">
                Please read these terms carefully before using the KhelaDekho platform.
                By using our service, you agree to be bound by these conditions.
              </p>
            </div>
            <Link prefetch={false}
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
            </Link>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="border border-border-alt bg-card p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-hover border border-border-alt flex items-center justify-center">
              <FileText className="w-4 h-4 text-fg-dim" />
            </div>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-fg">
              Table of Contents
            </h2>
          </div>
          <div className="space-y-1">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-3 px-4 py-3 text-xs font-mono text-fg-dim hover:text-fg hover:bg-hover transition-colors border border-transparent hover:border-border-alt"
              >
                <span className="w-7 h-7 rounded-md bg-red-500/10 border border-red-500/15 flex items-center justify-center text-[10px] font-bold text-red-400 shrink-0">
                  {i + 1}
                </span>
                <span>{s.title.replace(/^\d+\.\s*/, "")}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="border border-border-alt bg-card p-8 hover:border-border-alt transition-all group"
            >
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-hover border border-border-alt flex items-center justify-center shrink-0 group-hover:border-red-500/20 group-hover:bg-red-500/10 transition-all">
                  <section.icon className="w-5 h-5 text-fg-dim group-hover:text-red-400 transition-colors" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-mono font-semibold text-fg tracking-tight">
                    {section.title}
                  </h3>
                  <p className="text-xs font-mono text-fg-dim leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="border border-border-alt bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[10px] font-mono text-fg-dim">
            Last updated: June 2026
          </p>
          <p className="text-[10px] font-mono text-fg-faint">
            For questions,{" "}
            <a href="https://github.com/mosabbir-maruf/KhelaDekho/issues" target="_blank" rel="noopener noreferrer" className="text-fg-dim hover:text-fg transition-colors">
              open a GitHub issue
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
