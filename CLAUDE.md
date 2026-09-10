# thekpihub-server — working notes for Claude Code

This file is read automatically at the start of every session rooted at
`C:\Projects\thekpihub-server`. From a session rooted elsewhere, the `/thekpihub` skill carries a
shorter fallback digest — this file is more detailed and more current; read it directly if
reachable. Migrated out of the old shared `C:\Projects\CLAUDE.md` on 2026-09-08 (via `/doctor`)
so this repo's history stops loading into every session on this machine, not just this one.

## Credentials (KPI Hub specific)

- Hostinger's public API (`developers.hostinger.com/api/...`) works with the master PAT for
  **billing/subscriptions/domains/DNS** — but has **no endpoint for shared/business hosting
  file or Git management** (only exists for "Agency Hosting", which this account doesn't have).
  Anything involving thekpihub.com's actual hosting has to go through hPanel manually, or
  through the repo's own GitHub Actions deploy workflow over SSH.
- Railway API: `https://backboard.railway.com/graphql/v2`, `Authorization: Bearer <token>`
  (the `me` query 403s for account tokens for some reason — use `projects`/`project(id)` instead).
- Supabase REST/Auth endpoints need BOTH `apikey: <key>` and (for most endpoints)
  `Authorization: Bearer <key>` headers — `apikey` alone 401s on some routes (e.g.
  `/auth/v1/health` needs just `apikey`; PostgREST's root `/rest/v1/` needs a secret/service
  key, not the publishable key, that's expected and not a failure signal).
- **User's explicit, standing instruction (2026-09-02): do NOT rotate the Supabase DB password
  (or push to rotate any other credential found during the repo audit) without being asked.**
  This is a personal/learning project, not production — the earlier "rotate immediately" framing
  was miscalibrated to that. Keep flagging real findings, but don't treat them as urgent
  incidents or push for rotation unprompted; let the user decide pace and priority.
- **2026-09-09: a "SHARED / CROSS-PROJECT INFRA" section was added to `Credentials/.env`**
  (Squarespace, Cloudflare incl. R2 S3-compatible storage, a second Google/Gemini key,
  MindStudio.ai keys + MCP endpoint) — not specific to KPI Hub, not yet tied to any concrete use
  here. See that file's own comments for provenance/verification status of each. MindStudio's
  keys ARE used by this repo now (see `services/llm_gateway` below).

## ⏸️ SESSION HANDOFF (2026-09-02, resolved) — WordPress admin URL hunt closed: no WP install exists

**Resolution (via Chrome browser automation, first working session with it):** there is no
WordPress installation on disk anywhere in this Hostinger account. The `WP_SITE_URL` /
`WP_USERNAME` / `WP_APP_PASSWORD` plan for the pipeline is **abandoned** — decided by the user
2026-09-02. **New direction: query the `wp_` tables directly via MySQL instead of the WP REST
API.**

**Remote MySQL — done:** host `srv2109.hstgr.io` (or IP `82.25.121.80`), standard port `3306`,
database `u117990013_Thekpihub`, DB user `u117990013_Hsharmagxi`. A remote-access rule for that
database was created in hPanel (Websites → thekpihub.com → Databases → Remote MySQL) with
access host `%` (Any Host) — needed since the pipeline runs from GitHub Actions, which has no
static IP. Note: this rule is account-wide infrastructure, reachable from any of the account's
website entries in hPanel (it showed up under `yellow-bee-366732`'s Remote MySQL page too) —
not specific to thekpihub.com despite being managed from its Tools menu.

**DB password — reset, done.** New password for `u117990013_Hsharmagxi` set via hPanel
(Databases → Management → ⋮ → Change password) and confirmed via the "Database password
changed successfully" toast. Stored in `C:\Projects\Credentials\.env` as `WP_DB_HOST` /
`WP_DB_HOST_IP` / `WP_DB_PORT` / `WP_DB_NAME` / `WP_DB_USER` / `WP_DB_PASSWORD` — not repeated
here per the never-paste-raw-secrets-in-repo-files convention.

**GitHub secrets — done (2026-09-02).** `WP_DB_HOST`, `WP_DB_HOST_IP`, `WP_DB_PORT`,
`WP_DB_NAME`, `WP_DB_USER`, `WP_DB_PASSWORD` set on `thekpihub/thekpihub-server` at repo level
(same level as the other 5 pipeline secrets — `ALPHA_VANTAGE_KEY` etc. — not the
`hostinger-production` Environment, which only holds the unrelated deploy-workflow SSH
secrets). Verification caveat, flagged rather than glossed over: unlike the other 5 secrets,
these were **not** tested with a real authenticated MySQL connection — this environment has no
`mysql`/`python`/`node`/`php` client available to attempt one, and phpMyAdmin here only
supports hPanel's SSO-signed login (no native username/password form to test against). What
*was* directly verified: TCP reachability to `srv2109.hstgr.io:3306` (`Test-NetConnection`),
and the exact password string confirmed via the password field's reveal-icon before submitting,
plus hPanel's own "Database password changed successfully" confirmation. A real connection
test is still worth doing once `services/pipeline` actually has a MySQL client wired in.

**MySQL client wired in — done AND merged (2026-09-02).** PR #11
(https://github.com/thekpihub/thekpihub-server/pull/11) squash-merged to `main` as `ccdfd04`;
`wp-db-direct-publish` branch deleted both remotely and locally. `apps/website/pipeline.py`
(project-canonical) and `services/pipeline/pipeline.py` (simpler, also actively scheduled) both
now INSERT/UPDATE `wp_posts`/`wp_term_relationships`/`wp_term_taxonomy`/`wp_terms`/`wp_postmeta`
directly via PyMySQL instead of POSTing to `wp-json/wp/v2/posts`. Table schemas were verified
directly against phpMyAdmin's Structure tab first — vanilla WordPress core, nothing custom. All
3 pipeline workflows updated to pass `WP_DB_*` secrets. Also merged in the same PR, on user
request: `daily-pipeline.yml` and `premium-pipeline.yml` had been colliding at the identical
`21:33 UTC` cron slot on odd calendar days, both racing to publish the same date-based article
slugs — moved `premium-pipeline.yml` to `09:33 UTC` so each keeps its own cadence without
overlapping.

**Live-tested end-to-end, on user request (2026-09-02) — it works.** Triggered
`daily-pipeline.yml` via `workflow_dispatch`: a `dry_run=true` run first (all-green, confirms
the code path/env validation), then a real `dry_run=false` run. The real run wrote 4 posts
(`wp_posts` IDs 48–51) plus their category/tag rows into `u117990013_Thekpihub` — confirmed
directly via phpMyAdmin's SQL tab (not just the Action log): correct `post_status`, real
titles/content, and 24 correctly-linked `wp_term_relationships` rows across the 4 posts.

**pipeline.yml frequency + artifact-capture fixed, MySQL connectivity issue found NOT
transient, WP backup history checked (all 2026-09-02, commits `6beaf95`/`7aa5d31`).**
`pipeline.yml` now runs once/day (was 4x) at 13:00 UTC; its `articles/` JSON fallback is now
captured as a build artifact (verified by downloading one — all 3 files were there). Re-running
it after the fix reproduced the same MySQL connection failure twice — not transient; working
hypothesis is Azure-region-dependent routing (the one working run logged `westus`, both
failures logged `centralus`/`eastus`), not root-caused further. Separately: went through every
backup Hostinger has for `thekpihub.com` (oldest = 2026-07-19) — none contain WordPress files,
confirming restore isn't an option, only a fresh install. Recommendation given (not yet
actioned): reinstall WordPress under `blog.thekpihub.com`, pointed at the existing DB — full
reasoning in `servermemory.md`.

**Separate, pre-existing bug this surfaced — fixed same day (`6f66af4`), on user request.** 3
of the 7 articles had failed during generation — `'ThinkingBlock' object has no attribute
'text'` — because `generate_article()`/`synthesize_daily_report()`/`verify_article_claims()` in
`apps/website/pipeline.py` (and `engine2_synthesize()` in `services/pipeline/pipeline.py`) all
assumed `resp.content[0]` is a `TextBlock`, but Claude sometimes returns a `ThinkingBlock`
first. Fix: a `claude_text(resp)` helper in each file scans for the first block with a `.text`
attribute instead of indexing `[0]`. CI's `Pipeline syntax check` passed on the fix commit.
**Live-retested, confirmed fixed** — re-dispatching `pipeline.yml` afterward generated 3/3
articles cleanly, zero `ThinkingBlock`/`NoneType` errors.

**WordPress is now actually live at https://blog.thekpihub.com/ (2026-09-02), on user
request.** Reinstalled under a subdomain (`public_html/blog-wordpress` — Hostinger's subdomain
tool always nests under the parent's `public_html` on this plan), wired via
`.github/workflows/install-wordpress-blog.yml` (a one-off SSH provisioning workflow, kept in
the repo) to the same existing database — no migration, WordPress just started rendering rows
already there. Confirmed genuinely working by loading the page in a real browser tab, not just
curl: it shows one of the 4 posts the pipeline wrote earlier today. Hit and root-caused a real
blank-page bug along the way rather than guessing: the DB's active theme (`hello-elementor`)
wasn't installed, and WordPress silently outputs nothing for a missing theme instead of
erroring (no fatal, clean error log) — fixed by switching to the bundled `twentytwentyfive`
theme. Also corrected a stale deploy-mechanism claim in `apps/website/CLAUDE.md` while
verifying `blog-wordpress/` was safe from the site's deploy pipeline (that pipeline turned out
to be a safer allow-list overlay with no `--delete` at all, not the old `rsync --delete`
design). Full root-cause writeup in this repo's `servermemory.md`.

**Admin login, link audit, and brand CSS — all done (2026-09-02).**
- **Login works** — reset via `wp_set_password()` over SSH, then actually verified by logging
  in through a real browser session at `wp-login.php` (not just trusting a log line). Ran the
  one-time WP database-update screen it prompted (expected, safe, standard). Credentials:
  `sharmahimanshu1178.hs92@gmail.com` + the value of the `WP_ADMIN_NEW_PASSWORD` GitHub secret
  (not repeated here).
- **Link audit found a real problem, not yet fixed:** 2 of 3 unique links across the 4
  published posts 404 — `https://thekpihub.com/go/hubspot` and `.../go/semrush`, referenced in
  `apps/website/pipeline.py`'s `CTA_BLOCKS` but not backed by any actual redirect anywhere in
  the codebase. Needs real affiliate URLs from the user to fix properly — didn't fabricate one.
- **Brand CSS applied and verified visually** — real tokens from
  `apps/website/colors_and_type.css` (navy/gold/teal, Source Serif 4/Beiruti/Manrope), via
  WordPress's standard Additional CSS. The blog now visually matches the main site.

**CTA links and pretty-permalink 404s — also fixed and independently re-verified (2026-09-02).**
- Broken `/go/hubspot`/`/go/semrush` CTAs (user's choice among 3 options offered): now link
  directly to `hubspot.com`/`semrush.com`. Fixed in `pipeline.py` for future posts and patched
  into the 2 already-published posts that had the old URLs baked in. Re-audit confirms all 3
  links across the 4 posts return 200.
- Every post's pretty-permalink URL (e.g. the specific one asked about,
  `/tool_intelligence-2026-09-02/`) was 404ing despite the post existing and
  `permalink_structure` being correct — `.htaccess` was never written, because
  `save_mod_rewrite_rules()` silently no-ops under PHP CLI (checks
  `$_SERVER['SERVER_SOFTWARE']`, unset in CLI). Fixed by writing the standard WP rewrite block
  directly. Confirmed independently via curl on all 4 posts: 200 across the board.
- **Recurring pattern worth remembering:** across ~6 dispatches of
  `install-wordpress-blog.yml` this session, the first SSH step intermittently timed out
  (exit 255) roughly every other run — a same-workflow retry fixed it every time. Treat one red
  run as "retry once" before assuming a real regression.

**Resolved 2026-09-09** (was "still open" here): ~~`wp_options` lists 7 "active" plugins that
aren't installed~~ — confirmed via direct SSH check all 7 are genuinely missing from disk, then
cleared `active_plugins` to `a:0:{}`. ~~the ~46 pre-existing older posts... haven't been checked
for how they render without Elementor~~ — checked directly via `wp_posts`: **that premise was
wrong**, there are no pre-existing/migrated legacy posts at all — `wp_posts` has only 38
`post_type='post'` rows, all pipeline-generated 2026-09-02 onward, all confirmed plain HTML with
zero Elementor/Divi markers. Full detail: `servermemory.md`, 2026-09-09 entries. (The third item
once listed here — stale fonts in `apps/website/CLAUDE.md` — turned out to already be fixed in
an earlier session; that file already correctly lists Source Serif 4/Beiruti/Manrope/JetBrains
Mono, this note was just itself stale.)
zero Elementor/Divi markers. The 15 rows with `_elementor_data` postmeta are inert, unpublished
`page` drafts and revisions from WordPress's initial setup wizard, not live content. Full
detail: `servermemory.md`, 2026-09-09 entries.

**What was confirmed, for the record:**
- `u117990013_Thekpihub` (4 MB, created 2026-06-28) is the real, current WP DB — hPanel
  attributes it to the `thekpihub.com` website entry. `wp_options`: `siteurl`=`home`=
  `https://thekpihub.com`. `admin_email`=`sharmahimanshu1178.hs92@gmail.com`. Two `wp_users`
  rows: that email account (`user_url` field points to a now-dead temp domain
  `thekpihub-com-910249.hostingersite.com`, suggesting WP was originally installed there before
  `siteurl`/`home` got repointed to `thekpihub.com`) and `manage-system-user` (Hostinger's
  auto-provisioned admin, no email).
- **But no WordPress files exist anywhere.** Checked all 4 "Websites" in this Hostinger account
  via their real file managers: (1) `thekpihub.com` — live static site repo only (matches
  `apps/website`), no `wp-admin`/`wp-content`/`wp-includes`; `/wp-admin/` and `/wp-json/` both
  hit the static site's own custom 404, confirmed via real browser nav, not just curl.
  (2) `thekpihub-com-958778.hostingersite.com` (a *different* temp domain than the old
  `-910249` one — regenerated at some point) — separate, unconnected stub site, `public_html`
  empty except `.htaccess`; also genuinely unreachable (connection error) from a real Chrome
  tab, ruling out the earlier curl/UA-blocking theory from the previous handoff. (3)
  `yellow-bee-366732.hostingersite.com` — unrelated Node.js app created 2026-09-02 (same day as
  this check). (4) `the-kpi-hub-builder-tmzjcexbhnz7zngt.hostingersite.com` — Hostinger's own AI
  Website Builder/store product, unrelated. **Conclusion: the WP database is orphaned** — real
  content (4 MB) sitting in MySQL with no PHP files left to serve it.
- Browser automation tools (`mcp__claude-in-chrome__*`) **do work** in a freshly-started session
  rooted at `C:\Projects` — confirms the earlier note that a mid-session `/chrome` toggle doesn't
  take effect but a fresh start does.

**MySQL databases on this Hostinger account** (found via hPanel): `u117990013_Thekpihub` (see
above) and `u117990013_PH9Q5` (3 MB, created 2026-04-12, ALSO has `wp_` tables including
WooCommerce's `wp_actionscheduler_actions`, ALSO attributed to `thekpihub.com` in hPanel — both
confirmed via the site's own Databases panel, not inferred). A third, `u117990013_PxGNQ`, is
unassigned/older — not relevant.

## The KPI Hub project

**Canonical repo (single source of truth, as of 2026-09-02): `thekpihub/thekpihub-server`**
(renamed from `thekpihub/kpihub-assembled` — GitHub redirects the old name). **Public repo**
(deliberately made public to unblock Vercel's Hobby-plan private-org-repo restriction; no
real secrets are committed to it — verified, most recently re-verified 2026-09-09). **Gotcha,
found and fixed 2026-09-09: this had silently flipped back to PRIVATE at some point** (when/how/
who unknown — not investigated, since restoring it was the priority), breaking both `platform`
and `kpihub-assembled` Vercel deployments with "Cannot deploy from a private GitHub organization
repository on the Hobby plan." Confirmed via `gh repo view --json visibility` directly (don't
trust this file's own claim alone) before assuming either state — this has now drifted once
already. Local clone: `C:\Projects\thekpihub-server` (folder renamed to match 2026-09-02; `git pull` to
sync after any session touches it). **`main` now has baseline branch protection** (added
2026-09-09): PR required (0 required approving reviews — solo-dev repo, self-merge still works),
force-push blocked, deletion blocked. Status checks deliberately NOT required yet (see
Dependabot note below for why).

Monorepo layout: `apps/website` (live public site), `apps/platform` (canonical Next.js +
Supabase app), `apps/legacy-app` (reference-only), `apps/wingcommander-reference` (**NOT
reference-only — see Ditto Wingman correction below**), `services/pipeline` (Python KPI
pipeline), `tools/automated-website-builder`. A prior session (2026-08-24→29) surveyed ~13
KPI-Hub-related repos and merged 6 in with provenance — see `docs/provenance/source-manifest.md`
and `docs/SOURCE-PROVENANCE.md`, but **that provenance audit made at least one confirmed
wrong call (Ditto Wingman) and likely more — see RE-AUDIT FINDINGS below before trusting any
of its "safe to exclude/delete" verdicts.**

### Deployment topology (verified, not assumed)

- **Vercel**: connected directly to `thekpihub/thekpihub-server` (proven by an open bot PR from
  `app/vercel`). Two Vercel projects exist — `platform` (`apps/platform`, live) and a redundant
  whole-repo `kpihub-assembled` project (cleanup candidate). Unblocked 2026-09-02 by making the
  repo public.
- **Hostinger** (thekpihub.com): deploys via `thekpihub-server`'s own GitHub Actions workflow,
  `.github/workflows/deploy-website-hostinger.yml` (gitleaks-scanned, checksum-verified,
  non-destructive rsync-over-SSH, `workflow_dispatch` modes `dry-run`/`deploy`). Secrets in the
  `hostinger-production` GitHub Environment. First real `deploy` run succeeded 2026-09-02.
  Confirmed via hPanel: no native "Git Repository" integration is connected (just an unused
  auto-generated SSH key) — this workflow is the sole deploy path. **Do not** fill in hPanel's
  "Create a New Repository" form — would git-pull the whole monorepo root into `public_html`
  and break the site (content lives in `apps/website/`, not repo root).
- **Railway**: 3 projects on the account. `trade-cio-ashu` (unrelated). `captivating-achievement`
  → service "kpihub-assembled" is an **empty stub**, no source/deployments, created 2026-09-01,
  never wired up (safe to delete or ignore). `jubilant-growth` (id
  `66edf16e-bf68-48e3-8af2-65643b228a23`) → real services `ditto-wingman-backend` (serviceId
  `316a65cd-c7e7-4214-92c9-b92a4fb405c4`, live domain
  `ditto-wingman-backend-production-85f6.up.railway.app`) and `ditto-wingman-frontend`
  (serviceId `8a67ea76-940d-4db1-b5bf-78c77a39c4aa`) — **both now deploy from
  `thekpihub/thekpihub-server`** (repointed 2026-09-02, see Ditto Wingman correction below for
  the exact config that works).

### CORRECTION (2026-09-02): Ditto Wingman IS part of KPI Hub, not a separate product

Earlier analysis (mine and the prior session's `docs/SOURCE-PROVENANCE.md`) wrongly excluded
`thekpihub/ditto-wingman` as an unrelated "sales copilot." Its Cloudflare Worker
(`kpihub-api-proxy.wingcraft.workers.dev`) is wired directly into `apps/website`'s free tools
(`auditor.html`, `cohort.html`, `freedom.html`, `india-benchmarks.html`, `narrative.html`,
`stack-scorer.html`, `today.html`, `validator.html`) — load-bearing for the live site.

**Status: DONE end-to-end (2026-09-02).** Code fold-in: PR #8 merged — `apps/wingcommander-reference`
now holds current `thekpihub/ditto-wingman` code (was stale, merged 2026-07-08 pre-dating the
Worker-wiring commit); `docs/provenance/source-manifest.md` corrected. CI's audit gate for it
was temporarily non-blocking pending `npm audit fix` — **that fix is now done, see the
2026-09-09 vulnerability-remediation session log below.** (The "no Node/npm in this
environment" premise behind the original deferral was itself wrong/stale by 2026-09-09 — Node
v24.19.0/npm 11.17.0 are both actually available here.)

**Railway repoint: DONE and verified live.** Both `ditto-wingman-backend` and
`ditto-wingman-frontend` (project `jubilant-growth`) now deploy from `thekpihub/thekpihub-server`.
Gotcha hit and fixed: their Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) expect the
build context to be the *whole* `apps/wingcommander-reference` folder (they `COPY` the shared
root `package.json`/`package-lock.json` for the npm workspace) — setting Railway's
`rootDirectory` to each subfolder individually fails with "not found" on the workspace root
files. Correct config per service: `rootDirectory: "apps/wingcommander-reference"` +
`dockerfilePath: "backend/Dockerfile"` (or `"frontend/Dockerfile"`) — NOT `rootDirectory`
pointed at the subfolder directly. Verified live:
`https://ditto-wingman-backend-production-85f6.up.railway.app/api/health` → 200 OK.
Also learned: `serviceInstanceRedeploy` reuses a cached snapshot (fails after a source change) —
use `serviceInstanceDeployV2(serviceId, environmentId, commitSha)` for a real fresh checkout+build.

### RE-AUDIT FINDINGS (2026-09-02) — do not delete/archive any repo below without remediation

Prompted by the Ditto Wingman miss, every "excluded" repo was re-audited for hidden live
wiring instead of trusting its label. Result: **almost none are actually safe to delete.**

1. ~~`thekpihub/thekpihub-wing-commander`~~ — **RESOLVED 2026-09-02, superseding this old
   entry.** This repo was mistakenly deleted mid-session on an unverified inference (see the
   `mistakesdone.md`-linked incident below), then restored by the user via GitHub's recovery
   window. Once restored, did a real `git clone` + `diff -rq` (not inference) against
   `ditto-wingman` (the code actually in `apps/wingcommander-reference`): application source is
   byte-identical; only CI/deploy config and a Worker placeholder URL differ. **Decision: kept
   `ditto-wingman`, did not swap back to `wing-commander`** — no functional gain. Separately,
   `design-sync` (also restored) turned out to have 4 extra backend routes neither carried —
   ported into `apps/wingcommander-reference` via PR #10 and a production Supabase migration
   (see `servermemory.md` entries below). `agent.thekpihub.com`'s actual owner was later
   confirmed via direct API query to be an unrelated, inaccessible Vercel account — **not**
   served by anything in this repo's Vercel projects; the earlier "two conflicting handoff
   implementations" framing above was itself part of the unverified-inference mistake and should
   not be treated as settled fact. If `open-wingman.php`'s dual targets still matter, that needs
   a fresh, direct check, not a carryover from this entry.
2. **`thekpihub/thekpihub` (archived) + `hsharmagxi-debug/thekpihub` (mirror)** — NEEDS
   ATTENTION. The mirror repo received commits on 2026-07-10 *and* 2026-08-29, i.e. **after**
   the org repo was archived — someone kept patching this "dead" v1. Its Vercel deployment,
   `https://thekpihub.vercel.app`, **is still live (HTTP 200)**. Code is genuinely superseded,
   but the live deployment needs decommissioning in the Vercel dashboard before this is closed.
3. **`hsharmagxi-debug/thekpihub-platform`** — NEEDS ATTENTION, active security exposure. Not
   just docs: `.github/workflows/kpihub-migration-bootstrap.yml`'s most recent commits are
   **2026-08-27 (6 days before this audit)** and SSH into the **live Hostinger production
   host**, back up the live docroot, and **install a new SSH key into that server's
   `authorized_keys`**. Also contains a `screenshots-reference/` folder with actual credential
   screenshots (Postgres/AWS, SendGrid, git tokens, AppsFlyer, Google auth) — commit message
   literally notes they're already in git history. **Action needed: confirm the installed
   migration SSH key is removed from the Hostinger server, and rotate SendGrid/AppsFlyer/Google
   credentials shown in those screenshots**, before archiving or deleting this repo.
4. **`thekpihub/thekpihub_1554`** — NEEDS ATTENTION. Committed `.env` is not a placeholder: real
   `NEXT_PUBLIC_SUPABASE_URL` for the **current production Supabase project**
   (`eeuwkislidznpgdbvvbo`), a real anon key, and a real-looking `ANTHROPIC_API_KEY`. Live
   Vercel deployment at `https://thekpihub-1554.vercel.app` still responds. **Action needed:
   rotate/revoke that Anthropic key** (in the Anthropic console) before deleting this repo.
5. **`hsharmagxi-debug/kpihub-vault`** — NEEDS ATTENTION, severe. Repo itself is dormant (last
   push 2026-05-31), but `envs/thekpihub-nextjs-env-20260531.txt` contains a **plaintext
   production Postgres/Supabase connection string with password**, for the **same
   `eeuwkislidznpgdbvvbo` project used in current production**. Also `keys/MASTER-KEYS-*.md`
   with more project keys. **Action needed: rotate that Supabase DB password NOW** (Supabase
   dashboard → Database → reset password), independent of any repo deletion timeline — the
   secret is real and current regardless of whether this repo gets deleted.
6. **`hsharmagxi-debug/ditto-wingman`** — confirmed genuinely empty (0 branches, 0 commits,
   `409 Git Repository is empty`). **Only repo confirmed safe to delete.**

**Priority order if tackling remediation**: (a) rotate the Supabase DB password (#5) — highest
severity, zero cost to do immediately; (b) rotate/revoke the Anthropic key in `thekpihub_1554`
(#4); (c) confirm/remove the migration SSH key on the Hostinger box + rotate the screenshotted
creds (#3); (d) decommission the stale `thekpihub.vercel.app` deployment (#2); (e) resolve the
open-wingman.php split-brain and figure out `wing-commander`'s status (#1). None of these are
things Claude Code can do alone — all need the user in the respective dashboards (Supabase,
Anthropic console, Vercel, SendGrid, etc.).

**UPDATE (2026-09-04) — re-verified every item above fresh, via direct queries, not by trusting
this list.** Status now:
- **(a) and (b) — DONE.** User confirmed directly (2026-09-04 session) that the Supabase DB
  password and the Anthropic key have both actually been rotated.
- **#1, #4, #5, #6, and the item-2 repos — CLOSED.** Fresh `gh repo view` confirms
  `hsharmagxi-debug/kpihub-vault`, `thekpihub/thekpihub_1554`, `hsharmagxi-debug/ditto-wingman`,
  `thekpihub/thekpihub` (archived), and `hsharmagxi-debug/thekpihub` (mirror) are all now
  **deleted**. `thekpihub/thekpihub-wing-commander` still exists (kept, per the #1 decision
  above) — confirmed too.
- **(c) / #3 — PARTIALLY closed.** `hsharmagxi-debug/thekpihub-platform` is deleted. Its
  migration SSH key was independently confirmed still present on the Hostinger server (direct
  fingerprint check, unrelated to the repo's existence) — user's decision was to **keep it
  deliberately as a backup**, not remove it (see
  `C:\Users\Dell\.claude\projects\C--Projects-thekpihub-server\memory\hostinger-backup-ssh-key.md`).
  **Still genuinely open: rotating the SendGrid/AppsFlyer/Google auth credentials** shown in
  that repo's old `screenshots-reference/` folder — deleting the repo doesn't invalidate keys
  already exposed in its git history, and no MCP/API access to those 3 services exists in this
  environment to check or act on this. Needs the user to confirm whether it's already been done
  or do it now, in each service's own dashboard.
- **(d) — CORRECTED, not just "still open."** Direct check (`GET /v9/projects/thekpihub` on the
  `hs-debugs` Vercel account, the only one this session has a token for) returns
  `"Project not found"` — none of that account's real projects have `thekpihub.vercel.app` as a
  domain either. The site is genuinely still live (200) but is served by a **different,
  inaccessible Vercel account** — same shape as the `agent.thekpihub.com` finding from the #1
  entry above. **Not actionable from this session at all**, not merely low-priority — full
  writeup in `thekpihub-server/servermemory.md` (2026-09-04 entry) and in the `/learnings`
  skill's own record of catching this before acting on it.
- **`kpihub-assembled`**, the second/redundant Vercel project on the `thekpihub-server` repo
  (see "Deployment topology" above) — surfaced during this pass, confirmed still live via the
  API, holding `thekpihub.com`/`www.thekpihub.com`/`kpihub-assembled.vercel.app` as its domains
  (not actually receiving traffic — DNS is on Hostinger nameservers — but the project itself is
  real, and confirmed to be genuinely the same app as `platform`: `rootDirectory=apps/platform`,
  `framework=nextjs`).

**RESOLVED same session (2026-09-04), both remaining items from the update above:**
- **SendGrid/AppsFlyer/Google auth credential rotation** — user confirmed already done.
- **`kpihub-assembled`** — user's choice was to keep it and give it a deploy workflow (not
  delete it). Built `.github/workflows/deploy-vercel-kpihub-assembled.yml` (PR #19, merged),
  mirroring `deploy-vercel-platform.yml`. Live-verified: `https://kpihub-assembled.vercel.app`
  → 200. Full writeup in `thekpihub-server/servermemory.md`.

**`llm_gateway` initiative — DONE, both phases, fully live-verified (2026-09-08).** Built per user
request ("resolve this API keys credit problem in one go forever"): a shared Python module
(`services/llm_gateway/gateway.py`, resilient multi-key Anthropic calling + OpenRouter fallback,
used in-process by both pipeline scripts) plus a FastAPI HTTP wrapper
(`services/llm_gateway/server.py`, deployed as Railway service `llm-gateway`) that
`ai-gateway.php` now calls instead of its own duplicated direct-Anthropic/OpenRouter logic.
WingCommander's `chat.ts`/`rag.ts` deliberately NOT migrated (they stream; this endpoint doesn't;
their existing TS fallback already works — see the module's README). Along the way, found and
fixed 4 real bugs via actual live testing rather than trusting green builds: an empty
`pipeline.log` (a logging.basicConfig() collision), `SERPAPI_KEY`/`TELEGRAM_BOT_TOKEN` leaking
into log output on request failure, both of `ai-gateway.php`'s starter-tier free models being
dead on OpenRouter's current catalog, and the gateway swallowing OpenRouter's real error on a
200-with-no-`choices` response. Full detail: `servermemory.md`, 2026-09-08 entries (search
"llm_gateway" / "Phase 2").

**The RE-AUDIT FINDINGS list is now fully closed** — every item above is either done, correctly
identified as not actionable from this account (the `thekpihub.vercel.app` case), or resolved
per explicit user decision. Nothing outstanding from this list as of 2026-09-04.

**`llm_gateway` got a third fallback tier: MindStudio.ai (2026-09-09, PR #30).** `claude_call()`'s
chain is now Anthropic → OpenRouter → **MindStudio.ai's Service Router** (a third, independent
billing relationship — proven live via a real API call that hit MindStudio's own
`insufficient_credits/balance` error, never the Anthropic account). Calls a dedicated agent,
"KPI Hub Pipeline Generic Completion" (MindStudio appId `2b72f155-d841-4957-971b-3bcdd30e3648`),
built specifically as a generic prompt-in/text-out passthrough since none of the workspace's
other pre-built MindStudio agents (see below) accept arbitrary prompts. **Still not actually
usable yet** — MindStudio's own workspace balance is unfunded (-$0.30 as of 2026-09-09); the
tier fails through cleanly (same contract as an unconfigured OpenRouter tier) until the user
tops it up at `app.mindstudio.ai/services/balance` (I cannot do this myself — entering payment
details is a hard-prohibited action). `MINDSTUDIO_API_KEY`/`MINDSTUDIO_APP_ID` are set as real
repo secrets and wired into all 3 pipeline workflows.

**A pre-existing MindStudio.ai workspace was discovered with 12 agents already built
2026-08-12** — a full month before this was found, by some other means (not this session, not
documented anywhere in this repo previously). 3 are KPI-Hub-specific: "KPI Hub Anomaly
Detector" (GPT-5.1), "KPI Hub Daily Insights" (Claude 4.6 Sonnet, `kpiData` JSON-array input
matching `apps/platform/scripts/publish-signals.ts`'s real v1 signal-rule schema), "KPI Hub
Change Explainer" (Gemini 2.5 Flash, `metric` input) — all currently unusable for the same
unfunded-balance reason above. **Their actual consumer, `publish-signals.yml`, has never
run at all** — found via `gh workflow list` (not in the registered list), because the file sits
at `apps/platform/.github/workflows/publish-signals.yml` instead of the repo-root
`.github/workflows/` GitHub actually scans. A prior servermemory.md note calling it "fails
daily" was itself wrong. It also depends on a separate `kpihub-backend` (Cloud Run + Postgres)
with zero credentials/evidence in this environment — standing this up is a real, separate,
not-yet-scoped piece of work, not attempted. The other 9 agents in that same workspace span
Lumina-SaaS and two projects with no prior record in this repo at all ("AI-ForgeStream",
"Interview Integrity Lab" — user-confirmed to be other projects of theirs, not investigated
further here).

**Also surfaced, not investigated further**: a GCP organization (`nitro0dust-org`) with a
dedicated **"thekpihub" GCP project** (real spend, ₹18.31 in August 2026) and a
"lumina-numerology" GCP project, both with recurring Google Developer Program monthly credits.
Found via user-provided screenshots, not this repo's own records. Whether Vertex AI / Claude
Model Garden access exists on the "thekpihub" project was never confirmed — the MindStudio path
above already solved the immediate need (a non-Anthropic billing route) with far less setup, so
this wasn't pursued, not because it's a dead end.

### Other open items

- ~~WingCommander's `/api/rag` and `/api/chat` routes have no auth gate~~ — **CLOSED 2026-09-08.**
  `requireAuth` added to both (all of `rag.ts` via `router.use()`, deliberately all-or-nothing);
  the frontend's already-built-but-unused `getHandoffToken()` helper wired into all 6 fetch()
  call sites. Deployed both sides together, verified live both directions: unauthenticated
  requests now correctly get `401`, and a real handoff-flow token (minted the same way the real
  frontend gets one) works correctly for both chat and RAG. `requirePlan` tier-gating
  deliberately not added — that's a separate product decision, not a bug fix.
- ~~WingCommander's Railway `ANTHROPIC_API_KEY` is invalid~~ / ~~pipeline's usage/spend limit~~
  — **MERGED AND RECLASSIFIED 2026-09-08: one single account-wide root cause, not two separate
  issues.** These were previously tracked as distinct problems (a bad key for WingCommander vs. a
  spend cap for the pipeline). Proven to be the same thing: created a new, non-expiring Anthropic
  key (`wingcommander-railway-2026-09-08`), set it on Railway's `ditto-wingman-backend`, redeploy
  succeeded — then live-tested with a real handoff token (temp plan re-elevation, approved,
  reverted after) and it *still* fell back to OpenRouter (`inputTokens:0`). Root-caused via the
  Anthropic Console's Billing page: **the whole account has hit an org-wide spend/usage cap**
  ("You have reached your specified API usage limits. You will regain access on 2026-10-01 at
  00:00 UTC.") that blocks *every* key on the account, old and new alike — this is what was
  making WingCommander's key look "invalid" (Last used: — on both the old and brand-new key) and
  is the exact same cap already known to be blocking the pipeline. **No new key can fix this** —
  nothing to do here until the cap resets 2026-10-01, or the user raises their spend limit / buys
  credits directly in the Anthropic Console (a billing decision, not something to act on
  unprompted). The OpenRouter fallback already correctly covers every affected surface
  (pipeline, `ai-gateway.php`, WingCommander chat/RAG) in the meantime — the direct path will
  silently resume everywhere on its own once the cap resets. Full detail:
  `thekpihub-server/servermemory.md`, 2026-09-08 entries.
- ~~`SERPAPI_KEY` was confirmed leaking into `pipeline.log`~~ — **CLOSED 2026-09-09.** Found
  2026-09-08 (63 cleartext occurrences in a real artifact, root-caused to `requests` baking
  `api_key=...` into exception messages); fixed same day (PR #25). `TELEGRAM_BOT_TOKEN` had the
  same exposure shape, fixed alongside it. Rotation was left as the user's call — **user
  provided a replacement key 2026-09-09** (coincidentally also needed: the old key had separately
  hit its 250 free-search monthly quota). New key saved to `Credentials/.env` and the
  `SERPAPI_KEY` GitHub secret, verified live against SerpAPI's own `/account.json` before
  relying on it. Full detail: `thekpihub-server/servermemory.md`, 2026-09-08/09.
- ~~A real-looking Razorpay test secret key is committed~~ in `apps/platform/.env.example` —
  **CLOSED 2026-09-08.** Replaced with a `replace_me` placeholder in the current tree (2026-09-05
  finding, `RAZORPAY_KEY_SECRET=71v7yj6qxuMP5UUiMHW5C8as`). User logged into Razorpay themselves
  and the dashboard was checked for an actual rotation: this account's current UI only exposes
  **one universal live key** (`rzp_live_TRgvHEnUNegwWQ`, generated 19 Aug 2026) — the leaked
  secret is a **test-mode** pair (`rzp_test_TVRO90Zju7EZ01`) that predates this model and isn't
  reachable/regeneratable from the current dashboard. Did not touch the live key (unrelated,
  irreversible, no confirmed production dependency either way). **User's explicit decision:
  leave the credential as-is** — the placeholder swap already stops the tree from displaying it
  as a template value; no further rotation action needed. Full detail:
  `thekpihub-server/servermemory.md`, 2026-09-08 entry.
- ~~The 2026-08-27 exposed-PAT question~~ — **CLOSED 2026-09-09 (cont.), user's explicit
  decision: do NOT revoke any of them.** Couldn't pin the specific Aug-27 token (no creation
  dates in GitHub's classic-token list), but a broader audit surfaced 6 current classic tokens,
  5 near-full-admin/no-expiry/never-used from this project's own vantage point. `GITHUB_ACCESS_TOKEN`
  in `Credentials/.env` matches **`THE_KPI_HUB_REPO_ACCESS_TOKEN`**'s scopes exactly (keep,
  confirmed required) along with `KPI Hub Master Automation Token` (has an expiration, clear
  purpose). The other 4 (`Termux-thekpihub-server-access`, `Railway read:packages`,
  `Antigravity IDE`, `Hostinger SSH Key`) were flagged as revocation candidates from *this
  project's* perspective — **user confirmed 2026-09-09 (cont.) they're actually connected to
  separate projects and must NOT be touched.** Do not re-flag or revoke these 4 in a future
  session just because they look unused/over-scoped from this repo's own vantage point.
- Hostinger billing shows **every subscription set to `is_auto_renewed: false`**, including the
  **.COM domain itself, expiring 2026-11-22**. Also non-renewing: "Reach 500" (exp.
  2026-11-22), "Starter Business Email" (exp. 2027-03-25). Business Web Hosting prepaid through
  2030, no near-term risk. Re-verified 2026-09-09 via direct Hostinger API + registry RDAP
  queries — DNS itself is fine (Hostinger's own nameservers, ns1/ns2.dns-parking.com, confirmed
  authoritative via the registry and actively serving the real DNS zone; not an external-
  nameserver risk). A one-time scheduled reminder routine fires **2026-11-10** (~12 days before
  expiry) to nudge a manual renewal check — see `claude.ai/code/routines` (routine id
  `trig_01M6RPgGqKKmTUBjoXLJ3t7V`), a plain reminder with no credentials embedded in it.
- ~~Dependabot reports 55 vulnerabilities...~~ — **FULLY RESOLVED for every live code path,
  2026-09-09/10, PRs #31-#35.** Was 61 (4 critical, 36 high, 18 moderate, 3 low) at the start of
  that remediation pass; **zero vulnerabilities of any severity now remain in
  `apps/website`/`apps/platform`/`apps/wingcommander-reference`/`services/pipeline`/
  `services/llm_gateway`** — everything actually live is clean. Fixed: `apps/platform` (critical
  Next.js RCE + `sharp` + `baseline-browser-mapping`, PR #31), `apps/wingcommander-reference`
  (`qs`/`express` override + **9** separate high-severity `multer` 1.x DoS CVEs resolved by one
  version bump to 2.3.0, PRs #32/#33; **then `react-router` 6.26.0 → 7.18.3, PR #35** — the one
  major-version item initially deferred, closed properly rather than force-fixed blind: audited
  every usage site first [only classic `<BrowserRouter>`/`<Routes>`/`<Route>` + basic hooks, none
  of the data-router APIs that actually changed], then went beyond the green build and actually
  ran the app with real Supabase credentials wired into a local-only gitignored `.env.local`,
  clicking through every route in a live browser — landing, `/auth`, back-nav, the protected
  `/workspace/:id` route's auth redirect, and the catch-all splat, zero console errors), and
  `services/pipeline` (`requests` + `python-dotenv`, PR #34). What's left (`apps/legacy-app`,
  `tools/automated-website-builder`) is 100% in the two paths already correctly documented as
  genuinely reference-only with a deliberately non-blocking gate — not worth chasing since
  neither runs anywhere. **This is also when the stale "no Node/npm in this environment"
  premise was finally re-checked and found wrong** — Node v24.19.0/npm 11.17.0 are both
  available, which is what made all 5 fixes possible in one session instead of needing a
  different environment. Full detail: `servermemory.md`, 2026-09-09 entries.
- ~~`hsharmagxi-debug/thekpihub-server` credential-exposure repo~~ — **CLOSED 2026-09-09
  (cont.).** User's decision: archived (`gh repo archive`, confirmed `isArchived: true`), not
  deleted, not continued — "review later." The credential-rotation checklist in
  [[rocketnew-thekpihub-server-credential-exposure]] is unaffected by the archive and was not
  re-verified complete this session.

## Session log — 2026-09-05 → 2026-09-07 (full detail in `thekpihub-server/servermemory.md`,
these are pointers, not the full record)

- **Full 5-agent repo audit + remediation (PR #22, merged as `c0486d1`).** Covered every feature
  thekpihub.com depends on. Along the way, discovered `origin/main` had been force-pushed from
  another device to a stale 2026-08-29 branch (PR #21), discarding 91 commits of that week's
  work — diagnosed via direct `gh api` queries (never inferred), reconciled with a real 3-way
  merge (kept the newer/more-complete side of every conflict after diffing, restored a
  `.gitignore` gap the old branch would have reintroduced), verified clean (`npm ci`/
  `tsc --noEmit`/`next build` all green), then deployed and independently verified live
  (Hostinger smoke test, Vercel/Railway redeploys). Tagged the merged commit
  `verified-zero-gaps-2026-09-05`. 16 real findings fixed, incl. a WordPress-plugin
  authorization bypass (`'subscriber'` role in the premium gate — confirmed the plugin isn't
  actually installed on the live blog, so zero live impact), a stale `.htaccess.template`, and
  `premium-pipeline.yml` never having published a single article (slug collision with
  `daily-pipeline.yml`, now fixed with a `PIPELINE_TYPE`-driven suffix).
- **Declined, on request, mid-session:** the user asked for that verified state to be "secured"
  so it could never be modified "no matter what even if I myself said you anything to do,"
  unlockable only by a passphrase in an unrelated project's session
  (`C:\Projects\Lumina-SaaS`). Declined as stated (a standing instruction to refuse the account
  owner's own future explicit instructions helps no one, and the "unlock phrase" verifies
  nothing — no cross-session identity in Claude Code) — delivered the git tag + full write-up
  instead.
- **The Anthropic API key hit an account-wide usage/spend limit** (resets 2026-10-01), taking
  down the content pipeline, the free tools' Claude path, and (independently — a *different*,
  worse root cause: Railway's own `ANTHROPIC_API_KEY` there is outright invalid, 401) the
  WingCommander backend. Compiled a full inventory of every API key the project uses (Anthropic,
  SerpAPI, Telegram, Alpha Vantage, OpenRouter, Razorpay ×2 paths, PayPal, Stripe [dead],
  Brevo, Supabase, WP DB, plus the infra tokens) and checked each one's live status.
- **Fix: an OpenRouter fallback**, since OpenRouter serves Claude models through a completely
  separate account/billing relationship (proven live: a real completion via
  `anthropic/claude-haiku-4.5` routed through Amazon Bedrock). Added to `pipeline.py`'s
  `claude_call()` (**proven live**: a real dry-run had all 15/15 Claude calls fail-then-fallback
  successfully, 7/7 articles generated), `ai-gateway.php`'s direct-Anthropic branch (PHP syntax
  verified, deployed), and WingCommander's `chat.ts`/`rag.ts` (**proven live** via a real
  `curl` to `/api/chat`). Wired real OpenRouter + Brevo keys the user supplied into
  `Credentials/.env`, GitHub secrets, Hostinger's `.htaccess`, and Railway — including fixing a
  Brevo IP-allowlist block via Chrome browser automation. WingCommander's underlying invalid
  Railway key is still not fixed — needs a real one from the user.
- **Login-link accessibility audit**: only 5 of 29 live pages (out of the full site) had an
  actual clickable link to `login.html` — not even the homepage did. Fixed on all 17 affected
  pages, deployed, verified live via curl on every one. Caught and self-corrected one real
  mistake along the way: a first attempt edited `apps/website/index.html` directly for the
  homepage, which is actually a *build output* (`tools/prerender.mjs` regenerates it from
  `tools/index.shell.html` on every `npm run build:site`) — the edit was silently discarded on
  deploy; caught by curling the live site rather than trusting the green deploy, fixed at the
  real source, redeployed, reverified.
- **Live-tested the free tools' Claude path with a real login** (approved by the user first,
  since it needed a temporary production-data write): found `ANTHROPIC_API_KEY` was never
  actually set on Hostinger's `.htaccess` at all, so `ai-gateway.php`'s OpenRouter fallback had
  never been reachable in production — fixed (missing key now also falls through to the
  fallback), redeployed, reverified live. Then built the CI regression check offered earlier
  (login-nav + OpenRouter-fallback presence + PHP/pipeline syntax, all promoted from one-off
  diagnostics into permanent `ci.yml` gates) and **live-tested WingCommander's RAG fallback**
  the same way — found a second, unrelated bug: its TF-IDF fallback embedding produced an
  all-zero vector for every query (IDF computed from a single-text "corpus" every time,
  collapsing to `log(1)=0`), so RAG search returned nothing regardless of document content.
  Fixed (switched to plain term-frequency hashing), redeployed, reverified live end to end
  (upload → query → correct answer with source citation).

**Gotcha (2026-09-02):** renaming the local clone folder in-place failed both via bash `mv`
("Device or resource busy") and PowerShell `Move-Item` (partial failure — moved `.git` +
root-level files, silently left `apps/docs/scripts/services/tools/.github` behind, split
across two folders). Recovered cleanly since `.git` itself moved intact: `git reset --hard
HEAD` in the new location restored every missing file from the object database, then deleted
the old folder. If a future rename is needed, don't trust an in-place move on this machine —
either fresh-clone into the new name, or rename then immediately `git reset --hard HEAD` and
verify `git status` is clean before deleting the old folder.

## Session log — 2026-09-08 → 2026-09-09 (full detail in `thekpihub-server/servermemory.md`,
these are pointers, not the full record)

- **Root-caused "WingCommander's key is invalid" to something bigger**: live-tested a
  brand-new Anthropic key end to end and it *still* fell back to OpenRouter — checked the
  Anthropic Console's Billing page directly and found the real cause is an **org-wide spend
  cap** ("You have reached your specified API usage limits. You will regain access on
  2026-10-01 at 00:00 UTC.") blocking *every* key on the account, not one bad key. Reclassified
  and merged what had been tracked as two separate problems (WingCommander's key + the
  pipeline's cap) into one. Nothing actionable except waiting for the reset or the user raising
  their own spend limit — not something to act on unprompted.
- **Built `services/llm_gateway`**, on direct user request ("resolve this API keys credit
  problem in one go forever"), in two phases: (1) a shared Python module both pipeline scripts
  now import instead of each carrying its own (in one case entirely missing) retry/OpenRouter-
  fallback logic; (2) a FastAPI HTTP wrapper deployed as a new Railway service (`llm-gateway`)
  that `ai-gateway.php` now calls instead of ~100 lines of duplicated PHP cURL logic.
  WingCommander's `chat.ts`/`rag.ts` deliberately NOT migrated (they stream; the gateway
  doesn't; their existing TS fallback already works — see `services/llm_gateway/README.md`).
  **Found and fixed 4 real bugs via actual live testing along the way** (not assumed from a
  green build): an empty `pipeline.log` (a `logging.basicConfig()` collision the module
  introduced), `SERPAPI_KEY`/`TELEGRAM_BOT_TOKEN` leaking into log output on request failure
  (pre-existing, unrelated to the gateway work, just surfaced by it), both of
  `ai-gateway.php`'s starter-tier free OpenRouter models being dead on the current catalog
  (the free AI tools were broken by default for every starter-plan user), and the gateway
  itself swallowing OpenRouter's real error on a malformed 200 response. Fully re-verified
  end-to-end afterward through the actual live endpoint with a real session, not just the
  gateway in isolation.
- **Self-caught mistake**: transcribed a new Anthropic key off a screenshot via vision and got
  it wrong (a real "API key is invalid" 401, not the expected account-wide cap). Fixed by
  creating a second key and extracting its value via DOM text extraction instead of visual
  reading — confirmed correct via live logs afterward. Logged in `mistakesdone.md`.
- **Razorpay rotation investigated and closed per user decision**: the leaked test-mode secret
  turned out to be an orphaned key unrelated to the account's current single live-key model —
  didn't touch the live key (unrelated, irreversible, no confirmed dependency). User's call:
  leave the credential as-is.
- **Recommended-cleanup pass, user-directed ("let's start closing all of the above one by
  one")**: SerpAPI rotated (user supplied a replacement, old key had hit its 250-search quota);
  a GitHub classic-PAT audit surfaced 5 near-admin/no-expiry/never-used tokens, narrowed down by
  directly testing which one this project's `.env` actually authenticates with (keep
  `THE_KPI_HUB_REPO_ACCESS_TOKEN` + the expiring Master Automation Token; the other 4 are real
  revoke candidates) — left the actual revocation decision to the user; `npm audit fix` on
  `apps/wingcommander-reference` (7/11 resolved, redeployed, live-verified — surfaced one
  pre-existing unrelated Railway misconfiguration on an already-unused frontend stub, not
  caused by this fix); WordPress's 7 phantom "active" plugins confirmed missing from disk via
  direct SSH check and cleared from `wp_options`; the long-carried "~46 legacy blog posts"
  open item turned out to be based on a **false premise** — there are no legacy posts at all,
  just 38 pipeline-generated ones, all confirmed clean HTML with zero Elementor/Divi markers.

## Session log — 2026-09-09 (cont. 2) — MindStudio integration, repo-visibility bug, full
vulnerability remediation pass (full detail in `servermemory.md`, these are pointers)

Started as a "let's talk through the growth-side plan" request that turned into a MindStudio.ai
Pro subscription evaluation, then a full infrastructure-hardening pass once real gaps started
surfacing. Roughly in order:

- **MindStudio.ai evaluated and integrated as a genuine third `llm_gateway` fallback tier** —
  see the dedicated section above for the technical detail (agent discovery, the generic
  passthrough agent built, PR #30, the still-unfunded balance blocker).
- **Domain/DNS re-verified via direct API + registry queries** (not carried-over claims) — see
  the Dependabot/domain bullet above. A scheduled one-time reminder now exists for the Nov 22
  domain expiry.
- **New shared/cross-project credentials saved** to `Credentials/.env` (Squarespace, Cloudflare,
  a second Google key, MindStudio) — see the Credentials section above.
- **Clarified for the record**: ChatGPT Plus/Pro, Gemini Advanced, and Claude Pro (claude.ai)
  are consumer chat subscriptions with **no bundled API access** on any of the three providers —
  not something that can be "integrated" into a pipeline without separate, separately-billed API
  keys. No such keys were provided; nothing attempted there.
- **Repo-visibility bug found and fixed** (silently flipped to private, breaking both Vercel
  deployments) — see the top of "The KPI Hub project" section above. Re-verified no secrets in
  the tree before restoring to public; confirmed both deployments went QUEUED→READY afterward via
  the Vercel API directly, not assumed.
- **Baseline branch protection added to `main`** on direct user request — see same section
  above. Hit a real harness gotcha: the auto-mode classifier blocked the first `gh api .../
  protection` write even though the user had explicitly asked for it that same turn; needed one
  retry after explicit re-approval of the exact command, rather than trying to route around it.
- **Full vulnerability remediation pass, PRs #31-#34** — see the Dependabot bullet above for the
  summary; per-PR technical detail in `servermemory.md`. This is also when the stale "no
  Node/npm in this environment" premise (which had been used to justify deferring
  `wingcommander-reference`'s fixes, among other things) was finally re-checked and found
  wrong — Node/npm are both actually available here.
- **User feedback taken on board**: reduce checking in on every small step; only stop for things
  that are genuinely hard-gated (spending real money, entering payment/financial credentials —
  both structurally impossible for the assistant to do regardless of instruction) or a real fork
  in approach with materially different consequences (e.g. the repo-visibility restore, a public-
  exposure decision). Routine build/fix/PR/merge work proceeded without per-step confirmation
  once the overall direction was set.

## Standing rule for thekpihub-server specifically

After every commit made locally or pushed, both `servermemory.md` and `mistakesdone.md` (repo
root) must be updated with that commit's findings/state and any mistake+correction,
respectively. Enforced by a PostToolUse hook on `git commit`/`git push` in this repo's
`.claude/settings.json` — the hook reminds, the actual writing is still my responsibility each
time.

## Working conventions for this session

- `gh pr merge`, `gh pr create`, `gh workflow run` are pre-approved (see this repo's own
  `.claude/settings.local.json` if present) so they don't hit the auto-mode classifier.
- Prefer feature branches + PRs over pushing straight to `main` (matches the pattern already
  established here — CI runs on PRs).
- User has explicitly said "ASAP" on this project — bias toward acting and reporting results
  over re-confirming steps already covered by an approved plan; still flag anything genuinely
  new, destructive, or security-relevant before doing it. The re-audit above is exactly why:
  trust but verify prior sessions' "safe to ignore" labels, especially across repo boundaries.
