import Link from "next/link";
import Tv from "lucide-react/dist/esm/icons/tv";

export function Footer() {
  return (
    <footer className="border-t border-border-alt bg-page relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3 font-mono text-sm tracking-widest text-fg uppercase">
              <Tv className="w-5 h-5 text-red-500" />
              [ KhelaDekho ]
            </div>
            <p className="text-sm text-fg-dim font-mono leading-relaxed max-w-sm">
              Aggregating, decrypting, and rendering live sports streaming feeds at the edge.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-fg-dim uppercase tracking-widest">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/channels" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  All Channels
                </Link>
              </li>
              <li>
                <Link href="/matches" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Matches Schedule
                </Link>
              </li>
              <li>
                <Link href="/matches?status=live" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Live Channels
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Search Finder
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-fg-dim uppercase tracking-widest">
              Info
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-4 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 24px))" }}>
          <div className="flex items-center gap-4 text-[10px] font-mono text-fg-faint uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="text-fg-dim">VERSION:</span> beta-1.0.1
            </span>
            <span className="inline-flex items-center gap-2 border-l border-border-alt pl-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-500/60">SYS_OPERATIONAL</span>
            </span>
          </div>
          <div className="text-[10px] font-mono text-fg-faint uppercase tracking-widest flex flex-wrap items-center justify-center sm:justify-end gap-3">
            <Link href="/docs/api" className="hover:text-fg transition-colors flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-red-500/50" />
              API Docs
            </Link>
            <span className="border-l border-border-alt h-3" />
            <span>© {new Date().getFullYear()} KhelaDekho</span>
            <span className="border-l border-border-alt h-3" />
            <span>A sideproject by Mosabbir Maruf</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
