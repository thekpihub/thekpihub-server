# Razorpay Production Deployment Guide

**Status**: Ready for Production  
**Last Updated**: 2026-08-29  
**Audience**: DevOps, Platform Engineers, Team Leads

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Step 1: Obtain Live Razorpay Credentials](#step-1-obtain-live-razorpay-credentials)
3. [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
4. [Step 3: Deploy to Production](#step-3-deploy-to-production)
5. [Step 4: Post-Deployment Verification](#step-4-post-deployment-verification)
6. [Step 5: Monitor Payment Processing](#step-5-monitor-payment-processing)
7. [Rollback Procedures](#rollback-procedures)
8. [Production Monitoring](#production-monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Review & Testing
- [ ] PR #4 approved by team lead
- [ ] All CI/CD checks passing (CodeQL, security scanning, TypeScript)
- [ ] Local testing completed with test credentials
- [ ] Demo page tested at `http://localhost:3000/razorpay-demo`
- [ ] Payment verification endpoint tested with cURL
- [ ] Error handling verified for edge cases

### Security Review
- [ ] HMAC-SHA256 signature validation reviewed
- [ ] Timing-safe comparison implementation verified
- [ ] No secrets committed to repository
- [ ] Environment variable approach reviewed
- [ ] API key rotation policy established

### Documentation Review
- [ ] RAZORPAY-INTEGRATION-GUIDE.md reviewed
- [ ] Production checklist reviewed
- [ ] Team trained on payment flow
- [ ] Support procedures documented

---

## Step 1: Obtain Live Razorpay Credentials

### 1.1 Create Razorpay Account (if not exists)

1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Click **"Sign Up"** or **"Sign In"**
3. Complete KYC verification:
   - Business details
   - Bank account information
   - GST registration (if applicable)
   - Pan card details
4. Wait for account approval (typically 24-48 hours)

### 1.2 Generate Live API Keys

Once account is approved:

1. Go to **Settings → API Keys**
2. Click **"Generate Live Key"**
3. Copy both:
   - **Key ID** (public): `rzp_live_XXXXXXXXX...`
   - **Key Secret** (private): `xxxxxxxxx...`
4. **NEVER** share the Key Secret publicly

### 1.3 Whitelist URLs

In Razorpay Dashboard:

1. Go to **Settings → Website URL**
2. Add your production domain: `https://yourdomain.com`
3. Add any subdomains if using multiple deployment environments

### 1.4 Configure Webhooks (Step 5 below)

---

## Step 2: Configure Environment Variables

### 2.1 Production Environment Setup

Update your production environment with live credentials:

```bash
# For Vercel Deployment
vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID
# Enter: rzp_live_XXXXXXXXX

vercel env add RAZORPAY_KEY_SECRET
# Enter: your_live_key_secret (will be encrypted)
```

### 2.2 GitHub Actions Secrets

For CI/CD pipeline:

```bash
# Go to: Settings → Secrets and variables → Actions
# Add secrets:
RAZORPAY_LIVE_KEY_ID: rzp_live_XXXXXXXXX
RAZORPAY_LIVE_KEY_SECRET: your_live_key_secret
```

### 2.3 Environment Variable Checklist

```
✅ NEXT_PUBLIC_RAZORPAY_KEY_ID (public - can be in .env.local)
✅ RAZORPAY_KEY_SECRET (private - must be in deployment secrets)
✅ NEXT_PUBLIC_SUPABASE_URL (for user tracking)
✅ SUPABASE_SERVICE_ROLE_KEY (for webhook processing)
✅ WEBHOOK_SECRET (for securing webhook endpoints)
```

### 2.4 Verification

After deploying, verify variables are set:

```bash
vercel env ls
# Should show all production variables
```

---

## Step 3: Deploy to Production

### 3.1 Merge PR #4 to Main

```bash
# PR #4: feat: Razorpay Standard Web Checkout Integration
# All checks passing ✅

# Option A: Via GitHub UI
# 1. Go to PR #4
# 2. Click "Merge pull request"
# 3. Select "Squash and merge" or "Merge"
# 4. Confirm merge

# Option B: Via Git CLI
git checkout main
git pull origin main
git merge --no-ff origin/claude/kpihub-repo-assembly-y1i0kv
git push origin main
```

### 3.2 Automatic Deployment

Once merged to `main`:

1. GitHub Actions workflow triggers automatically
2. Vercel automatically deploys
3. Watch deployment progress in Vercel dashboard

### 3.3 Manual Deployment (if needed)

```bash
# Deploy to Vercel
vercel --prod

# Or via CLI
vercel deploy --prod
```

### 3.4 Deployment Verification

```bash
# Check deployment status
vercel ls

# Visit production URL
https://your-production-domain.com/razorpay-demo
```

---

## Step 4: Post-Deployment Verification

### 4.1 Smoke Testing

**Before announcing to customers, run these tests:**

#### Test 1: Create Order Endpoint
```bash
curl -X POST https://your-domain.com/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "order_live_001"
  }'

# Expected: 
# {
#   "order_id": "order_ILHxFGbFP6KSJS",
#   "amount": 50000,
#   "currency": "INR",
#   "receipt": "order_live_001"
# }
```

#### Test 2: Payment Modal
1. Open demo page: `https://your-domain.com/razorpay-demo`
2. Enter amount: **₹1** (minimum for testing)
3. Click "Pay with Razorpay"
4. Use test card:
   - Card: `4111111111111111`
   - Expiry: Any future date
   - CVV: Any 3 digits
5. Click "Pay" in modal

#### Test 3: Payment Verification
After completing payment in modal:
1. Check response for `razorpay_payment_id`
2. Verify signature validation succeeds
3. See success message on demo page

#### Test 4: Error Handling
1. Close modal without paying
2. Verify graceful error handling
3. Test with invalid amounts (< ₹1)
4. Test network error scenarios

### 4.2 Database Integration (if using)

If storing payments in database:

```typescript
// Example: Save payment to Supabase
import { createClient } from "@/utils/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase
  .from("payments")
  .insert([{
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    amount: amount,
    status: "completed",
    user_id: userId
  }]);

if (error) console.error("Database error:", error);
```

### 4.3 Verification Checklist

- [ ] Payment creation succeeds
- [ ] Razorpay modal loads correctly
- [ ] Payment can be completed
- [ ] Signature verification passes
- [ ] Demo page shows success message
- [ ] No console errors
- [ ] Network requests use HTTPS
- [ ] Error states display correctly

---

## Step 5: Monitor Payment Processing

### 5.1 Razorpay Dashboard Monitoring

1. Go to **Razorpay Dashboard → Payments**
2. Filter by date range
3. Check:
   - **Payment Count**: How many payments processed
   - **Success Rate**: Should be > 95%
   - **Failed Payments**: Review and contact users if needed
   - **Refunds**: Track refund requests

### 5.2 Set Up Webhooks

Razorpay can notify your backend when payment events occur.

#### 5.2.1 Create Webhook Handler

```typescript
// apps/platform/src/app/api/razorpay/webhook/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const signature = request.headers.get("x-razorpay-signature");

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(JSON.stringify(body))
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Process webhook events
  const { event, payload } = body;

  switch (event) {
    case "payment.authorized":
      // Handle payment authorization
      console.log("Payment authorized:", payload.payment.id);
      break;

    case "payment.failed":
      // Handle payment failure
      console.log("Payment failed:", payload.payment.id);
      // Notify user, retry, etc.
      break;

    case "refund.created":
      // Handle refund
      console.log("Refund created:", payload.refund.id);
      // Update database
      break;
  }

  return NextResponse.json({ status: "ok" });
}
```

#### 5.2.2 Register Webhook in Razorpay

1. Go to **Settings → Webhooks**
2. Click **"Add New Webhook"**
3. Configure:
   - **Webhook URL**: `https://your-domain.com/api/razorpay/webhook`
   - **Events**: Select all relevant events:
     - `payment.authorized`
     - `payment.failed`
     - `refund.created`
   - **Active**: Enable
4. Click **"Create Webhook"**

### 5.3 Set Up Alerts

In Razorpay Dashboard:

1. **Settings → Alerts**
2. Configure email notifications for:
   - Failed payments
   - High transaction volumes
   - Unusual activity

### 5.4 Analytics & Reporting

Track key metrics:

- **Daily Payment Count**
- **Daily Revenue**
- **Payment Success Rate**
- **Average Transaction Value**
- **Top Payment Methods**
- **Geographic Distribution**

---

## Rollback Procedures

### If Critical Issues Occur

#### Option 1: Revert PR Merge (Immediate)

```bash
git revert -m 1 <merge-commit-sha>
git push origin main
# Vercel auto-deploys reverted version
```

#### Option 2: Disable Payment Feature

In production code:

```typescript
const PAYMENT_ENABLED = false; // Set to false to disable

if (!PAYMENT_ENABLED) {
  return NextResponse.json(
    { error: "Payment processing temporarily unavailable" },
    { status: 503 }
  );
}
```

#### Option 3: Fall Back to Test Credentials

Temporarily revert to test mode:

```bash
vercel env rm RAZORPAY_KEY_SECRET
vercel env add RAZORPAY_KEY_SECRET
# Enter test secret key
vercel deploy --prod
```

### Communication Plan

1. **Immediately**: Post status on website/dashboard
2. **Within 1 hour**: Email affected customers
3. **Continuous updates**: Share progress every 30 min
4. **Resolution**: Communicate restoration and apology

---

## Production Monitoring

### Key Metrics to Track

```
📊 Payment Metrics:
├── Success Rate (target: > 98%)
├── Average Response Time (target: < 2s)
├── Transaction Volume (daily/weekly/monthly)
├── Revenue Tracking
└── Chargeback Rate (target: < 0.1%)

⚠️ Error Metrics:
├── Failed Transactions
├── Signature Verification Failures
├── Network Errors
├── Timeout Errors
└── Webhook Delivery Failures

🔒 Security Metrics:
├── Failed Verification Attempts
├── Suspicious Payment Patterns
├── Rate Limiting Events
└── Account Access Attempts
```

### Recommended Tools

1. **Vercel Analytics**: Monitor API performance
2. **Sentry**: Error tracking and alerting
3. **Razorpay Dashboard**: Native payment analytics
4. **Custom Dashboards**: Use Supabase for detailed tracking

### Alert Thresholds

Configure alerts for:

| Metric | Warning | Critical |
|--------|---------|----------|
| Payment Success Rate | < 95% | < 90% |
| API Response Time | > 3s | > 5s |
| Error Rate | > 2% | > 5% |
| Webhook Failures | > 5 | > 20 |

---

## Troubleshooting

### Issue 1: "Invalid API Key"

**Cause**: Using test key credentials instead of live  
**Solution**:
```bash
# Verify environment variables
vercel env ls
# Ensure RAZORPAY_KEY_ID starts with "rzp_live_"
# Regenerate keys if needed
```

### Issue 2: "Signature Verification Failed"

**Cause**: Key Secret doesn't match Razorpay's records  
**Solution**:
```bash
# Copy Key Secret exactly from Razorpay dashboard
# No extra spaces or characters
# Redeploy with verified key
vercel deploy --prod
```

### Issue 3: "Payment Modal Doesn't Load"

**Cause**: NEXT_PUBLIC_RAZORPAY_KEY_ID not in browser  
**Solution**:
```typescript
// Check browser console
console.log(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
// Should print key ID, not undefined
```

### Issue 4: "Webhook Delivery Failing"

**Cause**: URL unreachable or signature mismatch  
**Solution**:
1. Verify URL is publicly accessible
2. Check firewall/WAF rules
3. Verify webhook secret in code matches Razorpay
4. Check logs for webhook attempts

### Issue 5: "Transactions Failing in Production but Work in Test"

**Cause**: Account approval, rate limiting, or business rules  
**Solution**:
1. Check Razorpay Dashboard for account status
2. Verify whitelist includes production domain
3. Check transaction limits in account settings
4. Contact Razorpay support if blocked

---

## Next Steps After Deployment

### Immediate (Day 1)
- [ ] Monitor success metrics
- [ ] Check for customer complaints
- [ ] Verify webhook delivery
- [ ] Monitor error logs

### First Week
- [ ] Analyze payment patterns
- [ ] Gather user feedback
- [ ] Optimize error messages
- [ ] Plan refund handling

### First Month
- [ ] Generate revenue reports
- [ ] Analyze conversion funnel
- [ ] Plan promotional campaigns
- [ ] Review security audit logs

---

## Support & Escalation

### Razorpay Support
- **Dashboard Chat**: https://dashboard.razorpay.com (chat icon)
- **Email**: support@razorpay.com
- **Documentation**: https://razorpay.com/docs

### Internal Team
- **Payment Issues**: Mention @payments-team
- **Deployment Issues**: Mention @devops-team
- **Security Concerns**: Mention @security-team

---

## Sign-Off

- [ ] Team Lead: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______
- [ ] Security: _________________ Date: _______

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-29  
**Next Review**: 2026-09-29
