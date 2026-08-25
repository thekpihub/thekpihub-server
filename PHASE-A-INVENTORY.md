# Phase A: Inventory & Verification Checklist

**Objective**: Verify current live platform configuration without making changes  
**Estimated Time**: 30-45 minutes  
**Risk Level**: None (read-only verification only)  
**Status**: 🔄 In Progress

---

## **1. Hostinger Website Verification**

### Live Website URL
- **Public**: https://thekpihub.com
- **DNS**: Hostinger nameservers (ns1/ns2.dns-parking.com) → Hostinger CDN (hstgr.net)

### Required Access
- **SSH Host**: u117990013@thekpihub.com
- **SSH User**: u117990013
- **Server Path**: /home/u117990013/public_html/

### What to Verify (Read-Only)
- [ ] SSH key access works: `ssh u117990013@thekpihub.com`
- [ ] Live `config.js` exists at `/home/u117990013/public_html/config.js`
  - [ ] Contains Supabase URL
  - [ ] Contains Stripe publishable key (if subscriptions launching)
  - [ ] Contains GA4 Measurement ID
  - [ ] Contains Microsoft Clarity ID
- [ ] Live `.htaccess` exists at `/home/u117990013/public_html/.htaccess`
  - [ ] Contains SetEnv for Supabase service role key
  - [ ] Contains SetEnv for Stripe webhook secret (if needed)
  - [ ] Contains SetEnv for any other server-side secrets
- [ ] Build directory structure is present
- [ ] `.deploy-exclude` rules are protecting config files (check rsync behavior)

### Command Reference
```bash
# Connect
ssh u117990013@thekpihub.com

# Check config.js
cat public_html/config.js | head -20

# Check .htaccess
cat public_html/.htaccess | grep -i setenv

# Verify deployment timestamp
ls -la public_html/ | head
```

### Findings
**Status**: ⬜ Pending  
**Notes**: (Fill in after verification)

---

## **2. Supabase Project Verification**

### Project Details
- **Project ID**: `eeuwkislidznpgdbvvbo`
- **Region**: (To be verified)
- **URL**: https://eeuwkislidznpgdbvvbo.supabase.co

### What to Verify (Read-Only)
- [ ] Project is accessible and active
- [ ] Auth enabled (email/password, OAuth, etc.)
- [ ] Database tables exist and are queryable
- [ ] Real-time subscriptions enabled (if needed)
- [ ] Storage buckets configured (if needed)
- [ ] Service role key is secure (check permissions)
- [ ] Anon key is restricted (check RLS policies)

### Access Requirements
- Supabase account with project access (https://supabase.com/dashboard)
- OR Supabase CLI: `supabase projects list`

### Findings
**Status**: ⬜ Pending  
**Notes**: (Fill in after verification)

---

## **3. Stripe Configuration Verification**

### What to Verify (Read-Only)
- [ ] Stripe account is active and accessible
- [ ] Live API keys are configured (publishable & secret)
- [ ] Webhook endpoints configured:
  - [ ] Webhook signing secret exists
  - [ ] Webhook URL points to correct backend
  - [ ] Events subscribed: `checkout.session.completed`, `invoice.payment_succeeded`, etc.
- [ ] Product & Price IDs match repo:
  - [ ] `STRIPE_PRICE_STARTER` (if active)
  - [ ] `STRIPE_PRICE_GROWTH` (if active)
  - [ ] `STRIPE_PRICE_ENTERPRISE` (if active)
- [ ] Test vs. Live mode configured correctly
- [ ] Recent transactions visible (if any test/live charges)

### Access Requirements
- Stripe Dashboard: https://dashboard.stripe.com
- API Keys section (need: publishable key, secret key, webhook secret)

### Findings
**Status**: ⬜ Pending  
**Notes**: (Fill in after verification)

---

## **4. Razorpay Payment Link Verification**

### Live Payment Link
- **URL**: Hardcoded in `apps/website/get-audit.html`
- **Product**: KPI Audit Lite (₹2,999 one-time)
- **Status**: ✅ LIVE (only active revenue path)

### What to Verify (Read-Only)
- [ ] Payment link URL is accessible and returns 200 OK
- [ ] Payment link shows correct amount (₹2,999)
- [ ] Payment link is NOT expired
- [ ] Razorpay account is active
- [ ] Payment method (UPI, cards, etc.) is enabled
- [ ] Webhook secret is secure (if configured)

### Command Reference
```bash
# Find payment link in website code
grep -r "PAYMENT_LINK" apps/website/

# Test link accessibility
curl -I "https://rzp.io/..." # (replace with actual link)
```

### Findings
**Status**: ⬜ Pending  
**Notes**: (Fill in after verification)

---

## **5. Vercel Project Verification**

### Platform App Details
- **App**: `apps/platform`
- **Expected URL**: https://thekpihub-platform.vercel.app
- **Status**: Canonical future platform (not yet at production URL)

### What to Verify (Read-Only)
- [ ] Vercel project exists and is linked to GitHub
- [ ] GitHub integration points to `hsharmagxi-debug/kpihub-assembled`
- [ ] Current deployment is green or has known status
- [ ] Environment variables are configured (or missing with known reason)
- [ ] Custom domain configured (if any)
- [ ] Build settings are correct (Next.js standalone)

### Access Requirements
- Vercel Dashboard: https://vercel.com/dashboard
- OR Vercel CLI: `vercel projects list`

### Findings
**Status**: ⬜ Pending  
**Notes**: (Fill in after verification)

---

## **6. Summary & Next Steps**

### Verification Complete? 
- [ ] All 5 sections verified
- [ ] No blockers found
- [ ] Current deployment health confirmed

### Findings Summary
```
Website (Hostinger):   [✓/✗]
Supabase (Database):   [✓/✗]
Stripe (Subscriptions):[✓/✗]
Razorpay (Payments):   [✓/✗]
Vercel (Platform):     [✓/✗]
```

### Next Phase Recommendation
After Phase A completion, choose:

- **Phase B**: Configure Platform deployment (if Vercel project is ready)
- **Phase C**: Add GitHub Actions deploy secrets (if CD is desired)
- **Phase D**: Add health checks & monitoring

---

## **Notes**

**DO NOT** during Phase A:
- ❌ Change any configuration
- ❌ Rotate any secrets
- ❌ Deploy anything
- ❌ Modify .htaccess or config.js

**This is verification only** — gather facts, document findings, prepare for Phase B decision.

---

**Completed by**: (your name)  
**Date**: (completion date)  
**Verified at**: (timestamp)
