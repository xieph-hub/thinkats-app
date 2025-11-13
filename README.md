
# Resourcin — Next.js Starter

Multi‑page Next.js 14 (App Router, TypeScript) with Tailwind and a Markdown Insights blog.

## Routes
- `/` — Home
- `/services` — Talent Acquisition & EOR
- `/jobs` — Job search (connect to your ATS via `/api/jobs`)
- `/insights` — Lists Markdown posts from `content/insights`
- `/insights/[slug]` — Renders individual post
- `/about`, `/contact`

## Quickstart
```bash
pnpm i   # or: npm i / yarn
pnpm dev # http://localhost:3000
```

## Insights — how to publish
Add a Markdown file to `content/insights/`:

```md
---
title: My Title
date: 2025-11-13
category: Workforce Trends
excerpt: One‑line summary.
---
Write your content here…
```

Commit and deploy — the list & pages are generated at build time.

## Jobs API
Replace `app/api/jobs/route.ts` with your ATS integration. The UI on `/jobs` is currently a static search box (no JS) to keep the starter clean. You can fetch from `/api/jobs` on a client component or hydrate a server component as needed.

## Deploy to Vercel
- Push to GitHub, then import the repo on Vercel.
- Framework preset: Next.js.
- No extra build settings required.
