# The KPI Hub Assembled

This repository is the assembled source-of-truth workspace for TheKPIHub.com.
It preserves the live website, the canonical platform migration app, legacy
backend/database evidence, automation tooling, pipeline scripts, and related
Wing Commander reference material with source provenance.

## Architecture

- `apps/website`: live public TheKPIHub.com static/PHP website from `thekpihub/thekpihub-website`.
- `apps/platform`: canonical long-term Next.js + Supabase platform app from `thekpihub/thekpihub-platform`.
- `apps/legacy-app`: archived Next.js/Express/Prisma implementation from `thekpihub/thekpihub-app`.
- `apps/wingcommander-reference`: related Wing Commander/Ditto application reference from the design-sync repo.
- `services/pipeline`: KPI Hub Python pipeline from `thekpihub/thekpihub-pipeline`.
- `tools/automated-website-builder`: autonomous website build tooling from `thekpihub/automated-website-builder`.
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
cd apps/legacy-app && npm install
cd services/pipeline && pip install -r requirements.txt
```

Copy `.env.example` files to local, untracked environment files before running.
Do not commit secrets.

## Development Commands

- Website build: `cd apps/website && npm run build`
- Platform dev: `cd apps/platform && npm run dev`
- Platform typecheck: `cd apps/platform && npm run typecheck`
- Legacy app dev: `cd apps/legacy-app && npm run dev`
- Pipeline compile smoke check: `cd services/pipeline && python -m py_compile pipeline.py`
- Builder typecheck: `cd tools/automated-website-builder && npm test`

## Environment Variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). Real `.env` files, `config.js`,
and `credentials.md` were intentionally excluded during assembly.

## Database Requirements

Database evidence stays in its owning component path to avoid duplicate copies.
The canonical platform uses Supabase. The archived legacy application contains
Prisma and SQL migration history under `apps/legacy-app`.

## Deployment

The live website points to `https://thekpihub.com`. The platform app points to
`https://thekpihub-platform.vercel.app`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Source Provenance

Every included component is mapped in [docs/SOURCE-PROVENANCE.md](docs/SOURCE-PROVENANCE.md)
and [docs/provenance/source-manifest.md](docs/provenance/source-manifest.md).
