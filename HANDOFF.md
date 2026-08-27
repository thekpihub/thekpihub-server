# KPIHUB-ASSEMBLED — CODEX HANDOFF

**Date**: 2026-08-27  
**From**: Claude Code (multi-session sprint, home laptop WSL2)  
**To**: Codex (continue from GitHub without this chat)  
**Repo**: https://github.com/hsharmagxi-debug/kpihub-assembled  
**Branch**: `main`  
**Latest commit**: `see git log --oneline -1`

## Canonical Storage and Cleanup — 2026-08-27

- Canonical Windows root: `C:\Users\Admin\OneDrive\10-projects\11-The KPI Hub`
- Canonical website source: `C:\Users\Admin\OneDrive\10-projects\11-The KPI Hub\website-source`
- Archive root: `C:\Users\Admin\OneDrive\40-archive\44-redundant-copies-and-zips\The KPI Hub`
- Security quarantine: `C:\Users\Admin\OneDrive\20-areas\22-security-and-access\The KPI Hub\2026-08-27-security-review`
- GitHub: `https://github.com/hsharmagxi-debug/kpihub-assembled.git`
- Branch: `main`
- Canonical clone commit verified during cleanup: `ef15d0f`
- Production: `https://platform-two-zeta-31.vercel.app`

The canonical `website-source` is a fresh, clean clone with 493 tracked files
and zero dirty entries. Older or dirty repositories were kept intact and moved
only to manual review; none were merged, flattened, reset, or deleted.

### Remaining blockers

1. **Security reminder for 2026-08-28:** revoke the exposed GitHub personal
   access token (classic). Its contaminated checkout is quarantined, but
   quarantine does not revoke the credential.
   The owner explicitly deferred this manual action on 2026-08-27. Treat all
   existing KPI Hub tokens and long-lived deployment credentials as requiring
   rotation on 2026-08-28. Do not test, display, reuse, or copy the exposed
   token during the Hostinger migration. GitHub CLI was repaired separately
   through the browser/device OAuth flow; that login does not confirm PAT
   revocation. The installed CLI reported that its OAuth credential was saved
   in plaintext because no system credential store was available, so securing
   the local CLI credential store is also part of the manual security review.
2. Review the legacy Hostinger website repository before deciding whether it
   is still a separately active production surface.
3. Review dirty repositories, backups, bundles, exports, and unclear folders
   before any deletion. They must not be deleted merely because a clean
   canonical clone now exists.
4. Billing remains blocked on the Stripe configuration documented below.

### Next steps for Codex

1. Confirm the exposed GitHub PAT has been revoked; never print or commit it.
2. Continue only from the canonical `website-source` repository.
3. Review `docs/KPIHUB_ARCHIVE_INDEX_2026-08-27.md` before moving anything.
4. Keep ambiguous repositories in manual review and perform content/hash
   comparison before recommending deletion.
5. Make documentation-only commits for cleanup records; do not change source
   code as part of archive work.

---

## Session Update — 2026-08-27 (second WSL2 machine, reconciliation)

A second, independent WSL2 machine had 1 unpushed local commit (further
`WSL-PILOT-SMOKE-TEST.md` notes from a separate sandbox-hardening exercise on
that machine — unrelated to the platform work below) while `origin/main` had
already moved ahead by 12 commits (Phases B fix / C / D / Sprint 3 / Sprint 4,
all described below). The two histories were merged with no code conflicts
(one trivial `.gitignore` conflict, resolved by keeping both added lines).

**Redaction made this session**: the original "Credential Files Checked"
section further down in `KPIHUB_ASSEMBLED_AUDIT_LOG_2026-08-27.md` listed
exact local Windows file paths and a per-file inventory of which secrets each
one contains. Since this repo is read directly by Codex, that credential-location
map was replaced with a generic pointer (see that section) rather than carried
forward — no functional information for continuing the work was lost, but if
you need the original paths they are only in this session's local chat history,
not in git.

