"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tv from "lucide-react/dist/esm/icons/tv";
import Search from "lucide-react/dist/esm/icons/search";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import X from "lucide-react/dist/esm/icons/x";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Zap from "lucide-react/dist/esm/icons/zap";
import Shield from "lucide-react/dist/esm/icons/shield";
import Link from "next/link";
import Image from "next/image";

interface M3u8Channel {
  name: string;
  url: string;
}

type Category =
  | "All"
  | "Sports"
  | "News"
  | "Entertainment"
  | "Movies"
  | "Music"
  | "Kids"
  | "Religious"
  | "Documentary"
  | "International";

const CATEGORIES: { label: Category; icon: string }[] = [
  { label: "All", icon: "Tv" },
  { label: "Sports", icon: "Zap" },
  { label: "News", icon: "Monitor" },
  { label: "Entertainment", icon: "Tv" },
  { label: "Movies", icon: "Monitor" },
  { label: "Music", icon: "Tv" },
  { label: "Kids", icon: "Tv" },
  { label: "Religious", icon: "Shield" },
  { label: "Documentary", icon: "Monitor" },
  { label: "International", icon: "Tv" },
];

const CATEGORY_KEYWORDS: Record<Exclude<Category, "All">, string[]> = {
  Sports: [
    "sports", "cricket", "football", "tennis", "espn", "nfl", "nba", "golf",
    "tnt", "sky sports", "ptv sports", "willow", "bein", "eurospot",
    "sony ten", "sony sports", "star sports", "a sports", "t sports",
    "fox cricket", "astro cricket", "dd sports", "nbc sports",
    "premier league", "laliga", "premier sports", "speed sports",
    "marquee sports", "sports grid", "sports first", "sports fishing",
    "bleav", "tsn", "ten sports", "sports range", "sports legends",
    "cricket gold",
  ],
  News: [
    "news", "cnn", "bbc", "al jazeera", "dw news", "trt world",
    "sky news", "republic", "india today", "abc news", "bloomberg",
    "cnbc", "fox business", "msnbc", "wion", "nhk world", "cgtn",
    "france", "euronews", "ntv", "atn news", "somoy", "jamuna",
    "independent", "ekattor", "channel 24", "dbc news", "news 24",
    "anb news", "news 1", "tv9", "sadhna", "hindi khabar", "news nation",
    "bek tv", "btv news", "time tv", "abc 7", "o an", "iran press",
    "sky news", "pix 11", "cp 24", "cbs tv",
  ],
  Entertainment: [
    "channel i", "maasranga", "bangla vision", "rtv", "atv",
    "deepto", "ekushey", "channel 9", "n tv", "boishakhi",
    "green tv", "sa tv", "ananda", "bangla tv", "global tv",
    "bijoy", "nexus", "mohona", "desh tv", "asian tv", "channel s",
    "etv", "gazi tv", "my tv", "drama 24", "duronto",
    "dangal", "shemaroo", "manoranjan", "taaza", "assam talks",
    "khushboo", "dhinchaak", "9x jalwa", "9x tashan",
    "rongeen", "network 10", "awaaz",
    "star plus", "star jalsha", "zee tv", "zee bangla", "&tv",
    "sony sab", "sony ent", "hum tv", "sony aath", "zee anmol",
    "b4u music", "zing", "toffee drama", "colors",
    "discovery family", "hgtv", "food network", "lifetime",
    "laff", "syfy", "usa tv", "mtv", "bravo", "comedy central",
    "amc", "axs", "tbs", "hbo", "epix", "fx",
    "cooking", "travel channel", "tlc", "nat geo",
    "wild tv", "4k travel", "intravel", "persiana", "travel xp",
    "cowboy movie", "world war tv", "rakuten movies",
    "movie sphere", "cmac tv", "rds social",
    "action hollywood", "goldmines bollywood", "hindi movie",
    "movie bangla", "toffee movies", "zee cinema", "zee action",
    "zee bollywood", "sony max", "sony pix", "star movies",
    "jalsha movies", "b4u movies", "& pictures",
    "sony max 2", "zee cafe",
  ],
  Movies: [
    "movie", "cinema", "hbo", "sony max", "sony pix", "zee cafe",
    "zee cinema", "star movies", "toffee movie", "b4u movies",
    "& pictures", "zee action", "zee bollywood", "sony max 2",
    "goldmines", "hindi movie", "movie sphere", "rakuten movies",
    "cowboy movie", "world war tv", "action hollywood",
  ],
  Music: [
    "music", "sangeet", "mtv",
  ],
  Kids: [
    "kids", "cartoon", "pogo", "sony yay", "discovery kids",
    "duronto", "hungama", "pbs", "nick",
  ],
  Religious: [
    "islamic", "islam", "quran", "peace tv", "god tv", "ewtn",
    "al quran",
  ],
  Documentary: [
    "discovery", "animal planet", "nat geo", "tlc", "love nature",
    "wildlife",
  ],
  International: [
    "bbc", "cnn", "al jazeera", "dw news", "trt world", "sky news",
    "wion", "nhk world", "cgtn", "france 24", "abc news",
    "bloomberg", "cnbc", "fox", "msnbc", "travel xp",
    "persiana", "4k travel", "intravel", "cowboy movie",
    "world war tv", "rakuten movies", "movie sphere",
    "action hollywood", "cmac tv", "cooking", "hgtv",
    "food network", "lifetime", "tbs", "amc", "axs",
    "bravo", "comedy central", "fx", "epix", "laff",
    "syfy", "usa tv", "mtv",
  ],
};

