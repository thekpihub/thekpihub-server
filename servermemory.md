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

## 2026-09-02 — Payment links + pricing packages verified live on thekpihub.com (main site, not the blog)

User asked to verify payment links work and how many packages are currently listed. Checked
the live site directly, not any doc.

**Razorpay (KPI Audit Lite, ₹2,999 one-time) — live and correct.** `get-audit.html`'s
`PAYMENT_LINK_URL` is `https://rzp.io/rzp/hLRfwonD`. Confirmed via a read-only GET (no
interaction, no payment data entered — screenshotting it was correctly blocked by the browser
tool's own payment-domain safety restriction, so verified via `curl` instead): HTTP 200,
description "Payment of INR 2999.00 requested by The KPI Hub", amount `299900` (paise) =
₹2,999.00, matches the published price exactly.

**Stripe (`/upgrade.html`, subscriptions) — live, but wired to numbers that don't match what's
published.** This confirms, with concrete live evidence, the caveat `apps/website/CLAUDE.md`
already flagged ("Do not treat the ₹5,999/mo figure as verified against Stripe — it is verified
only against the site's own copy") rather than resolving it:
- Live `pricing.html` and the homepage both publish exactly **3 packages**: KPI Audit Lite
  (₹2,999 one-time), Growth (₹5,999/mo, "coming Q3 2026"), Enterprise (custom/contact).
- Live `config.js` (fetched straight from `https://thekpihub.com/config.js`, not the repo —
  it's server-only, `.deploy-exclude`-protected) actually wires **3 different Stripe price
  IDs**: `starter` (₹999/mo — a tier that doesn't exist in current published pricing at all),
  `growth` (₹2,499/mo — not ₹5,999/mo as advertised), `enterprise` (₹7,999/mo — a specific
  number, despite Enterprise being marketed as "Custom"/contact-only).
- `/upgrade.html` itself is publicly reachable (`HTTP 200`, no auth gate) and its backend
  (`kpihub-backend-...-run.app/stripe-session`) is alive (`OPTIONS` → `204`) — confirmed without
  actually creating a checkout session (no POST sent; a session isn't a financial transaction,
  but wasn't necessary to prove the endpoint is live).
- Net effect: anyone who finds `/upgrade.html` can attempt to subscribe to a "starter" plan
  that isn't sold anywhere else on the site, or to "Growth"/"Enterprise" at prices that don't
  match what pricing.html/the homepage advertise.

**Not fixed — this is a business decision, not a code bug.** Don't know which side is "right":
maybe `config.js`'s price IDs are stale and need updating to match the ₹5,999/mo Growth figure,
maybe pricing.html's copy is aspirational and Stripe has the real numbers, maybe `starter`
should be removed from `config.js` entirely now that it's not sold. Flagged to the user with
the concrete numbers rather than guessed at or silently changed.

---

## 2026-09-02 — Footer nav's dead placeholder links fixed (real mistake, see mistakesdone.md)

The user caught something the earlier theme-swap fix missed: `blog.thekpihub.com`'s footer had
8 nav links (Blog/About/FAQs/Authors/Events/Shop/Patterns/Themes) that all went nowhere —
`href="#"`, which just stays on whatever page you're already on, making every article look like
it "duplicated the homepage" when clicked. Full mistake writeup with what should have been
checked at the time is in `mistakesdone.md` — this entry is the technical record of the fix.

**Root cause, verified by reading the actual source file, not assumed:** those `url:"#"` values
are hardcoded in `wp-content/themes/twentytwentyfive/patterns/footer.php` — Twenty Twenty-Five's
own shipped demo footer pattern, confirmed with `cat` over SSH. Genuinely official WordPress
theme placeholder content, not something introduced for this site — but applying that theme
(to fix the earlier blank-page bug) without ever auditing its own default content was the gap.

**Fix:** wrote a corrected `footer.php` (`.github/workflows/assets/blog-footer.php`, uploaded via
`scp` in the same SSH-based workflow used throughout this session) with a single nav group
containing two real links — `Blog` → `home_url('/')`, `About The KPI Hub` → `https://thekpihub.com`
— and removed the `Events`/`Shop`/`Patterns`/`Themes` group entirely rather than inventing fake
destinations for options that don't apply to a content blog. Also swapped the leftover literal
"Twenty Twenty-Five" text for a real copyright line.

**Verified directly in a live browser session, not just the fix script's own output:**
`find()` on the rendered footer returned exactly 2 links (down from 8); read their actual
`href` attributes: `Blog` → `https://blog.thekpihub.com/`, `About The KPI Hub` →
`https://thekpihub.com`. Both real, both correct.

**Recurring SSH-flakiness pattern held again:** first attempt at this exact fix failed with the
same `Connection timed out` (exit 255) on the very first SSH step; a same-workflow retry
succeeded, consistent with every prior occurrence this session.

---

## 2026-09-02 — CTA links fixed, pretty-permalink 404s fixed (both independently re-verified)

Two more fixes on the same install, both confirmed working via a fresh, independent check
afterward (not just trusting the fix script's own success message).

**Broken CTA links — fixed.** User's decision on the 3 options offered: link straight to the
real company homepages, dropping the `/go/` indirection (no real affiliate infrastructure
existed anywhere in the codebase — checked via `grep` before asking, not assumed).
`apps/website/pipeline.py`'s `CTA_BLOCKS` now points to `https://www.hubspot.com/` and
`https://www.semrush.com/` directly (fixes future posts; `services/pipeline/pipeline.py` has no
such CTAs, nothing to fix there). Also patched the 2 already-published posts (#48, #51) that had
the old broken URLs baked into `post_content`, via `wp_update_post()` over the same SSH path.
Re-ran `blog-link-audit.yml` fresh afterward: all 3 unique links across the 4 published posts
now return `200`.

**Pretty-permalink 404s — root-caused and fixed.** The user asked to check
`https://blog.thekpihub.com/tool_intelligence-2026-09-02/` specifically — it 404'd, but
`?p=48` correctly 301-redirected to that exact URL, proving the post existed and
`permalink_structure` (`/%postname%/`) was already correct. Root cause: `.htaccess` genuinely
didn't exist. `save_mod_rewrite_rules()` (called via the SSH+PHP-CLI path used throughout this
session) detects the web server via `$_SERVER['SERVER_SOFTWARE']`, which isn't set under CLI,
so it silently returned `false` and skipped writing anything — confirmed directly (`var_export`
of its return value). Fix: write the standard WordPress rewrite block to `.htaccess` directly
when missing (same well-known boilerplate WP itself generates from a real web request, not
guessed at). Verified independently afterward, outside the workflow: all 4 posts' pretty
permalink URLs (including the exact one asked about) now return `200`.

**Recurring pattern, now well-established across ~6 dispatches this session:** the very first
SSH step in `install-wordpress-blog.yml` intermittently fails with `Connection timed out` (exit
255), and everything after it in the same job doesn't run since the step fails outright. A
same-workflow retry has succeeded every single time so far. Treat a red run on this workflow as
"retry once" before treating it as a real problem, not evidence the fix itself is wrong. See
`apps/website/CLAUDE.md`'s deploy-mechanism note for the matching pattern seen there too.

---

## 2026-09-02 — Admin login fixed, link audit run, brand CSS applied to blog.thekpihub.com

Three more asks on the same live WordPress install, all done and verified this session.

**Admin login — done, verified by actually logging in.** Added a password-reset step to
`install-wordpress-blog.yml` using `wp_set_password()` over the same SSH+PHP-CLI path (chosen
over the email-based `wp-login.php?action=lostpassword` flow since outbound mail from this
fresh install was untested — this is deterministic). New password came from a `WP_ADMIN_NEW_PASSWORD`
GitHub secret, not hardcoded. Hit the same intermittent SSH timeout seen earlier in this session
(exit 255 on the very first SSH step, so nothing after it ran) — retried once, succeeded. Then
**actually logged in via a real browser session** at `wp-login.php` with
`sharmahimanshu1178.hs92@gmail.com` — worked first try, landed on the standard admin-email
confirmation screen, then a one-time "Database Update Required" screen (expected: the DB's
`db_version` predates the freshly-downloaded WP core; ran it, standard/safe/official WP
routine), then a normal wp-admin Dashboard: "4 Published posts. WordPress 7.1 running Twenty
Twenty-Five theme."

**Link audit — done.** New `.github/workflows/blog-link-audit.yml` (one-off, read-only, same
SSH pattern) queries `post_content` for every `post_status='publish'` post directly via
`get_posts()` (not scraped), regexes out every `href`, dedupes, and curls each one for a live
status code. Result on the 4 published posts: **2 of the 3 unique links are broken (404)** —
`https://thekpihub.com/go/hubspot` and `https://thekpihub.com/go/semrush`, both from the
`CTA_BLOCKS` constant in `apps/website/pipeline.py`. `https://thekpihub.com/#waitlist` (200) is
fine. Confirmed via `grep` that `/go/hubspot` and `/go/semrush` exist **only** as strings inside
`pipeline.py` — there is no redirect script, `.htaccess` rule, or folder anywhere in the repo
that would serve those paths. This is a pre-existing gap in the pipeline's affiliate-CTA content
(not something this session caused), flagged rather than papered over with a fabricated
redirect target — setting up real HubSpot/SEMrush affiliate links needs the user's actual
affiliate program URLs.

**Brand CSS — done, applied and verified visually.** New
`.github/workflows/blog-brand-css.yml` + `.github/workflows/assets/blog-brand.css`. Tokens
pulled directly from `apps/website/colors_and_type.css` (the main site's real, current source
of truth) rather than the stale summary in `apps/website/CLAUDE.md`'s Design System section,
which lists the wrong fonts entirely (says Cormorant Garamond/Syne/DM Sans; the actual live
site uses Source Serif 4 / Beiruti / Manrope / JetBrains Mono — that doc section needs fixing
separately). Navy `#06071A` background, gold `#E9A123` primary accent, teal `#00C9A7`
secondary, matching fonts loaded via the same Google Fonts URL pattern the main site uses.
Applied via `wp_update_custom_css_post()` — WordPress's standard Additional CSS mechanism,
theme-independent, fully reversible from wp-admin without touching any theme file. Verified by
loading the actual page in a browser: dark background, gold serif site title, serif headings,
readable body copy all rendering correctly.

---

## 2026-09-02 — WordPress reinstalled at blog.thekpihub.com, wired to the existing DB — LIVE

Executed the recommendation from the entry below, on explicit user request. Site is real,
rendering pipeline-generated content, confirmed by loading it in a browser (not just curl):
**https://blog.thekpihub.com/** shows "SaaS Benchmark Update, September 02, 2026: NRR Falls to
101%, CAC Climbs 14%" — one of the 4 posts (`wp_posts` IDs 48-51) the pipeline wrote into the
DB earlier today.

**What was built:**
- Subdomain `blog.thekpihub.com` created in hPanel (Websites → thekpihub.com → Domains →
  Subdomains). Docroot is `public_html/blog-wordpress` — Hostinger's subdomain tool always
  nests under the parent domain's `public_html` on this plan, no way to place it as a sibling.
  Confirmed this is NOT at risk from `apps/website`'s deploy workflow: that pipeline turned out
  to be an **allow-list** staged payload with no `--delete` flag at all (see
  `scripts/stage-hostinger-site.sh`) — safer than the old CLAUDE.md notes describe (those
  describe a stale `rsync --delete` setup that predates a rewrite; worth correcting there).
  `blog-wordpress/` was never at risk either way, since it's not part of the repo.
- `.github/workflows/install-wordpress-blog.yml` — a `workflow_dispatch`-only, one-off
  provisioning workflow (kept in the repo as a record / for any future reinstall, not deleted).
  Reuses the `hostinger-production` environment's SSH secrets (already proven by
  `deploy-website-hostinger.yml`). SSHes in, downloads WordPress core directly on the *remote*
  server (the 37 MB core zip is well over the browser upload tool's 10 MB cap, so this avoided
  that entirely), and writes `wp-config.php` pointed at the **existing** `u117990013_Thekpihub`
  database — table prefix `wp_`, matching what's already there. No new database, no migration.

**Root cause of an initial blank-page problem, found and fixed, not guessed at:**
First load returned HTTP 200 with a genuinely empty body. Ruled out causes methodically via a
sequence of SSH diagnostics appended to the same workflow (each committed/pushed/dispatched in
turn — real back-and-forth, not a single lucky guess):
1. PHP CLI (8.2.33) bootstrap via `wp-load.php` succeeded cleanly (`WP_BOOTSTRAP_OK`) — ruled
   out DB connectivity and wp-config.php correctness.
2. The real web request runs a *different* PHP version than CLI — `X-Powered-By: PHP/8.3.33`
   vs CLI's 8.2.33 (CloudLinux PHP Selector — SSH/cron and the web vhost are configured
   separately on this shared hosting). Found the actual web-facing error log path
   (`~/.logs/error_log_blog_thekpihub_com`) via a temporary web-accessible diagnostic script
   (`ini_get('error_log')`) rather than guessing common paths — the earlier guesses had all
   found nothing, which was itself a clue that they were wrong paths, not that logging was off.
3. That log was clean (only two benign LiteSpeed-cron-reschedule notices) — no PHP fatal ever
   fired. The actual cause: `wp_options.template`/`stylesheet` = `hello-elementor`, a theme
   that was never installed (the fresh WP core download only ships
   `twentytwentyfive/four/three`). `wp-includes/template-loader.php` can't locate any template
   file for a missing theme and **silently outputs nothing** rather than erroring — hence 200 +
   empty body + a clean log. Confirmed directly: simulating the real front-end render via CLI
   (`php wp-blog-header.php`, exercising the exact code path a real request uses, unlike the
   earlier `WP_USE_THEMES=false` bootstrap test) produced exactly 159 bytes — one harmless CLI
   warning, then nothing.
4. Fix: `update_option('template', 'twentytwentyfive')` / same for `stylesheet`, via the same
   SSH+PHP-CLI path. Verified immediately after: homepage jumped from 0 bytes to 101,542 bytes
   of real HTML, `<title>The KPI Hub</title>`, then confirmed visually in an actual browser tab.

**Known, not yet addressed:** the DB also lists 7 "active" plugins (`elementor`,
`hostinger`, `image-optimization`, `litespeed-cache`, `manage`, `pojo-accessibility`,
`wp-webhooks`) that aren't installed either. WordPress tolerates this gracefully (validates
each plugin file exists before including it, silently skips missing ones since WP 5.2 — this
did NOT contribute to the blank-page bug), so it's not broken, just noisy / worth cleaning up
`wp_options.active_plugins` at some point so wp-admin's plugins screen doesn't show phantom
entries. The ~46 pre-existing older posts (dated back to 2025-11-24, from whatever WordPress
install this DB was originally migrated from) will display unstyled under the new default
theme rather than however Elementor originally rendered them — Elementor generally saves full
rendered HTML into `post_content`, so they should still be structurally readable, but this
hasn't been checked post-by-post. Admin login password is unknown (only a bcrypt hash exists in
`wp_users`, can't be reversed) — `wp-login.php?action=lostpassword` should work since
`admin_email` is a real inbox the user owns (`sharmahimanshu1178.hs92@gmail.com`), but outbound
mail delivery from this install hasn't been tested.

---

## 2026-09-02 — pipeline.yml: once/day + artifact-capture fix; MySQL connectivity NOT transient; WP backup history checked

**Both done, on explicit user request:**
- `pipeline.yml` cron: `0 1,7,13,19 * * *` (4x/day) → `0 13 * * *` (once/day, 13:00 UTC /
  18:30 IST — picked clear of `daily-pipeline.yml`'s 21:33 UTC and `premium-pipeline.yml`'s
  09:33 UTC). Commit `6beaf95`.
- `upload-artifact` in the same workflow now also captures `services/pipeline/articles/`
  (previously only `pipeline.log`) — **verified by downloading the artifact from a real run**:
  all 3 fallback JSON files were present alongside the log. Same commit.

**MySQL connectivity from `pipeline.yml` — NOT transient, reproduced twice in a row.**
Re-dispatched `pipeline.yml` after the fixes (run 33630386644) specifically to check whether
the earlier connection failure (run 33629397860) was a one-off. It wasn't — identical failure,
same two-stage pattern, for all 3 articles again:
```
DB connect via <hostname> failed: (2003, "... [Errno 101] Network is unreachable")
DB connect via <IP> failed: (2003, "... timed out")
```
Working hypothesis, not confirmed: the one run that *did* connect successfully
(`apps/website`'s live run, 33626840842) logged `Azure Region: westus`; both failures logged
`centralus`/`eastus`. GitHub-hosted runners land in different Azure regions per run with no
user control over which, and "Network is unreachable" (ENETUNREACH) is a local-routing-table
error, not a remote refusal — consistent with a region-dependent routing/IPv6 issue between
that particular Azure region and Hostinger's server, rather than anything wrong with the Any
Host (%) rule itself (which did work, from `westus`). Not root-caused further this session —
flagged to the user rather than guessed at with more code changes. The JSON-fallback +
now-captured-artifact path means no data is lost when this happens, just not written to the DB
automatically.

**WordPress backup history checked — conclusive, restore is not viable.** Went through hPanel
Backups → Restore and download → Files backup for `thekpihub.com`, oldest available backup is
**2026-07-19** (six weeks before this check; backups exist from 2026-06-25 per hPanel's own
note, but the UI only surfaces this far back). Browsed that oldest backup's full file listing
end-to-end: identical static-site repo structure to today (`.git`, `.github`, `account/`,
`api/`, ... `wp-plugin/`) — **no `wp-admin`, `wp-content`, `wp-includes`, or `wp-config.php`
anywhere, confirmed by scrolling the complete alphabetical listing**. Combined with the earlier
finding that `wp_posts`' oldest rows are dated 2025-11-24 — seven months before this Hostinger
website was even created (2026-06-20) — the likely explanation is that the WordPress
**database** was migrated in from a prior, different WordPress installation at some point, but
the WordPress **application files** were never installed on this hosting account at all. This
settles the restore-vs-reinstall question: there is nothing to restore from backups; a fresh
WordPress install is the only path if that route is taken.

**Recommendation given to the user, not yet actioned:** reinstall WordPress core under a
subdomain (`blog.thekpihub.com`) pointed at the existing `u117990013_Thekpihub` database, over
a subdirectory/root-domain install or a custom-built frontend. Reasoning: the pipeline already
writes 100%-WordPress-native rows (proper `wp_posts`/taxonomy relationships, and a
`_yoast_wpseo_metadesc` postmeta key implying the original stack included Yoast SEO) — a real
WordPress install renders all of that correctly with zero further data work, which a bespoke
frontend would have to reimplement and maintain. A subdomain avoids two real risks a
subdirectory install would carry: `apps/website`'s deploy workflow runs `rsync --delete`
(protected only by `.deploy-exclude` — see `apps/website/CLAUDE.md`), and a WP folder not added
to that exclude list before the next automated deploy would be wiped; a subdomain's docroot is
untouched by that pipeline entirely. Root domain was ruled out outright — would mean replacing
the live static site's docroot.

---

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
