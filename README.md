# KhelaDekho

Live sports streaming dashboard & aggregator client built with Next.js 16.

---

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **hls.js** & **Shaka Player** (dynamically imported for HLS/DASH with ClearKey DRM)

---

## API

Consumes the KhelaDekho API:

- **V1** — live scores, fixtures, results, and match/player/team detail from the
  configured score provider (`/api/v1/*`).
- **V2 / V4** — channel streams for the Live Matches page.

The backend URL and shared key are the single source of truth in `src/lib/api.ts`
(`getApiBaseUrl` / `getXKey`); other shared constants live in `src/lib/config.ts`.

## Environment

See `.env.example` for the full list. Key variables:

```env
# Backend API + shared key (injected server-side, never shipped to the client)
KHELADEKHO_API_URL=https://your-api.workers.dev
XKEY=your-xkey-here

# Optional: displayed score-provider name (keep in sync with backend SCORE_PROVIDER)
NEXT_PUBLIC_SCORE_PROVIDER=Goal

# Contact form
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

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
