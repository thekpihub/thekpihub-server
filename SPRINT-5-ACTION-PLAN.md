# Sprint 5 Action Plan — KPI Hub Assembled
## Executive Status & Next Steps (2026-08-28)

**Date**: 2026-08-28  
**Status**: 🟡 **PRODUCTION-READY WITH CRITICAL SECURITY DEBT**  
**Overall Assessment**: All Phase A-D work complete; production systems live; one critical blocker and one high-priority blocker remain.

---

## Executive Summary

The KPI Hub migration to a unified monorepo is **complete and operational**:
- ✅ All 4 applications assembled and integrated
- ✅ Platform deployed to Vercel and live at https://platform-two-zeta-31.vercel.app
- ✅ Website live at https://thekpihub.com with safe deployment workflow
- ✅ Authentication configured and working with Supabase
- ✅ Comprehensive documentation across 23+ files
- ✅ CI/CD automation configured in GitHub Actions
- ✅ Health monitoring endpoints implemented

**However**, two items require immediate attention:
1. **🔴 CRITICAL (TODAY)**: Revoke exposed GitHub Personal Access Token (deferred from 2026-08-27)
2. **🟠 HIGH (This Week)**: Configure Stripe products and API keys (blocking billing features)

---

## Part 1: CRITICAL - GitHub PAT Revocation (TODAY - 2026-08-28)

### Current Status

**Issue**: A GitHub Personal Access Token (classic) was exposed during local development work and has been quarantined but **NOT YET REVOKED**.

**Quarantine Location**: `C:\Users\Admin\OneDrive\20-areas\22-security-and-access\The KPI Hub\2026-08-27-security-review`

**What This Means**:
- The token exists and could theoretically be used to access KPI Hub repositories
- The contaminated checkout is isolated and documented
- GitHub CLI has been repaired separately via browser/device OAuth
- The token was never tested or reused after exposure

**Action Required**: Revoke this token immediately on GitHub to prevent any unauthorized access.

### Step-by-Step: How to Revoke the Exposed PAT

#### Step 1: Access GitHub Personal Access Tokens

1. Go to https://github.com/settings/tokens (requires authentication)
2. You'll see two tabs:
   - **Personal access tokens (classic)** ← Look here
   - **Fine-grained personal access tokens**
3. Click on the **Personal access tokens (classic)** tab

#### Step 2: Identify the Exposed Token

Look for a token that:
- **Name**: likely mentions "KPI Hub", "Hostinger", "deploy", or was created around 2026-08-27
- **Last used**: Check the date to confirm it matches when it was exposed
- **Scopes**: If visible, should show `repo`, `admin:repo_hook`, or similar

> ⚠️ **DO NOT copy or display the token value in chat or any shared location**

#### Step 3: Revoke the Token

1. Click the **Delete** button next to the token
2. Confirm the deletion when prompted
3. ✅ Token is now revoked and cannot be used for authentication

#### Step 4: Verify Revocation

After deleting:
1. The token should no longer appear in the list
2. Any attempts to use that token will receive authentication errors
3. Repository access using that token is permanently terminated

### Additional Credential Rotation Items

While revoking the PAT, also review and rotate these credentials per your security schedule:

1. **Hostinger SSH Credentials**
   - A new dedicated SSH key was created for the migration
   - Old GitHub-stored keys should be removed from Hostinger
   - Status: Verify that only the new key is authorized in Hostinger SSH Access

2. **Hostinger Direct Password**
   - Was exposed in plaintext during the security review
   - Should be rotated as part of this security hardening

3. **GitHub CLI Credential**
   - Stored in plaintext in WSL due to lack of system credential store
   - Should be reviewed and moved to a secure credential manager if possible

### Evidence Documentation

Once revoked, update the HANDOFF.md file to record:

```markdown
**✅ 2026-08-28 - GitHub PAT Revoked**
- Exposed classic PAT deleted from github.com/settings/tokens
- Token no longer valid for authentication
- Hostinger access credentials reviewed and rotated
- No ongoing security blockers
```

