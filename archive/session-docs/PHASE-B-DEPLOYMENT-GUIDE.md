# Phase B: Configure Platform Deployment to Vercel

**Objective**: Set up the canonical platform app (`apps/platform`) for production deployment on Vercel  
**Estimated Time**: 45-60 minutes  
**Prerequisites**: Phase A complete, Vercel account, credentials ready  
**Status**: 🔄 In Progress

---

## **Overview**

**What we're doing**:
- Link GitHub repo to Vercel project
- Configure environment variables for platform
- Enable automatic deployment on push
- Test live deployment

**What we're deploying**:
- App: `apps/platform` (Next.js 16.3.2)
- URL: `https://thekpihub-platform.vercel.app` (existing) or new custom domain
- Database: Supabase (shared with website)
- Auth: Supabase Auth
- Billing: Stripe
- AI: Anthropic API, OpenRouter

---

## **Step 1: Prepare Your Credentials** 

Before starting, gather these values (from Phase A verification):

### Required Credentials
```
Supabase:
  □ NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
  □ NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard>
  □ SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard, server-only>

Stripe:
  □ STRIPE_SECRET_KEY=sk_test_... or sk_live_...
  □ STRIPE_WEBHOOK_SECRET=whsec_...
  □ STRIPE_PRICE_STARTER=price_...
  □ STRIPE_PRICE_GROWTH=price_...
  □ STRIPE_PRICE_ENTERPRISE=price_...

AI Providers:
  □ ANTHROPIC_API_KEY=sk-ant-...
  □ OPENROUTER_API_KEY=<from openrouter.ai>

Platform Config:
  □ NEXT_PUBLIC_APP_URL=https://thekpihub-platform.vercel.app
  □ WINGMAN_API_URL=https://... (if applicable)
  □ WINGMAN_URL=https://... (if applicable)
  □ HANDOFF_SECRET=<random string for security>
```

### How to Find These

**Supabase Keys**:
1. Go to https://supabase.com/dashboard
2. Select project `eeuwkislidznpgdbvvbo`
3. Settings → API → Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Public API Key (anon) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

**Stripe Keys**:
1. Go to https://dashboard.stripe.com
2. Settings → API Keys → Copy:
   - Secret Key → `STRIPE_SECRET_KEY`
3. Developers → Webhooks → Find webhook secret → `STRIPE_WEBHOOK_SECRET`
4. Product → Prices → Copy price IDs for each tier

**AI Provider Keys**:
1. Anthropic: https://console.anthropic.com/account/keys
2. OpenRouter: https://openrouter.ai/account/api-keys

---

## **Step 2: Link Vercel Project**

### Option A: Using Vercel CLI (Recommended)

```bash
# Navigate to platform directory
cd apps/platform

# Connect to Vercel
vercel link

# Follow prompts:
# - Choose: Create new project
# - Project name: kpihub-platform (or existing project)
# - Framework: Next.js
# - Root directory: .
# - Deployment: automatic on git push
```

### Option B: Using Vercel Web Dashboard

