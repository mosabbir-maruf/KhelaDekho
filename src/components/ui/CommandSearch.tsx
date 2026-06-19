"use client";

import { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Search from "lucide-react/dist/esm/icons/search";
import Tv from "lucide-react/dist/esm/icons/tv";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import CornerDownLeft from "lucide-react/dist/esm/icons/corner-down-left";
import Activity from "lucide-react/dist/esm/icons/activity";
import Users from "lucide-react/dist/esm/icons/users";
import User from "lucide-react/dist/esm/icons/user";
import { getApiBaseUrl, type ChannelInfo, type Match } from "@/lib/api";
import { event } from "@/lib/analytics";

interface SearchItem {
  title: string;
  description: string;
  href: string;
  category: "Matches" | "Live Channels" | "Navigation" | "Teams" | "Players" | "Events";
}

interface SportsDBTeam {
  id: string;
  name: string;
  badge: string | null;
  country: string | null;
  league: string | null;
}

interface SportsDBPlayer {
  id: string;
  name: string;
  thumb: string | null;
  team: string | null;
  nationality: string | null;
  position: string | null;
}

interface SportsDBEvent {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  league: string | null;
  date: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
}

interface SportsDBResults {
  teams: SportsDBTeam[];
  players: SportsDBPlayer[];
  events: SportsDBEvent[];
}

const defaultItems: SearchItem[] = [
  { title: "Home", description: "Return to the featured media lobby", href: "/", category: "Navigation" },
  { title: "Live Matches", description: "Browse all channels and start watching live", href: "/live-matches", category: "Navigation" },
  { title: "Football Hub", description: "Live matches, standings, top scorers, teams and players", href: "/football", category: "Navigation" },
  { title: "Search Finder", description: "Search matches and channels across the platform", href: "/search", category: "Navigation" },
  { title: "About Us", description: "Learn about KhelaDekho and our mission", href: "/about", category: "Navigation" },
  { title: "Contact Us", description: "Get in touch with the team", href: "/contact", category: "Navigation" },
  { title: "Terms & Conditions", description: "View legal policies for the platform", href: "/terms", category: "Navigation" },
  { title: "Privacy Policy", description: "How we collect, use, and protect your data", href: "/privacy", category: "Navigation" },
];

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dynamicItems, setDynamicItems] = useState<SearchItem[]>([]);
  const [sportsDB, setSportsDB] = useState<SportsDBResults>({ teams: [], players: [], events: [] });
  const [sportsDBLoading, setSportsDBLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch matches and channels when search modal opens
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const fetchSearchData = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const [resMatches, resChannels] = await Promise.all([
          fetch(`${baseUrl}/api/v1/matches`, { signal: controller.signal }),
          fetch(`${baseUrl}/api/v1/channels`, { signal: controller.signal }),
        ]);

        const itemsList: SearchItem[] = [...defaultItems];

        if (resChannels.ok) {
          const chData = await resChannels.json();
          if (chData.success && chData.data?.channels) {
            chData.data.channels.forEach((ch: ChannelInfo) => {
              itemsList.push({
                title: ch.name,
                description: `Quality: ${ch.quality} • Category: ${ch.category} • Viewers: ${ch.live_viewers}`,
                href: `/live/${ch.key}`,
                category: "Live Channels",
              });
            });
          }
        }

        if (resMatches.ok) {
          const matchData = await resMatches.json();
          if (matchData.success && matchData.data?.matches) {
            matchData.data.matches.forEach((m: Match) => {
              itemsList.push({
                title: `${m.team1.name} vs ${m.team2.name}`,
                description: `Stage: ${m.stage} • Status: ${m.status.toUpperCase()} ${m.group ? `(${m.group})` : ""
                  }`,
                href: `/football?search=${encodeURIComponent(m.team1.name)}`,
                category: "Matches",
              });
            });
          }
        }

        if (controller.signal.aborted) return;
        setDynamicItems(itemsList);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load search index components:", err);
        setDynamicItems(defaultItems);
      }
    };

    fetchSearchData();
    return () => controller.abort();
  }, [open]);

  // Debounced SportsDB search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      const id = setTimeout(() => {
        setSportsDBLoading(false);
        setSportsDB({ teams: [], players: [], events: [] });
      }, 0);
      return () => clearTimeout(id);
    }

    const timer = setTimeout(async () => {
      setSportsDBLoading(true);
      try {
        const res = await fetch(`/api/sportsdb/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data: SportsDBResults = await res.json();
          setSportsDB(data);
        }
      } catch {
        setSportsDB({ teams: [], players: [], events: [] });
      }
      setSportsDBLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setSelectedIndex(0);
      setSportsDB({ teams: [], players: [], events: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const source = dynamicItems.length > 0 ? dynamicItems : defaultItems;

    if (!query.trim()) return source;

    const q = query.toLowerCase();
    const matched = source.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );

    if (query.trim().length < 2) return matched;

    const seenTitles = new Set(matched.map(i => i.title.toLowerCase()));

    const addIfNotDup = (items: SearchItem[], item: SearchItem) => {
      if (!seenTitles.has(item.title.toLowerCase())) {
        seenTitles.add(item.title.toLowerCase());
        items.push(item);
      }
    };

    const results = [...matched];

    const qLower = query.trim().toLowerCase();

    for (const team of sportsDB.teams.slice(0, 5)) {
      addIfNotDup(results, {
        title: team.name,
        description: `Team • ${[team.country, team.league].filter(Boolean).join(" • ")}`,
        href: `/football?team=${team.id}`,
        category: "Teams",
      });
    }

    for (const player of sportsDB.players.slice(0, 5)) {
      addIfNotDup(results, {
        title: player.name,
        description: `Player • ${[player.team, player.position, player.nationality].filter(Boolean).join(" • ")}`,
        href: `/football?player=${player.id}`,
        category: "Players",
      });
    }

    if (qLower.includes("match") || qLower.includes("vs") || qLower.includes("game")) {
      for (const event of sportsDB.events.slice(0, 5)) {
        addIfNotDup(results, {
          title: event.name,
          description: `Match • ${[event.league, event.date].filter(Boolean).join(" • ")}`,
          href: `/football?match=${event.id}`,
          category: "Events",
        });
      }
    }

    return results;
  }, [query, dynamicItems, sportsDB]);

  // Reset selection when results change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [filtered]);

  const handleSelect = (href: string) => {
    onClose();
    if (query.trim()) {
      event("search", { search_query: query.trim(), result_count: filtered.length });
    }
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].href);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-overlay backdrop-blur-sm z-[100]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[520px] z-[101] px-4">
        <div className="border border-border-alt bg-page shadow-2xl shadow-black/50 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-fg-dim shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search live channels, matches, teams, players..."
              className="flex-1 bg-transparent text-sm text-fg font-mono placeholder:text-fg-dim outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-fg-dim bg-hover border border-border-alt rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-mono text-fg-dim">
                  {sportsDBLoading ? "Searching..." : "No matching indexes found."}
                </p>
              </div>
            ) : (
              filtered.map((item, i) => (
                <button
                  key={`${item.href}-${item.category}-${i}`}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === selectedIndex ? "bg-hover" : "hover:bg-hover"
                    }`}
                >
                  <div className="w-8 h-8 rounded bg-hover border border-border-alt flex items-center justify-center shrink-0">
                    {item.category === "Live Channels" ? (
                      <Tv className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    ) : item.category === "Matches" ? (
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    ) : item.category === "Teams" ? (
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                    ) : item.category === "Players" ? (
                      <User className="w-3.5 h-3.5 text-amber-400" />
                    ) : item.category === "Events" ? (
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-fg-dim" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-fg font-mono">{item.title}</div>
                    <div className="text-xs text-fg-dim truncate">{item.description}</div>
                  </div>
                  {i === selectedIndex && <CornerDownLeft className="w-3.5 h-3.5 text-fg-dim shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-hover">
            <div className="flex items-center gap-3 text-[10px] font-mono text-fg-dim uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-hover border border-border-alt rounded text-[9px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-hover border border-border-alt rounded text-[9px]">↵</kbd>
                Select
              </span>
            </div>
            <span className="text-[10px] font-mono text-fg-dim tracking-widest">
              {filtered.length} entries
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Export a hook for the shortcut display
export function useIsMac(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const nav = navigator as Navigator & { userAgentData?: { platform: string } };
      const platform = (nav.userAgentData?.platform || nav.platform || "").toUpperCase();
      return platform.includes("MAC");
    },
    () => false
  );
}