---

## Part 2: HIGH PRIORITY - Stripe Configuration

### Current Status

**Issue**: Billing features are blocked because Stripe API keys and product configurations are not yet in place.

**Affected Features**:
- `/api/billing/checkout` endpoint (non-functional without Stripe keys)
- `/api/billing/webhook` endpoint (non-functional without webhook secret)
- Subscription tier selection in Dashboard (grayed out/disabled)
- Payment processing (cannot complete transactions)

**Status**: Ready to configure; documentation complete; implementation blocked only on external service setup.

### Required Stripe Configuration

#### What You Need From Stripe

You will need the following from your Stripe account (https://dashboard.stripe.com):

1. **Secret Key**
   - Located: Settings → API Keys → Secret Key
   - Format: `sk_live_...` (production) or `sk_test_...` (testing)
   - Usage: Added to Vercel as `STRIPE_SECRET_KEY`

2. **Webhook Secret**
   - Located: Developers → Webhooks → Signing secret (for "chargewithin" or your custom endpoint)
   - Format: `whsec_...` (Stripe) or `whsec_...`
   - Usage: Added to Vercel as `STRIPE_WEBHOOK_SECRET`

3. **Product Price IDs** (3 tiers required)
   - Product 1: Starter Tier
     - Price ID: `price_...` (from Stripe Products)
     - Usage: Vercel env var `STRIPE_PRICE_STARTER`
   - Product 2: Growth Tier
     - Price ID: `price_...` (from Stripe Products)
     - Usage: Vercel env var `STRIPE_PRICE_GROWTH`
   - Product 3: Enterprise Tier
     - Price ID: `price_...` (from Stripe Products)
     - Usage: Vercel env var `STRIPE_PRICE_ENTERPRISE`

#### Step-by-Step: Create Stripe Products

1. **Log into Stripe Dashboard**: https://dashboard.stripe.com

2. **Navigate to Products**:
   - Click "Catalog" in left sidebar
   - Click "Products"
   - Click "+ Add Product" button

3. **Create First Product (Starter)**:
   - Name: `KPI Hub - Starter`
   - Description: `Basic analytics and monitoring`
   - Pricing model: Subscription
   - Billing period: Monthly
   - Price: (set your pricing, e.g., $29/month)
   - Click "Create Product"
   - On next page, copy the **Price ID** (format: `price_...`)
   - Save this as `STRIPE_PRICE_STARTER`

4. **Repeat for Growth and Enterprise Tiers**:
   - Create second product: `KPI Hub - Growth` with appropriate pricing
   - Create third product: `KPI Hub - Enterprise` with appropriate pricing
   - Collect all three price IDs

#### Step-by-Step: Get Webhook Secret

1. **Navigate to Webhooks**:
   - In Stripe Dashboard, click "Developers" (top right)
   - Click "Webhooks"
   - You should see webhooks listed

2. **Find or Create Webhook Endpoint**:
   - If a webhook for your domain exists, click it
   - If not, click "+ Add Endpoint"
   - Endpoint URL: `https://platform-two-zeta-31.vercel.app/api/billing/webhook`
   - Events to send: Select "charge.succeeded", "customer.subscription.updated", "customer.subscription.deleted"

3. **Copy Signing Secret**:
   - Click the webhook endpoint
   - Under "Signing secret", click "Reveal"
   - Copy the value (format: starts with `whsec_`)
   - Save this as `STRIPE_WEBHOOK_SECRET`

#### Step-by-Step: Add to Vercel

1. **Access Vercel Project Settings**:
   - Go to https://vercel.com/dashboard
   - Select your project (`kpihub-assembled` or similar)
   - Click "Settings"
   - Click "Environment Variables"

2. **Add Three New Variables**:

   ```
   Variable Name: STRIPE_SECRET_KEY
   Value: sk_live_... (or sk_test_...)
   Environment: Production
   
   Variable Name: STRIPE_WEBHOOK_SECRET
   Value: whsec_...
   Environment: Production
   
   Variable Name: STRIPE_PRICE_STARTER
   Value: price_...
   Environment: Production
   
   Variable Name: STRIPE_PRICE_GROWTH
   Value: price_...
   Environment: Production
   
   Variable Name: STRIPE_PRICE_ENTERPRISE
   Value: price_...
   Environment: Production
   ```

3. **Verify Configuration**:
   - After adding variables, trigger a new deployment
   - Vercel will automatically rebuild with new environment variables
   - Check that the deployment succeeds

4. **Test Billing Workflow**:
   - Go to https://platform-two-zeta-31.vercel.app
   - Log in with test account
   - Navigate to Dashboard → Billing
   - Verify subscription tiers are now displayed and clickable
   - Test checkout flow (note: use Stripe test card numbers if in test mode)

### Testing Checklist

- [ ] Stripe keys configured in Vercel
- [ ] Deployment successful with new environment variables
- [ ] Dashboard billing section no longer shows "Not Configured"
- [ ] Subscription tiers are displayed (Starter, Growth, Enterprise)
- [ ] Checkout button leads to Stripe checkout page
- [ ] Webhook endpoint is receiving test events

---

## Part 3: Medium Priority - Deploy Website to Hostinger

### Current Status

**Status**: ✅ **READY TO DEPLOY** (not blocking; website already live)

**Why This Is Optional**:
- The website is already live at https://thekpihub.com
- Current deployment uses the old `thekpihub/thekpihub-website` repository
- This workflow provides a **safe, governed alternative** that can be executed anytime

**When to Execute**:
- After PAT revocation is complete and verified
- After Stripe configuration is done
- Can be deferred until you want to migrate to monorepo-based deployments

### Safe Deployment Workflow

A new **governed deployment workflow** has been created in this repository that:

1. ✅ Builds **only** `apps/website` (prevents deploying entire monorepo)
2. ✅ Creates explicit **allow-listed staging payload**
3. ✅ Makes payload **reviewable via GitHub artifacts**
4. ✅ Requires **manual dispatch** for every deployment
5. ✅ Performs **dry-run validation** before production push
6. ✅ Requires **`hostinger-production` environment approval**
7. ✅ Uses **non-destructive rsync** (no `--delete` flag)
8. ✅ Verifies **`config.js` and `.htaccess` checksums** are unchanged
9. ✅ Runs **smoke tests** post-deployment

### If You Decide to Deploy

1. Go to GitHub Actions in this repository
2. Look for "Deploy to Hostinger (Manual)" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Check the dry-run output in the logs
6. Review the staging payload artifacts
7. Confirm deployment when ready

### Rollback Procedure (If Needed)

A protected backup was created before any modifications:
- **Location**: `/home/u117990013/kpihub-migration-backups/2026-08-27-before-kpihub-assembled/public_html.tar.gz`
- **SHA-256**: `184ecb5de1c4fcbd457f9bac9a45f3895e3b84e843bc2cc24cdb9a1b3a9550a3`
- **Contains**: Full website backup with 641 manifest entries

If rollback is needed:
1. SSH into Hostinger
2. Restore: `tar -xzf /home/u117990013/kpihub-migration-backups/2026-08-27-before-kpihub-assembled/public_html.tar.gz`
3. Verify checksums of `.htaccess` and `config.js`

---

## Part 4: Optional - Setup Monitoring & Alerts

### Current Status

**Status**: ✅ **Documentation ready; implementation optional**

All monitoring components are optional enhancements that improve operational visibility but are not required for basic functionality.

### Recommended Monitoring Setup

#### 1. UptimeRobot (5 minutes)

Setup uptime monitoring for the platform:

1. Go to https://uptimerobot.com
2. Sign up (free tier available)
3. Add New Monitor:
   - **Type**: HTTPS
   - **URL**: https://platform-two-zeta-31.vercel.app/api/health
   - **Check Interval**: 5 minutes
   - **Alerts**: Email (or Slack if connected)

4. Optional: Add separate monitors for:
   - `/api/health/ready` (readiness probe)
   - `/api/health/live` (liveness probe)

#### 2. Sentry Error Tracking (10 minutes)

Setup error tracking and alerting:

1. Go to https://sentry.io
2. Sign up (free tier available)
3. Create New Project:
   - Select "Next.js"
   - Copy the DSN provided
4. Add to Vercel environment variables:
   - **Variable**: `SENTRY_DSN`
   - **Value**: DSN from Sentry
5. Restart deployment for Sentry integration

#### 3. Slack Notifications (5 minutes)

Connect Sentry and UptimeRobot to Slack:

1. In Slack workspace, create #platform-alerts channel
2. UptimeRobot:
   - Get Slack webhook URL from Slack API settings
   - In UptimeRobot, add Slack notification
3. Sentry:
   - In Sentry project settings, add Slack integration
   - Select #platform-alerts channel

### Documentation Reference

See these files for detailed setup guides:
- `PHASE-D-QUICK-SETUP.md` - Quick setup for all monitoring
- `PHASE-D-OPERATIONS.md` - Operations runbook

---

## Part 5: What's Already Complete

### Phase A - Inventory & Documentation ✅

- ✅ All 4 applications inventoried and documented
- ✅ Environment variables documented (14 total)
- ✅ Deployment topology mapped
- ✅ 5 documentation files created
- ✅ Source provenance documented for all components

### Phase B - Platform Deployment ✅

- ✅ Vercel project linked
- ✅ Environment variables configured (11 of 14)
- ✅ Platform live at https://platform-two-zeta-31.vercel.app
- ✅ Health check endpoints verified functional

### Phase C - GitHub Actions Automation ✅

- ✅ CI workflow configured and passing
- ✅ Deployment workflow configured
- ✅ GitHub environments created (`hostinger-production`)
- ✅ Secrets configured in GitHub
- ✅ Deployment gating configured

### Phase D - Monitoring & Health Checks ✅

- ✅ 5 health check endpoints implemented
- ✅ Monitoring documentation complete
- ✅ Readiness/liveness probes configured
- ✅ Status page endpoint working

### Repository & Git ✅

- ✅ All work committed and pushed
- ✅ Clean git history with 100+ commits
- ✅ No uncommitted changes
- ✅ No exposed secrets in repository

---

## Part 6: Blocking Issues Status

### 🔴 CRITICAL - GitHub PAT Revocation (TODAY)

| Item | Status | Action |
|------|--------|--------|
| PAT Exposed | ✅ Confirmed | Revoke today via github.com/settings/tokens |
| PAT Quarantined | ✅ Done | Local isolation confirmed |
| PAT Revoked | ❌ NOT YET | **ACTION REQUIRED** |
| GitHub CLI Repaired | ✅ Done | OAuth authentication working |
| Hostinger SSH Key Created | ✅ Done | New key deployed and working |

**Next Action**: Follow the step-by-step guide in Part 1 above to revoke the token today.

### 🟠 HIGH - Stripe Configuration (This Week)

| Item | Status | Action |
|------|--------|--------|
| Stripe Account | ✅ Verified | Using existing account |
| Products Created | ❌ Needed | Create 3 tiers (Starter, Growth, Enterprise) |
| Price IDs Obtained | ❌ Needed | Collect from Stripe dashboard |
| API Keys Obtained | ❌ Needed | Secret key + webhook secret from Stripe |
| Vercel Configured | ❌ Needed | Add 5 environment variables to Vercel |
| Billing Features Unblocked | ❌ Blocked | Will work after Vercel variables set |

**Next Action**: Follow the step-by-step guide in Part 2 above to configure Stripe.

### 🟢 MEDIUM - Hostinger Deployment (Optional)

| Item | Status | Action |
|------|--------|--------|
| Backup Created | ✅ Done | SHA-256 verified |
| Workflow Created | ✅ Done | Safe, non-destructive |
| Source Hardening | ✅ Done | `.htaccess` configured for denial |
| Website Live | ✅ Yes | Already serving thekpihub.com |
| Safe to Deploy | ✅ Ready | Can execute anytime without risk |

**Next Action**: Optional; execute only when ready to migrate to monorepo-based deployment.

---

## Part 7: Command Reference

### Quick Commands for This Sprint

#### Verify No Uncommitted Work
```bash
git status
# Should show: "working tree clean"
```

#### Check Remote Is Up To Date
```bash
git fetch origin main
git log --oneline -5
# Should show recent findings documents
```

#### View Health Check Status
```bash
curl -s https://platform-two-zeta-31.vercel.app/api/health | jq .
# Should return: {"status":"ok","timestamp":"...","responseTime":"..."}
```

#### Check Deployment Status
```bash
curl -s https://thekpihub.com
# Should return HTTP 200 with homepage content
```

#### Verify Stripe Webhook Configuration
After adding webhook to Stripe:
```bash
# Send test event from Stripe dashboard
# Check Vercel logs: vercel logs
# Should show webhook received and processed
```

---

## Part 8: Summary Timeline

### 2026-08-28 (TODAY)

- **NOW**: Revoke GitHub PAT (CRITICAL)
- **THIS MORNING**: Document PAT revocation in HANDOFF.md
- **THIS WEEK**: Configure Stripe products and keys
- **THIS WEEK**: Add Stripe variables to Vercel and deploy
- **THIS WEEK**: Test billing workflow end-to-end

### 2026-08-29 → 2026-09-04 (Week of Aug 28)

- **Verify** Stripe configuration is working in production
- **Test** subscription tier selection and checkout flow
- **Document** any issues or refinements needed
- **Deploy** website to Hostinger if transitioning to monorepo model (optional)

### 2026-09-05+ (Post-Sprint 5)

- **Setup** UptimeRobot, Sentry, Slack alerts (optional)
- **Enable** additional CI/CD automation features
- **Implement** any advanced monitoring features
- **Scale** operations as traffic increases

---

## Part 9: Success Criteria

### Sprint 5 Complete When:

1. ✅ GitHub PAT revoked and verified (CRITICAL)
2. ✅ Stripe products created and price IDs obtained
3. ✅ Stripe API keys added to Vercel
4. ✅ New Vercel deployment successful with Stripe configuration
5. ✅ Billing section in Dashboard is active and clickable
6. ✅ Stripe checkout flow works end-to-end
7. ✅ All monitoring optional setup (UptimeRobot, Sentry, Slack) documented

### After Sprint 5:

- ✅ Production systems fully operational with all core features
- ✅ Security credentials rotated and hardened
- ✅ Billing pipeline active and tested
- ✅ Monitoring in place for operational visibility
- ✅ Hostinger deployment workflow ready for transitioning old deployment

---

## Conclusion

The KPI Hub Assembled monorepo is **production-ready**. Two items need immediate attention, both of which have clear, documented procedures:

1. **Revoke GitHub PAT** (today) — Security critical but quick (< 5 minutes)
2. **Configure Stripe** (this week) — Feature enablement (< 30 minutes)

After these two items are complete, the project will have:
- ✅ All core features working and deployed
- ✅ Security debt cleared
- ✅ Comprehensive documentation
- ✅ Production monitoring in place
- ✅ Safe deployment workflows for all platforms

**Status**: 🟡 **PRODUCTION-READY WITH SECURITY DEBT** → 🟢 **FULLY OPERATIONAL** (after Sprint 5 completion)

---

**Document prepared**: 2026-08-28  
**Next review**: After security blockers resolved  
**Owner**: hsharmagxi-debug  
**Repository**: https://github.com/hsharmagxi-debug/kpihub-assembled/
