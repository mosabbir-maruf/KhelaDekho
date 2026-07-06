"use client";

import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Shield from "lucide-react/dist/esm/icons/shield";
import Lock from "lucide-react/dist/esm/icons/lock";
import Cookie from "lucide-react/dist/esm/icons/cookie";
import Globe from "lucide-react/dist/esm/icons/globe";
import Server from "lucide-react/dist/esm/icons/server";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import UserX from "lucide-react/dist/esm/icons/user-x";
import Link from "next/link";

const sections = [
  {
    id: "collection",
    icon: UserX,
    title: "1. Information We Collect",
    content:
      "KhelaDekho does not require user registration. We do not collect personal information such as names, email addresses, or payment details. Anonymous usage data may be collected through Google Analytics 4 to improve platform performance. This is an opt-in feature that is only active when a Google Analytics measurement ID is configured.",
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "2. Cookies & Local Storage",
    content:
      "We do not use tracking cookies. Local storage is used solely for saving user preferences such as streaming quality presets. Google Analytics uses its own cookies and tracking mechanisms when enabled. No data is shared with third-party advertisers.",
  },
  {
    id: "third-party",
    icon: Globe,
    title: "3. Third-Party Services",
    content:
      "The platform indexes streams from publicly available third-party endpoints. We are not responsible for the privacy practices of these external services. Users should review the privacy policies of any third-party sites accessed through our platform.",
  },
  {
    id: "security",
    icon: Lock,
    title: "4. Data Security",
    content:
      "We implement reasonable security measures to protect against unauthorized access to or alteration of information under our control. However, no method of transmission over the internet or method of electronic storage is 100% secure.",
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "5. Changes to This Policy",
    content:
      "We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Changes will be posted on this page with an updated revision date.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 sm:space-y-16">
        {/* Header */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Shield className="w-3 h-3 text-red-500" />
                Legal Document
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Privacy<span className="text-red-500">.</span> Policy
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-xl leading-relaxed">
                We take your privacy seriously. This policy explains what information we collect,
                how we use it, and your rights regarding your data.
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

        {/* Privacy Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-border-alt bg-card p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs font-mono text-fg font-semibold">No Registration</p>
            <p className="text-[10px] font-mono text-fg-dim mt-1">No accounts required</p>
          </div>
          <div className="border border-border-alt bg-card p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <Cookie className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs font-mono text-fg font-semibold">No Trackers</p>
            <p className="text-[10px] font-mono text-fg-dim mt-1">Zero tracking cookies</p>
          </div>
          <div className="border border-border-alt bg-card p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Server className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs font-mono text-fg font-semibold">Local Only</p>
            <p className="text-[10px] font-mono text-fg-dim mt-1">Preferences stored locally</p>
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
            Have questions?{" "}
            <Link href="/contact" className="text-fg-dim hover:text-fg transition-colors">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
