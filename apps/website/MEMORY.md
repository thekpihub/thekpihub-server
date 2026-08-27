# Project Memory — The KPI Hub Website

A running, dated record of what's been done in this repo, why, and what it bought — kept so
anyone picking this up later doesn't have to re-derive the reasoning from the diff alone.
Every entry traces back to one motive: **paid subscribers should get a fully working
product — live deploys that actually deploy, intelligence reports that actually generate,
checkout that actually works.** Append new entries at the top of "Log"; don't rewrite
history below.

## Log

### 2026-08-27 — KPIHUB-Assembled consolidation, Hostinger migration, and security hardening

**Starting point:** The project was already live on Vercel at
`https://platform-two-zeta-31.vercel.app`, with GitHub `main` at the documented
commit `32205f3`. The first checks confirmed HTTP 200 for `/`, `/login`,
`/register`, `/api/health`, and `/api/health/ready`, with readiness reported true
at that stage. The saved handoff and audit log were read before continuing; work
was resumed from the recorded next step rather than restarted.

**Supabase/Vercel setup:** The browser-safe Supabase publishable key supplied by
the owner was treated as a secret and never written into source or documentation.
The canonical Vercel project was identified as the `platform-two-zeta-31` deployment
under the `hsharmagxi-debug` scope. The missing public Supabase key was added to the
Vercel production/preview/development environment under the existing public-key
variable name. Project access to Supabase project `eewkislidznpgdbvvbo` remained a
separate owner-access limitation and was recorded rather than guessed around.

**Canonical repo and deployment audit:** The canonical repository was verified as
`https://github.com/hsharmagxi-debug/kpihub-assembled`, private, branch `main`.
The repository is a monorepo; the public Hostinger site must come only from
`apps/website`, never from the repository root. The old Hostinger server checkout
was inspected read-only over SSH and recorded as:

- webroot `/home/u117990013/domains/thekpihub.com/public_html`;
- remote `https://github.com/thekpihub/thekpihub-website.git`;
- branch `main`, commit `9240e0082dada24b18760d8e64f77c544a65759a`;
- 49 dirty Git entries and 641 inventoried filesystem entries.

GitHub auditing found the accessible duplicate Hostinger workflow in
`hsharmagxi-debug/thekpihub-platform`; its workflow ID `306005775` was later
disabled. The historical `thekpihub/thekpihub-website` webhook/remote could not be
fully owner-verified, so it was preserved and documented as an outstanding manual
review item. No repositories, DNS records, Hostinger sites, or files were deleted.

**Access repair:** GitHub CLI was repaired through browser/device OAuth using the
`hsharmagxi-debug` account; the old exposed classic PAT was not tested, reused, or
printed. A dedicated temporary Hostinger deploy key was generated, its public key
was added by the owner in Hostinger SSH Access, and only the masked private key and
known-host data were stored in the protected GitHub `hostinger-production`
environment. The previously stored legacy Hostinger key was proven stale by a
failed SSH attempt and was not reused.

**Safety implementation:** A reviewed deployment design was added and merged:

1. `apps/website/hostinger-publish-manifest.txt` defines the exact 58-file public
   payload; no discovery globs or monorepo-root publication are allowed.
2. `scripts/stage-hostinger-site.sh` and its test create and verify an empty,
   allow-listed staging directory.
3. `apps/website/hostinger-source-deny.conf` blocks repository metadata, docs,
   tools, build/config files, package manifests, and other source-only material
   without containing credentials.
4. `.github/workflows/deploy-website-hostinger.yml` builds only `apps/website`,
   scans the staged payload, requires the protected `hostinger-production`
   environment, performs a non-destructive rsync dry run, and overlays without
   `--delete`. Server-managed `config.js`, `.htaccess`, WordPress, uploads,
   `.well-known`, and runtime paths are preserved.
5. Workflow, staging, and source-denial tests were run; all passed. The website
   dependency install, static build, asset check, rendered-homepage check, and
   payload secret scan also passed.

**Backup and execution evidence:** Before changing Hostinger, run `33103094801`
created the protected backup at
`/home/u117990013/kpihub-migration-backups/2026-08-27-before-kpihub-assembled`.
The retained `public_html.tar.gz` SHA-256 is
`184ecb5de1c4fcbd457f9bac9a45f3895e3b84e843bc2cc24cdb9a1b3a9550a3`; the backup
also includes the full manifest, Git state, dirty status, and pre-change `.htaccess`
copy. A dry run (`33103169805`) completed successfully and showed no deletion or
server-only-path changes.

**Hardening and deployment:** The append-only source-denial fragment was applied
after the backup by run `33103331526`; temporary backup and hardening workflows were
then disabled but retained in Git history. The governed production overlay was run
as `33103604181` from the reviewed `main` tree (`9f34a30` at deployment) and
completed successfully. The final documentation update was committed and pushed as
`0c8d065`.

**Post-deployment verification:** `https://thekpihub.com/` and
`https://www.thekpihub.com/` return HTTP 200 with HTTPS/SSL intact. Static website
pages `/login.html`, `/register.html`, `/pricing.html`, `/auditor.html`, and
`/benchmarks.html` return HTTP 200. Previously exposed paths such as `README.md`,
`vercel.json`, `package.json`, `docs/`, `tools/`, `.github/`, `server.js`, and
`api/index.js` return HTTP 403. Hostinger `/login`, `/register`, and `/api/health*`
remain 404 by design because those application routes belong to the separate Vercel
platform; Vercel `/`, `/login`, `/register`, and `/api/health` return 200, while
`/api/health/ready` still returns 503 and remains a blocker.

