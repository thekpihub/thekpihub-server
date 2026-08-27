# KPIHUB-ASSEMBLED — HOME LAPTOP CONTINUATION HANDOFF

**Created**: 2026-08-27  
**Machine**: Home laptop (WSL2, Linux 6.6.87.2-microsoft-standard-WSL2)  
**Sprint**: Sprint 3 — Home Development Environment Recovery

---

## 1. Repository

| Field | Value |
|---|---|
| Path | `/home/nitr0/workspaces/kpihub-assembled` |
| Remote | `git@github.com:hsharmagxi-debug/kpihub-assembled.git` |
| Branch | `main` |
| HEAD SHA | `4be0a6375fffef34e4382fbed65815174f4ce81c` |
| Working tree | **CLEAN** |

---

## 2. WSL / Home Machine Context

- **OS**: WSL2 — Linux 6.6.87.2-microsoft-standard-WSL2
- **Shell**: bash
- **Node.js**: v22.22.2
- **npm**: 10.9.7
- **Python**: 3.12.3
- **Claude CLI**: v2.1.247 at `/home/nitr0/.local/bin/claude`
- **Git user**: `hsharmagxi-debug`
- This is a **different machine** from the office session. The office SHA `bbc34766d5d0be647f53f74a12eb9b1e1248ce18` is **not present** in the fetched refs of this repository — it was never pushed and is not recoverable here. `AGENT-HANDOFF.md` and `WSL-PILOT-SMOKE-TEST.md` from the office session were also not recovered; the office session's work exists only in that machine's local git state. This is not a blocker.

---

## 3. Current Architecture

### Component Classification

| Component | Path | Classification | Notes |
|---|---|---|---|
| Platform | `apps/platform` | ACTIVE_DEVELOPMENT_COMPONENT | Next.js 16.3.2 + Supabase + Stripe + AI; target: Vercel |
| Website | `apps/website` | ACTIVE_PRODUCTION_COMPONENT | Static/PHP; live at thekpihub.com on Hostinger |
| Legacy App | `apps/legacy-app` | REFERENCE_ONLY | Next.js + Prisma archive; migration source only |
| Wing Commander | `apps/wingcommander-reference` | REFERENCE_ONLY | Multi-deployment reference; not core production |
| Pipeline | `services/pipeline` | SUPPORTING_SERVICE | Python KPI pipeline |
| Builder | `tools/automated-website-builder` | BUILD_TOOLING | Autonomous website build tool |

### Live Deployment Topology

```
thekpihub.com           → Hostinger (apps/website, static/PHP)
                           Auth: Supabase eeuwkislidznpgdbvvbo
                           Billing: Razorpay LIVE (₹2,999 audit)

thekpihub-platform.vercel.app → Vercel (apps/platform, Next.js)
                                  STAGING — not yet at prod URL
                                  Requires: env vars configured in Vercel dashboard
```

---

## 4. Environment Variable Inventory (NAMES ONLY — no secrets)

### `apps/platform` — 14 required variables (from `.env.example`)

| Variable | Component | Required | Type | Provider | Status |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | platform | Yes | public | self | Provide `https://thekpihub-platform.vercel.app` for Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | platform | Yes | public | Supabase | Project: `eeuwkislidznpgdbvvbo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | platform | Yes | public | Supabase | From project API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | platform | Yes | **secret** | Supabase | From project API settings |
| `STRIPE_SECRET_KEY` | platform | Yes | **secret** | Stripe | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | platform | Yes | **secret** | Stripe | `whsec_...` from webhook endpoint |
| `STRIPE_PRICE_STARTER` | platform | Yes | config | Stripe | `price_...` from product catalog |
| `STRIPE_PRICE_GROWTH` | platform | Yes | config | Stripe | `price_...` from product catalog |
| `STRIPE_PRICE_ENTERPRISE` | platform | Yes | config | Stripe | `price_...` from product catalog |
| `ANTHROPIC_API_KEY` | platform | Yes | **secret** | Anthropic | `sk-ant-...` |
| `OPENROUTER_API_KEY` | platform | Yes | **secret** | OpenRouter | From openrouter.ai account |
| `WINGMAN_API_URL` | platform | For AI features | config | self/Railway | Backend agent URL |
| `WINGMAN_URL` | platform | For AI features | config | self/Vercel | Agent frontend URL |
| `HANDOFF_SECRET` | platform | Yes | **secret** | self-generated | Random string; generate locally |

### `apps/website` — Hostinger-managed (not in this repo)

Variables live in `/home/u117990013/public_html/config.js` and `.htaccess` on Hostinger only.  
Not required for local development of the platform.

### `apps/wingcommander-reference/frontend` — REFERENCE_ONLY

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

### `apps/wingcommander-reference/backend` — REFERENCE_ONLY

`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `FRONTEND_URL`, `NODE_ENV`

