# Signal wiring design — KPI Monitor → global decision feed

> **Recreated 2026-09-10.** The original design doc under this exact filename, cited by
> `.github/workflows/publish-signals.yml`, `scripts/publish-signals.ts`, and
> `supabase/migrations/0003_module_snapshots_worker_write.sql`, does not exist anywhere in this
> repo's git history — confirmed via `git log --all --full-history` and a full-repo filename
> search, not assumed missing. Either it lived outside this repo and was never committed, or it
> was lost before this repo's history begins. This version is reconstructed from the actual
> code + a live audit of the production Supabase project, not from memory of the original —
> treat it as the current source of truth, not a restoration of the original wording.

## What this is

A scheduled worker (`scripts/publish-signals.ts`, run daily by
`.github/workflows/publish-signals.yml`) that reads KPI data from `kpihub-backend`, evaluates a
small set of rules against it, and writes the results as one global "decision feed" entry per
day into `apps/platform`'s own Supabase table `module_snapshots` (`organization_id is null`,
`module_id = 'kpi-monitor'`) — which the live dashboard's `hub.ts` (`buildDecisionFeed`) reads
back out to render the KPI Monitor card.

## Signal rules (v1 — both implemented, no others exist yet)

1. **Missed target** (`checkMissedTarget`): the KPI's current value is on the wrong side of its
   nearest past-due target. Severity scales with the gap (`high` ≥20%, `medium` ≥8%, else `low`).
2. **Trend reversal** (`checkTrendReversal`): the most recent 3-month trend point flips sign vs.
   the one before it. `opportunity` if it flipped to improving, `risk` if to declining; severity
   scales with the magnitude of the reversal (`high` ≥25%, `medium` ≥10%, else `low`).

Both explicitly skip `direction: "target_is_better"` KPIs — not handled in v1.

## Data source: `kpihub-backend`

`GET /api/kpis?limit=200&status=active`, then per KPI `GET /api/kpis/:id/targets` and
`GET /api/kpis/:id/trend?months=3`. The actual backend these routes map to is
`archive/apps/legacy-app/backend` (its own `ci.yml` tags a Docker image literally
`kpihub-backend`, and its route guards — `requirePermission('kpis:read')` on exactly these three
paths — match this script's expectations exactly, confirmed by direct route inspection, not
coincidence of naming).

**Status as of 2026-09-10: not deployed anywhere.** This is the actual root blocker for
everything below it — see `CLAUDE.md`'s "kpihub-backend deployment investigated... deliberately
declined" entry for the full reasoning (it's a complete separate SaaS backend, not a small
KPI-data reader, and `apps/platform`'s real production schema has zero KPI tables regardless of
which backend serves this — the underlying product capability doesn't exist yet). Revisit that
decision before revisiting this one; they're the same blocker.

## Write side: Supabase `module_snapshots`, worker-scoped RLS

Deliberately **not** the `service_role` key. A dedicated, narrowly-scoped Supabase Auth user
("the worker") signs in via `supabase.auth.signInWithPassword`, then upserts one row (unique on
`module_id, snapshot_date` for global rows — migration `0003`'s partial index). RLS restricts
that specific user to `organization_id is null` writes only — a leaked worker credential can
never touch org-scoped rows or any other table.

**Status as of 2026-09-10, confirmed via a direct query against the live
`eeuwkislidznpgdbvvbo` project (not assumed from the migration file, which was stale):**
- `module_snapshots` table, RLS, and the read policy (migration `0002`) — live.
- Migration `0003` (worker write policies + the unique daily index) — **live**, despite the
  checked-in file having said "DRAFT — NOT YET APPLIED" until this same session corrected it.
- The dedicated worker Supabase Auth user — **exists live** (uuid
  `2ef527c0-0bf6-408e-a31a-ede0055de3b4`).
- **Its login credentials are not recorded anywhere** — not in this repo, not in
  `Credentials/.env`. `SUPABASE_WORKER_EMAIL` / `SUPABASE_WORKER_PASSWORD` (the two GitHub repo
  secrets the workflow needs) remain unset. Either they're known to the account owner from
  however this was originally set up, or the account's password needs a deliberate admin reset
  — not done unprompted, since it's a real production-credential action.

## Full required-steps checklist (as of 2026-09-10)

| # | Step | Status |
|---|---|---|
| 1 | Deploy `kpihub-backend` somewhere real | ❌ Not done — the actual blocker, a deferred product/infra decision |
| 2 | Provision an org + a `kpis:read`-only service user in that backend's own DB | ❌ Blocked on #1 |
| 3 | Mint `KPIHUB_SERVICE_JWT` for that user (note: its `jwt.js` defaults access tokens to a 15-minute expiry — a static secret needs either a custom long-lived mint or a refresh step added to this workflow) | ❌ Blocked on #2 |
| 4 | Set `KPIHUB_API_URL` repo variable | ❌ Blocked on #1 |
| 5 | Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` repo variables | ✅ Done 2026-09-10 |
| 6 | Set `SUPABASE_WORKER_EMAIL` / `SUPABASE_WORKER_PASSWORD` repo secrets | ❌ Credentials for the existing worker account aren't recorded anywhere found so far |
| 7 | Flip `PUBLISH_SIGNALS_DRY_RUN` to `false` once 1-6 are real and a real (not import-failure) dry run looks sane | ❌ Last step |

See `servermemory.md`'s 2026-09-10 entries for the full investigation trail.
