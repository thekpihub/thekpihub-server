# Server Memory

Running log of findings and state for this repo. **Mandatory rule: update this file after
every commit made locally or pushed, from 2026-09-02 onward, for as long as this repo exists.**
Newest entry on top. See also `mistakesdone.md` for mistake+correction entries specifically,
and `C:\Projects\CLAUDE.md` for the broader cross-project working notes this repo's local
clone sits under.

---

## 2026-09-02 — WordPress publishing switched from REST API to direct MySQL writes

Resolves the outstanding item from the entry below: the WP REST API plan is dead because
there's no live WordPress on this Hostinger account at all — confirmed via Chrome browser
automation (first working session with it) that every one of the account's 4 "Websites" lacks
`wp-admin`/`wp-content`/`wp-includes` on disk, while the `u117990013_Thekpihub` database (4 MB)
is real, current, and DB-attributed to `thekpihub.com` in hPanel. Full writeup: `C:\Projects\CLAUDE.md`'s
handoff section. User's decision: abandon `WP_SITE_URL`/`WP_USERNAME`/`WP_APP_PASSWORD` (never
actually reachable), publish by writing straight into `wp_posts`/`wp_postmeta`/
`wp_term_relationships`/etc. instead.

**Done this session:**
- Enabled Remote MySQL access in hPanel for `u117990013_Thekpihub` (access host `%`, i.e. Any
  Host — needed since GitHub Actions runners have no static IP) and reset the DB user
  (`u117990013_Hsharmagxi`) password, confirmed via hPanel's own success toast.
