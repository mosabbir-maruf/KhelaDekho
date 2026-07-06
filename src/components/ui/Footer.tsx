import Link from "next/link";
import Tv from "lucide-react/dist/esm/icons/tv";

export function Footer() {
  return (
    <footer className="border-t border-border-alt bg-page relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 font-mono text-sm tracking-widest text-fg uppercase hover:text-red-400 transition-colors">
              <Tv className="w-5 h-5 text-red-500" />
              [ KhelaDekho ]
            </Link>
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
                <Link href="/live-matches" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Live Matches
                </Link>
              </li>
              <li>
                <Link href="/scores" className="text-sm font-mono text-fg-dim hover:text-fg transition-colors">
                  Match Scores
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

      {/* Disclaimer */}
      <div className="border-t border-border-alt/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-[10px] sm:text-[11px] font-mono text-fg-faint leading-relaxed text-center">
            KhelaDekho is an indexing platform that aggregates publicly available streaming links from third-party sources and organizes them for convenience, similar to how search engines index web content. We do not host, store, or transmit any copyrighted content. All streams are sourced from publicly accessible third-party providers. If you believe any content infringes your rights, please contact the respective source provider directly.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-4 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-3">
          <div className="flex items-center gap-4 text-[10px] font-mono text-fg-faint uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="text-fg-dim">VERSION:</span> beta-1.1.0
            </span>
            <span className="inline-flex items-center gap-2 border-l border-border-alt pl-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-500/60">SYS_OPERATIONAL</span>
            </span>
          </div>
          <div className="text-[10px] font-mono text-fg-faint uppercase tracking-widest flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <Link href="/docs/api" className="hover:text-fg transition-colors flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-500/50" />
                API Docs
              </Link>
              <span className="border-l border-border-alt h-3" />
              <span>© {new Date().getFullYear()} </span><Link href="/" className="hover:text-fg transition-colors">KhelaDekho</Link>
            </div>
            <span className="hidden sm:block border-l border-border-alt h-3" />
            <span className="mt-1 sm:mt-0 text-fg-dim">A sideproject by </span><Link href="https://github.com/mosabbir-maruf" target="_blank" rel="noopener noreferrer" className="text-fg-dim hover:text-fg transition-colors">Mosabbir Maruf</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