**Verified independently on this machine**: `apps/platform` typecheck (`tsc
--noEmit`) PASS; `services/pipeline` `python -m py_compile pipeline.py` PASS.
Full `npm install`/`build` across the other components was not re-run here —
rely on the Sprint 3/4 results below for those.

---

## Session Update — 2026-08-27 (Supabase/Vercel auth configuration)

- Confirmed the canonical Supabase project URL is
  `https://eeuwkislidznpgdbvvbo.supabase.co`.
- Validated a browser-safe `sb_publishable_...` key against that project's
  Auth settings endpoint (HTTP 200). The key value is stored only in Vercel
  and is not recorded in Git.
- Confirmed the target Vercel project is `platform`
  (`prj_BiGJMYSHuiVQk4rkEpuUVHl1gd8J`) under
  `hsharmagxi-debugs-projects`.
- Verified `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured for Production, Preview,
  and Development. The compatibility variable name holds the current
  publishable-key format.
- Forced a production rebuild after the environment update. Deployment
  `dpl_44BBtccqBq7u5mDkpKSqSpyazRZ3` reached READY and was aliased to
  `https://platform-two-zeta-31.vercel.app`.
- Post-deploy verification: `/login`, `/register`, `/api/health`, and
  `/api/health/ready` returned HTTP 200; auth forms rendered without a
  missing-configuration message; readiness returned `true`; no runtime
  errors were reported in the verification window.
- No application code was changed.

---

## Current Project Status

| Dimension | Status |
|---|---|
| Source build | ✅ PASS — typecheck, build, pipeline compile all clean |
| Local runtime | ✅ PASS — Next.js dev server starts, /, /login, /register return 200 |
| Vercel project linked | ✅ DONE — project `platform` under `hsharmagxi-debugs-projects` |
| Vercel env vars (partial) | ⚠️ AUTH COMPLETE — Supabase public URL/key configured; billing variables still required |
| First Vercel deployment | ✅ LIVE — `https://platform-two-zeta-31.vercel.app` |
| Stripe products | ❌ NOT YET — products and price IDs not created in Stripe dashboard |
| Auth working | ✅ CONFIGURED — Supabase key validated; login/register forms verified in production |
| Billing working | ❌ BLOCKED — needs Stripe secret key + price IDs |

---

## UI — What Is Already Built

The platform UI was assembled from the original `thekpihub/thekpihub-platform` source repo. It is **not a skeleton** — it is a complete working app shell. All UI code lives in `apps/platform/src/`.

### Design System (`globals.css`)
- **Theme**: Dark navy (`--bg: #06071a`), glassmorphism panels, dual radial gradient background (teal top-right, gold top-left)
- **Accents**: Gold `#e9a123`, Teal `#16c7b7`, Muted `#a6b0cf`
- **Font**: Inter (system-ui fallback)
- **No component library** — pure CSS + inline styles. No shadcn, no Tailwind, no Chakra.
- **Layout classes**: `.shell` (1120px max), `.panel` (glassmorphism card), `.dashboard-shell` (280px sidebar + content grid), `.stats-grid`, `.two-column-grid`, `.three-column-grid`

### Pages Built

| Route | Component | Status | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | ✅ Functional | Marketing shell — Sign in / Create account / Open dashboard CTAs |
| `/login` | `app/login/page.tsx` + `LoginForm.tsx` | ✅ Functional (needs anon key) | Email/password with Supabase auth, redirects to `/dashboard` or `?next=` param |
| `/register` | `app/register/page.tsx` + `RegisterForm.tsx` | ✅ Functional (needs anon key) | Full registration with name, org, role fields |
| `/reset-password` | `app/reset-password/page.tsx` + `ResetPasswordForm.tsx` | ✅ Functional (needs anon key) | Supabase magic-link reset |
| `/dashboard` | `app/dashboard/page.tsx` | ✅ Functional (needs anon key) | Profile stats: email, plan, org; migration status list |
| `/dashboard/intelligence-hub` | `app/dashboard/intelligence-hub/page.tsx` | ✅ UI complete, data from API | Executive brief, strategic heatmap with 4-metric bars, decision feed, action queue, 3-column signal grid |
| `/dashboard/recommendation-engine` | `app/dashboard/recommendation-engine/page.tsx` | ✅ UI complete, data from API | 7-tab category filter, ranked cards with impact/effort/confidence/priority bars + accuracy tracker |