- Set `WP_DB_HOST`, `WP_DB_HOST_IP`, `WP_DB_PORT`, `WP_DB_NAME`, `WP_DB_USER`, `WP_DB_PASSWORD`
  as repo-level GitHub secrets (same level as the other 5 pipeline secrets). Verification
  caveat: no `mysql`/`python`/`node`/`php` client exists in the working environment to attempt
  a real authenticated connection, so this wasn't live-tested the way the earlier 5 secrets
  were — only TCP reachability (`Test-NetConnection`) and the exact password string (verified
  via the field's reveal icon before submitting) were confirmed directly.
- Verified the actual `wp_posts`/`wp_terms`/`wp_term_taxonomy`/`wp_term_relationships`/
  `wp_postmeta` schemas via phpMyAdmin's Structure tab before writing any SQL — all vanilla,
  unmodified WordPress core schema, nothing custom.
- Rewrote `publish_to_wordpress()` (and its category/tag/idempotency helpers) in
  `apps/website/pipeline.py` — the richer, project-canonical pipeline per this repo's own
  `apps/website/CLAUDE.md` ("Pipeline: pipeline.py") — to INSERT/UPDATE those tables directly
  with PyMySQL instead of POSTing to `wp-json/wp/v2/posts`. Preserves prior behavior:
  idempotency by slug, category/tag get-or-create, `future`-vs-`publish` status based on
  whether the scheduled time is still ahead, SEO excerpt meta. Connection is opened per article
  and explicitly closed in a `finally` (PyMySQL's `with conn:` commits/rolls back on exit but
  does **not** close the socket — would've leaked up to 7 open connections per run otherwise).
- Applied the same direct-DB-write swap to `services/pipeline/pipeline.py` (the simpler, older
  v3.1 pipeline — also actively scheduled, `pipeline.yml` runs it 4x/day), keeping its existing
  local-JSON-artifact fallback as the final resort if the DB write itself fails, matching that
  file's own "graceful fallback" design already documented in its module docstring.
- Updated `WP_DB_*` into the `env:` blocks of `daily-pipeline.yml`, `premium-pipeline.yml`, and
  `pipeline.yml` (replacing the old `WP_SITE_URL`/`WP_USERNAME`/`WP_APP_PASSWORD` secret refs —
  the latter two were never actually set as GitHub secrets, so those workflow runs always fell
  through to REST failure anyway). `WP_SITE_URL` is now a literal `"https://thekpihub.com"` in
  each workflow rather than an unset secret — it's not actually secret data, just used to build
  each post's `guid`.
- Added `PyMySQL` to both `requirements.txt` files.

**Also fixed this session, on the user's follow-up request:** discovered while reading the
workflows that `daily-pipeline.yml` and `premium-pipeline.yml` both ran `apps/website/pipeline.py`
at the same `21:33 UTC` cron slot on odd calendar days (the premium one every 2 days), racing
to publish the same date-based slugs. Flagged it in the PR; user then explicitly asked for
daily-pipeline to run only once a day. Fix: moved `premium-pipeline.yml`'s cron to `33 9 1-31/2 * *`
(15:03 IST / 09:33 UTC) instead of changing `daily-pipeline.yml` itself (which already only had
one cron trigger — the "twice a day" symptom was the *other* workflow colliding with it, not a
second trigger inside daily-pipeline.yml). Both workflows keep their own cadence (daily vs.
every-2-days); they just no longer land in the same few minutes.

**Live-tested end-to-end (2026-09-02), on `main` post-merge:** ran `daily-pipeline.yml` via
`workflow_dispatch` twice — first `dry_run=true` (confirms code/imports/env validation clean,
run 33625459936, 7m19s, all green), then a real `dry_run=false` run (33626840842, 6m2s).
The real run wrote 4 posts (`wp_posts` IDs 48–51) and their category/tag rows into
`u117990013_Thekpihub` — verified directly via phpMyAdmin's SQL tab, not just trusted from the
log: `SELECT ... FROM wp_posts WHERE ID >= 48` returned all 4 rows with correct
`post_author=1`, `post_status='publish'` (correct — `PUBLISH_AT` was earlier that same day, so
the future-vs-publish check in `publish_to_wordpress()` correctly fell through to `publish`,
same as what the old WP REST API would have done server-side for a past date), real titles and
content. A join across `wp_term_relationships`/`wp_term_taxonomy`/`wp_terms` confirmed the
category + up to 5 tags were created and linked correctly for each post (24 relationship rows
across the 4 posts). **The MySQL write path works.**

**Separate, pre-existing bug surfaced by this run — not caused by this session's changes —
fixed same day.** 3 of the 7 articles failed at Engine 2B (article generation, in
`generate_article()`), before ever reaching the new DB code: `'ThinkingBlock' object has no
attribute 'text'`. `resp.content[0].text` assumed `content[0]` is always a `TextBlock`, but the
Claude response sometimes returns a `ThinkingBlock` first instead. Affected that run:
`market_flash`, `kpi_spotlight`, `founders_brief`. Fix: added a `claude_text(resp)` helper (in
both `apps/website/pipeline.py`, right after `claude_call()`, and `services/pipeline/pipeline.py`,
right after the Anthropic client init) that scans `resp.content` for the first block with a
`.text` attribute instead of indexing `[0]`, raising a clear `RuntimeError` if none exists.
Replaced all 4 raw `resp.content[0].text` call sites: `synthesize_daily_report()`,
`generate_article()`, and `verify_article_claims()` (the last wrapped in try/except since it
already had a graceful fallback-to-title-on-failure) in `apps/website/pipeline.py`, and
`engine2_synthesize()` in `services/pipeline/pipeline.py`. Not yet re-tested live — the 4-post
successful run above predates this fix, so the next real pipeline run is what will confirm all
7 articles generate cleanly now.

---

## 2026-09-02 — Pipeline secrets: 5/8 set; WordPress creds still outstanding (session paused here)

No repo commit this entry — logging session state per user's explicit "save everything before
VS Code restart" request, so a fresh session can resume without re-deriving it.

**GitHub secrets set and individually verified working before setting** (per standing
verify-first rule): `ANTHROPIC_API_KEY`, `SERPAPI_KEY`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `ALPHA_VANTAGE_KEY`. Note the first `ANTHROPIC_API_KEY` sourced from the
user's "Keys - Stick Notes.txt" file tested dead (401) — a *second* key the user pasted
separately (real Anthropic curl example) tested live (200) and is the one actually set.

**Still outstanding**: `WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` — see
`C:\Projects\CLAUDE.md`'s "SESSION HANDOFF" section (top of file) for the full current state:
WordPress isn't at thekpihub.com itself, lives on a Hostinger temp domain that resets every
automated connection attempt, and the user was mid-lookup in phpMyAdmin's `wp_options` table to
find the real configured site URL when this session paused. Browser tools (`/chrome`) were
requested but confirmed not active this session — re-check on the next session start, don't
assume still off.

---

## 2026-09-02 — BYOK migration applied to production Supabase + encryption key generated

Per explicit user request, ran `apps/wingcommander-reference/docs/byok-supabase-migration.sql`
against production Supabase (`eeuwkislidznpgdbvvbo`) via the Management API's
`/database/query` endpoint. **Found and fixed a real bug before running**: the file used
`CREATE POLICY IF NOT EXISTS`, which is not valid PostgreSQL syntax (only `DROP POLICY`
supports `IF EXISTS`) — would have errored mid-migration. Fixed to DROP-then-CREATE, ran the
corrected version, and verified each piece landed individually afterward: `profiles.byok_approved*`
columns present, `byok_approval_requests`/`user_api_keys` tables present, RLS enabled on both,
`users_own_request` policy present on `byok_approval_requests`. Committed the corrected SQL
back to the repo so the reference doc matches what was actually run.

Generated `BYOK_ENCRYPTION_KEY` (64-char hex, `openssl rand -hex 32`) — saved to
`C:\Projects\Credentials\.env` as `WINGCOMMANDER_BYOK_ENCRYPTION_KEY`. **Not yet set as a
Railway env var** on the `ditto-wingman-backend` service — still needed before `byok.ts`'s
encrypt/decrypt functions will actually work; same for `MASTER_ADMIN_ID`, `THEKPIHUB_API_URL`,
`CONTEXT_BRIDGE_SECRET` (none of the 4 new required env vars are set on Railway yet).

---

## 2026-09-02 — 3 deleted repos restored by user; wing-commander swap evaluated and rejected; 4 features ported instead

User restored `thekpihub-wing-commander`, `thekpihub-wingcommander-design-sync`, and
`automated-website-builder` via GitHub's recovery window (worked — see `mistakesdone.md` for
the deletion incident that made this necessary). `automated-website-builder` left untouched
per instruction.

**Diff done (PR request, properly this time — see `mistakesdone.md`):** `wing-commander` vs
`ditto-wingman` (currently in `apps/wingcommander-reference`) — application source
(`backend/src`, `frontend/src`) is byte-identical. Only differences: CI/deploy config, a Node
engine pin, and the `weapons/*.html` Worker URL (wing-commander still has the placeholder).
**Decision: kept ditto-wingman, did not swap** — no functional gain, would've reintroduced a
broken placeholder and required re-verifying the Railway build config from scratch.

`wing-commander` vs `design-sync` (also diffed): NOT identical as first assumed —
`design-sync` has 4 backend routes (`admin.ts`, `byok.ts`, `context.ts`, `team.ts`) that
neither `wing-commander` nor `ditto-wingman` carried forward. User requested all 4 — added in
PR #10 (branch `feat/wingcommander-byok-admin-team-context`), commit `bf11a90`:
- `admin.ts` — master-admin BYOK approval panel (`MASTER_ADMIN_ID` env var) + stats
- `byok.ts` — per-user bring-your-own-key storage (AES-256-GCM, `BYOK_ENCRYPTION_KEY`)
- `context.ts` — bridges live KPI data from `THEKPIHUB_API_URL` into assistant context
- `team.ts` — multi-agent debate/vote/orchestrate mode
- `AdminPage.tsx` ported too (UI for admin.ts), `wing-*` Tailwind colors renamed to `ditto-*`
  to match this repo's existing palette (would've rendered uncolored otherwise)
