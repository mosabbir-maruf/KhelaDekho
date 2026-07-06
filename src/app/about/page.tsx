import type { Metadata } from "next";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Users from "lucide-react/dist/esm/icons/users";
import Globe from "lucide-react/dist/esm/icons/globe";
import Shield from "lucide-react/dist/esm/icons/shield";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Layers from "lucide-react/dist/esm/icons/layers";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Radio from "lucide-react/dist/esm/icons/radio";
import Activity from "lucide-react/dist/esm/icons/activity";
import Link from "next/link";
import { getGoalScores } from "@/lib/api";

export const metadata: Metadata = {
    title: "About",
    description: "Learn about KhelaDekho — a real-time sports streaming aggregation platform with live scores, match details, and player profiles. Open source, private, and free.",
};

export default async function AboutPage() {
  const goalData = await getGoalScores();
  const goalMatches = goalData?.total_matches || 0;
  const liveMatches = (goalData?.competitions || []).reduce(
    (s, c) => s + c.matches.filter((m) => m.status === "LIVE").length,
    0
  );

  const stats = [];

  if (goalMatches > 0) {
    stats.push({ icon: Globe, label: "Matches Tracked", value: String(goalMatches), desc: "Indexed today" });
  }
  if (liveMatches > 0) {
    stats.push({ icon: BarChart3, label: "Live Scores", value: String(liveMatches), desc: "Real-time telemetry" });
  }

  stats.push({ icon: Radio, label: "Channels Served", value: "200+", desc: "Across 4 streaming servers" });
  stats.push({ icon: Activity, label: "Uptime SLA", value: "99.9%", desc: "Edge-deployed reliability" });

  const features = [
  {
    icon: Cpu,
    title: "Edge Infrastructure",
    desc: "Deployed on Cloudflare Workers at the edge for minimal latency to users worldwide.",
  },
  {
    icon: Shield,
    title: "Minimal & Private",
    desc: "No user accounts, no tracking cookies, no personal data collection. Just the content you want.",
  },
  {
    icon: Layers,
    title: "Live Scores & Match Details",
    desc: "Real-time global football scores, fixtures, results, lineups, match stats, and player profiles via edge telemetry.",
  },
  {
    icon: Globe,
    title: "Open Source",
    desc: "Built in public on GitHub. Community contributions, issues, and feature requests are welcome.",
  },
];

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 sm:space-y-16 lg:space-y-20">
        {/* Hero */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Cpu className="w-3 h-3 text-red-500" />
                Our Story
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                About<span className="text-red-500">.</span> Us
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                KhelaDekho is a real-time sports streaming aggregation platform and live score hub. We index publicly
                available broadcast links, aggregate live match data from global providers, and present everything in a clean,
                fast, searchable interface.
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-border-alt bg-card p-5 text-center hover:border-red-500/20 hover:bg-red-500/[0.02] transition-all group"
            >
              <stat.icon className="w-5 h-5 text-fg-faint group-hover:text-red-500/60 mx-auto mb-3 transition-colors" />
              <p className="text-lg font-mono font-bold text-fg">{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-2">
                {stat.label}
              </p>
              <p className="text-[9px] font-mono text-fg-faint mt-1">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-border-alt bg-card p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-mono font-bold text-fg tracking-tight">
              Our Mission
            </h2>
            <p className="text-xs font-mono text-fg-dim leading-relaxed">
              We believe live sports should be accessible to everyone, everywhere. KhelaDekho
              simplifies the discovery of matches, leagues, and tournaments by aggregating publicly
              available streams into one unified interface. We do not host, store, or produce any
              content — we only index what is already publicly available on the web.
            </p>
          </div>
          <div className="border border-border-alt bg-card p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-mono font-bold text-fg tracking-tight">
              Important Disclaimer
            </h2>
            <p className="text-xs font-mono text-fg-dim leading-relaxed">
              KhelaDekho is an independent open-source project. We are not affiliated with any sports
              league, broadcaster, or rights holder. All stream links are sourced from public
              third-party endpoints and are provided for informational purposes only. Users are
              responsible for ensuring they comply with applicable laws in their jurisdiction.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hover" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-fg-faint">
              Platform Features
            </span>
            <div className="h-px flex-1 bg-hover" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-border-alt bg-card p-6 flex gap-5 hover:border-red-500/10 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-hover border border-border-alt flex items-center justify-center shrink-0 group-hover:border-red-500/20 group-hover:bg-red-500/10 transition-all">
                  <f.icon className="w-4 h-4 text-fg-dim group-hover:text-red-400 transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-mono font-semibold text-fg">{f.title}</h3>
                  <p className="text-xs font-mono text-fg-dim leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
