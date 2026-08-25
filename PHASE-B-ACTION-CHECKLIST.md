# Phase B: Action Checklist & Implementation Plan

**Decision**: Deploy Platform to Vercel | Keep Website on Hostinger  
**Date**: 2026-08-25  
**Status**: 🚀 Ready to Execute  

---

## **Deployment Strategy Confirmed**

| Component | Hosting | Deployment | Status |
|-----------|---------|------------|--------|
| **Website** (thekpihub.com) | Hostinger | SSH rsync (existing) | ✅ No changes |
| **Platform** (thekpihub-platform.vercel.app) | Vercel | GitHub push → auto-deploy | 🔄 Phase B setup |
| **Legacy App** | Reference only | N/A | — |
| **Wing Commander** | Reference only | N/A | — |

---

## **Phase B Implementation Checklist**

### **Before You Start**
- [ ] Have credentials ready (see below)
- [ ] Vercel account access: https://vercel.com/dashboard
- [ ] GitHub repo access: https://github.com/hsharmagxi-debug/kpihub-assembled

### **Credentials You Need** (Gather from Phase A)

```
SUPABASE:
  □ Project URL: https://eeuwkislidznpgdbvvbo.supabase.co
  □ Public API Key (anon): ________________________
  □ Service Role Key: ________________________

STRIPE:
  □ Secret Key: sk_test_... or sk_live_...
  □ Webhook Secret: whsec_...
  □ Price ID (Starter): price_...
  □ Price ID (Growth): price_...
  □ Price ID (Enterprise): price_...

AI PROVIDERS:
  □ Anthropic API Key: sk-ant-...
  □ OpenRouter API Key: ________________________

PLATFORM:
  □ App URL: https://thekpihub-platform.vercel.app
  □ Handoff Secret: ________________________ (generate random string)
```

---

## **Step-by-Step Execution**

### **Step 1: Link to Vercel** (5 min)

```bash
# Navigate to platform
cd apps/platform

# Connect to Vercel
vercel link

# Follow prompts:
# ✓ Set up and deploy "kpihub-platform"?
# ✓ Which scope? (your account)
# ✓ Link to existing project? (if exists) or create new
# ✓ Project name: kpihub-platform
# ✓ Directory: .
# ✓ Continue? Yes
```

