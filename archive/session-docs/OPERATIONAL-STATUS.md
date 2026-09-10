# KPI Hub Assembled — Operational Status & Next Steps

**Date**: 2026-08-25  
**Source Repo**: https://github.com/hsharmagxi-debug/kpihub-assembled  
**Current HEAD**: `b3317a2` (production-ready)  
**Status**: Source code clean ✓ | CI passing ✓ | Secrets removed ✓ | **Deployment not yet configured**

---

## Current Deployment Topology (Discovered)

### 1. Live Website — `apps/website`
- **URL**: https://thekpihub.com
- **Hosting**: Hostinger (static files + PHP)
- **Deployment**: GitHub Actions → SSH rsync (`.github/workflows/deploy-hostinger.yml`)
- **Build**: `npm run build:site` → vanilla HTML/CSS + inline React 18 via CDN
- **Auth**: Supabase (`eeuwkislidznpgdbvvbo.supabase.co`)
- **Billing**: 
  - **LIVE**: Razorpay Payment Link (₹2,999 KPI Audit) — hardcoded in `get-audit.html`
  - **UNLAUNCHED**: Stripe subscriptions (code ready, not live) — infrastructure in `upgrade.html` only
- **Config**: 
  - Public config: `config.js` (deployed to Hostinger, protected via `.deploy-exclude`)
  - Secrets: `.htaccess` SetEnv directives (on Hostinger only, never committed)
- **DNS**: Hostinger nameservers (ns1/ns2.dns-parking.com) → Hostinger CDN (hstgr.net)
- **Requirements**:
  - Hostinger SSH credentials (u117990013@thekpihub.com)
  - Hostinger PHP environment setup (for `.htaccess` SetEnv)
  - Razorpay API credentials (if live payments need adjustment)
  - Supabase project credentials (auth backend)

### 2. Canonical Platform (Staging) — `apps/platform`
- **URL**: https://thekpihub-platform.vercel.app (inferred from metadata)
- **Hosting**: Vercel (Next.js 16.3.2)
- **Build**: `npm run build` (Next.js standalone)
- **TypeCheck**: `npm run typecheck`
- **Auth**: Supabase (same project as website)
- **Billing**: Stripe (for subscription testing)
- **AI**: Anthropic API, OpenRouter
- **Status**: Canonical future platform, not yet promoted to production URL
- **Requirements**:
  - Vercel account + project linked to `kpihub-assembled/apps/platform`
  - Vercel environment variables (Supabase, Stripe, AI provider keys)
  - GitHub Actions deploy trigger (optional, can be manual)

### 3. Legacy App (Reference) — `apps/legacy-app`
- **Status**: Migration source, reference, not primary production
- **Hosting**: Vercel (frontend) + Railway (backend)
- **Build**: Next.js 16.3.2
- **Backend**: Node.js + Prisma + SQL migrations
- **Note**: Kept for migration reference only; should not be deployed to production URLs

### 4. Wing Commander (Reference) — `apps/wingcommander-reference`
- **Status**: Related reference, likely not core KPI Hub production
- **Hosting**: Multiple (Vercel/Railway/Cloudflare/Docker)
- **Note**: Kept as reference; unclear if production-relevant

---

## Secrets & Configuration Status

### Website (`apps/website`)
**Example file**: None found (Hostinger deploy is static)  
**Live config location**: Hostinger `/home/u117990013/public_html/config.js`  
**Live secrets location**: Hostinger `/home/u117990013/public_html/.htaccess` (SetEnv directives)

**Known required**:
- Supabase project URL & anon key (public)
- Stripe publishable key (public, for checkout)
- Razorpay Payment Link URL (public hardcoded)
- GA4 Measurement ID (public)
- Microsoft Clarity ID (public)

**Server-side only** (never in Git):
- Supabase service role key (for auth backend)
- Stripe webhook secret (for payment confirmation)

### Platform (`apps/platform`)
**Example file**: `.env.example` ✓  
**Live secrets location**: Vercel environment variables (via web UI or CLI)

**Required**:
```
NEXT_PUBLIC_APP_URL=https://thekpihub-platform.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_ENTERPRISE=price_...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=...
WINGMAN_API_URL=https://...
WINGMAN_URL=https://...
HANDOFF_SECRET=...
```

### Wing Commander (`apps/wingcommander-reference`)
**Example files**: `frontend/.env.example`, `backend/.env.example` ✓  
**Status**: Reference only; not currently deployed

---

## Immediate Action Items

### Phase A: Verify & Inventory (No Changes)
- [ ] **Hostinger SSH**: Verify current `config.js` & `.htaccess` on thekpihub.com
- [ ] **Supabase**: List projects and confirm `eeuwkislidznpgdbvvbo` is production
- [ ] **Stripe**: List live webhooks and price IDs
- [ ] **Razorpay**: Verify payment link is live
- [ ] **Vercel**: Check if `thekpihub-platform` project exists and is linked to this repo

### Phase B: Set Up Platform Deployment (First New Step)
**Prerequisite**: GO approval that platform should deploy to Vercel

1. **Link Vercel project**:
   - `vercel link` in `apps/platform` (or web UI)
   - Confirm GitHub integration points to `hsharmagxi-debug/kpihub-assembled`

2. **Configure Vercel environment**:
   - Add secrets from `.env.example`
   - Stripe, Supabase, AI provider keys

3. **Test deployment**:
   - `git push` to `main`
   - Verify Vercel builds and deploys
   - Test live URLs

### Phase C: Add GitHub Actions Deploy Secrets (Optional, After Phase B)
If CI/CD is desired:

- Add GitHub Actions secrets for website Hostinger SSH
- Add GitHub Actions secrets for Vercel token (if CD desired)
- Create `.github/workflows/deploy-platform.yml` for Vercel (optional, Vercel can auto-deploy on push)
- Update `.github/workflows/deploy-website.yml` if Hostinger deploy is desired from this repo

### Phase D: Add Health Checks & Monitoring
- [ ] `/health` endpoint in platform
- [ ] Website status page or health check
- [ ] Uptime monitoring (Vercel, Hostinger, Supabase)

---

## GO / NO-GO Decision Points

**Before proceeding**, clarify:

1. **Website**: Keep on Hostinger, or migrate to Vercel?
   - Hostinger: Maintain status quo (SSH rsync via GitHub Actions)
   - Vercel: Consolidate both website + platform on Vercel

2. **Platform**: Deploy to Vercel, or defer?
   - Immediate: Set up CI/CD for `apps/platform` → Vercel
   - Defer: Keep as staging reference for now

3. **Legacy App**: Archive in this repo, or move to separate repo?
   - Keep: Reference migration path, but don't deploy
   - Move: Reduce clutter, maintain in separate archive repo

4. **Wing Commander**: Keep reference, or remove from main repo?
   - Keep: Reference implementation
   - Remove: Move to separate reference repo

---

## Next Recommended Step

**For Operator** (human):  
Clarify deployment strategy above. Then choose Phase A (inventory) or Phase B (new deployment).

**For Claude**:  
Inventory Phase A: Verify secrets on live platforms without changing anything. Prepare Phase B deployment guide based on decision.
