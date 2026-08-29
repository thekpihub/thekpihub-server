# Razorpay Business Integration Guide

**Status**: Implementation Ready  
**Last Updated**: 2026-08-29  
**Scope**: Connecting payments to subscription flows and user management

---

## Table of Contents

1. [Integration Architecture](#integration-architecture)
2. [Subscription Flow Integration](#subscription-flow-integration)
3. [User Database Synchronization](#user-database-synchronization)
4. [Webhook Event Processing](#webhook-event-processing)
5. [Refund Handling](#refund-handling)
6. [Invoice & Receipt Management](#invoice--receipt-management)
7. [Billing Cycle Management](#billing-cycle-management)
8. [Analytics & Reporting](#analytics--reporting)

---

## Integration Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Subscription │────────→│   Razorpay   │                  │
│  │  Component   │         │   Checkout   │                  │
│  └──────────────┘         └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
         │                          │
         │ onSuccess                │ callback
         ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Next.js API Routes)                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │ Create Order │  │ Verify Sig   │  │ Webhook Handler│    │
│  └──────────────┘  └──────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │Supabase│    │Email Svc │    │Analytics │
    │  DB    │    │(Resend)  │    │(Tracking)│
    └────────┘    └──────────┘    └──────────┘
```

### Data Flow

```
1. User Initiates Payment
   └─→ Frontend: RazorpayCheckout component mounts
   └─→ User selects plan and amount
   └─→ User clicks "Subscribe"

2. Create Payment Order
   └─→ Frontend calls: POST /api/razorpay/create-order
   └─→ Backend validates plan/amount
   └─→ Backend creates Razorpay order
   └─→ Backend stores order metadata in Supabase

3. Complete Payment
   └─→ Razorpay modal captures payment
   └─→ Payment processed by Razorpay
   └─→ Razorpay returns payment_id + signature

4. Verify & Activate Subscription
   └─→ Frontend calls: POST /api/razorpay/verify-payment
   └─→ Backend verifies HMAC-SHA256 signature
   └─→ Backend marks order as verified in Supabase
   └─→ Backend updates user subscription status
   └─→ Backend sends confirmation email

5. Webhook Confirmation
   └─→ Razorpay sends webhook event
   └─→ Backend processes webhook event
   └─→ Backend confirms subscription activation
   └─→ Backend sends receipt email
```

---

## Subscription Flow Integration

### Step 1: Extend User Schema

Add subscription fields to your users table:

```sql
-- apps/platform/supabase/migrations/add_subscriptions.sql

ALTER TABLE auth.users ADD COLUMN subscription_plan VARCHAR(50);
ALTER TABLE auth.users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE auth.users ADD COLUMN subscription_start_date TIMESTAMP;
ALTER TABLE auth.users ADD COLUMN subscription_end_date TIMESTAMP;
ALTER TABLE auth.users ADD COLUMN razorpay_customer_id VARCHAR(255);
ALTER TABLE auth.users ADD COLUMN razorpay_subscription_id VARCHAR(255);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  amount_inr DECIMAL(10, 2) NOT NULL,
  amount_usd DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'inactive', -- inactive, active, expired, cancelled
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_customer_id VARCHAR(255),
  razorpay_subscription_id VARCHAR(255),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  renewal_date TIMESTAMP,
  cancellation_date TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_renewal_date ON subscriptions(renewal_date);
```

### Step 2: Define Plans

```typescript
// apps/platform/src/lib/subscription-plans.ts

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amountINR: number;
  amountUSD: number;
  currency: "INR" | "USD";
  billingCycle: "monthly" | "annual";
  features: string[];
  maxUsers?: number;
  maxProjects?: number;
  priority: "standard" | "priority";
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: "starter",
    name: "Starter Plan",
    description: "For individuals and small teams",
    amountINR: 2999,
    amountUSD: 36,
    currency: "INR",
    billingCycle: "monthly",
    features: [
      "Up to 5 KPI dashboards",
      "Basic analytics",
      "Email support",
      "Community access"
    ],
    maxUsers: 1,
    maxProjects: 5,
    priority: "standard"
  },

  growth: {
    id: "growth",
    name: "Growth Plan",
    description: "For growing teams",
    amountINR: 9999,
    amountUSD: 120,
    currency: "INR",
    billingCycle: "monthly",
    features: [
      "Up to 25 KPI dashboards",
      "Advanced analytics",
      "Priority email support",
      "API access",
      "Custom integrations"
    ],
    maxUsers: 5,
    maxProjects: 25,
    priority: "priority"
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    description: "Custom solution for enterprises",
    amountINR: 49999,
    amountUSD: 600,
    currency: "INR",
    billingCycle: "monthly",
    features: [
      "Unlimited dashboards",
      "Custom analytics",
      "24/7 dedicated support",
      "Full API access",
      "Custom integrations",
      "On-premise deployment",
      "SLA guarantee"
    ],
    priority: "priority"
  }
};
```

### Step 3: Update Checkout Component

```typescript
// apps/platform/src/components/SubscriptionCheckout.tsx

"use client";

import { useState } from "react";
import { RazorpayCheckout } from "@/components/razorpay/RazorpayCheckout";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { createClient } from "@/utils/supabase/client";

export function SubscriptionCheckout({ planId }: { planId: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const plan = SUBSCRIPTION_PLANS[planId];
  const supabase = createClient();

  const handlePaymentSuccess = async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setIsProcessing(true);
    try {
      // 1. Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      // 2. Create subscription record
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .insert([
          {
            user_id: user.id,
            plan_id: plan.id,
            plan_name: plan.name,
            amount_inr: plan.amountINR,
            amount_usd: plan.amountUSD,
            status: "active",
            razorpay_order_id: paymentData.razorpay_order_id,
            razorpay_payment_id: paymentData.razorpay_payment_id,
            start_date: new Date(),
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 3. Update user subscription status
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          subscription_plan: plan.id,
          subscription_status: "active"
        }
      });

      if (updateError) throw updateError;

      // 4. Send confirmation email
      await fetch("/api/email/send-subscription-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          planName: plan.name,
          amount: plan.amountINR,
          orderId: paymentData.razorpay_order_id
        })
      });

      // 5. Redirect to dashboard
      window.location.href = "/dashboard?subscription=activated";
    } catch (error) {
      console.error("Subscription activation failed:", error);
      alert("Failed to activate subscription. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="subscription-checkout">
      <h2>{plan.name}</h2>
      <p>{plan.description}</p>

      <div className="price-display">
        <span className="amount">₹{plan.amountINR}</span>
        <span className="period">/month</span>
      </div>

      <ul className="features">
        {plan.features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>

      <RazorpayCheckout
        planId={plan.id}
        amount={plan.amountINR * 100} // Convert to paise
        currency="INR"
        onSuccess={handlePaymentSuccess}
        onError={(error) => {
          console.error("Payment error:", error);
          alert("Payment failed: " + error.message);
        }}
        buttonText={`Subscribe to ${plan.name}`}
        disabled={isProcessing}
      />
    </div>
  );
}
```

---

## User Database Synchronization

### Update User Profile on Subscription Activation

```typescript
// apps/platform/src/app/api/razorpay/verify-payment/route.ts

import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    // ... signature verification code ...

    // After successful verification:
    const supabase = await createClient(await cookies());
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get subscription details
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date()
      })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    // Update user profile
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: {
        subscription_status: "active",
        subscription_plan: subscription.plan_id,
        subscription_activated_at: new Date().toISOString()
      }
    });

    if (userUpdateError) throw userUpdateError;

    return NextResponse.json({
      verified: true,
      subscription_id: subscription.id,
      status: "activated"
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
```

---

## Webhook Event Processing

### Implement Webhook Handler

```typescript
// apps/platform/src/app/api/razorpay/webhook/route.ts

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature!), Buffer.from(expectedSignature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const supabase = await createClient(await cookies());

    // Process different event types
    switch (event.event) {
      case "payment.authorized":
        await handlePaymentAuthorized(supabase, event.payload);
        break;

      case "payment.failed":
        await handlePaymentFailed(supabase, event.payload);
        break;

      case "payment.captured":
        await handlePaymentCaptured(supabase, event.payload);
        break;

      case "refund.created":
        await handleRefundCreated(supabase, event.payload);
        break;

      case "subscription.activated":
        await handleSubscriptionActivated(supabase, event.payload);
        break;

      case "subscription.paused":
        await handleSubscriptionPaused(supabase, event.payload);
        break;

      case "subscription.halted":
        await handleSubscriptionHalted(supabase, event.payload);
        break;
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handlePaymentAuthorized(supabase: any, payload: any) {
  const { payment } = payload;
  console.log("Payment authorized:", payment.id);
  // Update subscription status
  await supabase
    .from("subscriptions")
    .update({ status: "active" })
    .eq("razorpay_payment_id", payment.id);
}

async function handlePaymentFailed(supabase: any, payload: any) {
  const { payment } = payload;
  console.log("Payment failed:", payment.id);
  // Notify user, update status
  await supabase
    .from("subscriptions")
    .update({ status: "failed" })
    .eq("razorpay_payment_id", payment.id);
}

async function handleRefundCreated(supabase: any, payload: any) {
  const { refund } = payload;
  console.log("Refund created:", refund.id);
  // Track refund
  await supabase
    .from("refunds")
    .insert([{ razorpay_refund_id: refund.id, amount: refund.amount }]);
}
```

---

## Refund Handling

### Implement Refund Processing

```typescript
// apps/platform/src/app/api/razorpay/refund/route.ts

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export async function POST(request: NextRequest) {
  try {
    const { subscription_id, reason } = await request.json();
    const supabase = await createClient(await cookies());

    // Get subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .single();

    if (error || !subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Process refund
    const refund = await razorpay.payments.refund(subscription.razorpay_payment_id, {
      amount: subscription.amount_inr * 100, // Convert to paise
      notes: {
        reason: reason || "User requested"
      }
    });

    // Update subscription
    await supabase
      .from("subscriptions")
      .update({
        status: "refunded",
        cancellation_date: new Date(),
        cancellation_reason: reason
      })
      .eq("id", subscription_id);

    // Send refund confirmation email
    await fetch("/api/email/send-refund-confirmation", {
      method: "POST",
      body: JSON.stringify({
        subscriptionId: subscription_id,
        refundAmount: subscription.amount_inr,
        refundId: refund.id
      })
    });

    return NextResponse.json({
      status: "refunded",
      refund_id: refund.id,
      amount: subscription.amount_inr
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
```

---

## Invoice & Receipt Management

### Generate Invoice

```typescript
// apps/platform/src/lib/invoice-generator.ts

export async function generateInvoice(subscriptionId: string) {
  // Fetch subscription details
  // Generate PDF using a library like `pdf-lib` or `pdfkit`
  // Store in Supabase Storage
  // Email to user
}
```

---

## Billing Cycle Management

### Handle Recurring Billing

```typescript
// apps/platform/src/app/api/cron/process-renewals/route.ts
// Called daily by cron job

export async function GET() {
  try {
    const supabase = await createClient();

    // Find subscriptions due for renewal
    const { data: duingRenewal } = await supabase
      .from("subscriptions")
      .select("*")
      .lte("renewal_date", new Date())
      .eq("status", "active");

    for (const subscription of duingRenewal || []) {
      // Create new order for renewal
      // Send renewal reminder email
      // Update renewal_date
    }

    return NextResponse.json({ processed: duingRenewal?.length || 0 });
  } catch (error) {
    return NextResponse.json({ error: "Renewal processing failed" }, { status: 500 });
  }
}
```

---

## Analytics & Reporting

### Track Key Metrics

```typescript
// apps/platform/src/lib/analytics.ts

export async function trackSubscriptionMetrics() {
  const supabase = await createClient();

  // Active subscriptions by plan
  const { data: byPlan } = await supabase
    .from("subscriptions")
    .select("plan_id, count()")
    .eq("status", "active")
    .group_by("plan_id");

  // Monthly recurring revenue (MRR)
  const { data: mrr } = await supabase
    .from("subscriptions")
    .select("amount_inr")
    .eq("status", "active");

  const totalMRR = (mrr || []).reduce((sum, sub) => sum + sub.amount_inr, 0);

  // Churn rate
  const { data: cancellations } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("status", "cancelled")
    .gte("cancellation_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  console.log({
    activeSubscriptions: byPlan,
    monthlyRecurringRevenue: totalMRR,
    churnCount: cancellations?.length || 0
  });
}
```

---

## Implementation Checklist

- [ ] Extend user/subscription schema in Supabase
- [ ] Define subscription plans
- [ ] Update checkout component
- [ ] Implement webhook handler
- [ ] Create refund endpoint
- [ ] Set up email notifications
- [ ] Configure renewal logic
- [ ] Create analytics dashboard
- [ ] Test end-to-end flow
- [ ] Deploy to production
- [ ] Monitor metrics

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-29