- `docs/byok-supabase-migration.sql` added **for reference only, NOT run**. These routes will
  error at runtime (missing table/column) until someone runs that migration against production
  Supabase (`eeuwkislidznpgdbvvbo`) — not done automatically, needs a deliberate decision.
- No `auth.ts` changes needed — verified all 4 routes only use already-present exports.
- New required env vars added to `.env.example`: `MASTER_ADMIN_ID`, `BYOK_ENCRYPTION_KEY`,
  `THEKPIHUB_API_URL`, `CONTEXT_BRIDGE_SECRET` — none of these are set anywhere yet.
- Verification: no local Node/npm (still true, see below) — relying on CI's `validate` job
  (real `tsc`/build) as the compile check; confirm it passed before treating this as done.

---

## 2026-09-02 — This file + `mistakesdone.md` + the enforcement hook created

Commit `c23767a` added this file, `mistakesdone.md`, and `.claude/settings.json` (a PostToolUse
hook on `git commit`/`git push` that reminds to keep both updated — checked into the repo so it
travels with it, per explicit user instruction after the `thekpihub-wing-commander` incident).

**Verification note:** the hook did not fire on its own introducing commit — expected, per the
standard caveat: the settings watcher only watches directories that already had a settings file
when the session started, and `.claude/settings.json` was brand new. Pipe-test and JSON/schema
validation both passed before commit, so the hook itself is written correctly; it needs one
`/hooks` reload (or a session restart) to arm. **If you're reading this in a later session and
the reminder isn't appearing after commits, that reload may not have happened yet — check
`/hooks` shows it listed, and if not, that's the fix, not a rewrite of the hook.**

