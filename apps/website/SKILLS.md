# SKILLS — thekpihub-website

> **Role in the ecosystem:** the public face — live marketing + tools site at
> **https://thekpihub.com** (the production property). Top of the funnel.

## Purpose
Marketing, SEO, pricing, and the free/lead-gen tools (auditor, benchmarks,
narrative, cohort, validator, etc.) that attract users and funnel them into the
product and paid tiers.

## Tech stack
- **Frontend:** vanilla HTML/CSS + inline React 18 (unpkg CDN); `landing/*.jsx` pre-compiled to `.js`
- **Server:** PHP on Hostinger (Stripe handlers, Wingman handoff)
- **Auth:** Supabase · **Billing:** Stripe embedded checkout
- **Analytics:** GA4 + Microsoft Clarity · **AI:** Anthropic (browser-side via `api-key-modal.js`)
- **Hosting:** Hostinger (apex + www → `hstgr.net` CDN), DNS on Hostinger nameservers

## Capabilities ("skills")
- Public marketing/SEO pages + sitemap/robots
- Lead-gen tools (auditor, benchmarks, cohort, narrative, validator, stack-scorer…)
- Stripe checkout (`stripe-session.php`, `stripe-webhook.php`)
- "Wingman" handoff to the AI agent (`open-wingman.php`, HMAC `HANDOFF_SECRET`)
- Content pipeline (`pipeline.py` + daily/premium GitHub Actions)

## Key entry points
- `index.html`, `pricing.html`, tool pages (`auditor.html`, `benchmarks.html`, …)
- `config.js` (server-only, real keys) / `config.example.js` (template)
- `.htaccess` (server-only, SetEnv secrets)
- `.github/workflows/deploy-hostinger.yml` — governed SSH deploy (`.deploy-exclude`)

## Deployment
Governed GitHub Actions → Hostinger over SSH (rsync): checks → manual approval →
deploy → smoke test. See `docs/DEPLOYMENT_GITHUB_ACTIONS.md`. (Replaces the old
hPanel Git auto-deploy webhook.)
**State (2026-06-28):** workflow merged to `main` and active, but **not yet
operational** — pending deploy keypair, the 6 SSH secrets, the `production`
environment (approval gate), and disabling the old webhook. Live site is still
served via the existing Hostinger webhook until that setup is done.

## Relationships with the other 3 repos
| Repo | Relationship |
|---|---|
| **thekpihub-app** | This site funnels users into the product (login/dashboard/upgrade). Shares **Supabase auth** + **Stripe billing**. Pricing tiers here map to the app's entitlements. |
| **thekpihub-wing-commander** | `open-wingman.php` hands off authenticated users to **agent.thekpihub.com** via an HMAC secret. wing-commander also serves copies of these tool pages (`weapons/`) as a downtime fallback. |
| **thekpihub-pipeline** | Generates articles/benchmarks published to the WordPress blog on this domain. Note: a divergent `pipeline.py` also lives here — canonical-source decision pending. |

## Shared services (whole ecosystem)
Supabase (auth/DB) · Anthropic (AI) · Stripe (billing) · `thekpihub.com` domain.

## Status
LIVE production. Treat as fragile — verify before deploy; never delete server-only
`config.js`/`.htaccess`. Rollback anchor: tag `pre-governance-2026-06-28`.
Held for review: **PR #9** (GCP migration scaffolding) — competes with the
Hostinger deploy direction; do not merge without a hosting decision.

_Last updated: 2026-06-28 (post-consolidation)._

## TailwindCSS (landing redesign — branch `design/tailwind-landing`)
- Local Tailwind v3 build: `tailwind.config.js` (brand tokens: navy/gold/teal, Source Serif 4/Beiruti/Manrope), `landing/tailwind-input.css` → `npm run build:css` → `landing/tailwind.css` (committed, linked last in `index.html`).
- **preflight disabled** (utilities-only) so the legacy `landing.css` stays intact for not-yet-converted sections — the page is a working hybrid.
- After editing any `landing/*.jsx`, recompile: `npx babel landing/<f>.jsx --out-file landing/<f>.js`, then `npm run build:css`.
- Converted: Hero, Problem, Platform, Personas, Features, Proof, How, Pricing, Close, Footer. Pending: Ticker, MetricStrip, Pipeline, Compare, Integrations, Faq, Founder, Capture. Bespoke viz widgets kept on `landing.css`.
