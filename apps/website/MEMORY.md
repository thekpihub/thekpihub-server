# Project Memory — The KPI Hub Website

A running, dated record of what's been done in this repo, why, and what it bought — kept so
anyone picking this up later doesn't have to re-derive the reasoning from the diff alone.
Every entry traces back to one motive: **paid subscribers should get a fully working
product — live deploys that actually deploy, intelligence reports that actually generate,
checkout that actually works.** Append new entries at the top of "Log"; don't rewrite
history below.

## Log

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
