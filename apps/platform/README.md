# The KPI Hub Platform

This folder is the migration-safe canonical app foundation for the unified KPI Hub platform.

Current goal:

- preserve the existing live static site while the new app is built
- port Supabase auth and shared data models first
- replace the static dashboard with the richer Next.js product experience

## Initial scope

- Next.js App Router foundation
- Supabase auth scaffolding
- protected `/dashboard` routing
- draft API surface for profiles, decisions, and billing
- draft SQL migration for the unified data model

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase and Stripe values
3. Install dependencies
4. Run `npm run dev`

## Notes

- Secrets must never be committed.
- The static/PHP site remains the live source during migration.
- This app is intended to become the long-term canonical product shell.