---

## 5. Environment Readiness

### USER_SECRET_INPUT REQUIRED

To run `apps/platform` locally or deploy to Vercel:

| Variable | Component | Provider | Target local file | Reason |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | apps/platform | Supabase dashboard → Project Settings → API | `apps/platform/.env.local` | Auth requires real anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | apps/platform | Supabase dashboard → Project Settings → API | `apps/platform/.env.local` | Server-side auth |
| `STRIPE_SECRET_KEY` | apps/platform | Stripe dashboard → Developers → API Keys | `apps/platform/.env.local` | Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | apps/platform | Stripe dashboard → Webhooks | `apps/platform/.env.local` | Webhook verification |
| `STRIPE_PRICE_STARTER` | apps/platform | Stripe dashboard → Products | `apps/platform/.env.local` | Subscription tiers |
| `STRIPE_PRICE_GROWTH` | apps/platform | Stripe dashboard → Products | `apps/platform/.env.local` | Subscription tiers |
| `STRIPE_PRICE_ENTERPRISE` | apps/platform | Stripe dashboard → Products | `apps/platform/.env.local` | Subscription tiers |
| `ANTHROPIC_API_KEY` | apps/platform | console.anthropic.com | `apps/platform/.env.local` | AI features |
| `OPENROUTER_API_KEY` | apps/platform | openrouter.ai account | `apps/platform/.env.local` | AI routing |
| `HANDOFF_SECRET` | apps/platform | self (any random string) | `apps/platform/.env.local` | Internal handoff auth |

**Provision workflow** (when ready):

```bash
# 1. Target file is gitignored — verified safe
# git check-ignore apps/platform/.env.local → confirmed ignored

# 2. Copy template
cp apps/platform/.env.example apps/platform/.env.local

# 3. Fill in real values (use your terminal/editor — not the Claude conversation)
# Set: NEXT_PUBLIC_APP_URL=http://localhost:3000
# Set: NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
# Fill remaining secrets from dashboards

# 4. Start dev server
cd apps/platform && npm run dev
```

---

## 6. Validation Results

### Install

| Component | Result |
|---|---|
| `apps/platform` npm install | PASS — 0 vulnerabilities |
| `apps/website` npm install | PASS — 0 vulnerabilities |
| `tools/automated-website-builder` npm install | PASS — 0 vulnerabilities |

### Lint / Typecheck

| Component | Command | Result |
|---|---|---|
| `apps/platform` | `npm run typecheck` (tsc --noEmit) | **PASS** |
| `apps/platform` | `npm run lint` (tsc --noEmit) | **PASS** |
| `tools/automated-website-builder` | `npm test` (tsc --noEmit) | **PASS** |
| `apps/legacy-app` | NOT RUN — REFERENCE_ONLY | NOT AVAILABLE |
| `apps/wingcommander-reference` | NOT RUN — REFERENCE_ONLY | NOT AVAILABLE |

### Build

| Component | Command | Result |
|---|---|---|
| `apps/platform` | `npm run build` (Next.js) | **PASS** — 12 routes compiled |
| `apps/website` | `npm run build:site` | **PASS** — version-assets ok |
| `services/pipeline` | `python -m py_compile pipeline.py` | **PASS** |

**Platform build output** (12 routes):

```
/ ○  /_not-found ○  /login ○  /register ○  /reset-password ○
/api/billing/checkout ƒ  /api/billing/webhook ƒ
/api/decisions ƒ  /api/decisions/[id]/outcome ƒ  /api/decisions/[id]/status ƒ
/api/intelligence-hub ƒ  /api/profile ƒ  /api/recommendations ƒ
/dashboard ƒ  /dashboard/intelligence-hub ƒ  /dashboard/recommendation-engine ƒ
```

### Tests

| Component | Result |
|---|---|
| `apps/platform` | NOT AVAILABLE — no test runner configured |
| `apps/website` | NOT AVAILABLE — no test runner configured |
| `apps/legacy-app` | NOT RUN — REFERENCE_ONLY |

### Runtime / Local Startup

NOT ATTEMPTED — requires `apps/platform/.env.local` with real Supabase/Stripe credentials. See USER_SECRET_INPUT REQUIRED above.

### Database Connectivity

NOT ATTEMPTED — Supabase credentials not available on this machine. Supabase project ID `eeuwkislidznpgdbvvbo` confirmed in source. 3 migrations present: `0001_unified_core.sql`, `0002_intelligence_content_and_read_policies.sql`, `0003_module_snapshots_worker_write.sql`.

### Website Build Behavior Note

Running `npm run build:site` in `apps/website` runs `version-assets.mjs` which rewrites asset hash query strings (e.g. `?v=xxxx`) in all HTML files. These tracked HTML files will appear as modified after a local build. This is expected — restore with `git checkout -- apps/website/` before committing if no asset content changed.

