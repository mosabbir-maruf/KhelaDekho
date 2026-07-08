"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Github from "lucide-react/dist/esm/icons/github";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import Tv from "lucide-react/dist/esm/icons/tv";
import Activity from "lucide-react/dist/esm/icons/activity";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Shield from "lucide-react/dist/esm/icons/shield";
import Info from "lucide-react/dist/esm/icons/info";
import Mail from "lucide-react/dist/esm/icons/mail";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Key from "lucide-react/dist/esm/icons/key";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Dribbble from "lucide-react/dist/esm/icons/dribbble";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Clock from "lucide-react/dist/esm/icons/clock";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandSearch, useIsMac } from "@/components/ui/CommandSearch";
import { event } from "@/lib/analytics";
import { NAV_SPORTS, getSportUrl } from "@/lib/config";
import { useIsActive } from "@/lib/routing";

const getSportIcon = (slug: string) => {
  switch (slug) {
    case "football":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      );
    case "cricket":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="6" y1="18" x2="18" y2="6" />
          <circle cx="18" cy="6" r="3" />
          <path d="M6 18l-3 3" />
        </svg>
      );
    case "motorsports":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="8" rx="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M8 18h8" />
        </svg>
      );
    case "basketball":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M6.2 6.2c2.4 2.4 2.4 6.4 0 8.8M17.8 6.2c-2.4 2.4-2.4 6.4 0 8.8" />
          <path d="M2 12h20M12 2v20" />
        </svg>
      );
    case "fight":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "rugby":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
          <path d="M12 2v20M2 12h20" />
        </svg>
      );
    case "tennis":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12a14.5 14.5 0 0 0 20 0" />
        </svg>
      );
    case "golf":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="3" />
          <path d="M12 11v8M10 19h4" />
        </svg>
      );
    case "american-football":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.5 2 2 7.5 2 12s4.5 10 10 10 10-7.5 10-10S17.5 2 12 2z" />
          <path d="M7 12h10M9 9l6 6M15 9l-6 6" />
        </svg>
      );
    case "afl":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
        </svg>
      );
    case "volleyball":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20" />
          <path d="M2 12a10 10 0 0 1 20 0" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
};

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSportsOpen, setIsSportsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
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

  const isActive = useIsActive();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-page/90 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">

          {/* Left Side: Logo & Nav Links */}
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
            <nav className="hidden md:flex items-center h-full">
              <Link
                href="/scores"
                className={`px-3 lg:px-4 flex items-center gap-1.5 h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/scores") ? "text-fg bg-hover" : "text-fg-muted hover:text-fg hover:bg-hover"
                  }`}
              >
                <Trophy className={`w-3.5 h-3.5 transition-colors ${isActive("/scores") ? "text-amber-500" : "text-fg-muted/70"}`} />
                Scores
              </Link>
              <div
                className="relative h-full"
                onMouseEnter={() => setIsSportsOpen(true)}
                onMouseLeave={() => setIsSportsOpen(false)}
              >
                <button
                  onClick={() => setIsSportsOpen(p => !p)}
                  className={`px-3 lg:px-4 flex items-center gap-1.5 h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors cursor-pointer ${isSportsOpen ? "text-fg bg-hover" : "text-fg-muted hover:text-fg hover:bg-hover"}`}
                >
                  <Dribbble className={`w-3.5 h-3.5 transition-colors ${isSportsOpen ? "text-blue-500" : "text-fg-muted/70"}`} />
                  Sports
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSportsOpen ? "rotate-180" : ""}`} />
                </button>
                {isSportsOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-50"
                  >
                    <div className="border border-border-alt bg-card shadow-2xl p-3 rounded-xl min-w-[340px]">
                      <div className="grid grid-cols-2 gap-1">
                        {NAV_SPORTS.map(({ slug, label }) => {
                          const sportUrl = getSportUrl(slug);
                          const isSportActive = pathname === sportUrl || (slug === "cricket" && pathname === "/cricket");
                          return (
                            <Link
                              key={slug}
                              href={sportUrl}
                              prefetch={false}
                              onClick={() => setIsSportsOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-all duration-200 ${
                                isSportActive
                                  ? "text-red-500 bg-red-500/10 font-bold"
                                  : "text-fg-muted hover:text-fg hover:bg-hover/80"
                              }`}
                            >
                              <span className={`transition-colors duration-200 ${isSportActive ? "text-red-500" : "text-fg-muted/70"}`}>
                                {getSportIcon(slug)}
                              </span>
                              <span>{label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/live-matches"
                className={`px-3 lg:px-4 flex items-center gap-1.5 h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/live-matches") ? "text-fg bg-hover" : "text-fg-muted hover:text-fg hover:bg-hover"
                  }`}
              >
                <Activity className={`w-3.5 h-3.5 transition-colors ${isActive("/live-matches") ? "text-red-500 animate-pulse" : "text-fg-muted/70"}`} />
                Live Matches
              </Link>
              <Link
                href="/live-tv"
                className={`px-3 lg:px-4 flex items-center gap-1.5 h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/live-tv") ? "text-fg bg-hover" : "text-fg-muted hover:text-fg hover:bg-hover"
                  }`}
              >
                <Tv className={`w-3.5 h-3.5 transition-colors ${isActive("/live-tv") ? "text-red-500" : "text-fg-muted/70"}`} />
                Live TV
              </Link>
              <Link
                href="/24-7-streams"
                className={`px-3 lg:px-4 flex items-center gap-1.5 h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors ${isActive("/24-7-streams") ? "text-fg bg-hover" : "text-fg-muted hover:text-fg hover:bg-hover"
                  }`}
              >
                <Clock className={`w-3.5 h-3.5 transition-colors ${isActive("/24-7-streams") ? "text-red-500" : "text-fg-muted/70"}`} />
                24/7 Streams
              </Link>
              <div
                className="relative h-full"
                onMouseEnter={() => setIsMoreOpen(true)}
                onMouseLeave={() => setIsMoreOpen(false)}
              >
                <button
                  onClick={() => setIsMoreOpen(p => !p)}
                  className={`px-3 lg:px-4 flex items-center gap-1.5 h-full border-r border-border text-[11px] font-mono uppercase tracking-widest transition-colors cursor-pointer ${isMoreOpen ? "text-fg bg-hover" : "text-fg-muted hover:text-fg hover:bg-hover"}`}
                >
                  <Info className={`w-3.5 h-3.5 transition-colors ${isMoreOpen ? "text-blue-500" : "text-fg-muted/70"}`} />
                  Support & Legal
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`} />
                </button>
                {isMoreOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-50"
                  >
                    <div className="border border-border-alt bg-card shadow-2xl p-3 rounded-xl min-w-[460px] md:min-w-[520px]">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/docs/api"
                          prefetch={false}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                            isActive("/docs/api")
                              ? "bg-emerald-500/10"
                              : "hover:bg-hover/80"
                          }`}
                        >
                          <span className={`mt-0.5 transition-colors duration-200 ${isActive("/docs/api") ? "text-emerald-500" : "text-fg-dim/60"}`}>
                            <Terminal className="w-4 h-4" />
                          </span>
                          <div className="flex flex-col text-left">
                            <span className={`text-[11px] font-mono uppercase tracking-wider ${isActive("/docs/api") ? "text-emerald-500 font-bold" : "text-fg"}`}>Docs</span>
                            <span className="text-[10px] text-fg-dim font-sans mt-0.5 normal-case tracking-normal leading-normal">API documentation and guides</span>
                          </div>
                        </Link>
                        <Link
                          href="/about"
                          prefetch={false}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                            isActive("/about")
                              ? "bg-blue-500/10"
                              : "hover:bg-hover/80"
                          }`}
                        >
                          <span className={`mt-0.5 transition-colors duration-200 ${isActive("/about") ? "text-blue-500" : "text-fg-dim/60"}`}>
                            <Info className="w-4 h-4" />
                          </span>
                          <div className="flex flex-col text-left">
                            <span className={`text-[11px] font-mono uppercase tracking-wider ${isActive("/about") ? "text-blue-500 font-bold" : "text-fg"}`}>About</span>
                            <span className="text-[10px] text-fg-dim font-sans mt-0.5 normal-case tracking-normal leading-normal">Learn more about KhelaDekho</span>
                          </div>
                        </Link>
                        <Link
                          href="/terms"
                          prefetch={false}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                            isActive("/terms")
                              ? "bg-amber-500/10"
                              : "hover:bg-hover/80"
                          }`}
                        >
                          <span className={`mt-0.5 transition-colors duration-200 ${isActive("/terms") ? "text-amber-500" : "text-fg-dim/60"}`}>
                            <FileText className="w-4 h-4" />
                          </span>
                          <div className="flex flex-col text-left">
                            <span className={`text-[11px] font-mono uppercase tracking-wider ${isActive("/terms") ? "text-amber-500 font-bold" : "text-fg"}`}>Terms & Conditions</span>
                            <span className="text-[10px] text-fg-dim font-sans mt-0.5 normal-case tracking-normal leading-normal">Rules, policies, and guidelines</span>
                          </div>
                        </Link>
                        <Link
                          href="/privacy"
                          prefetch={false}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                            isActive("/privacy")
                              ? "bg-emerald-500/10"
                              : "hover:bg-hover/80"
                          }`}
                        >
                          <span className={`mt-0.5 transition-colors duration-200 ${isActive("/privacy") ? "text-emerald-500" : "text-fg-dim/60"}`}>
                            <Shield className="w-4 h-4" />
                          </span>
                          <div className="flex flex-col text-left">
                            <span className={`text-[11px] font-mono uppercase tracking-wider ${isActive("/privacy") ? "text-emerald-500 font-bold" : "text-fg"}`}>Privacy Policy</span>
                            <span className="text-[10px] text-fg-dim font-sans mt-0.5 normal-case tracking-normal leading-normal">How your data is protected</span>
                          </div>
                        </Link>
                        <Link
                          href="/contact"
                          prefetch={false}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                            isActive("/contact")
                              ? "bg-purple-500/10"
                              : "hover:bg-hover/80"
                          }`}
                        >
                          <span className={`mt-0.5 transition-colors duration-200 ${isActive("/contact") ? "text-purple-500" : "text-fg-dim/60"}`}>
                            <Mail className="w-4 h-4" />
                          </span>
                          <div className="flex flex-col text-left">
                            <span className={`text-[11px] font-mono uppercase tracking-wider ${isActive("/contact") ? "text-purple-500 font-bold" : "text-fg"}`}>Contact</span>
                            <span className="text-[10px] text-fg-dim font-sans mt-0.5 normal-case tracking-normal leading-normal">Get in touch with our team</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Side: Search, Theme, GitHub, Mobile Toggle */}
          <div className="flex items-center h-full flex-1 justify-end">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center h-full border-l border-border px-4 bg-transparent cursor-pointer group flex-1 max-w-[300px] hover:bg-hover transition-colors"
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

            {/* Theme Toggle & GitHub Wrapper (Shifted slightly rightward) */}
            <div className="flex items-center h-full lg:-mr-4 sm:-mr-2">
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
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden flex items-center justify-center border-l border-border h-full px-4 -mr-4 sm:-mr-6 hover:bg-hover transition-colors text-fg-dim hover:text-fg"
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
                  <Activity className="w-4 h-4 text-red-500" />
                  Home
                </Link>
                <Link
                  href="/scores"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors ${isActive("/scores") ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"
                    }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Scores
                </Link>
              </div>

              {/* Sports */}
              <div className="border-t border-border-alt pt-4">
                <h4 className="text-[10px] font-semibold text-fg-dim uppercase tracking-widest mb-3 px-4">
                  Sports
                </h4>
                <div className="grid grid-cols-2 gap-1 px-2">
                  {NAV_SPORTS.map(({ slug, label }) => {
                    const sportUrl = getSportUrl(slug);
                    const isSportActive = pathname === sportUrl || (slug === "cricket" && pathname === "/cricket");
                    return (
                      <Link
                        key={slug}
                        href={sportUrl}
                        prefetch={false}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                          isSportActive
                            ? "bg-hover-alt text-fg font-bold"
                            : "text-fg-dim hover:text-fg hover:bg-hover"
                        }`}
                      >
                        <span className={`transition-colors duration-200 ${isSportActive ? "text-red-500" : "text-fg-dim/60"}`}>
                          {getSportIcon(slug)}
                        </span>
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Links */}
              <div className="border-t border-border-alt pt-4">
                <h4 className="text-[10px] font-semibold text-fg-dim uppercase tracking-widest mb-3 px-4">
                  Quick Links
                </h4>
                <div className="space-y-1">
                  <Link
                    href="/live-matches"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-hover transition-colors"
                  >
                    <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                    Live Matches
                  </Link>

                  <Link
                    href="/live-tv"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-hover transition-colors"
                  >
                    <Tv className="w-4 h-4 text-red-500" />
                    Live TV
                  </Link>

                  <Link
                    href="/24-7-streams"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-hover transition-colors"
                  >
                    <Clock className="w-4 h-4 text-red-500" />
                    24/7 Streams
                  </Link>
                </div>
              </div>

              {/* Support & Legal (Docs, About, Contact, Terms, Privacy) */}
              <div className="border-t border-border-alt pt-4">
                <button
                  onClick={() => setIsMobileMoreOpen(p => !p)}
                  className="flex items-center justify-between w-full text-[10px] font-semibold text-fg-dim uppercase tracking-widest mb-1 px-4 cursor-pointer"
                >
                  <span>Support & Legal</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileMoreOpen ? "rotate-180" : ""}`} />
                </button>
                {isMobileMoreOpen && (
                  <div className="space-y-1.5 mt-3 px-2">
                    <div className="text-[9px] font-mono text-fg-faint uppercase tracking-wider px-2 mt-1">Documentation</div>
                    <Link
                      href="/docs/api"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/docs/api") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      KhelaDekho API
                    </Link>
                    <Link
                      href="/docs/architecture"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/docs/architecture") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <Activity className="w-4 h-4 text-blue-500" />
                      Architecture
                    </Link>
                    <Link
                      href="/docs/installation"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/docs/installation") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      Installation Guide
                    </Link>
                    <Link
                      href="/docs/request"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/docs/request") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <Key className="w-4 h-4 text-red-500" />
                      Request API / Repo
                    </Link>

                    <div className="text-[9px] font-mono text-fg-faint uppercase tracking-wider px-2 mt-3">Information</div>
                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/about") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <Info className="w-4 h-4 text-blue-500" />
                      About Us
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/contact") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <Mail className="w-4 h-4 text-purple-500" />
                      Contact Us
                    </Link>
                    <Link
                      href="/terms"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/terms") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <FileText className="w-4 h-4 text-amber-500" />
                      Terms & Conditions
                    </Link>
                    <Link
                      href="/privacy"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive("/privacy") ? "bg-hover-alt text-fg font-bold" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
                    >
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Privacy Policy
                    </Link>
                  </div>
                )}
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
