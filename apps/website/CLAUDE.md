# The KPI Hub — Claude Code Context

## Project
SaaS KPI intelligence platform for Indian businesses.
Tagline: "Decision-Grade Intelligence. Zero Fluff."
Live at: https://thekpihub.com

## Stack
- Hosting: Hostinger (static files + PHP, git webhook deploy)
- Frontend: Vanilla HTML/CSS + inline React 18 via unpkg CDN
- Auth: Supabase (https://eeuwkislidznpgdbvvbo.supabase.co)
- Billing: **`upgrade.html`'s Stripe flow was retired 2026-09-04 — see the caveat below.**
  - **Razorpay Payment Link — the only live one-time revenue path.** The ₹2,999 KPI Audit.
    Hardcoded as `PAYMENT_LINK_URL` in `get-audit.html`; does not touch `config.js`.
  - **Subscriptions (Growth/Enterprise) now live in `apps/platform`**, not this site — real
    Razorpay + PayPal checkout at `/dashboard/billing` on the platform's own Vercel deployment
    (`https://thekpihub-platform.vercel.app`), wired in PR #12. `config.js`'s Stripe keys are
    now dead weight (nothing on this site calls them any more) — not yet removed from
    `config.js`/`config.example.js`, just unused.
- AI: Anthropic API (browser-side via api-key-modal.js)
- Blog: WordPress on thekpihub.com
- Pipeline: pipeline.py (GitHub Actions cron 3:03 AM IST)
- Wingman: frontend at https://wingcommander.thekpihub.com (Vercel, `apps/wingcommander-reference`),
  API at Railway (`ditto-wingman-backend-production-85f6.up.railway.app`, proxied via the
  frontend's `/api/*` rewrite). **Corrected 2026-09-04** — this line previously said
  `agent.thekpihub.com (Railway backend)`, which was wrong on both counts: `agent.thekpihub.com`
  turned out to be owned by a different, inaccessible Vercel account (not anything deployed from
  this repo), and the backend itself has always been Railway, not fronted directly. See
  `servermemory.md` (2026-09-04) for the full investigation. `open-wingman.php`'s
  `WINGCOMMANDER_API_URL`/`WINGCOMMANDER_URL`/`WINGCOMMANDER_HANDOFF_SECRET` .htaccess `SetEnv`
  values are set on Hostinger and confirmed working — live-tested end to end 2026-09-04 with a
  real Growth-plan user (200 OK, correct plan mapping). `.htaccess.template` (the checked-in
  reference for reprovisioning) previously documented the wrong variable names/domain for this
  and was fixed 2026-09-05 — see servermemory.md.
- Analytics: GA4 + Microsoft Clarity
- DNS: Hostinger nameservers (ns1/ns2.dns-parking.com) — apex + www resolve to Hostinger CDN (hstgr.net). Verified 2026-06-28.

## Design System
- Colors: Navy #06071A, Gold #E9A123, Teal #00C9A7
- Fonts: Source Serif 4, Beiruti, Manrope, JetBrains Mono (monospace) — see
  colors_and_type.css. This previously said Cormorant Garamond/Syne/DM Sans,
  which was stale.

## Security Rules (CRITICAL)
- NEVER put handoff_secret or supabase_service_role_key in config.js
- config.js = public client-side file (wingman, supabase, stripe, app only)
- Secrets go in .htaccess via SetEnv directives only
- All nested CONFIG objects must be Object.freeze()d

## Deployment
- Canonical repo: thekpihub/thekpihub-website (NOT nitro0dust-pixel). **PRIVATE since 2026-08-19** —
  cloning needs an authenticated `gh`/credential helper; an anonymous 404 is expected.
- SSH: u117990013@thekpihub.com
- **A red GitHub Actions run means the deploy did NOT happen.** This line previously read
  "GitHub Actions red = harmless (deploys via Hostinger webhook)". That is false and was
  dangerous: there is no webhook deploy any more. If it is red, production is stale.
- **Corrected 2026-09-02 — the deploy mechanism was rewritten since the note above was
  written, and the description below it (kept for a while after, `rsync --delete`) was stale.**
  The actual current workflow is `.github/workflows/deploy-website-hostinger.yml`
  ("Website - Hostinger governed deploy"). It builds an **allow-listed** payload via
  `scripts/stage-hostinger-site.sh` (only files explicitly allowed get staged — not the old
  deny-list-via-`.deploy-exclude` model) and ships it with a plain `rsync -avz` overlay —
  **no `--delete` flag at all**. Confirmed directly while installing WordPress under
  `blog.thekpihub.com` (a folder that's never been in this repo): nothing in `.deploy-exclude`
  was needed to protect it, because the deploy can only ever add/update files it explicitly
  staged, never delete anything on the server. `.deploy-exclude` still exists and still lists
  `wp-admin/`, `wp-content/`, etc., but it's now effectively belt-and-suspenders rather than
  the only thing standing between a deploy and deleting the WordPress blog.
- **Hostinger intermittently blocks/times out GitHub runner connections to the server.**
  Symptom is `Connection timed out` on SSH — TCP-level, not auth; the credentials are fine.
  Also seen 2026-09-02 on the *database* side (MySQL, not SSH) from a different workflow, same
  symptom pattern — see `servermemory.md`. Not root-caused, but reproducible enough to not be
  a fluke. The job retries 3x, but a sticky block needs a re-run on a fresh runner:
  `gh run rerun <id> --failed`.

## Sprint 4 — CLOSED (May 23 2026)
- api-key-modal.js: secure API key modal (replaces browser prompt)
- config.example.js: scaffolded with placeholders + .gitignore entry
- open-wingman.php: replaced dead Next.js route with PHP
- Babel 1.7MB removed: JSX pre-compiled to 8 .js files
- cache_control ephemeral: added to all 5 API call files

## Current Status (updated 2026-09-05 — the checklist below was stale)
- [x] config.js live on Hostinger with real credentials (server-maintained, not committed to git)
- [x] .htaccess SetEnv secrets (Supabase, WingCommander) set on Hostinger — WingCommander
  handoff live-tested end to end 2026-09-04 with a real Growth-plan user
- [x] X-HMAC-Signature requirement removed from open-wingman.php (a browser fetch() could
  never have computed it against a server-only secret) — this is what unblocked the above
- [ ] Stripe payment flow — moot, `upgrade.html`'s Stripe flow was retired 2026-09-04 in favor
  of apps/platform's Razorpay+PayPal checkout at /dashboard/billing (see Billing above)
- Full history of what's actually been verified: see the repo's servermemory.md

## Pricing

Canonical. `pricing.html`, homepage §8 (`landing/sections-c.jsx`) and the homepage FAQ
(`landing/sections-d.jsx`) must all agree with this table — they drifted badly once and
shipped three different schemes at the same time.

| Tier | Price | Status |
|---|---|---|
| KPI Audit Lite | **₹2,999 one-time** | **Live.** The only thing that can be bought today. Razorpay, INR. |
| Growth | **₹5,999/mo** | Coming Q3 2026. Not purchasable — CTA is "Express Interest". |
| Enterprise | Custom | Contact sales. |

The earlier ₹999 / ₹2,499 / ₹7,999 monthly scheme recorded here was never published and
conflicted with the live site. Removed 2026-08-19.

### `/upgrade.html` — retired 2026-09-04, now redirects (was: could sell what pricing pages said wasn't for sale)

Previously `/upgrade.html` returned **200** (unlisted, `noindex`, but not access-controlled) and
wired a real Stripe embedded checkout for three plans — `starter` (removed from public pricing
on 2026-08-19 but still selectable here), `growth` (advertised as not purchasable until Q3 2026,
yet payable at whatever price Stripe's dashboard held, unpinned to the published ₹5,999/mo), and
`enterprise` (marketed as Custom/contact-only, yet had a fixed Stripe price). User decision
2026-09-04: redirect rather than gate-and-fix, since a real replacement now exists. The page is
now a static redirect (meta-refresh + JS) to `apps/platform`'s `/dashboard/billing`, which has
its own auth gate and real Razorpay/PayPal checkout (PR #12). All Stripe/Supabase/plan-fetch
logic was removed from the page. 17 other files in this repo still link to `upgrade.html` by URL
(nav CTAs, docs, sitemap) — left as-is since the redirect keeps every one of those links working
without a 17-file find-and-replace; update them directly to the platform URL only if/when the
redirect itself is removed.
