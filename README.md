# KhelaDekho

<p align="center">
  <img src="https://kheladekho.pages.dev/meta-graph.webp" alt="KhelaDekho" width="100%" />
</p>

Live sports streaming dashboard & aggregator client built with Next.js 16.

---

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **hls.js** & **Shaka Player** (dynamically imported for HLS/DASH with ClearKey DRM)
- Deployed on **Cloudflare Pages**

---

## Project Structure

```
KhelaDekho-Frontend/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # Home (live scores hero + feed)
│   │   ├── layout.tsx               # Root layout (injects API URL + XKEY)
│   │   ├── not-found.tsx            # Custom 404 page
│   │   ├── manifest.ts / robots.ts / sitemap.ts  # PWA + SEO
│   │   ├── globals.css              # Global Tailwind styles
│   │   ├── scores/                  # V1 score provider UI
│   │   │   ├── page.tsx             # Dynamic shell → ScoresClient
│   │   │   ├── ScoresClient.tsx     # Scores list, tabs, day strip, polling
│   │   │   ├── [slug]/[matchId]/    # Match detail (events, lineups, stats)
│   │   │   ├── player/[playerId]/   # Player detail
│   │   │   └── team/[teamId]/       # Team detail
│   │   ├── live-matches/            # Multi-server match streaming (V2/V3/V4/V5)
│   │   │   ├── page.tsx             # Server shell → LiveMatchesClient
│   │   │   ├── layout.tsx           # Metadata
│   │   │   └── LiveMatchesClient.tsx  # Match list, channels, player, server switch
│   │   ├── live-tv/                 # Live TV (V5 DLHD 878+ channels, falls back V3 KV)
│   │   │   ├── page.tsx             # Server wrapper (dynamic)
│   │   │   ├── LiveTvClient.tsx     # Grid/card layout, category+country filters
│   │   │   └── layout.tsx           # Metadata
│   │   ├── v4/channel/[id]/page.tsx # V4 channel player page
│   │   ├── admin/                   # Admin panel (default server, V3 playlists)
│   │   ├── docs/                    # Documentation
│   │   │   ├── layout.tsx           # Docs shell with JSON-LD + sidebar
│   │   │   ├── api/page.tsx         # API reference (all versions)
│   │   │   ├── architecture/page.tsx# Architecture & streaming servers
│   │   │   ├── installation/page.tsx# Setup guide
│   │   │   └── request/page.tsx     # Access request form
│   │   ├── about/ contact/ privacy/ terms/ search/
│   │   └── api/                     # Frontend edge routes (Next.js route handlers)
│   │       ├── playlist/            # V3: reads self-hosted playlist from KV
│   │       ├── iptv/proxy/          # M3U8/segment proxy for V3
│   │       ├── contact/             # Contact form submission
│   │       └── admin/               # verify · settings · playlists (KV, admin key)
│   ├── components/
│   │   ├── ui/                      # Navbar, Sidebar, VideoPlayer, ChannelListItem, PageHero, StatsGrid, etc.
│   │   └── GoogleAnalytics.tsx     # Analytics component
│   ├── hooks/                       # useCopyButton, useDevicePlatform
│   ├── lib/                         # api.ts, config.ts, logger.ts, streamSelector.ts, analytics.ts
│   ├── data/                        # liveTv.ts (logo maps, category keywords)
│   └── types/                       # Global type declarations
├── public/                          # Logo, meta image, PWA icons
├── next.config.ts
└── wrangler.toml                    # Cloudflare Pages config + KV binding
```

---

## Streaming Servers

The **Live Matches** page can play from multiple sources ("servers"):

- **V2 / V4 / V5** — channel providers served through the backend API (`/api/v2/*`, `/api/v4/*`, `/api/v5/*`).
- **V3** — a **self-hosted playlist** (M3U8 or JSON) stored in **Cloudflare KV** and
  managed from the **admin panel**. It is served by the frontend edge route
  `GET /api/playlist?source=live-matches`, which fetches/merges the configured sources,
  de-duplicates channels, and applies per-channel overrides (custom name, order, hidden,
  default). On Live Matches, V3 also injects the V4 channel list.

> V3 has no external provider — it is entirely admin-managed content in KV, so add your
> own playlist sources from the admin panel before it shows channels.

The **Live TV** page uses **V5 DLHD channels** as its primary source (878+ 24/7 channels
from `GET /api/v5/tv/channels`), with automatic categorization, country detection, and
on-demand stream resolution through the V5 proxy. Falls back to the V3 KV playlist
if the V5 backend is unavailable.

---

## API

Consumes the KhelaDekho API:

- **V1** — live scores, fixtures, results, and match/player/team detail from the
  configured score provider (`/api/v1/*`).
- **V2 / V4 / V5** — channel streams for the Live Matches page (`/api/v2/*`, `/api/v4/*`, `/api/v5/*`).
- **V3** — self-hosted KV playlist served by the frontend (`/api/playlist`), see above.

The backend URL and shared key are the single source of truth in `src/lib/api.ts`
(`getApiBaseUrl` / `getXKey`); other shared constants live in `src/lib/config.ts`.

---

## Environment

See `.env.example` for the full list. Key variables:

```env
# Backend API + shared key (injected server-side, never shipped to the client)
KHELADEKHO_API_URL=https://your-api.workers.dev
XKEY=your-xkey-here

# Contact form
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Admin panel (separate key)
ADMIN_SECRET_KEY=your-admin-secret-key
```

### Cloudflare KV (`KHELA_SETTINGS`)

The V3 playlist system and admin settings use a **Cloudflare KV** namespace bound as
`KHELA_SETTINGS` in `wrangler.toml`. It stores:

| Key | Purpose |
|-----|---------|
| `playlist_sources_live-matches` | V3 source configs for the Live Matches page |
| `playlist_sources_live-tv` | V3 source configs (fallback for Live TV) |
| `playlist_overrides_live-matches` | Per-channel overrides (name, order, hidden) |
| `playlist_overrides_live-tv` | Per-channel overrides for Live TV fallback |
| `defaultVersion` | Admin-configured default streaming server (V2/V3/V4/V5) |

Managed via the **admin panel** at `/admin`. The Live TV page uses V5 DLHD channels as
its primary source and falls back to the V3 KV playlist when V5 is unavailable.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Build

```bash
npm run build
npm run start
```
