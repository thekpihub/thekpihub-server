# Ditto Wingman — backend

Express + TypeScript API. Deployed on Railway.

**Corrected 2026-09-04:** this doc previously said the frontend it serves lives at
`agent.thekpihub.com`. That domain turned out to be owned by a different, inaccessible Vercel
account (see `servermemory.md`, 2026-09-04) — not anything deployed from this repo. The real
frontend is now `wingcommander-frontend` (Vercel team `hs-debugs`), live at
`https://wingcommander.thekpihub.com`, sourced from this same repo
(`apps/wingcommander-reference`, its `vercel.json` unchanged). `agent.thekpihub.com` was left
alone — reclaiming it, if ever wanted, needs finding whoever/whatever Vercel account currently
owns it.

## Routes

| Route | Purpose |
|---|---|
| `GET /api/health` | Healthcheck. Railway probes this — do not remove or rename it. |
| `/api/auth` | Login + the short-lived JWT handoff from thekpihub.com |
| `/api/chat` | SSE-streamed chat |
| `/api/execute` | Code execution |
| `/api/rag` | Document upload, embedding, retrieval |
| `/api/image` | Image generation and vision |

Rate limit: 60 requests/minute on `/api/*`.

## Local development

```bash
npm install                                   # from the repo root (npm workspaces)
cp .env.example .env                          # then fill it in
npm run dev --workspace=ditto-wingman-backend # tsx watch, port 4000
```

Requires Node 22 (`engines.node: 22.x`). The frontend expects the API at `VITE_API_URL`.

## Environment

Set in Railway, never committed: `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `HANDOFF_SECRET`, `FRONTEND_URL`, `PORT`.

`HANDOFF_SECRET` must match the value on thekpihub.com — it signs the premium-subscriber handoff.

## Deployment

Railway project **`jubilant-growth`** → service **`ditto-wingman-backend`** → environment
`production`. Builder RAILPACK.

```
build  npm run build --workspace=ditto-wingman-backend
start  npm run start --workspace=ditto-wingman-backend
health /api/health
domain ditto-wingman-backend-production-85f6.up.railway.app  (port 4000)
```

`vercel.json` at the repo root rewrites `/api/*` from `wingcommander.thekpihub.com` (the
frontend's real domain as of 2026-09-04 — see the correction at the top of this file) to that
host. **If the Railway domain ever changes, update that rewrite** or every API call 404s at the
edge while the frontend still loads — which looks like a working site with a dead app.

### Two deployment traps, both hit in production

**1. `watchPatterns` is `/backend/**`.** Commits that don't touch `backend/` are correctly
SKIPPED. A SKIPPED deployment carries **no snapshot**, so it cannot be redeployed — the API
returns *"Cannot redeploy without a snapshot"* and the service must be deployed from the
dashboard or CLI instead.

**2. Railway coalesces rapid pushes.** Two commits pushed minutes apart are evaluated as one, so a
backend change followed quickly by a root-only change is skipped entirely. Push backend changes
alone and let them build before pushing anything else.

### History worth knowing

The service ran fine until **2026-07-10**, when its deployment was removed — the Hobby trial
credit ran out ("0 days or $1.00 left"), not a crash. Its last real build passed its healthcheck
cleanly. Because every later commit was skipped, the service was left with no snapshot and no
service domain, so all documented hostnames returned 404 for roughly six weeks.