1. Go to https://vercel.com/dashboard
2. New Project → Import from Git
3. Select GitHub repo: `hsharmagxi-debug/kpihub-assembled`
4. Framework: Next.js
5. Root directory: `apps/platform`
6. Click Deploy (will fail on first try without env vars — that's OK)

---

## **Step 3: Configure Environment Variables**

### Using Vercel Web UI (Easiest)

1. Go to your Vercel project: https://vercel.com/dashboard → kpihub-platform
2. Settings → Environment Variables
3. Add each variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The credential value
   - **Environments**: Select all (Production, Preview, Development)

### All Required Variables

Add these 14 variables to Vercel:

```
NEXT_PUBLIC_APP_URL = https://thekpihub-platform.vercel.app
NEXT_PUBLIC_SUPABASE_URL = https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your anon key>
SUPABASE_SERVICE_ROLE_KEY = <your service role key>
STRIPE_SECRET_KEY = sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
STRIPE_PRICE_STARTER = price_...
STRIPE_PRICE_GROWTH = price_...
STRIPE_PRICE_ENTERPRISE = price_...
ANTHROPIC_API_KEY = sk-ant-...
OPENROUTER_API_KEY = <your key>
WINGMAN_API_URL = https://... (optional)
WINGMAN_URL = https://... (optional)
HANDOFF_SECRET = <random alphanumeric string>
```

### ⚠️ Important Notes

- **NEVER commit .env files to Git** ✓ (already not in this repo)
- **NEXT_PUBLIC_* variables** are public (visible in browser) → Use anon key only
- **Service role key** is private → Vercel env only, never in code
- **Webhook secret** is sensitive → Store in Vercel, not in code

---

## **Step 4: Enable GitHub Integration**

Vercel auto-deploys when you push to `main`.

### Verify Integration

1. Go to Vercel project settings
2. Git → Connected Repository
3. Should show: `hsharmagxi-debug/kpihub-assembled`
4. Main branch: `main`

### Test Integration

```bash
# Make a small change to platform
echo "# Deployment test" >> apps/platform/README.md

# Commit and push
git add apps/platform/README.md
git commit -m "test: trigger Vercel deployment"
git push origin main

# Watch deployment at https://vercel.com/dashboard → kpihub-platform → Deployments
```

---

## **Step 5: Add Webhook Configuration (Stripe)**

### Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Create endpoint:
   - URL: `https://thekpihub-platform.vercel.app/api/billing/webhook`
   - Events: Select these events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.deleted`
3. Copy webhook signing secret
4. Add to Vercel: `STRIPE_WEBHOOK_SECRET = <your secret>`

---

## **Step 6: Test Live Deployment**

### Verify Platform is Live

```bash
# Check if platform is accessible
curl -I https://thekpihub-platform.vercel.app

# Should return HTTP 200 (or 308 redirect if custom domain)
```

### Test Key Features

1. **Homepage loads**: https://thekpihub-platform.vercel.app
2. **API endpoint responds**: https://thekpihub-platform.vercel.app/api/health (if implemented)
3. **Database connection**: Sign up → should connect to Supabase
4. **Stripe checkout**: Initiate checkout → should redirect to Stripe

### Debug Deployment

If deployment fails:

1. Check Vercel logs: Dashboard → Deployments → Click latest → Logs
2. Common issues:
   - Missing env var → Add to Vercel settings
   - Build error → Check `npm run build` locally first
   - Runtime error → Check application logs

---

## **Step 7: Configure GitHub Actions Secrets (Optional)**

If you want GitHub Actions to deploy automatically:

### Add Secrets to GitHub

1. Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
2. New repository secret:
   - Name: `VERCEL_TOKEN`
   - Value: Get from https://vercel.com/account/tokens → Create new
3. Add another secret:
   - Name: `VERCEL_ORG_ID`
   - Value: Get from Vercel team settings
4. Add another secret:
   - Name: `VERCEL_PROJECT_ID`
   - Value: Get from `vercel.json` after linking, or Vercel dashboard

### Create Deployment Workflow (Optional)

Create `.github/workflows/deploy-platform.yml`:

```yaml
name: Deploy Platform to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'apps/platform/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/platform
```

**Note**: Vercel auto-deploys on push, so this is optional (nice-to-have, not required).

---

## **Phase B Completion Checklist**

- [ ] Credentials gathered from Phase A
- [ ] Vercel project linked to GitHub repo
- [ ] All 14 environment variables configured in Vercel
- [ ] GitHub integration verified (auto-deploy on push)
- [ ] Stripe webhook endpoint configured
- [ ] Platform deployment tested and accessible
- [ ] Database connection verified (can sign up)
- [ ] Stripe checkout flow tested
- [ ] Deployment logs checked for errors

---

## **Next Steps After Phase B**

### If everything works:
- ✅ **Phase C**: Add GitHub Actions secrets & deployment workflows
- ✅ **Phase D**: Add health checks & monitoring

### If issues:
- Check Vercel deployment logs
- Verify env vars are correct
- Test build locally: `cd apps/platform && npm install && npm run build`
- Check Supabase/Stripe dashboards for errors

---

## **Important Reminders**

- ✅ **Secrets are safe in Vercel** (encrypted at rest)
- ✅ **Never commit .env files to Git**
- ✅ **Anon key is public** (visible in browser) — that's intentional
- ✅ **Service role key is private** — Vercel only, never expose
- ✅ **Webhook secret must match Stripe** — keep in sync when rotating

---

**Ready to proceed?** Complete the steps above and report back once platform is deployed! 🚀
