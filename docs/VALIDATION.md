# Validation Results

Date: 2026-08-24

## Install

- `apps/website`: `npm ci` passed. npm audit reported 4 vulnerabilities: 1 low, 3 high.
- `apps/platform`: `npm ci` passed. npm audit reported 4 high vulnerabilities.
- `apps/legacy-app`: `npm ci` passed. npm audit reported 7 vulnerabilities: 1 moderate, 6 high.
- `apps/wingcommander-reference`: `npm ci` passed. npm audit reported 7 vulnerabilities: 1 low, 2 moderate, 4 high.
- `tools/automated-website-builder`: `npm ci` passed. npm audit reported 1 low vulnerability.
- `services/pipeline`: no package install was run; `requirements.txt` exists and Python compile validation passed.

## Lint / TypeScript

- `apps/platform`: `npm run typecheck` passed.
- `apps/legacy-app`: `npm run lint` passed.
- `tools/automated-website-builder`: `npm test` (`tsc --noEmit`) passed.
- `apps/wingcommander-reference`: TypeScript passed as part of `npm run build`.

## Build

- `apps/website`: `npm run build` passed; Babel compiled 8 landing files.
- `apps/platform`: `npm run build` passed; Next.js generated static and dynamic routes successfully.
- `apps/legacy-app`: `npm run build` passed; Next.js generated static routes successfully.
- `apps/wingcommander-reference`: `npm run build` passed for frontend and backend workspaces.

## Runtime

Runtime startup was not kept running because the task is assembly/recovery. The runnable commands are documented in `docs/LOCAL-DEVELOPMENT.md`.

## Database

Database files were not duplicated into a central folder. They remain in component-owned source paths:

- `apps/platform/supabase`
- `apps/legacy-app/prisma/schema.prisma`
- `apps/legacy-app/backend/migrations`
- `apps/legacy-app/backend/supabase-schema.sql`
- `apps/website/docs/supabase-schema.sql`

No live Supabase/PostgreSQL connection validation was performed because credentials were intentionally excluded.

## Redis

No authoritative Redis runtime configuration was validated in the assembled components.

## Deployment Configuration

Deployment config files were preserved in their owning components. No production deployment settings were changed.

## Security Scan

- Real `.env`, `config.js`, and `credentials.md` files were excluded.
- Secret scan found code/template references to tokens, keys, and environment variables, but no committed secret values were identified in the assembled tree.
- `.env.example` files are intentionally retained.

## Final Validation Status

Build and static validation passed. Production-ready status is blocked only by unresolved npm audit vulnerabilities and lack of live external service credential validation.