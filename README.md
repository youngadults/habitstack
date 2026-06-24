# StackFlow

> Micro-habit tracker built on habit stacking — define triggers, attach tiny habits, stack your way to better routines.

## What Is It?

StackFlow is a mobile-first PWA that uses the science of **habit stacking**: instead of building habits by time ("I'll meditate at 7 AM"), you attach them to triggers you already do ("After I make coffee, I'll meditate for 2 minutes").

### Core Concept

A **Stack** has a trigger ("After I make coffee") and a set of micro-habits attached to it. You check them off throughout the day. The app tracks streaks, awards XP, and shows your progress on a heatmap.

## Features

- **Habit Stacks** — Create stacks with custom triggers, colors, and icons
- **Daily Checklist** — 2-tap logging, organized by stack
- **Streak Tracking** — Per-habit streaks with fire indicators
- **Completion Heatmap** — GitHub-style activity visualization
- **XP & Levels** — Earn XP for every completion, bonus for full stacks and streaks
- **Achievement Badges** — Unlock milestones as you build consistency
- **Offline-First** — Works without internet, syncs when connected
- **PWA** — Install on iOS/Android homescreen

## Tech Stack

- **Frontend:** SvelteKit 5 (runes mode), Tailwind CSS 4
- **Storage:** IndexedDB (offline-first via `idb`), Supabase (auth + sync)
- **Testing:** Vitest
- **Deploy:** Vercel (or any SvelteKit adapter)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (for auth + cloud sync)

### Install

```bash
git clone https://github.com/your-username/stackflow.git
cd stackflow
npm install
```

### Configure Supabase

1. Create a [Supabase](https://supabase.com) project
2. Run the schema in `supabase/schema.sql` in the SQL editor
3. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev        # Start dev server
npm run test       # Run tests
npm run check      # Type checking
npm run build      # Production build
```

### Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

For other platforms, install the appropriate SvelteKit adapter (e.g., `@sveltejs/adapter-node` for Node.js).

## Project Structure

```
src/
├── lib/
│   ├── services/
│   │   ├── auth.ts       # Supabase auth client
│   │   ├── db.ts          # IndexedDB offline storage
│   │   └── sync.ts        # Offline-to-online sync
│   ├── stores/
│   │   └── app.ts         # Svelte 5 runes-based state
│   ├── types/
│   │   └── index.ts       # TypeScript type definitions
│   └── utils/
│       ├── badges.ts       # Achievement definitions & checks
│       ├── gamification.ts # XP, levels, streaks, heatmap
│       └── helpers.ts      # Date, color, ID utilities
├── routes/
│   ├── +layout.svelte     # App shell with bottom nav
│   ├── +page.svelte       # Today view (checklist)
│   ├── auth/
│   │   ├── login/         # Sign in
│   │   └── signup/        # Create account
│   ├── stacks/
│   │   ├── +page.svelte   # Stack management
│   │   └── [id]/          # Individual stack detail
│   ├── stats/             # Heatmap & statistics
│   └── achievements/       # Badge gallery
├── app.css                # Global styles + Tailwind
└── app.html               # HTML shell
```

## Gamification Math

### XP
- 10 XP per habit completed
- +25 XP bonus for completing a full stack
- +5 XP per streak day (capped at +50)

### Levels
- Level N requires `25 × N × (N+1)` total XP
- Level 1 = 50 XP, Level 5 = 750 XP, Level 10 = 2,750 XP

### Badges
20 achievements across 5 categories:
- **Streaks:** 3, 7, 14, 30, 100 day streaks
- **Completions:** 1, 10, 50, 100, 500, 1000 habits
- **Stacks:** First stack, 5 stacks, full stack completion
- **Levels:** 5, 10, 25, 50
- **Special:** Night owl, early bird

## Offline-First Architecture

StackFlow uses IndexedDB as the primary data store:

1. **All reads/writes go to IndexedDB first** — instant, works offline
2. **Changes are queued in a sync table** — pending mutations
3. **When online, changes push to Supabase** — then pull remote updates
4. **Conflict resolution** — last-write-wins with timestamps

This means the app is fully functional offline. When connectivity returns, changes sync automatically.

## PWA Setup

The app includes a web manifest at `static/manifest.webmanifest`. To complete PWA setup:

1. Generate PNG icons at 192x192 and 512x512 from the SVG in `static/`
2. Place as `static/icon-192.png` and `static/icon-512.png`
3. The service worker at `src/sw.ts` handles caching

## Security

- Row-level security on all Supabase tables (users can only access their own data)
- No secrets in client code — only the anon key is public
- Input validation on all forms
- `.env.example` documents required variables

## License

MIT