**Security follow-up:** The owner explicitly deferred rotation of the exposed GitHub
PAT, Hostinger password, and other long-lived tokens until 2026-08-28. This is still
open. Never add credential values to this memory file, `HANDOFF.md`, source, or
archive materials.

### 2026-06-21 — Full CI/automation audit + RSS feed fix (PR #7, merged)

**What:** Investigated every failing GitHub Actions check (not just the one visible in the
latest push) and found 4 real, persistent issues:

1. **`Deploy to Firebase Hosting` fails on every push.** `FIREBASE_TOKEN` secret doesn't
   exist in the repo at all — `firebase deploy --token ""` → "Failed to authenticate."
2. **`Daily Intelligence Pipeline` has failed every single scheduled run for 15+ days
   straight** (since 2026-06-06). `ANTHROPIC_API_KEY` exists but the Anthropic API returns
   `401 invalid x-api-key` — the key itself is invalid/revoked.
3. **`48-Hour Premium Pipeline` fails the same way, every run** — same root cause as #2,
   same shared secret.
4. **Two RSS feeds silently failed every pipeline run** with "not well-formed (invalid
   token)" XML errors: `techcrunch.com/category/saas/feed/` (now a dead 404 — TechCrunch
   restructured their site) and `openviewpartners.com/blog/feed/` (the trailing slash serves
   an HTML page, not XML). Non-fatal (the pipeline caught the error and continued) but
   silently dropped 2 of 5 intended sources on every run.
5. **6 secrets the Firebase deploy's `config.js` generation step depends on don't exist**:
   `CONFIG_SUPABASE_URL`, `CONFIG_SUPABASE_ANON_KEY`, `CONFIG_STRIPE_PUB_KEY`,
   `CONFIG_STRIPE_PRICE_STARTER`, `CONFIG_STRIPE_PRICE_GROWTH`, `CONFIG_STRIPE_PRICE_ENT`.
   Even once Firebase deploy itself is fixed, the deployed site's Supabase auth and Stripe
   checkout would still ship broken (empty strings baked in) until these are set.

**Fixed today** (#4 only — the rest need real credentials, see "Blocked" below): replaced
both dead RSS URLs in `pipeline.py`'s `RSS_FEEDS` list
(`techcrunch.com/tag/saas/feed/` and `openviewpartners.com/blog/feed`, no trailing slash) —
verified both parse cleanly with real entries before committing. Shipped via
`fix/rss-feed-urls` → PR #7 → merged to `main` (not pushed directly, since `main` auto-deploys
to production via the Hostinger webhook on every push — a PR keeps that deploy a deliberate,
reviewed action rather than incidental).

**Why:** "Resolve all the errors... verify everything for 0% errors" — required full
visibility into every failure mode, not just the one shown in a single screenshot, before
fixing anything.

**Benefit:** The Daily/Premium intelligence pipeline — the core paid-product value, market
intelligence delivered to subscribers — will pull from all 5 intended sources again once the
API key (below) is fixed, instead of silently losing 40% of its sources every run
indefinitely.

**Blocked on credentials only the account owner can generate** (not fixable by code):
`FIREBASE_TOKEN`, `ANTHROPIC_API_KEY`, and the 6 `CONFIG_*` secrets. A daily automated
check-in (cloud routine, 11:11 PM IST, https://claude.ai/code/routines/trig_013PNKS13ypWaQ8esYtp8Wj3)
was set up to re-verify these via `gh run list`/`gh secret list` each night and remind with
exact remediation steps until all three are resolved — then it should be disabled.

## Next steps — recommended, in priority order

Framed the same way every step above was: **does this directly restore or protect value a
paying subscriber is supposed to get?**

1. **Rotate `FIREBASE_TOKEN`** (`firebase login:ci` or a service account) and
   `gh secret set FIREBASE_TOKEN --repo thekpihub/thekpihub-website` — restores automatic
   production deploys. Until this is done, every merged change only reaches GitHub Pages,
   not the Firebase-hosted production site — the two deploy targets are drifting apart.
2. **Generate a fresh `ANTHROPIC_API_KEY`** at console.anthropic.com and set it the same
   way — this single fix resolves *both* failing pipelines at once and restores the daily
   subscriber-facing intelligence reports that have been silently absent for over two weeks.
3. **Set the 6 `CONFIG_*` secrets** from the Supabase and Stripe dashboards (see
   `config.example.js` for exactly what each one is and where to find it) — without these,
   subscriber login and the upgrade/checkout flow are broken on the live site even after #1
   is fixed.
4. **Once #1–#3 are done, manually trigger both pipelines** (`workflow_dispatch`) and
   spot-check a generated report for quality before letting the nightly schedule resume
   unattended — don't just trust the green checkmark.
5. **Add a cheap pre-flight check to `pipeline.py`** that validates `ANTHROPIC_API_KEY` with
   one lightweight call before running the full 15-query SerpAPI research harvest — this
   exact failure mode burned ~1.5 minutes of search/scrape work on every one of the last 15+
   runs before failing at the synthesis step. A fast-fail saves SerpAPI quota and makes the
   Telegram failure alert arrive faster.
6. **Confirm the existing Telegram failure alert is actually firing** — if it were, a 15-day
   silent failure streak should have been impossible to miss. Worth checking
   `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` are still valid and the notify step is reachable.
7. **Move Firebase CI auth off the token flow** (`firebase login:ci`, which Google has been
   deprecating) **onto a service-account-based deploy** — more robust, doesn't silently
   expire the way a CI token can, directly prevents this exact class of failure recurring.
8. **Periodically audit `RSS_FEEDS`/`SERPAPI_QUERIES` for staleness** — today's TechCrunch
   404 is a reminder that external sources restructure without notice; a quarterly check
   keeps subscriber-facing reports comprehensive instead of quietly thinning out over time.
