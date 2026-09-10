# CI/CD — thekpihub-app

Two GitHub Actions workflows:

- **`.github/workflows/ci.yml`** — runs on every PR and on push to `main`.
  - `frontend`: `npm ci` → `npm run lint` → `npm run build` (Next.js 16).
  - `backend`: `npm ci` → `npm test` (Jest) → `docker build` (validates `backend/Dockerfile`).
  - Active immediately; no secrets required.

- **`.github/workflows/deploy.yml`** — continuous deployment, **dormant by default**.

## Deploy configs

- **`vercel.json`** (root) — Next.js frontend build settings. Vercel project Root Directory = `/`.
- **`backend/railway.toml`** — backend image build + health check. In Railway, set the
  service **Root Directory = `backend`** (the Dockerfile uses `backend/` as its build context).

## Enabling deployment

The deploy workflow is **manual-only**: it has no push trigger, so merges to `main`
never auto-deploy. A deploy happens only when you:

1. Set repository variable **`DEPLOY_ENABLED`** = `true`
   (Settings → Secrets and variables → Actions → **Variables**) — your arm switch, AND
2. Run it by hand: **Actions → Deploy (gated) → Run workflow**.

> Note: required-reviewer environment protection needs a paid plan for private repos,
> so the manual trigger + `DEPLOY_ENABLED` is the gate. The `production` environment
> exists (without a protection rule) and can hold environment-scoped secrets if desired.

### Required secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Used by | Where to get it |
|---|---|---|
| `VERCEL_TOKEN` | frontend | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | frontend | `vercel link` → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | frontend | `vercel link` → `.vercel/project.json` |
| `RAILWAY_TOKEN` | backend | Railway → Account → Tokens |
| `RAILWAY_SERVICE_ID` | backend | Railway service settings |

### Turn-on checklist

- [ ] Create Vercel project for the frontend; capture org/project IDs.
- [ ] Create Railway service for `backend/`; capture token + service ID.
- [ ] Add the 5 secrets above.
- [ ] Create the `production` environment with a required reviewer.
- [ ] Set `DEPLOY_ENABLED=true`.
- [ ] Trigger via **Run workflow** (workflow_dispatch) and approve the gate once.

Until then, pushes to `main` start the workflow but the deploy jobs are skipped.