---

## 7. Security Baseline

| Item | Status |
|---|---|
| Claude CLI path | `/home/nitr0/.local/bin/claude` |
| Claude version | `2.1.247 (Claude Code)` |
| Repo-local Claude config | None (`apps/platform/.claude/settings.json` absent) |
| User Claude settings | `~/.claude/settings.json` — theme: dark, no sandbox keys |
| User Claude local settings | `~/.claude/settings.local.json` — permission allowlist only |
| `failIfUnavailable` | Not set (default) |
| `allowUnsandboxedCommands` | Not set (default) — **REVIEW_REQUIRED** if hardening needed |
| Secrets in repo | NONE — security scan passed, no `.env` files committed |
| `.env` gitignored | CONFIRMED — `apps/platform/.env` and `.env.local` are ignored |
| Build artifacts gitignored | CONFIRMED — `.next/` is ignored |
| No hardcoded secrets | CONFIRMED — only placeholder values in `.env.example` files |

**Sandbox note**: Home machine Claude settings do not explicitly configure `failIfUnavailable` or `allowUnsandboxedCommands`. Default sandbox behavior is in effect. Do not weaken settings to match office configuration.

---

## 8. Historical Office Context

- Office session SHA: `bbc34766d5d0be647f53f74a12eb9b1e1248ce18`
- **This SHA is NOT present in the fetched refs of this repository.** It was a local office-only commit that was never pushed.
- `AGENT-HANDOFF.md` (office) and `WSL-PILOT-SMOKE-TEST.md` were also not recovered.
- These are NOT blockers. All current repository state was established from the verified HEAD `4be0a63` which is fully synced with `origin/main`.
- The office session completed Phase A documentation. Phase B (Vercel deployment) was prepared but not executed.

---

## 9. CI/CD Configuration

- **CI workflow**: `.github/workflows/ci.yml` — runs on push/PR to `main`
- **Jobs**: install + audit + build for all components, typecheck for platform and builder, lint for legacy-app, py_compile for pipeline
- **No CD**: No auto-deploy workflow exists. Vercel deployment requires manual `vercel link` or Vercel GitHub App integration.
- **Hostinger deploy**: Documented as existing in a separate private `thekpihub-website` repo — NOT in this repo.

---

## 10. Known Blockers

| Blocker | Impact | Resolution |
|---|---|---|
| No `.env.local` for platform | Cannot run `npm run dev` locally | Provision credentials from Supabase/Stripe/Anthropic dashboards |
| No Vercel project link | Cannot deploy `apps/platform` | Run `cd apps/platform && vercel link` with Vercel account |
| Stripe products not configured | Subscription pricing non-functional | Create products in Stripe dashboard; copy price IDs |
| No GitHub Actions secrets | CI cannot deploy automatically | Phase C: add secrets to repo for automated deploy |

---

## 11. Completed Work This Session

- [x] Verified repository at expected HEAD `4be0a63` — CLEAN
- [x] Read all state documents (CURRENT-STATE.md, OPERATIONAL-STATUS.md, PHASE-A-INVENTORY.md, PHASE-A-SELF-TEST-REPORT.md, PHASE-B-ACTION-CHECKLIST.md, PHASE-B-DEPLOYMENT-GUIDE.md, README.md)
- [x] Classified all components
- [x] Inventoried all environment variables by name (14 platform + website + reference)
- [x] Installed dependencies: platform ✓, website ✓, builder ✓
- [x] Typecheck: platform PASS, builder PASS
- [x] Build: platform PASS (12 routes), website PASS, pipeline compile PASS
- [x] Verified `.env` and `.next/` are gitignored
- [x] Verified no secrets in working tree
- [x] Established Claude home security baseline
- [x] Confirmed office SHA not in fetched refs — documented as non-blocker
- [x] Created this AGENT-HANDOFF.md

---

## 12. Exact Resume Point

**Next action**: Phase B — Deploy `apps/platform` to Vercel

**Steps**:

1. Gather credentials (Supabase → Stripe → Anthropic → OpenRouter)
2. Create `apps/platform/.env.local` with real values for local testing
3. Run `npm run dev` in `apps/platform` to verify local startup
4. Run `cd apps/platform && vercel link` to link Vercel project
5. Add 14 environment variables in Vercel dashboard (see Section 4 above)
6. Configure Stripe webhook endpoint pointing to `https://thekpihub-platform.vercel.app/api/billing/webhook`
7. `git push origin main` → triggers Vercel auto-deploy
8. Verify https://thekpihub-platform.vercel.app — auth, checkout, dashboard

**After Phase B**: Phase C (GitHub Actions secrets + CD workflow), Phase D (health endpoints + monitoring)

---

*This handoff was created on the home laptop after a complete Sprint 3 environment verification.*  
*No secrets are present in this file or this repository.*
