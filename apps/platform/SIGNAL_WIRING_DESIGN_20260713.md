# Signal wiring design — KPI Monitor → global decision feed

> **Recreated 2026-09-10, rewired same day.** The original design doc under this exact filename,
> cited by `.github/workflows/publish-signals.yml`, `scripts/publish-signals.ts`, and
> `supabase/migrations/0003_module_snapshots_worker_write.sql`, does not exist anywhere in this
> repo's git history — confirmed via `git log --all --full-history` and a full-repo filename
> search, not assumed missing. This version is reconstructed from the actual code + a live audit
> of the production Supabase project, then updated the same day once the underlying architecture
> changed (see "2026-09-10 rewire" below) — treat it as the current source of truth.

## What this is

A scheduled worker (`scripts/publish-signals.ts`, run daily by
`.github/workflows/publish-signals.yml`) that reads KPI data, evaluates a small set of rules
against it, and writes the results as one global "decision feed" entry per day into
`apps/platform`'s own Supabase table `module_snapshots` (`organization_id is null`,
`module_id = 'kpi-monitor'`) — which the live dashboard's `hub.ts` (`buildDecisionFeed`) reads
back out to render the Intelligence Hub's decision feed (`/dashboard/intelligence-hub`).

## 2026-09-10 rewire: KPI data now lives in `apps/platform` itself

The original design (and the first recreation of this doc, earlier the same day) assumed KPI
data came from an external `kpihub-backend` service via `GET /api/kpis` + a scoped JWT. That
service (`archive/apps/legacy-app/backend`) was never deployed, and deploying it was
deliberately declined (it's a complete separate SaaS backend with its own billing/auth, and
would duplicate `apps/platform`'s already-live system for a database that would start and stay
empty regardless — see `CLAUDE.md`).

**Decision, 2026-09-10: add KPI data directly to `apps/platform`'s own database instead.**
Migration `0004_kpis_core.sql` adds `public.kpis` / `kpi_values` / `kpi_targets`, owner-scoped by
`user_id` (not `organization_id` — confirmed live that this project has exactly 1 real profile
and 0 organizations, so an org requirement would be a dead end for the only real user today).
`/api/kpis` (+ `/api/kpis/:id/values`, `/api/kpis/:id/targets`) exposes this through
`apps/platform`'s existing cookie-session auth, and `/dashboard/kpi-monitor` is the UI where a
real user actually enters KPIs, targets, and periodic values.

`scripts/publish-signals.ts` was rewritten the same day to read these tables directly via the
Supabase client instead of an HTTP call to an external backend — **this removes
`KPIHUB_API_URL` and `KPIHUB_SERVICE_JWT` from the required-env-vars list entirely**, since the
worker now runs against the same database it already writes `module_snapshots` to.

## Signal rules (v1 — both implemented, no others exist yet)

1. **Missed target** (`checkMissedTarget`): the KPI's current value (latest `kpi_values` row) is
   on the wrong side of its nearest past-due target (`kpi_targets`). Severity scales with the
   gap (`high` ≥20%, `medium` ≥8%, else `low`).
2. **Trend reversal** (`checkTrendReversal`): the most recent recorded value's change vs. the one
   before it flips sign (computed from up to the last 6 `kpi_values` rows). `opportunity` if it
   flipped to improving, `risk` if to declining; severity scales with the magnitude of the
   reversal (`high` ≥25%, `medium` ≥10%, else `low`).

Both explicitly skip `direction: "target_is_better"` KPIs — not handled in v1.

## Write side: Supabase `module_snapshots`, worker-scoped RLS

Deliberately **not** the `service_role` key. A dedicated, narrowly-scoped Supabase Auth user
("the worker") signs in via `supabase.auth.signInWithPassword`, then:
- **reads** every user's active `kpis`/`kpi_values`/`kpi_targets` rows (migration `0004`'s
  `*_select_worker` policies — this account, and only this account, can see across all users;
  every other user only ever sees their own rows via the `*_manage_own` policies)
- **writes** one global `module_snapshots` row per day (migration `0003`'s
  `module_snapshots_insert_worker` / `_update_worker` policies, unique on
  `module_id, snapshot_date` for global rows)

A leaked worker credential can read all users' KPI data (by design — it needs to, to compute
global signals) but can never write anything except that one global `module_snapshots` row, and
can never touch any other table.

**Status as of 2026-09-10:**
- `kpis`/`kpi_values`/`kpi_targets` (migration `0004`) — written, applied via the account owner
  running it directly in Supabase's SQL editor (the harness's own safety classifier blocked
  applying a production schema change via an automated API call, correctly — a human ran it).
- `module_snapshots` table, RLS, and the read policy (migration `0002`), plus the worker write
  policies + unique daily index (migration `0003`) — confirmed live via a direct query against
  the live `eeuwkislidznpgdbvvbo` project.
- The dedicated worker Supabase Auth user — **exists live** (uuid
  `2ef527c0-0bf6-408e-a31a-ede0055de3b4`). Its login credentials
  (`SUPABASE_WORKER_EMAIL`/`SUPABASE_WORKER_PASSWORD`) — see the required-steps table below for
  current status.

## Full required-steps checklist (as of 2026-09-10, post-rewire)

| # | Step | Status |
|---|---|---|
| 1 | Add `kpis`/`kpi_values`/`kpi_targets` schema (migration `0004`) | Written; needs to be run against production (blocked from automated apply by the harness's own safety classifier — run directly in Supabase SQL editor) |
| 2 | `/api/kpis` + sub-routes on `apps/platform` | ✅ Done 2026-09-10 |
| 3 | `/dashboard/kpi-monitor` UI | ✅ Done 2026-09-10 |
| 4 | Rewire `publish-signals.ts` to read Supabase directly (drops `KPIHUB_API_URL`/`KPIHUB_SERVICE_JWT`) | ✅ Done 2026-09-10 |
| 5 | Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` repo variables | ✅ Done 2026-09-10 |
| 6 | Set `SUPABASE_WORKER_EMAIL` / `SUPABASE_WORKER_PASSWORD` repo secrets | See current session notes — needs either the account owner's existing credentials or a deliberate password reset |
| 7 | Flip `PUBLISH_SIGNALS_DRY_RUN` to `false` once 1-6 are real and a real (not import-failure) dry run looks sane | Last step |

See `servermemory.md`'s 2026-09-10 entries for the full investigation and rewire trail.
