"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Tv from "lucide-react/dist/esm/icons/tv";
import Search from "lucide-react/dist/esm/icons/search";
import Home from "lucide-react/dist/esm/icons/home";
import Activity from "lucide-react/dist/esm/icons/activity";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Shield from "lucide-react/dist/esm/icons/shield";
import Info from "lucide-react/dist/esm/icons/info";
import Mail from "lucide-react/dist/esm/icons/mail";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Key from "lucide-react/dist/esm/icons/key";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import { SPORTS, getSportUrl } from "@/lib/config";

export function Sidebar() {
  const pathname = usePathname();
  const [isSportsOpen, setIsSportsOpen] = useState(true);

  const isActive = (path: string) => pathname === path;

  const baseLinkClass =
    "flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-all duration-200 border font-mono";
  const activeLinkClass =
    "bg-hover-alt text-fg font-medium shadow-[0_0_15px_rgba(255,255,255,0.05)] border-border-alt";
  const inactiveLinkClass = "text-fg-dim hover:text-fg hover:bg-hover border-transparent";

  return (
    <nav className="border-r border-border md:w-72 flex-shrink-0 h-[calc(100dvh-4rem)] sticky top-16 bg-transparent py-6 pr-6 pl-0 overflow-y-auto z-40 hidden md:flex flex-col">
      <div className="space-y-8">
        {/* Navigation Section */}
        <div>
          <h4 className="text-xs font-semibold text-fg-dim uppercase tracking-widest mb-4 px-3 relative">
            Navigation
            <div className="absolute left-0 bottom-0 top-0 w-0.5 bg-neutral-800 rounded-r-md" />
          </h4>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/"
                className={`${baseLinkClass} ${isActive("/") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/live-matches"
                className={`${baseLinkClass} ${isActive("/live-matches") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Tv className="w-4 h-4 text-red-500 animate-pulse" />
                Live Matches
              </Link>
            </li>
            <li>
              <button
                onClick={() => setIsSportsOpen(p => !p)}
                className={`${baseLinkClass} w-full ${isSportsOpen ? "bg-hover-alt text-fg" : "text-fg-dim hover:text-fg hover:bg-hover"}`}
              >
                <Tv className="w-4 h-4 text-red-500 animate-pulse" />
                Sports
                <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-200 ${isSportsOpen ? "rotate-180" : ""}`} />
              </button>
              {isSportsOpen && (
                <ul className="mt-1 ml-4 space-y-0.5 border-l border-border-alt pl-2">
                  {SPORTS.map(({ slug, label }) => {
                    const sportUrl = getSportUrl(slug);
                    return (
                      <li key={slug}>
                        <Link
                          href={sportUrl}
                          prefetch={false}
                          className={`${baseLinkClass} text-xs ${isActive(sportUrl) || (slug === "cricket" && isActive("/cricket")) ? activeLinkClass : inactiveLinkClass}`}
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
            <li>
              <Link
                href="/scores"
                className={`${baseLinkClass} ${isActive("/scores") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Trophy className="w-4 h-4" />
                Match Scores
              </Link>
            </li>
          </ul>
        </div>



        {/* Documentation Section */}
        <div>
          <h4 className="text-xs font-semibold text-fg-dim uppercase tracking-widest mb-4 px-3 relative">
            Documentation
            <div className="absolute left-0 bottom-0 top-0 w-0.5 bg-neutral-800 rounded-r-md" />
          </h4>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/docs/api"
                className={`${baseLinkClass} ${isActive("/docs/api") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Terminal className="w-4 h-4 text-emerald-500" />
                KhelaDekho API
              </Link>
            </li>
            <li>
              <Link
                href="/docs/architecture"
                className={`${baseLinkClass} ${isActive("/docs/architecture") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Activity className="w-4 h-4" />
                Architecture
              </Link>
            </li>
            <li>
              <Link
                href="/docs/installation"
                className={`${baseLinkClass} ${isActive("/docs/installation") ? activeLinkClass : inactiveLinkClass}`}
              >
                <FileText className="w-4 h-4" />
                Installation Guide
              </Link>
            </li>
            <li>
              <Link
                href="/docs/request"
                className={`${baseLinkClass} ${isActive("/docs/request") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Key className="w-4 h-4 text-red-500" />
                Request API / Repo
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Section */}
        <div>
          <h4 className="text-xs font-semibold text-fg-dim uppercase tracking-widest mb-4 px-3 relative">
            Legal
            <div className="absolute left-0 bottom-0 top-0 w-0.5 bg-neutral-800 rounded-r-md" />
          </h4>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/terms"
                className={`${baseLinkClass} ${isActive("/terms") ? activeLinkClass : inactiveLinkClass}`}
              >
                <FileText className="w-4 h-4" />
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className={`${baseLinkClass} ${isActive("/privacy") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Shield className="w-4 h-4" />
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`${baseLinkClass} ${isActive("/about") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Info className="w-4 h-4" />
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className={`${baseLinkClass} ${isActive("/contact") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Mail className="w-4 h-4" />
                Contact Us
              </Link>
            </li>
            <li>
              <Link
                href="/search"
                className={`${baseLinkClass} ${isActive("/search") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Search className="w-4 h-4" />
                Search Finder
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
