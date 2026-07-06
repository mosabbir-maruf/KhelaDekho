# KhelaDekho

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
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Home (live scores hero + feed)
│   │   ├── layout.tsx            # Root layout (injects API URL + XKEY)
│   │   ├── scores/               # V1 score provider UI
│   │   │   ├── page.tsx          # Static shell -> ScoresClient
│   │   │   ├── ScoresClient.tsx  # Scores list, tabs, day strip, polling
│   │   │   ├── [slug]/[matchId]/ # Match detail (events, lineups, stats)
│   │   │   ├── player/[playerId]/# Player detail
│   │   │   └── team/[teamId]/    # Team detail
│   │   ├── live-matches/         # Multi-server match streaming (V2/V3/V4/V5)
│   │   ├── live-tv/              # Live TV (V5 DLHD channels, falls back to V3 KV)
│   │   ├── v2/channel/[id]/      # V2 channel player
│   │   ├── v4/channel/[id]/      # V4 channel player
│   │   ├── admin/                # Admin panel (default server + V3 playlists)
│   │   ├── docs/                 # Documentation pages
│   │   ├── about/ contact/ privacy/ terms/ search/
│   │   └── api/                  # Frontend edge routes
│   │       ├── playlist/         # V3: reads self-hosted playlist from KV
│   │       ├── iptv/proxy/       # M3U8/segment proxy for V3
│   │       ├── contact/          # Telegram contact form
│   │       └── admin/            # verify · settings · playlists (KV, admin key)
│   ├── components/ui/            # Navbar, Sidebar, VideoPlayer, etc.
│   ├── hooks/                    # useDevicePlatform, useCopyButton
│   ├── lib/                      # api.ts, config.ts, logger.ts, streamSelector.ts
│   ├── data/                     # static data (liveTv)
│   └── types/                    # global type declarations
├── public/                       # logo, meta image
├── next.config.ts
└── wrangler.toml                 # Cloudflare Pages config + KV binding
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

The V3 playlist and admin settings are stored in a bound **Cloudflare KV** namespace
(`KHELA_SETTINGS` in `wrangler.toml`).

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
