# Validation Results

Date: 2026-08-24

## Install

- `apps/website`: `npm ci` passed.
- `apps/platform`: `npm ci` passed after upgrading Next.js to 16.3.2.
- `apps/legacy-app`: `npm ci` passed after upgrading Next.js to 16.3.2.
- `apps/wingcommander-reference`: `npm ci` passed after upgrading React Router to 7.18.2.
- `tools/automated-website-builder`: `npm ci` passed.
- `services/pipeline`: Python syntax validation passed.

## Security Audit

`npm audit --audit-level=moderate` passed with 0 vulnerabilities in every npm component:

- `apps/website`
- `apps/platform`
- `apps/legacy-app`
- `apps/wingcommander-reference`
- `tools/automated-website-builder`

## Lint / TypeScript

- `apps/platform`: `npm run typecheck` passed.
- `apps/legacy-app`: `npm run lint` passed.
- `tools/automated-website-builder`: `npm test` (`tsc --noEmit`) passed.
- `apps/wingcommander-reference`: TypeScript passed as part of `npm run build`.

## Build

- `apps/website`: `npm run build` passed; Babel compiled 8 landing files.
- `apps/platform`: `npm run build` passed on Next.js 16.3.2.
- `apps/legacy-app`: `npm run build` passed on Next.js 16.3.2.
- `apps/wingcommander-reference`: `npm run build` passed for frontend and backend workspaces on React Router 7.18.2.

## Runtime

Runtime startup was not kept running because the request is repository assembly and production hardening. The runnable commands are documented in `docs/LOCAL-DEVELOPMENT.md`.

## Database

Database files remain in component-owned source paths:

- `apps/platform/supabase`
- `apps/legacy-app/prisma/schema.prisma`
- `apps/legacy-app/backend/migrations`
- `apps/legacy-app/backend/supabase-schema.sql`
- `apps/website/docs/supabase-schema.sql`

No live Supabase/PostgreSQL connection validation was performed because no real production credentials are committed or configured as GitHub secrets.

## Redis

Legacy backend Redis client/config exists under `apps/legacy-app/backend/src/config/redis.js`. Live Redis validation was not performed because no Redis secret is configured.

## Deployment Configuration

Deployment configuration files are preserved in their owning components. Root CI was added at `.github/workflows/ci.yml` to validate installs, audits, typechecks/lint, builds, and Python syntax on push/PR.

## GitHub Secrets

`gh secret list --repo hsharmagxi-debug/kpihub-assembled` returned no configured repository secrets on 2026-08-24. To deploy from this repo, configure the required production secrets for the chosen deployment target.

## Secret Scan

- Real `.env`, `config.js`, and `credentials.md` files were excluded.
- Secret scan found code/template references to tokens, keys, and environment variables, but no committed secret values were identified in the assembled tree.
- `.env.example` files are intentionally retained.

## Final Validation Status

Source, dependency audit, build, typecheck, lint, and CI readiness passed. Live production deployment depends on adding environment secrets outside Git.