---

## 2026-09-02 — Baseline: consolidation session summary

This repo (`thekpihub/thekpihub-server`, renamed from `kpihub-assembled`) is the canonical
single source of truth for KPI Hub, consolidated from ~13 GitHub repos. State as of this entry:

**Confirmed working, deployed from this repo:**
- Vercel — project `platform` (`apps/platform`), live.
- Hostinger (thekpihub.com) — `.github/workflows/deploy-website-hostinger.yml`, verified
  live deploy 2026-09-02.
- Railway — `ditto-wingman-backend`/`ditto-wingman-frontend` (project `jubilant-growth`),
  repointed and verified live (`/api/health` → 200) 2026-09-02.

**Fixed this session:**
- `apps/platform`: Supabase SSR cookie typing (CI fix), lazy Razorpay client init (build fix).
- `services/pipeline/pipeline.py`: retired Anthropic model id → `claude-sonnet-5`.
- Added root-level `.github/workflows/pipeline.yml`, `daily-pipeline.yml`,
  `premium-pipeline.yml` — ported from source repos before their deletion (GitHub Actions only
  reads a repo's ROOT `.github/workflows/`, never a subdirectory's — nested copies from the
  original merge were dead on arrival).
- `apps/wingcommander-reference`: replaced stale (2026-07-08) content with current
  `thekpihub/ditto-wingman` code — it's load-bearing for `apps/website`'s free tools via its
  Cloudflare Worker, not reference-only as originally classified.

**Known broken, NOT yet fixed (need real credential values only the user has):**
- `daily-pipeline.yml` / `premium-pipeline.yml`: several GitHub secrets were entered malformed
  from the start (e.g. `SERPAPI_KEY`'s stored value is literally the text `"SERPAPI_KEY"`).
  Can't be fixed via API — secrets are write-only. Needs real keys re-entered by the user.
- `publish-signals.yml` (`apps/platform`): fails daily but is designed to no-op (dry-run) until
  deliberately switched on with real credentials — never live, lower priority.

**Deleted 2026-09-02** (superseded, content verified merged): `thekpihub-website`,
`thekpihub-platform` (org), `thekpihub-app`, `thekpihub-pipeline`,
`thekpihub-wingcommander-design-sync`, `automated-website-builder`, `thekpihub` (archived) +
`hsharmagxi-debug/thekpihub` mirror, `hsharmagxi-debug/thekpihub-platform`, `thekpihub_1554`,
`hsharmagxi-debug/kpihub-vault`, `hsharmagxi-debug/ditto-wingman` (empty).

**Deleted on an unverified inference — see `mistakesdone.md`:** `thekpihub-wing-commander`.
Recovery status unknown as of this entry.

**Not yet done:**
- `thekpihub_1554`'s live Anthropic key / old repos' other credential exposure — user has
  said not to rotate anything without being asked; not urgent per user (personal project).
- Domain `.COM` auto-renew is off, expires 2026-11-22 — user's call.
- `ditto-wingman-frontend` Vercel project: fixed Root Directory/build-command mismatch
  (`buildCommand`/`outputDirectory` now correct), but no fresh deployment has actually been
  triggered/verified yet (API trigger blocked by permission classifier; needs a dashboard
  "Redeploy" click or a new push to `thekpihub/ditto-wingman` main).
