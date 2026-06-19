"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Github from "lucide-react/dist/esm/icons/github";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Tv from "lucide-react/dist/esm/icons/tv";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Activity from "lucide-react/dist/esm/icons/activity";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Shield from "lucide-react/dist/esm/icons/shield";
import Info from "lucide-react/dist/esm/icons/info";
import Mail from "lucide-react/dist/esm/icons/mail";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Key from "lucide-react/dist/esm/icons/key";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandSearch, useIsMac } from "@/components/ui/CommandSearch";
import { event } from "@/lib/analytics";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMac = useIsMac();
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [pathname]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-page/90 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          {/* Left Side: Brand Panel */}
          <div className="flex items-center h-full">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 transition-opacity hover:opacity-80 pr-6 border-r border-border h-full"
            >
              <Tv className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="font-mono font-semibold tracking-widest text-[13px] uppercase">
                [ KhelaDekho ]
              </span>
            </Link>

            {/* Nav Links (desktop only) */}
            <nav className="hidden md:flex items-center h-full ml-12">
              <Link
                href="/live-tv"
                className={`px-6 flex items-center h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/live-tv") ? "text-fg bg-hover" : "text-fg-dim hover:text-fg hover:bg-hover"
                  }`}
              >
                Live TV
              </Link>
              <Link
                href="/live-matches"
                className={`px-6 flex items-center h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/live-matches") ? "text-fg bg-hover" : "text-fg-dim hover:text-fg hover:bg-hover"
                  }`}
              >
                Live Matches
              </Link>
              <Link
                href="/football"
                className={`px-6 flex items-center h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/football") ? "text-fg bg-hover" : "text-fg-dim hover:text-fg hover:bg-hover"
                  }`}
              >
                Football
              </Link>
              <Link
                href="/about"
                className={`px-6 flex items-center h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/about") ? "text-fg bg-hover" : "text-fg-dim hover:text-fg hover:bg-hover"
                  }`}
              >
                About
              </Link>

              <Link
                href="/contact"
                className={`px-6 flex items-center h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/contact") ? "text-fg bg-hover" : "text-fg-dim hover:text-fg hover:bg-hover"
                  }`}
              >
                Contact
              </Link>
              <Link
                href="/docs/api"
                className={`px-6 flex items-center h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/docs/api") ? "text-fg bg-hover" : "text-fg-dim hover:text-fg hover:bg-hover"
                  }`}
              >
                Docs
              </Link>
            </nav>
          </div>

          {/* Right Side: Search & Social & Mobile Toggle */}
          <div className="flex items-center h-full">


            {/* Search Trigger (desktop only) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center h-full border-l border-border px-4 bg-transparent cursor-pointer group w-[280px] hover:bg-hover transition-colors"
            >
              <span className="text-red-500 font-mono text-xs mr-2">{`>`}</span>
              <span className="text-xs text-fg-dim font-mono flex-1 text-left group-hover:text-fg-dim transition-colors">
                Search anything...
              </span>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-hover px-1.5 font-mono text-[10px] font-medium text-fg-dim border border-border-alt">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-hover px-1.5 font-mono text-[10px] font-medium text-fg-dim border border-border-alt">
                  K
                </kbd>
              </div>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* GitHub */}
            <Link
              href="https://github.com/mosabbir-maruf/kheladekho"
              target="_blank"
              rel="noreferrer"
              onClick={() => event("external_link_click", { link_url: "https://github.com/mosabbir-maruf/kheladekho", link_text: "GitHub" })}
              className="flex items-center justify-center border-l border-border h-full px-4 hover:bg-hover transition-colors text-fg-dim hover:text-fg"
            >
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden flex items-center justify-center border-l border-border h-full px-4 hover:bg-hover transition-colors text-fg-dim hover:text-fg"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-40 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer */}
          <nav className="relative z-10 bg-page border-b border-border-alt overflow-y-auto max-h-[calc(100dvh-3.5rem)] shadow-2xl">
            <div className="p-6 space-y-6">
              {/* Main Nav */}
              <div className="space-y-1">
                <Link
                  href="/"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Activity className="w-4 h-4" />
                  Home
                </Link>
                <Link
                  href="/football"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/football") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                  Matches
                </Link>

                <Link
                  href="/privacy"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/privacy") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
                <Link
                  href="/about"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/about") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Info className="w-4 h-4" />
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/contact") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </Link>
                <Link
                  href="/docs/api"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/docs/api") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  Decryption API
                </Link>
                <Link
                  href="/docs/architecture"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/docs/architecture") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Activity className="w-4 h-4" />
                  Architecture
                </Link>
                <Link
                  href="/docs/installation"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/docs/installation") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  Installation Guide
                </Link>
                <Link
                  href="/docs/request"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/docs/request") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Key className="w-4 h-4 text-red-500" />
                  Request API / Repo
                </Link>
              </div>

              {/* Quick Categories */}
              <div className="border-t border-border-alt pt-4">
                <h4 className="text-[10px] font-semibold text-fg-dim uppercase tracking-widest mb-3 px-4">
                  Quick Links
                </h4>
                <div className="space-y-1">
                  <Link
                    href="/live-tv"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-hover transition-colors"
                  >
                    <Tv className="w-4 h-4 text-red-500" />
                    Live TV
                  </Link>
                  <Link
                    href="/live-matches"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-hover transition-colors"
                  >
                    <Tv className="w-4 h-4 text-red-500" />
                    Live Matches
                  </Link>
                  <Link
                    href="/football"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-hover transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-red-500 animate-pulse" />
                    Matches
                  </Link>
                  <Link
                    href="/live-matches"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-hover transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    FIFA World Cup
                  </Link>

                </div>
              </div>

              <div className="border-t border-border-alt pt-4 text-center">
                <p className="text-[10px] font-mono text-fg-faint uppercase tracking-widest">A sideproject by</p>
                <p className="text-xs font-mono text-fg-dim mt-0.5">Mosabbir Maruf</p>
              </div>

            </div>
          </nav>
        </div>
      )}

      {/* Command Search Modal */}
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
