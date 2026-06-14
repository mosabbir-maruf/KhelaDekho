<div align="center">
  <img src="./public/logo.png" alt="KhelaDekho Logo" width="90" height="90" />
  
  # KhelaDekho
  ### Live Sports Streaming Dashboard & Aggregator Client

  <div>
    <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=next.js&color=000000" alt="Next.js badge" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6"/>
    <img src="https://img.shields.io/badge/-Tailwind%20CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=38B2AC"/>
    <img src="https://img.shields.io/badge/-shadcn/ui-black?style=for-the-badge&logoColor=white&logo=shadcnui&color=000000"/>
    <img src="https://img.shields.io/badge/-npm-black?style=for-the-badge&logoColor=white&logo=npm&color=000000"/>
    <img src="https://img.shields.io/badge/-Vercel-black?style=for-the-badge&logoColor=white&logo=vercel&color=000000"/>
  </div>
</div>

---

> [!IMPORTANT]
> **KhelaDekho Frontend Client**. This application integrates with the KhelaDekho Scraping Aggregator API and Edge Workers to provide a modern, high-performance sports streaming platform featuring automated match updates, TV channels cataloging, and secure DRM/ClearKey decryption stream players.

---

## 📋 Table of Contents
- [Introduction](#introduction)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Configurations](#environment-configurations)
- [Quick Start](#quick-start)

---

## Introduction
KhelaDekho is a modern, responsive web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Framer Motion**. It serves as the frontend dashboard for sports fans to view upcoming fixtures, track live match stats, and stream TV channels using built-in HLS/DASH players.

---

## Tech Stack
### Core
- **Next.js 16 (App Router)** & **React 19**
- **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **shadcn/ui** design patterns
- **Lucide React** for UI icons

### Video Playback
- **hls.js** & **Shaka Player** - Dynamically imported packages to handle Adaptive Bitrate Streaming (ABR) with ClearKey DRM decryption.

### Motion & Animation
- **Framer Motion** - Fluid micro-animations for page transitions, sidebar shifts, and dialog entries.

---

## Project Structure

```plaintext
kheladekho/
├── .env.example             # Example environment file template
├── .env.local               # Local developer environment overrides
├── package.json             # NPM package manifest & script definitions
├── tsconfig.json            # TypeScript compiler configuration
├── next.config.ts           # Next.js server configuration
├── public/                  # Static assets (images, fonts, manifest icons)
└── src/
    ├── app/                 # Next.js App Router Pages & API Routes
    │   ├── layout.tsx       # Root layout and global theme provider mounting
    │   ├── page.tsx         # Dashboard landing page (Live & Upcoming Matches)
    │   ├── globals.css      # Core styling rules and theme tokens
    │   ├── manifest.ts      # WebApp app manifest
    │   ├── robots.ts        # Search crawler directive overrides
    │   ├── sitemap.ts       # Dynamic sitemap generator
    │   ├── about/           # About & credits page
    │   ├── channels/        # Channel list catalogue with query filters
    │   ├── contact/         # Contact & feedback form interface
    │   ├── privacy/         # Privacy Policy page
    │   ├── terms/           # Terms of Service page
    │   ├── search/          # Command-palette query landing page
    │   ├── live/            # Channel player playback route
    │   │   └── [channel_key] # Dynamic route for the live player component
    │   ├── leagues/         # Tournament filtered collections
    │   │   └── [league_key]  # Dynamic route for specific leagues
    │   └── api/             # Next.js Serverless API endpoints
    │       ├── contact/     # Contact form Telegram notification endpoint
    │       ├── stream/      # Secure proxy signing backend extractor
    │       └── stars/       # GitHub metadata repo sync
    ├── components/          # React components
    │   └── ui/              # Global dashboard UI components
    │       ├── VideoPlayer.tsx  # Dynamic Adaptive player handling HLS/DASH ClearKey DRM
    │       ├── Navbar.tsx       # Glassmorphic top navigation bar
    │       ├── Sidebar.tsx      # Sidebar collapsing navigation
    │       ├── CommandSearch.tsx# Universal search overlays
    │       ├── CodeBlock.tsx    # Code highlighting wrapper
    │       ├── CopyButton.tsx   # Share copy button helper
    │       └── ThemeProvider.tsx# Theme context wrapper
    └── lib/                 # Shared client utilities
        └── api.ts           # Client fetch wrappers and data interface models
```

---

## Environment Configurations

To configure the frontend client, create a `.env.local` file in the root directory:

```env
# Telegram Notification Integration (for contact form submissions)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# KhelaDekho Scraper API configurations
# This secret MUST match the backend API's KHELADEKHO_SECRET_KEY
KHELADEKHO_SECRET_KEY=production-super-secret-key-fallback-change-me
KHELADEKHO_API_URL=https://your-api.workers.dev

# Google Analytics 4 (Optional — leave blank to disable)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Quick Start

### Prerequisites
- **Node.js 20+**
- A backend server running (FastAPI backend or Cloudflare Worker)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and populate the required keys.

### 3. Launch Development Server
```bash
npm run dev
```
Open `http://localhost:3000` inside your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```