function getCategory(name: string): Category {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return cat as Category;
    }
  }
  return "Entertainment";
}

const LOGO_BASE = "https://raw.githubusercontent.com/boy653859/m3u8/main/Logo/";

const LOGO_MAP: Record<string, string> = {
  "somoy tv": "imgi_3_somoyTV.png",
  "somoy news tv": "imgi_3_somoyTV.png",
  "btv": "imgi_2_BTV Logo Gallery.png",
  "btv national hd": "imgi_23_BTV.HD.png",
  "channel 24": "imgi_14_CHANNEL 24.png",
  "channel 24 hd": "imgi_14_CHANNEL 24.png",
  "channel 9 hd": "imgi_19_Channel 9.png",
  "channel 9": "imgi_19_Channel 9.png",
  "independent tv": "imgi_6_independent.jpg",
  "jamuna tv": "imgi_17_JAMUNA TV.png",
  "ntv": "imgi_17_NTV.png",
  "atn news": "imgi_15_ATN NEWS.png",
  "atn bangla": "imgi_18_ATN BANGLA.png",
  "channel i": "imgi_20_CHANNEL I.png",
  "channel i hd": "imgi_20_CHANNEL I.png",
  "maasranga tv": "imgi_16_Maasranga TV.png",
  "maasranga hd": "imgi_16_Maasranga TV.png",
  "ekattor hd": "imgi_16_EKATTOR_TV.png",
  "ekattor tv": "imgi_16_EKATTOR_TV.png",
  "bangla vision": "imgi_19_BANGLA_VISION.png",
  "islamic tv": "imgi_33_IslamicTV.jpg",
  "deepto tv": "imgi_22_DEEPTO.png",
  "deepto tv hd": "imgi_22_DEEPTO.png",
  "sa tv": "imgi_18_SATV.png",
  "green tv hd": "imgi_20_Green TV.png",
  "sangeet bangla": "imgi_29_SANGEET BANGLA.png",
  "star sports 1": "imgi_2_STAR SPORTS1 HD.png",
  "star sports 2": "imgi_3_STAR SPORTS2 HD.png",
  "star sports 3": "imgi_4_STAR SPORTS3.png",
  "star sports 1 hindi": "imgi_2_STAR SPORTS1 HD.png",
  "ptv sports": "imgi_11_PTV SPORTS HD.png",
  "[bd] sony ten sports 1 hd": "imgi_10_SONY SPORTS5 HD.png",
  "[bd] sony ten sports 2 hd": "imgi_10_SONY SPORTS5 HD.png",
  "[bd] sony ten sports 5 hd": "imgi_10_SONY SPORTS5 HD.png",
  "[bd] sony ten cricket": "imgi_10_SONY SPORTS5 HD.png",
  "[bd] eurosport hd": "imgi_12_EUROSPORTS HD.png",
  "[bd] ntv": "imgi_17_NTV.png",
  "[bd] somoy tv": "imgi_3_somoyTV.png",
  "[bd] jamuna tv": "imgi_17_JAMUNA TV.png",
  "[bd] channel i": "imgi_20_CHANNEL I.png",
  "[bd] ekattor tv": "imgi_16_EKATTOR_TV.png",
  "[bd] independent tv": "imgi_6_independent.jpg",
  "duronto tv": "imgi_38_Duronto_TV_Logo.png",
  "btv world": "imgi_2_BTV Logo Gallery.png",
  "animal planet hd": "imgi_22_1280px-Animal_Planet_logo.svg.png",
  "[bd] sony max hd": "imgi_30_SONY MAX HD.png",
  "[bd] sony max": "imgi_30_SONY MAX HD.png",
  "[bd] sony pix hd": "imgi_30_SONY MAX HD.png",
  "[bd] sony entertainment television hd": "imgi_31_SONY ENTERTAINMENT HD.png",
  "[bd] sony entertainment television": "imgi_31_SONY ENTERTAINMENT HD.png",
  "[bd] sony sab hd": "imgi_31_SONY ENTERTAINMENT HD.png",
  "[bd] zee tv hd": "imgi_26_ZEE BANGLA HD.png",
  "[bd] zee bangla": "imgi_26_ZEE BANGLA HD.png",
  "[bd] zee bangla cinema": "imgi_26_ZEE BANGLA HD.png",
  "[bd] zee cinema hd": "imgi_26_ZEE BANGLA HD.png",
  "[bd] colors cineplex hd": "imgi_35_COLORS CINEPLEX HD.png",
  "[bd] colors hd": "imgi_34_COLORS HD.png",
  "[bd] star plus hd": "imgi_32_STAR PLUS HD.png",
  "[bd] star movies hd": "imgi_33_STAR MOVIES HD.png",
  "[bd] star jalsha hd": "imgi_24_STAR JALSHA HD.png",
  "[bd] jalsha movies hd": "imgi_25_JALSHA MOVIES HD.png",
  "[bd] discovery hd": "imgi_37_DISCOVERY HD.png",
  "[bd] discovery": "imgi_37_DISCOVERY HD.png",
  "[bd] cartoon network hd +": "imgi_38_CARTOON NETWORK.png",
  "[bd] cartoon network": "imgi_38_CARTOON NETWORK.png",
  "[bd] discovery kids": "imgi_39_DISCOVERY KIDS.png",
  "[bd] animal planet hd": "imgi_22_1280px-Animal_Planet_logo.svg.png",
  "[bd] animal planet": "imgi_22_1280px-Animal_Planet_logo.svg.png",
  "news 24 hd": "imgi_15_ATN NEWS.png",
  "news 24 bd": "imgi_15_ATN NEWS.png",
  "al jazeera": "imgi_6_independent.jpg",
  "aljazeera": "imgi_6_independent.jpg",
  "ekhon tv": "imgi_6_independent.jpg",
  "ananda tv": "imgi_18_ATN BANGLA.png",
  "bangla tv": "imgi_18_ATN BANGLA.png",
  "global tv": "imgi_18_ATN BANGLA.png",
  "bijoy tv": "imgi_18_ATN BANGLA.png",
  "nexus tv": "imgi_18_ATN BANGLA.png",
  "mohona tv": "imgi_18_ATN BANGLA.png",
  "asian tv": "imgi_18_ATN BANGLA.png",
  "desh tv": "imgi_18_ATN BANGLA.png",
  "channel s": "imgi_13_channel-i-bangla.png",
  "boishakhi tv": "imgi_13_channel-i-bangla.png",
  "etv": "imgi_13_channel-i-bangla.png",
  "rtv": "imgi_13_channel-i-bangla.png",
  "star news": "imgi_3_somoyTV.png",
  "dangal": "imgi_3_somoyTV.png",
  "zee 24 ghanta": "imgi_63_24-Ghanta.jpg",
  "kolkata tv": "imgi_66_KolkataTV.png",
  "republic bangla": "imgi_3_somoyTV.png",
  "news time bangla": "imgi_4_imagea02f4314e761661d.png",
  "drama 24": "imgi_67_Gseries.png",
  "sony sports3": "imgi_10_SONY SPORTS5 HD.png",
  "music bangla": "imgi_29_SANGEET BANGLA.png",
  "deshe bideshe": "imgi_3_somoyTV.png",
  "ekushey tv": "imgi_3_somoyTV.png",
  "bbc news": "imgi_3_somoyTV.png",
  "my tv": "imgi_3_somoyTV.png",
  "abc news": "imgi_3_somoyTV.png",
  "dw news": "imgi_3_somoyTV.png",
  "trt world": "imgi_3_somoyTV.png",
  "wion": "imgi_3_somoyTV.png",
  "sky news": "imgi_3_somoyTV.png",
  "cgtn docu": "imgi_3_somoyTV.png",
  "bloomberg tv": "imgi_3_somoyTV.png",
  "cnbc tv": "imgi_3_somoyTV.png",
  "cnn": "imgi_6_independent.jpg",
  "fox business": "imgi_6_independent.jpg",
  "discovery family": "imgi_22_1280px-Animal_Planet_logo.svg.png",
  "nat geo tv": "imgi_22_1280px-Animal_Planet_logo.svg.png",
  "tlc hd": "imgi_22_1280px-Animal_Planet_logo.svg.png",
  "travel channel": "imgi_22_1280px-Animal_Planet_logo.svg.png",
  "hbo": "imgi_6_independent.jpg",
  "t sports hd": "imgi_3_somoyTV.png",
  "sports legends": "imgi_4_STAR SPORTS3.png",
  "a sports": "imgi_11_PTV SPORTS HD.png",
  "a sports hd": "imgi_11_PTV SPORTS HD.png",
  "willow hd": "imgi_11_PTV SPORTS HD.png",
  "willow hd 2": "imgi_11_PTV SPORTS HD.png",
  "willow tv": "imgi_11_PTV SPORTS HD.png",
  "ten sports": "imgi_10_SONY SPORTS5 HD.png",
  "sky sports cricket": "imgi_10_SONY SPORTS5 HD.png",
  "fox cricket 501 hd": "imgi_10_SONY SPORTS5 HD.png",
  "astro cricket": "imgi_10_SONY SPORTS5 HD.png",
  "[bd] movie bangla": "imgi_18_ATN BANGLA.png",
  "boishakhi": "imgi_13_channel-i-bangla.png",
  "gazi tv": "imgi_22_DEEPTO.png",
  "btv ctg": "imgi_2_BTV Logo Gallery.png",
  "peace tv bangla hd": "imgi_33_IslamicTV.jpg",
  "time tv usa": "imgi_3_somoyTV.png",
  "abc 7 bay": "imgi_3_somoyTV.png",
  "btv news": "imgi_2_BTV Logo Gallery.png",
  "bek tv news": "imgi_3_somoyTV.png",
  "dbc news": "imgi_15_ATN NEWS.png",
  "dbc news hd": "imgi_15_ATN NEWS.png",
  "anb news": "imgi_3_somoyTV.png",
  "news 1 india": "imgi_3_somoyTV.png",
  "tv9 bangla": "imgi_3_somoyTV.png",
  "india today": "imgi_3_somoyTV.png",
  "cricket gold": "imgi_4_STAR SPORTS3.png",
  "golf channel": "imgi_3_somoyTV.png",
  "bein sports": "imgi_10_SONY SPORTS5 HD.png",
  "dd sports": "imgi_4_STAR SPORTS3.png",
  "nfl network": "imgi_3_somoyTV.png",
  "nbc sports": "imgi_3_somoyTV.png",
};