**Result**: Creates `apps/platform/.vercel/project.json` (don't commit this)

---

### **Step 2: Configure Environment Variables in Vercel** (15 min)

**Access**: https://vercel.com/dashboard → kpihub-platform → Settings → Environment Variables

**Add these 14 variables** (select "All" for environments):

| Variable | Value | Type |
|----------|-------|------|
| NEXT_PUBLIC_APP_URL | https://thekpihub-platform.vercel.app | Public |
| NEXT_PUBLIC_SUPABASE_URL | https://eeuwkislidznpgdbvvbo.supabase.co | Public |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | `<from Supabase>` | Public |
| SUPABASE_SERVICE_ROLE_KEY | `<from Supabase>` | Secret |
| STRIPE_SECRET_KEY | sk_test_... or sk_live_... | Secret |
| STRIPE_WEBHOOK_SECRET | whsec_... | Secret |
| STRIPE_PRICE_STARTER | price_... | Secret |
| STRIPE_PRICE_GROWTH | price_... | Secret |
| STRIPE_PRICE_ENTERPRISE | price_... | Secret |
| ANTHROPIC_API_KEY | sk-ant-... | Secret |
| OPENROUTER_API_KEY | `<from OpenRouter>` | Secret |
| WINGMAN_API_URL | https://... (if applicable) | Secret |
| WINGMAN_URL | https://... (if applicable) | Secret |
| HANDOFF_SECRET | `<random string>` | Secret |

**✓ After adding all variables**: Click "Save"

---

### **Step 3: Verify GitHub Integration** (2 min)

**Access**: https://vercel.com/dashboard → kpihub-platform → Settings → Git

**Check**:
- [ ] Connected repository: `hsharmagxi-debug/kpihub-assembled`
- [ ] Main branch: `main`
- [ ] Deploy on push: ✅ Enabled
- [ ] Preview deployments: ✅ Enabled

**Result**: Every push to `main` will trigger automatic deployment

---

### **Step 4: Configure Stripe Webhook** (5 min)

**Access**: https://dashboard.stripe.com/webhooks

**Create Endpoint**:
- URL: `https://thekpihub-platform.vercel.app/api/webhooks/stripe`
- Events to listen:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `customer.subscription.created`
  - `customer.subscription.deleted`

**Copy webhook signing secret** → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

### **Step 5: Test Deployment** (20 min)

**Option A: Let Vercel deploy automatically**
```bash
# Make a small test change
echo "# Test deployment" >> apps/platform/README.md

# Commit and push
git add apps/platform/README.md
git commit -m "test: trigger Vercel deployment for Phase B"
git push origin main

# Watch deployment at:
# https://vercel.com/dashboard → kpihub-platform → Deployments
# (Should see "Building" → "Ready" within 2-3 min)
```

**Option B: Deploy manually from Vercel dashboard**
1. Go to https://vercel.com/dashboard → kpihub-platform
2. Click "Deploy" button (deploys current main branch)

---

### **Step 6: Verify Live Platform** (10 min)

**Test these**:

```bash
# 1. Is platform accessible?
curl -I https://thekpihub-platform.vercel.app
# Should return HTTP 200 or 308

# 2. Can you access homepage?
# Visit: https://thekpihub-platform.vercel.app
# Should load homepage without errors

# 3. Can you sign up? (Tests Supabase)
# Try signing up → should see auth flow
# Check Supabase dashboard for new user

# 4. Can you start checkout? (Tests Stripe)
# Try purchasing a plan → should redirect to Stripe
# Check Stripe dashboard for test session
```

**If any test fails**:
1. Check Vercel deployment logs: Dashboard → Deployments → Click latest → Logs
2. Look for error messages
3. Common issues:
   - Missing env var → Add to Vercel
   - Wrong secret value → Double-check in Stripe/Supabase dashboards
   - Build error → Run `npm run build` locally to debug

---

## **After Deployment: Monitoring**

Once live, monitor these:

- [ ] **Vercel Deployments**: https://vercel.com/dashboard → kpihub-platform → Deployments
  - Check latest deployment status
  - View build logs for errors
  - Monitor response times

- [ ] **Supabase Logs**: https://supabase.com/dashboard → projet → Logs
  - Monitor auth attempts
  - Check database queries

- [ ] **Stripe Webhooks**: https://dashboard.stripe.com/webhooks
  - Monitor webhook delivery success
  - Check for failed events

---

## **Phase B Completion Criteria**

✅ Phase B is **COMPLETE** when:

- [ ] Vercel project linked to GitHub
- [ ] All 14 env vars configured
- [ ] GitHub auto-deploy enabled
- [ ] Stripe webhook configured
- [ ] Platform accessible at https://thekpihub-platform.vercel.app
- [ ] Sign up works (Supabase tested)
- [ ] Checkout flow works (Stripe tested)
- [ ] No errors in Vercel logs

---

## **Website Deployment: No Action Required**

✅ **Website (thekpihub.com)** continues to work as-is:
- Stays on Hostinger
- Deployment workflow in separate private repo (`thekpihub/thekpihub-website`)
- Razorpay payments remain live
- No changes to this repo needed

---

## **Next Phases**

**After Phase B completes**:

- **Phase C**: Add GitHub Actions secrets for CI/CD pipelines (optional)
- **Phase D**: Add health checks & monitoring endpoints

---

## **Support**

If you get stuck:
1. Check Vercel deployment logs (most helpful)
2. Verify all 14 env vars are set correctly
3. Test Stripe/Supabase dashboards directly
4. Check repo: https://github.com/hsharmagxi-debug/kpihub-assembled/blob/main/PHASE-B-DEPLOYMENT-GUIDE.md

---

**Ready to execute Phase B?** Start with Step 1: `vercel link` in `apps/platform` directory 🚀
