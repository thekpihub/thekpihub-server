# SKILLS — thekpihub-app

> **Role in the ecosystem:** ⭐ the canonical application (product) of The KPI Hub.
> Frontend + the core SaaS API. The other repos orbit this one.

## Purpose
The customer-facing KPI intelligence product: account, dashboards, KPI tracking,
billing, and admin. Consolidates the frontend with the SaaS backend that was
migrated out of the now-archived `thekpihub` monolith.

## Tech stack
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, TypeScript (`src/app/`)
- **Backend:** Node.js + Express (JS) under `backend/` — standalone service
- **Data:** Prisma + SQL migrations (`prisma/`, `backend/migrations/001–012`), Supabase Postgres (`backend/supabase-schema.sql`)
- **AI:** Anthropic API (Claude)

## Capabilities ("skills")
- Auth & sessions (Supabase-backed), RBAC, plan gating
- Billing (Stripe) and invoicing
- KPI + dashboard domain APIs
- Admin surface + audit logging
- Reference material for rebuilds in `reference/` (legacy Next 14 pages, design system)

## Key entry points
- `src/app/layout.tsx`, `src/app/page.tsx` — Next.js app shell
- `backend/src/index.js` / `backend/src/app.js` — Express API
- `backend/src/routes/{auth,billing,kpis,admin,ai}.js`
- `backend/migrations/` — schema source of truth

## Deployment
- Frontend → Vercel (intended). Backend → container (Dockerfile present) / Railway-style host.

## Relationships with the other 3 repos
| Repo | Relationship |
|---|---|
| **thekpihub-website** | The marketing site funnels visitors here (login/dashboard/upgrade). Shares **Supabase auth** + **Stripe billing**. The website's tool pages are the top-of-funnel for this product. |
| **thekpihub-wing-commander** | The AI "Wingman" agent — bundled in Growth/Enterprise tiers sold by this app. Shares **Anthropic** + **Supabase**. This app owns billing/entitlement; Wingman owns the agent runtime. |
| **thekpihub-pipeline** | Produces content/benchmarks that feed the product's intelligence surfaces and the marketing blog. Loose coupling via shared data + WordPress. |

## Shared services (whole ecosystem)
Supabase (auth/DB) · Anthropic (AI) · Stripe (billing) · `thekpihub.com` domain.

## Status
Backend + prisma + reference absorbed from the archived monolith (PR #2).
Frontend is still a near-scaffold being built out.