function getLogoUrl(name: string): string | null {
  const key = name.toLowerCase().trim().replace(/\s+/g, " ");
  const filename = LOGO_MAP[key];
  if (filename) return LOGO_BASE + encodeURIComponent(filename);
  return null;
}

const JSON_URL = "https://raw.githubusercontent.com/boy653859/m3u8/main/live_channel.json";
const CACHE_KEY = "khela_live_tv_channels";
const CACHE_TTL = 60 * 60 * 1000;

function loadCachedChannels(): M3u8Channel[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCachedChannels(chs: M3u8Channel[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: chs, ts: Date.now() }));
  } catch {}
}

export default function LiveTvPage() {
  const [channels, setChannels] = useState<M3u8Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<M3u8Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let cachedSelection: M3u8Channel | null = null;

    (async () => {
      const cached = loadCachedChannels();
      if (cached && cached.length > 0) {
        setChannels(cached);
        cachedSelection = cached[0];
        setSelectedChannel(cached[0]);
        setLoading(false);
      }

      try {
        const res = await fetch(JSON_URL, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch channels");
        const data = await res.json();
        if (!active) return;
        const chs: M3u8Channel[] = data.channels || [];
        setChannels(chs);
        saveCachedChannels(chs);
        if (chs.length > 0) {
          const stillSelected = cachedSelection && chs.some((c) => c.name === cachedSelection!.name && c.url === cachedSelection!.url);
          if (!stillSelected) setSelectedChannel(chs[0]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!cachedSelection) console.error("Failed to load channels:", err);
      } finally {
        if (active && !cachedSelection) setLoading(false);
      }
    })();

    return () => { active = false; controller.abort(); };
  }, []);

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (activeCategory !== "All") {
      result = result.filter((ch) => getCategory(ch.name) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ch) => ch.name.toLowerCase().includes(q));
    }
    return result;
  }, [channels, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: channels.length };
    for (const ch of channels) {
      const cat = getCategory(ch.name);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [channels]);

  const selectChannel = useCallback((ch: M3u8Channel) => {
    setSelectedChannel(ch);
    setIsMobileDropdownOpen(false);
  }, []);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 flex-1 min-h-0">
        {/* ── Hero ── */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Tv className="w-3 h-3 text-red-500" />
                Browse Streams
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Live TV<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                Streaming live TV channels
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby
            </Link>
          </div>
          <p className="text-[11px] font-mono text-yellow-500/80 leading-relaxed text-center mt-6">
            Stream buffering? Switch channel or server.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Indexing streams...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-6 items-stretch flex-1 min-h-0 overflow-hidden grid-rows-[1fr]">
            {/* ── Left: Channel List ── */}
            <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card overflow-hidden min-h-0">
              <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-3 py-2 border-b border-border-alt shrink-0">
                {filteredChannels.length} channel{filteredChannels.length !== 1 ? "s" : ""}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 space-y-1 p-2 scrollbar-red">
                {filteredChannels.map((ch, i) => (
                  <button
                    key={`${ch.name}-${i}`}
                    onClick={() => selectChannel(ch)}
                    className={`w-full text-left border p-3 transition-all cursor-pointer group ${
                      selectedChannel?.name === ch.name && selectedChannel?.url === ch.url
                        ? "border-red-500/30 bg-red-500/[0.03]"
                        : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`relative w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden transition-all ${
                        selectedChannel?.name === ch.name && selectedChannel?.url === ch.url
                          ? "border-red-500/20 bg-red-500/10"
                          : "border-border-alt bg-hover group-hover:border-red-500/20 group-hover:bg-red-500/10"
                      }`}>
                        {(() => {
                          const logoUrl = getLogoUrl(ch.name);
                          return logoUrl ? (
                            <Image src={logoUrl} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <Tv className={`w-3.5 h-3.5 transition-colors ${
                              selectedChannel?.name === ch.name ? "text-red-400" : "text-fg-dim group-hover:text-red-400"
                            }`} />
                          );
                        })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-mono font-semibold truncate transition-colors ${
                          selectedChannel?.name === ch.name ? "text-red-400" : "text-fg group-hover:text-red-400"
                        }`}>
                          {ch.name}
                        </div>
                        <div className="text-[9px] font-mono text-fg-dim mt-0.5">
                          {getCategory(ch.name).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredChannels.length === 0 && (
                  <div className="text-center py-10">
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Middle: Player ── */}
            <div className="min-w-0 w-full min-h-0 flex flex-col gap-3">
              {selectedChannel ? (
                <>
                  {/* Channel details header */}
                  <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center overflow-hidden">
                        {(() => {
                          const logoUrl = getLogoUrl(selectedChannel.name);
                          return logoUrl ? (
                            <Image src={logoUrl} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                          ) : (
                            <Tv className="w-5 h-5 text-red-400" />
                          );
                        })()}
                      </div>
                      <div>
                        <h2 className="font-mono text-lg font-bold text-fg tracking-tight">{selectedChannel.name}</h2>
                        <p className="font-mono text-xs text-fg-dim">{getCategory(selectedChannel.name)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-fg-dim">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-fg font-bold">STREAM</span>
                      </span>
                    </div>
                  </div>

                  <VideoPlayer streamUrl={selectedChannel.url} streamType="hls" clearKeys={null} />

                  {/* Fixed bottom: stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Signal</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-green-500">ACTIVE</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Status</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Zap className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">HLS</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Stream Type</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Shield className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">NONE</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Drm</p>
                    </div>
                    <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                      <Monitor className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                      <p className="font-mono text-sm font-bold text-fg">{channels.length}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Channels</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                  <div className="text-center space-y-3 py-16">
                    <div className="w-12 h-12 rounded-xl border border-border-alt bg-hover flex items-center justify-center mx-auto">
                      <Monitor className="w-6 h-6 text-fg-dim" />
                    </div>
                    <p className="font-mono text-sm text-fg-dim font-semibold">Select a channel</p>
                    <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                      Select a channel from the list to start watching
                    </p>
                  </div>
                </div>
              )}

              {/* MOBILE ONLY: Channel selector */}
              <div className="relative lg:hidden w-full shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between border border-border-alt bg-card px-4 py-3.5 hover:border-red-500/20 transition-all text-left shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Tv className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-fg-dim uppercase tracking-widest block">{selectedChannel ? "Active Channel" : "Select Channel"}</span>
                      <span className="font-mono text-xs font-bold text-fg truncate block">{selectedChannel?.name || "Tap to browse"}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-fg-dim transition-transform duration-200 ${isMobileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isMobileDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 border border-border-alt bg-[#0c0c0d] py-1 shadow-2xl z-40 max-h-[60vh] flex flex-col">
                    <div className="flex items-center gap-2 border-b border-border-alt px-3 py-2 bg-card shrink-0">
                      <Search className="w-3.5 h-3.5 text-fg-dim shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search channel..."
                        className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
                      />
                      {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg">
                          <X className="w-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 p-1 scrollbar-red">
                      {filteredChannels.map((ch, i) => (
                        <button
                          key={`mobile-${ch.name}-${i}`}
                          type="button"
                          onClick={() => selectChannel(ch)}
                          className={`w-full text-left border p-3 transition-all cursor-pointer group flex items-center justify-between ${
                            selectedChannel?.name === ch.name
                              ? "border-red-500/30 bg-red-500/[0.03] text-red-400 font-semibold"
                              : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <div className="text-xs font-mono truncate">{ch.name}</div>
                              <div className="text-[9px] font-mono text-fg-dim mt-0.5">{getCategory(ch.name).toUpperCase()}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredChannels.length === 0 && (
                        <div className="text-center py-8">
                          <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">No channels found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Filter List ── */}
            <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card p-3 gap-3 min-h-0 overflow-y-auto">
              {/* Category filter */}
              <div className="space-y-0.5">
                {CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.label] || 0;
                  const isActiveCat = activeCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => { setActiveCategory(cat.label); setSearchQuery(""); }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left border transition-all cursor-pointer group ${
                        isActiveCat
                          ? "border-red-500/30 bg-red-500/[0.03]"
                          : "border-transparent hover:border-red-500/10 hover:bg-red-500/[0.02]"
                      }`}
                    >
                      <span className={`font-mono text-[11px] transition-colors ${
                        isActiveCat ? "text-red-400 font-semibold" : "text-fg-dim group-hover:text-fg"
                      }`}>
                        {cat.label}
                      </span>
                      <span className={`font-mono text-[10px] ${
                        isActiveCat ? "text-red-400/60" : "text-fg-faint"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 border border-border-alt bg-card px-3 py-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-fg-dim shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter..."
                  className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
