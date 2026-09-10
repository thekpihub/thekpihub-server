# Architecture

Verified against live reality 2026-09-10 (Vercel/Railway/Hostinger APIs, `gh workflow list`,
direct domain checks) — not assumed from folder names or old provenance decisions. See
`servermemory.md`'s 2026-09-10 entries for how each claim below was checked.

## What actually serves https://thekpihub.com today

```text
https://thekpihub.com
|
|-- apps/website                    the site itself (static HTML/PHP + free AI tools)
|     |-- pipeline.py                Anthropic -> OpenRouter -> MindStudio content pipeline
|     |                              (imports services/llm_gateway), publishes to
|     |                              blog.thekpihub.com's WordPress DB
|     |-- pages/api/ai-gateway.php   free tools' Claude access, calls services/llm_gateway
|     |                              over HTTP (Railway `llm-gateway` service)
|     `-- weapon tools (auditor.html, cohort.html, etc.)
|           |
|           `-- Cloudflare Worker (kpihub-api-proxy.wingcraft.workers.dev)
|                 |
|                 `-- apps/wingcommander-reference backend (Railway, ditto-wingman-backend)
|
|-- blog.thekpihub.com               WordPress, DB-only (no files on disk), fed by the
|                                     pipeline above via direct MySQL writes
|
|-- wingcommander.thekpihub.com       apps/wingcommander-reference frontend (Vercel), the
    wingman.thekpihub.com             real WingCommander premium feature. Reached from
    dittowingman.thekpihub.com        apps/website's dashboard.html "Open WingCommander"
                                      button via apps/website/open-wingman.php (root, not
                                      the dead pages/api/ copy).
```

`services/pipeline` (the *other* Python pipeline, `services/pipeline/pipeline.py`) is a second,
simpler implementation of the same content-pipeline idea — kept `workflow_dispatch`-only
(schedule removed 2026-09-05) because its writes land as unpublished `draft` posts nobody sees.
Not part of the live serving path; a candidate for archiving if it's never revived, but not
touched in this pass since it's still occasionally dispatched manually.

## Live, real, but NOT reachable at thekpihub.com

- **`apps/platform`** — a genuinely live Next.js + Supabase product (dashboard, billing via
  Razorpay/PayPal, intelligence-hub). Deployed to Vercel, but **has no thekpihub.com domain
  attached** (only `platform-hs-debugs.vercel.app` and similar Vercel-generated URLs), and
  **thekpihub.com does not link to it anywhere** (checked directly — zero references). Kept in
  scope deliberately (user decision, 2026-09-10) as part of the KPI Hub product family even
  though it's domain-disconnected from the live site today. If it's ever meant to be the
  product users land in from thekpihub.com, that's a real product decision (custom domain +
  a link from the site) — not made here.

## Archived — confirmed dead, kept for reference only, not CI-tested, not deployed

Moved to `archive/` 2026-09-10 (previously scattered across `apps/`/`tools/` alongside live
code, which is what made them easy to mistake for something maintained):

- **`archive/apps/legacy-app`** — turns out to be a *complete, separate SaaS backend*
  (auth+OAuth+RBAC+Stripe+Razorpay+admin+12-migration Postgres schema), not the small
  boilerplate its root-level Next.js scaffold suggested. Investigated in full for a possible
  `kpihub-backend` deployment (2026-09-10) and deliberately not activated — see
  `servermemory.md` for the complete reasoning (no live database has any KPI data for it to
  serve regardless of which backend hosts it).
- **`archive/tools/automated-website-builder`** — a local WSL/Ollama experiment ("AMSDV
  Pipeline"), last touched 2026-05-31, never deployed to Hostinger as its own notes intended.
- **`archive/session-docs/`** — ~65 historical planning/status/audit markdown files (SPRINT-*,
  PHASE-A/B/C/D-*, RAZORPAY-*, MIGRATION-VERIFICATION-*, etc.) that had accumulated at the repo
  root. Verified via repo-wide grep: zero references from any code or CI — pure documentation
  clutter, safe to move with no functional risk.

## Shared infrastructure (not domain-specific, used by multiple surfaces above)

- **`services/llm_gateway`** — `gateway.py`'s `claude_call()` fallback chain: direct Anthropic
  keys, then OpenRouter (separate billing account), then MindStudio.ai's Service Router (a
  third, independent billing relationship, added 2026-09-09). Used in-process by both pipeline
  scripts; `server.py` (FastAPI, deployed as the Railway `llm-gateway` service) is called over
  HTTP by `ai-gateway.php`. WingCommander's `chat.ts`/`rag.ts` keep their own separate fallback
  (they stream; this gateway doesn't).

## Recommended model going forward

1. Treat `apps/website`, `apps/wingcommander-reference`, `services/pipeline` (the active
   `apps/website/pipeline.py` one), and `services/llm_gateway` as the actual thekpihub.com
   product surface — these are what CI gates strictly and what gets debugged first when
   something's wrong with the live site.
2. Treat `apps/platform` as a related-but-currently-standalone product — don't assume it's
   reachable from thekpihub.com in any troubleshooting or user-facing claim until it's actually
   domain-mapped and linked.
3. Treat everything under `archive/` as frozen: read for history/reference, never treat a
   change there as needing to reach production, and don't let it block CI or count toward
   "is thekpihub.com healthy" checks.
4. `services/pipeline` (the dormant one) is the one item in a gray zone between "live" and
   "archived" — worth a deliberate decision (revive it properly, or move it to `archive/` too)
   next time it comes up, rather than leaving it in permanent limbo.
