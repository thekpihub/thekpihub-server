# The KPI Hub Assembled

This repository is the assembled source-of-truth workspace for TheKPIHub.com.
It preserves the live website, the canonical platform migration app, legacy
backend/database evidence, automation tooling, pipeline scripts, and related
Wing Commander reference material with source provenance.

## Architecture

- `apps/website`: live public TheKPIHub.com static/PHP website from `thekpihub/thekpihub-website`.
- `apps/platform`: live Next.js + Supabase KPI Hub product (dashboard, billing) from
  `thekpihub/thekpihub-platform` — domain-mapped to `app.thekpihub.com` (2026-09-10), verified
  live (`/`, `/login` 200; `/dashboard` correctly auth-gates). Not yet linked from
  `apps/website`'s own pages. See `docs/ARCHITECTURE.md`.
- `apps/wingcommander-reference`: **NOT** reference-only despite the name — Ditto Wingman,
  load-bearing for `apps/website`'s free tools (via a Cloudflare Worker) and the live
  WingCommander premium feature at wingcommander.thekpihub.com.
- `services/pipeline`: KPI Hub Python pipeline from `thekpihub/thekpihub-pipeline` (dormant,
  `workflow_dispatch`-only — see `docs/ARCHITECTURE.md`; `apps/website/pipeline.py` is the
  active scheduled one).
- `services/llm_gateway`: shared resilient Claude-calling module (Anthropic → OpenRouter →
  MindStudio.ai fallback chain), used by the pipelines and `apps/website/pages/api/ai-gateway.php`.
- `archive/apps/legacy-app`: archived Next.js/Express/Prisma implementation from `thekpihub/thekpihub-app` — confirmed dead 2026-09-10, not deployed, see `docs/ARCHITECTURE.md`.
- `archive/tools/automated-website-builder`: autonomous website build tooling from `thekpihub/automated-website-builder` — confirmed a local, never-deployed experiment.
- `archive/session-docs`: ~65 historical planning/status markdown files, moved out of the repo root 2026-09-10 (zero code/CI references, pure documentation).
- `docs`: assembly, deployment, recovery, environment, and provenance records.

## Required Runtimes

- Node.js for website tooling, Next.js apps, and TypeScript tools.
- npm, using the committed `package-lock.json` files inside each component.
- Python 3 for `services/pipeline`.
- Supabase/PostgreSQL for platform and legacy database-backed functionality.
- Stripe configuration for billing paths.

## Local Setup

Each runnable component remains intentionally self-contained. Install and run
from the relevant component directory.

```bash
cd apps/website && npm install
cd apps/platform && npm install
cd archive/apps/legacy-app && npm install
cd services/pipeline && pip install -r requirements.txt
```

Copy `.env.example` files to local, untracked environment files before running.
Do not commit secrets.

## Development Commands

- Website build: `cd apps/website && npm run build`
- Platform dev: `cd apps/platform && npm run dev`
- Platform typecheck: `cd apps/platform && npm run typecheck`
- Legacy app dev: `cd archive/apps/legacy-app && npm run dev`
- Pipeline compile smoke check: `cd services/pipeline && python -m py_compile pipeline.py`
- Builder typecheck: `cd archive/tools/automated-website-builder && npm test`

## Environment Variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). Real `.env` files, `config.js`,
and `credentials.md` were intentionally excluded during assembly.

## Database Requirements

Database evidence stays in its owning component path to avoid duplicate copies.
The canonical platform uses Supabase. The archived legacy application contains
Prisma and SQL migration history under `archive/apps/legacy-app`.

## Deployment

The live website points to `https://thekpihub.com`. The platform app is domain-mapped to
`https://app.thekpihub.com` (added 2026-09-10 via the Vercel + Hostinger DNS APIs, verified
live) — not yet linked from the main site's own pages. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Source Provenance

Every included component is mapped in [docs/SOURCE-PROVENANCE.md](docs/SOURCE-PROVENANCE.md)
and [docs/provenance/source-manifest.md](docs/provenance/source-manifest.md).
