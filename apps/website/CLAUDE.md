# The KPI Hub — Claude Code Context

## Project
SaaS KPI intelligence platform for Indian businesses.
Tagline: "Decision-Grade Intelligence. Zero Fluff."
Live at: https://thekpihub.com

## Stack
- Hosting: Hostinger (static files + PHP, git webhook deploy)
- Frontend: Vanilla HTML/CSS + inline React 18 via unpkg CDN
- Auth: Supabase (https://eeuwkislidznpgdbvvbo.supabase.co)
- Billing: **`upgrade.html`'s Stripe flow was retired 2026-09-04; relaunched 2026-09-10 as a
  real session hand-off — see the `/upgrade.html` section below.**
  - **Razorpay Payment Link — the one-time revenue path.** The ₹2,999 KPI Audit.
    Hardcoded as `PAYMENT_LINK_URL` in `get-audit.html`; does not touch `config.js`.
  - **Subscriptions (Growth live, Enterprise custom) are in `apps/platform`**, not this site's
    own code — real Razorpay + PayPal checkout at `/dashboard/billing` on the platform's own
    Vercel deployment, now domain-mapped to `https://app.thekpihub.com` (2026-09-10 — the old
    `thekpihub-platform.vercel.app` claim here was stale/wrong, that URL was never live), wired
    in PR #12. This site's own `pricing.html`/homepage "Upgrade to Growth" buttons link to
    `upgrade.html`, which hands off the signed-in session there. `config.js`'s Stripe keys are
    still dead weight (nothing on this site calls them any more) — not yet removed from
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
| KPI Audit Lite | **₹2,999 one-time** | **Live.** Razorpay, INR. |
| Growth | **₹5,999/mo** | **Live as of 2026-09-10** — CTA is "Upgrade to Growth →", routes through `upgrade.html`'s session hand-off to `apps/platform`'s real checkout. Was gated "Coming Q3 2026" until this date; see below for why that gate existed and why it was deliberately lifted. |
| Enterprise | Custom | Contact sales. |

The earlier ₹999 / ₹2,499 / ₹7,999 monthly scheme recorded here was never published and
conflicted with the live site. Removed 2026-08-19.

### `/upgrade.html` — now the real session hand-off to Growth checkout (relaunched 2026-09-10)

**History**: originally wired a real Stripe embedded checkout for three plans, one of which
(`growth`) was purchasable at an unpinned Stripe-dashboard price *before* pricing.html said it
was for sale — treated as a bug and fixed 2026-09-04 by retiring it to a **dumb** redirect
(meta-refresh + JS, no session logic) to `apps/platform`'s `/dashboard/billing`, since Growth
still wasn't meant to be purchasable yet at that point.

**Relaunched 2026-09-10, deliberately**: the Q3 2026 gate above was a real, documented decision,
not stale copy — flagged directly to the user before touching anything, and the decision to move
the Growth launch up was made explicitly with that context, not assumed. Domain-mapping
`apps/platform` to `app.thekpihub.com` the same day exposed a real gap the dumb redirect always
had: this site's Supabase client is `localStorage`-based (origin-scoped to thekpihub.com);
`apps/platform`'s is `@supabase/ssr` cookies (host-only, no domain sharing configured) — a
session from one never existed on the other, so every "Upgrade" click was silently dropping
signed-in users at a second login. Fixed by giving `upgrade.html` real session-aware logic
again (Supabase JS re-added): signed-in users hand off their access/refresh token pair (both
apps share the same Supabase project, so the tokens are portable) via
`app.thekpihub.com/auth/handoff#access_token=...&refresh_token=...` (hash fragment, never sent
to any server); signed-out users go to this site's own `login.html` first. The stale
`thekpihub-platform.vercel.app` destination (never a real live domain — see
`thekpihub-server/README.md`'s own correction the same day) was also fixed to the real
`app.thekpihub.com`.

17 other files in this repo still link to `upgrade.html` by URL (nav CTAs, docs, sitemap) — that
was fine when it was a dumb redirect and is still fine now that it does more: none of them need
touching, they all benefit from the real hand-off automatically.

**Known minor gap, not fixed in this pass**: a signed-out user who logs in via `login.html`
lands on `dashboard.html` (that page's hardcoded redirect), not back on `upgrade.html` — they'd
need to click "Upgrade" a second time after signing in. Adding `next`-param support to
`login.html` would close this, but wasn't done here to avoid widening this change into a
shared, foundational file. Worth doing if this friction turns out to matter in practice.
