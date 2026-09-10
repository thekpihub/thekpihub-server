# Payment Processor Setup Guide

Quick reference for configuring Razorpay and PayPal payment processors.

## Quick Start

### 1. Razorpay Setup (India Primary)

**Get Credentials**:
1. Create account at [razorpay.com](https://razorpay.com)
2. Navigate to Dashboard → Settings → API Keys
3. Copy: Key ID and Key Secret (test or live)

**Environment Variables**:
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

**Configure Webhooks**:
1. Dashboard → Settings → Webhooks
2. URL: `https://thekpihub.com/api/billing/webhook/razorpay`
3. Events: `payment.authorized`, `payment.captured`
4. Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

**Test Checkout**:
```bash
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "growth", "region": "IN"}'
```

---

### 2. PayPal Setup (Global Primary)

**Get Credentials**:
1. Create business account at [paypal.com/developer](https://developer.paypal.com)
2. Create an application
3. Copy: Client ID and Secret (sandbox or live)

**Environment Variables**:
```bash
PAYPAL_CLIENT_ID=client_id_xxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=secret_xxxxxxxxxxxxx
PAYPAL_MODE=sandbox  # Change to 'live' for production
```

**Configure Webhooks**:
1. Dashboard → Account Settings → Notifications → Webhooks
2. URL: `https://thekpihub.com/api/billing/webhook/paypal`
3. Events: `CHECKOUT.ORDER.COMPLETED`, `PAYMENT.CAPTURE.COMPLETED`
4. Copy Webhook ID to `PAYPAL_WEBHOOK_ID`

**Test Checkout**:
```bash
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "growth", "processor": "paypal"}'
```

---

## Environment Configuration

### .env.local (Development)

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# PayPal
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_WEBHOOK_ID=xxxxx
PAYPAL_MODE=sandbox
```

### Production Deployment

Same variables, but with:
- Live credentials (not test/sandbox)
- PAYPAL_MODE=live
- Production URLs (https://thekpihub.com)

---

## Testing Checklist

- [ ] Razorpay checkout returns valid session
- [ ] PayPal checkout returns valid order URL
- [ ] Razorpay webhook signature validates
- [ ] PayPal webhook signature validates
- [ ] User plan updates after successful payment
- [ ] Error handling works (missing credentials, invalid signatures)
- [ ] Fallback processor works if primary fails

---

## Troubleshooting

**Issue**: "Razorpay credentials not configured"
- Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set
- Verify no typos in environment variable names

**Issue**: Webhook signature invalid
- Ensure webhook secret matches exactly in provider dashboard
- Check raw payload is used (not parsed JSON)

**Issue**: User plan not updating
- Check Supabase service role key has PATCH permissions
- Verify user_id is being passed correctly in webhook
- Check database logs for PATCH errors

---

## API Reference

### POST /api/billing/checkout

Request:
```json
{
  "plan": "growth",              // Required
  "processor": "razorpay",       // Optional
  "region": "IN"                 // Optional
}
```

Response (Razorpay):
```json
{
  "sessionId": "order_abc123",
  "url": "https://checkout.razorpay.com/?key_id=...",
  "processor": "razorpay",
  "currency": "INR",
  "amount": 4999
}
```

Response (PayPal):
```json
{
  "sessionId": "order_abc123",
  "url": "https://www.paypal.com/checkoutnow?token=...",
  "processor": "paypal",
  "currency": "USD",
  "amount": 5999
}
```

---

## Price Reference

| Plan | INR (Razorpay) | USD (PayPal) |
|------|---|---|
| Growth | ₹49.99 | $59.99 |
| Enterprise | ₹149.99 | $149.99 |

---

## Support

- **Razorpay Docs**: https://razorpay.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs
- **Internal**: Team communication channels