### Components

| Component | Path | Purpose |
|---|---|---|
| `AuthShell` | `components/auth/AuthShell.tsx` | Centered card wrapper for all auth pages |
| `LoginForm` | `components/auth/LoginForm.tsx` | Client-side Supabase `signInWithPassword` |
| `RegisterForm` | `components/auth/RegisterForm.tsx` | Supabase `signUp` + profile upsert |
| `ResetPasswordForm` | `components/auth/ResetPasswordForm.tsx` | Supabase `resetPasswordForEmail` |
| `DecisionCard` | `components/dashboard/DecisionCard.tsx` | Decision feed + action queue card |
| `Sidebar` | `components/dashboard/Sidebar.tsx` | 3-item nav: Overview / Intelligence Hub / Recommendation Engine |

### Intelligence Library (`src/lib/intelligence/`)

| File | Purpose |
|---|---|
| `types.ts` | TypeScript types: `ModuleSignal`, `IntelligenceHubSnapshot`, `HeatmapRow`, `DecisionEntry`, `ActionQueueItem` |
| `hub.ts` | Builds the intelligence snapshot (signal generation, heatmap, brief, decision feed) |
| `scoring.ts` | `rankSignalsBySeverity()` — sorts signals by severity enum |
| `recommendations.ts` | Recommendation item generation with accuracy metadata |

