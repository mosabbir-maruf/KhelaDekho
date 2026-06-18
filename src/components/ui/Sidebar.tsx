"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Calendar from "lucide-react/dist/esm/icons/calendar";
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

export function Sidebar() {
  const pathname = usePathname();

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
                href="/matches"
                className={`${baseLinkClass} ${isActive("/matches") ? activeLinkClass : inactiveLinkClass}`}
              >
                <Calendar className="w-4 h-4" />
                Matches
              </Link>
            </li>
            <li>
              <Link
                href="/matches?status=live"
                className={`${baseLinkClass} ${
                  pathname === "/matches" && typeof window !== "undefined" && window.location.search.includes("status=live")
                    ? activeLinkClass
                    : inactiveLinkClass
                }`}
              >
                <Tv className="w-4 h-4 text-red-500 animate-pulse" />
                Live Channels
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
                Decryption API Docs
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
