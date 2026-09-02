# The KPI Hub — Claude Code Context

## Project
SaaS KPI intelligence platform for Indian businesses.
Tagline: "Decision-Grade Intelligence. Zero Fluff."
Live at: https://thekpihub.com

## Stack
- Hosting: Hostinger (static files + PHP, git webhook deploy)
- Frontend: Vanilla HTML/CSS + inline React 18 via unpkg CDN
- Auth: Supabase (https://eeuwkislidznpgdbvvbo.supabase.co)
- Billing: **two separate rails — do not conflate them**
  - **Razorpay Payment Link — the only live revenue path.** The ₹2,999 KPI Audit.
    Hardcoded as `PAYMENT_LINK_URL` in `get-audit.html`; does not touch `config.js`.
  - **Stripe embedded checkout — subscriptions only, and they are unlaunched.**
    `upgrade.html` loads Stripe.js, reads `CONFIG.stripe.prices[plan]`, and posts to
    `/stripe-session` on the Cloud Run backend. Real code, and the live `config.js`
    has the publishable key plus all three price IDs populated. See the caveat below.
- AI: Anthropic API (browser-side via api-key-modal.js)
- Blog: WordPress on thekpihub.com
- Pipeline: pipeline.py (GitHub Actions cron 3:03 AM IST)
- Wingman: https://agent.thekpihub.com (Railway backend)
- Analytics: GA4 + Microsoft Clarity
- DNS: Hostinger nameservers (ns1/ns2.dns-parking.com) — apex + www resolve to Hostinger CDN (hstgr.net). Verified 2026-06-28.

## Design System
- Colors: Navy #06071A, Gold #E9A123, Teal #00C9A7
- Fonts: Cormorant Garamond, Syne, DM Sans

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

## Current Status — Phase 1 PENDING
- [ ] config.js live on Hostinger with real credentials
- [ ] .htaccess SetEnv secrets added on Hostinger
- [ ] 5x 404 pages verified and fixed
- [ ] Stripe payment flow tested end to end
- [ ] HMAC secret rotated (needs SSH access)

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

### Caveat — `/upgrade.html` can still sell what the pricing pages say is not for sale

`/upgrade.html` returns **200** (unlisted and `noindex`, but not access-controlled) and wires a
real Stripe embedded checkout for three plans: `starter`, `growth`, `enterprise`. Two problems:

- **`starter` no longer exists.** The seat-based Starter tier was removed from all public pricing
  on 2026-08-19. The Stripe price ID is still live in `config.js` and still selectable here.
- **`growth` is advertised as not purchasable until Q3 2026**, yet anyone with this URL can
  attempt to pay for it now, at whatever amount is set in the Stripe dashboard — which nothing in
  this repo pins to the published ₹5,999/mo.

Nobody has decided what should happen here, so nothing was changed. The options are to gate the
page behind auth, take the plans off it until launch, or launch them properly. **Do not treat the
₹5,999/mo figure as verified against Stripe** — it is verified only against the site's own copy.