### What the UI Is Missing / Not Yet Built
- No upgrade/billing UI (checkout flow triggers via `/api/billing/checkout` but there's no pricing page or upgrade modal)
- No sign-out button anywhere in the dashboard
- No error boundary pages
- No mobile responsive layout (sidebar collapses poorly on small screens)
- No loading skeletons (just text "Loading...")
- Intelligence Hub and Recommendation Engine data is **mock/generated** in the API routes — not yet reading from real Supabase tables

---

## Completed Work (Chronological)

### Phase A — Inventory & Verification
- Assembled 6 components into monorepo from separate private repos
- Verified Supabase project ID: `eeuwkislidznpgdbvvbo` (region: ap-southeast-1)
- Confirmed Razorpay payment link live: `https://rzp.io/rzp/hLRfwonD` (KPI Audit ₹2,999)
- Security scan: zero secrets committed, all `.env*` gitignored

### Phase B — Platform Deployment Prep
- Created full Vercel deployment guide + action checklist
- **Fixed critical bug**: Phase B docs had wrong Stripe webhook URL (`/api/webhooks/stripe`) — corrected to `/api/billing/webhook` (commit `46b0301`)
- Ran `vercel link` → project `platform` created, GitHub repo connected, auto-deploy wired

### Phase C — GitHub Actions CI/CD (docs from office session, already pushed)
- CI workflow: `.github/workflows/ci.yml` — runs typecheck, build, audit on all components
- Phase C docs in `docs/` (PHASE-C-*)

### Phase D — Health Check Endpoints (code from office session, already pushed)
- 5 health routes added to platform:
  - `GET /api/health` — simple liveness
  - `GET /api/health/live` — Kubernetes liveness probe
  - `GET /api/health/ready` — readiness probe
  - `GET /api/health/status` — status summary
  - `GET /api/health/detailed` — full service check (DB, Stripe, Anthropic, memory)

### Sprint 3 — Home Laptop Environment Recovery
- Dependencies installed, typecheck PASS, build PASS, pipeline compile PASS
- Created `AGENT-HANDOFF.md` at commit `4af5e92`

### Sprint 4 — Multi-Agent Verification
- 8 parallel agents: architecture audit, env matrix, quality, security, runtime, services, docs, commit
- Corrected Sprint 3 overstatements: lint is `MISCONFIGURED_DUPLICATE_TYPECHECK`, tests are `NOT_AVAILABLE`
- Runtime smoke test: server starts in ~650ms with only public env vars; /, /login, /register → HTTP 200
- Redis confirmed `NOT_REQUIRED` (no Redis references in platform source)
- Stripe/AI confirmed `FEATURE_DEFERRED` — not startup-blocking, only needed in route handlers
- `AGENTS.md` committed (auto-generated by Next.js 16 `next dev`)
- `apps/platform/CLAUDE.md` gitignored (auto-generated, not agent config)

### TypeScript Fix (this session)
- Fixed TS2741 error in `apps/platform/src/app/api/health/detailed/route.ts` line 238
- Build now clean: 20 routes (was 12 before Phase D)

---

## Exact Files Changed or Created

### Root Level
| File | Status | Notes |
|---|---|---|
| `HANDOFF.md` | ✅ NEW (this file) | Codex handoff |
| `KPIHUB_ASSEMBLED_AUDIT_LOG_2026-08-27.md` | ✅ NEW | Full audit log |
| `AGENT-HANDOFF.md` | ✅ UPDATED | Sprint 4 multi-agent results |
| `CURRENT-STATE.md` | existing (stale) | Phase A checkpoint — commit list is outdated |
| `OPERATIONAL-STATUS.md` | existing (stale) | References old SHA `b3317a2` — HEAD is now well past that |
| `PHASE-B-ACTION-CHECKLIST.md` | ✅ FIXED | Webhook URL corrected |
| `PHASE-B-DEPLOYMENT-GUIDE.md` | ✅ FIXED | Webhook URL corrected |

### apps/platform/
| File | Status | Notes |
|---|---|---|
| `.env.local` | ✅ CREATED (gitignored) | Contains only 2 public non-secret values |
| `.gitignore` | ✅ UPDATED | Added `CLAUDE.md`, `.vercel`, `.env*` |
| `.vercel/project.json` | ✅ CREATED (gitignored) | Vercel project link |
| `AGENTS.md` | ✅ COMMITTED | Next.js 16 agent hints (auto-generated by `next dev`) |
| `src/app/api/health/detailed/route.ts` | ✅ FIXED | TS2741 cast on line 238 |
| `src/app/api/health/` | existing | Phase D: 5 health check routes |

---

## Component Architecture

| Component | Path | Classification | Build Status |
|---|---|---|---|
| **Platform** | `apps/platform` | ACTIVE_DEVELOPMENT | ✅ PASS — 20 routes |
| **Website** | `apps/website` | ACTIVE_PRODUCTION | ✅ PASS (prior build) |
| **Legacy App** | `apps/legacy-app` | REFERENCE_ONLY | Not tested |
| **Wing Commander** | `apps/wingcommander-reference` | REFERENCE_ONLY | Not tested |
| **Pipeline** | `services/pipeline` | SUPPORTING_SERVICE | ✅ py_compile PASS |
| **Builder** | `tools/automated-website-builder` | BUILD_TOOLING | ✅ tsc PASS |

---

## Environment Variables

### Vercel — Already Added ✅
| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://thekpihub-platform.vercel.app` (prod/preview) / `http://localhost:3000` (dev) | All |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://eeuwkislidznpgdbvvbo.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase publishable key (value intentionally omitted) | All |

### Vercel — Still Required ⚠️
| Variable | Provider | Requirement | Notes |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Same dashboard → service_role key | FEATURE_REQUIRED | Webhook route only. Production env only. |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API Keys | FEATURE_REQUIRED | Use `sk_test_...` for staging |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → signing secret | FEATURE_REQUIRED | Create endpoint first (URL below) |
| `STRIPE_PRICE_GROWTH` | Stripe dashboard → Products | FEATURE_REQUIRED | Create product + price first |
| `STRIPE_PRICE_ENTERPRISE` | Stripe dashboard → Products | FEATURE_REQUIRED | Create product + price first |

**Stripe webhook endpoint URL**: `https://thekpihub-platform.vercel.app/api/billing/webhook`  
(NOT `/api/webhooks/stripe` — that route does not exist)

### Local `.env.local` — Present, Non-Secret Only
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
```

### Variables NOT Required for Platform
`ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `WINGMAN_API_URL`, `WINGMAN_URL`, `HANDOFF_SECRET`, `STRIPE_PRICE_STARTER` — present in `.env.example` but **zero references in `apps/platform/src/`**. Safe to skip for now.

---

## Quality Status

| Check | Result |
|---|---|
| `npm run typecheck` (platform) | ✅ PASS |
| `npm run lint` (platform) | ⚠️ MISCONFIGURED — script is `tsc --noEmit` (duplicate of typecheck). No ESLint/Biome configured. |
| Tests | ❌ NOT_AVAILABLE — no test runner configured |
| `npm run build` (platform) | ✅ PASS — 20 routes compiled |
| `python -m py_compile pipeline.py` | ✅ PASS |
| `npm test` (builder) | ✅ PASS |

---

## Current Blockers

| # | Blocker | Impact | Resolution |
|---|---|---|---|
| 1 | Stripe products not created | Billing/checkout non-functional | Create products in Stripe dashboard, add price IDs |
| 2 | Supabase service-role key not configured | Billing webhook cannot perform privileged updates | Add a backend-only Supabase secret key after restoring project access |
| 3 | Public alias differs from the originally documented URL | Bookmarks/docs using `thekpihub-platform.vercel.app` will not resolve to this project | Use `platform-two-zeta-31.vercel.app` or add the intended custom domain |
| 4 | No real linter configured | Code quality drift possible | Add ESLint or Biome to platform (`npm install -D eslint`) |
| 5 | No tests | Regressions undetected | Add Vitest or Jest |

---

## What Remains to Build / Test / Deploy

### Immediate (Codex can do from GitHub)
1. **Run an operator-approved end-to-end auth test** — register/login with a designated test account and verify the dashboard session
2. **Restore Supabase project access** — required before migrations, security-advisor review, or backend secret-key setup
3. **Create Stripe products** — two products (Growth, Enterprise) with recurring monthly prices

### Near-Term
5. **Set up Stripe webhook** — create endpoint in Stripe dashboard pointing to `/api/billing/webhook`
6. **Add ESLint** — `npm install -D eslint eslint-config-next @typescript-eslint/eslint-plugin`
7. **Add tests** — Vitest recommended for Next.js 16
8. **Configure Supabase migrations** — 3 migrations in `apps/platform/supabase/migrations/` not yet applied to production

### Production Cutover (later)
9. Move `thekpihub-platform.vercel.app` to production domain
10. Point `platform.thekpihub.com` or similar to Vercel
11. Configure Hostinger website to link to platform (upgrade flows, etc.)

---

## GitHub & Git Info

| Field | Value |
|---|---|
| Repo | https://github.com/hsharmagxi-debug/kpihub-assembled |
| Branch | `main` |
| Remote | `https://github.com/hsharmagxi-debug/kpihub-assembled.git` |
| Local ahead | 0 (in sync after final push) |

---

## Commands for Codex to Run First

```bash
# 1. Clone and enter repo
git clone https://github.com/hsharmagxi-debug/kpihub-assembled.git
cd kpihub-assembled

# 2. Install platform deps
cd apps/platform && npm install

# 3. Verify typecheck passes
npm run typecheck

# 4. Build
npm run build

# 5. Copy env template and fill in secrets
cp .env.example .env.local
# Edit .env.local — add NEXT_PUBLIC_SUPABASE_ANON_KEY at minimum

# 6. Start dev server
npm run dev
# Visit http://localhost:3000 — homepage, /login, /register should load

# 7. Verify Vercel link (already done, .vercel/ is gitignored — re-link if needed)
npx vercel whoami
npx vercel env ls

# 8. Check health endpoints after deployment
curl https://thekpihub-platform.vercel.app/api/health
curl https://thekpihub-platform.vercel.app/api/health/ready
```

---

## Exact Next Action for Codex

> **Run an operator-approved end-to-end registration/login test against the live platform.**
>
> 1. Use a designated disposable test email at https://platform-two-zeta-31.vercel.app/register
> 2. Complete any email-confirmation step required by Supabase Auth
> 3. Sign in at `/login` and verify the authenticated `/dashboard` session
> 4. Remove the disposable account after verification if it is no longer needed

## Hostinger migration status — 2026-08-27

- Canonical project root: `C:\Users\Admin\OneDrive\10-projects\11-The KPI Hub`.
- Canonical GitHub repository: `https://github.com/hsharmagxi-debug/kpihub-assembled`, branch `main`.
- Hostinger remains the hosting platform for `https://thekpihub.com`.
- Governed deployment completed from the explicit `apps/website` allow-list; monorepo root was not published. GitHub run: `33103604181`.
- Protected pre-change backup: `/home/u117990013/kpihub-migration-backups/2026-08-27-before-kpihub-assembled/public_html.tar.gz`, SHA-256 `184ecb5de1c4fcbd457f9bac9a45f3895e3b84e843bc2cc24cdb9a1b3a9550a3`.
- Server-only `config.js`, WordPress/runtime paths, and `.htaccess` were preserved. Source-denial rules were applied append-only after backup; rollback copy is retained outside the webroot.
- Verified live: apex and `www` HTTP 200/HTTPS; static homepage and website pages HTTP 200. Repository/config/docs probes return HTTP 403.
- `/login`, `/register`, `/api/health`, and `/api/health/ready` are intentionally not Hostinger routes; those belong to the separate Vercel platform deployment.
- Accessible duplicate workflow `hsharmagxi-debug/thekpihub-platform` is disabled. The server’s historical remote still names `https://github.com/thekpihub/thekpihub-website.git`; owner access is still needed to prove its old webhook is disconnected.
- Temporary backup/hardening workflows are disabled and retained as audit evidence. No files, repositories, DNS records, or Hostinger sites were deleted.
- Credential reminder: rotate the exposed GitHub PAT, Hostinger password, deployment keys, and other long-lived tokens manually on 2026-08-28 as previously scheduled. Never paste credentials into chat.

## Complete work log — 2026-08-27

This is the chronological record of the work completed today. It is intentionally
limited to evidence, commands/actions, identifiers, and outcomes; no secret values
are recorded.

1. Read `HANDOFF.md` and `KPIHUB_ASSEMBLED_AUDIT_LOG_2026-08-27.md` first, confirmed
   the saved production state, branch, commit, routes, readiness, and known blockers.
2. Confirmed the canonical GitHub repository and Vercel project, and recorded that
   the assembled repository is a monorepo whose Hostinger deployment must be scoped
   to `apps/website`.
3. Recorded the owner-supplied Supabase publishable-key setup without copying the
   key into source, logs, or documentation; Supabase project access remained an
   owner-side limitation.
4. Audited GitHub repositories, branches, workflows, hooks, deploy keys, and legacy
   Hostinger references. Preserved all old repositories; identified the accessible
   duplicate Hostinger workflow in `hsharmagxi-debug/thekpihub-platform`.
5. Audited Hostinger hPanel and SSH evidence. Confirmed static/PHP hosting,
   webroot `/home/u117990013/domains/thekpihub.com/public_html`, the old server
   remote, branch, commit, and 49 dirty entries. No hPanel Create/Disconnect/Remove
   action was used.
6. Audited the live site for public exposure. Before hardening, repository docs,
   source, package/config files, and directories were publicly readable; dotfiles
   were already denied. DNS, HTTP redirects, SSL, and Hostinger headers were recorded.
7. Repaired GitHub CLI with browser/device OAuth. The exposed classic PAT was never
   tested or reused. The owner’s manual credential-rotation reminder remains open.
8. Generated a dedicated temporary Hostinger SSH key. The old GitHub-stored Hostinger
   key failed authentication; the owner added the new public key through Hostinger
   SSH Access. The private key was stored only as a masked GitHub environment secret.
9. Created the protected `hostinger-production` GitHub environment with masked
   connection metadata, the deploy key, and known-host data; secret values were never
   displayed.
10. Disabled legacy workflow `306005775` in `hsharmagxi-debug/thekpihub-platform`
    to prevent accidental old-repo deployments. The historical webhook owner for
    `thekpihub/thekpihub-website` remains an explicit manual-review item.
11. Added and ran a temporary backup workflow. Run `33103094801` succeeded and
    retained the protected tarball, SHA-256, 641-entry manifest, Git state, 49-entry
    dirty status, and pre-change `.htaccess` copy outside the webroot.
12. Added the allow-listed Hostinger payload manifest and staging/test scripts.
    The build, asset verification, rendered homepage check, staging policy, workflow
    safety checks, and staged-payload secret scan all passed.
13. Ran governed Hostinger dry-run `33103169805`. It completed successfully with
    non-destructive rsync preview and unchanged server-only checksum safeguards.
14. Applied the reviewed append-only source-denial fragment in hardening run
    `33103331526`; no content was deleted. Temporary backup/hardening workflows were
    disabled afterward but retained for auditability.
15. Ran governed production overlay `33103604181` from `main`, publishing only the
    reviewed `apps/website` payload without `--delete`. The monorepo root was never
    published.
16. Verified apex and `www` HTTP 200/HTTPS, static website pages HTTP 200, and source,
    docs, metadata, and config probes HTTP 403. Verified that Hostinger API-style
    routes remain 404 because those belong to the separate Vercel platform. Vercel
    `/`, `/login`, `/register`, and `/api/health` are 200; `/api/health/ready` remains
    503.
17. Updated the migration audit and this handoff, then pushed documentation commit
    `0c8d065` to `main`. No repositories, DNS records, Hostinger sites, or files were
    deleted.

### Current rollback anchor

Disable the governed Hostinger workflow, restore the protected
`public_html.tar.gz` into the Hostinger webroot using the retained manifest, restore
`.htaccess.pre-source-deny`, verify the recorded checksums, and rerun the HTTP/SSL and
exposure matrix. DNS rollback is not applicable because DNS was never changed.

## Secret-file quarantine — 2026-08-27

Five ignored local secret-like files were inventoried and moved without deletion to:

`C:\Users\Admin\OneDrive\20-areas\22-security-and-access\KPI Hub\2026-08-27-secret-quarantine`

| Original | Quarantine name | Status |
|---|---|---|
| `.env` | `root.env` | moved; not tracked |
| `apps/platform/.env.local` | `platform.env.local` | moved; not tracked |
| `apps/platform/credentials.json` | `platform-credentials.json` | moved; not tracked |
| `fake_cert.pem` | `fake_cert.pem` | moved; not tracked |
| `fake_private.key` | `fake_private.key` | moved; not tracked |

The repository was rescanned after the move and no real `.env`, credentials JSON,
PEM, or private-key files remain. `.env.example` templates remain because they do
not contain secret values. The OneDrive/WSL mount reported mode `777` after an
attempted `chmod 600`, so review the Windows/OneDrive ACLs manually and keep this
folder out of all sync/public-share/deployment locations. These files must never be
committed, uploaded, or included in a Hostinger/Vercel payload.

---

## Complete work log — second WSL2 machine, docs-only session (2026-08-27 → 2026-08-28)

This is a different, separate session/machine from the "Complete work log — 2026-08-27"
above — that one did the real Vercel/Hostinger production deployment. This session did
**docs and git reconciliation only**: no application code, infrastructure, or credentials
were touched.

1. User asked this session to verify KPIHUB-Assembled work was pushed, then create/update
   a repo-root `HANDOFF.md` and `KPIHUB_ASSEMBLED_AUDIT_LOG_2026-08-27.md` so Codex could
   continue from GitHub without the chat.
2. Repo review found a real conflict before making any change: this repo's actual stack
   (Next.js + Supabase + Stripe) contradicts the user's global config description of KPI
   Hub (pure HTML/CSS/JS, no frameworks); and this repo's own untracked, local-only
   `AGENT-HANDOFF.md` (a parallel WSL2-sandbox-security-pilot investigation using this same
   repo) carried explicit standing boundaries — "do not commit/push this handoff file,"
   "do not invoke Codex," "do not start Phase 4" — that the new request directly conflicted
   with. Stopped and asked the user rather than guessing.
3. User confirmed: "This IS the real KPI Hub rebuild — proceed fully," explicitly
   overriding the prior session's caution.
4. Local branch had 1 unpushed commit (`WSL-PILOT-SMOKE-TEST.md` sandbox-hardening notes,
   unrelated to the platform) while `origin/main` was 12 commits ahead. Fetched; confirmed
   via `git merge-tree` that no real conflicts existed (only additions); merged (one
   trivial `.gitignore` conflict, resolved by keeping both added lines).
5. Found `origin/main` already had its own `HANDOFF.md` and this audit log from an earlier
   "Sprint 4" session. Its audit log had a "Credential Files Checked" section listing exact
   Windows file paths plus a per-file inventory of which live secrets each contains,
   including a note that one file has an unrotated RSA private key + WordPress DB
   credentials. No literal key values were present, but the file-path map itself was a
   real exposure once pushed to a repo Codex reads directly.
6. Flagged this to the user; user chose to redact and push. Replaced that section with a
   generic rotation reminder (see "Credential Sourcing (Redacted)" in the audit log),
   removed all `D:\` path references repo-wide (verified with grep), kept everything else.
7. Practical obstacle: 3 `.env.example` files were presented by the local sandbox as
   unhashable character-special device nodes (a known credential-substitution mechanism
   from the separate WSL2-pilot investigation, re-encountered here), which made `git
   merge`'s internal stash step fail outright. Fixed with `git update-index
   --skip-worktree` on those 3 paths before merging — not a real content change.
8. Committed the two legitimate pre-existing doc changes separately, then the merge, then
   the redaction + doc updates, then pushed. A second wave of concurrent upstream commits
   (a UI-inventory addition to this file) landed mid-task; required a second
   fetch/merge/push cycle — also clean, no conflicts. Final commit that round: `aec5070`,
   confirmed local `HEAD == origin/main`.
9. Never staged or committed the decoy/fake credential files sitting in the working tree
   (`credentials.json`, `id_rsa`, `service-account.json`, `fake_cert.pem`, stray dotfiles,
   `sneaky_link_to_fake_cred`) — verified clean before and after every commit.
10. Follow-up turn (2026-08-28): user asked for a git-status recheck, to avoid redoing
    already-completed work, and to record every step here and in this session's Claude
    Code memory. Found local `main` had already fast-forwarded to `4cf0547` — the other,
    separate session's 14 additional real-deployment commits — with nothing to merge.
    Found 21 unrelated modified `apps/website/*.html`/`tailwind.css` files (asset
    cache-busting version-hash churn) sitting dirty in the working tree; not from this
    session, flagged to the user, left untouched.

**Why this matters for Codex:** if you see this repo's git history move between reads,
that's expected — at least one other, separately-authenticated session pushes to `main`
concurrently. `git fetch` before assuming any file here is current.
