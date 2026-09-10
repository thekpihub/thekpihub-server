# Razorpay Monitoring & Analytics Guide

**Status**: Implementation Ready  
**Last Updated**: 2026-08-29  
**Scope**: Real-time monitoring, metrics tracking, and business analytics

---

## Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Key Metrics & KPIs](#key-metrics--kpis)
3. [Alert Configuration](#alert-configuration)
4. [Dashboards](#dashboards)
5. [Error Tracking](#error-tracking)
6. [Payment Analytics](#payment-analytics)
7. [Business Intelligence](#business-intelligence)
8. [Reporting](#reporting)

---

## Monitoring Architecture

### Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Data Sources                           │
│  ┌───────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐     │
│  │Razorpay│ │Vercel    │  │Supabase │  │Sentry    │     │
│  │ API    │ │Analytics │  │ Logs    │  │Errors    │     │
│  └───────┘  └──────────┘  └─────────┘  └──────────┘     │
└──────────────────────────────────────────────────────────┘
         │            │            │            │
         └────────────┼────────────┼────────────┘
                      ▼
┌──────────────────────────────────────────────────────────┐
│               Data Processing Layer                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Aggregation (Real-time + Batch)                 │   │
│  │  - Payment metrics aggregation                   │   │
│  │  - Error rate calculation                        │   │
│  │  - Performance metrics                           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│               Metrics Storage                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐    │
│  │  Supabase    │  │  Time-Series │  │ Analytics  │    │
│  │  Database    │  │  Database    │  │ DB         │    │
│  └──────────────┘  └──────────────┘  └────────────┘    │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                 Visualization Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐    │
│  │ Dashboards   │  │ Reports      │  │ Alerts     │    │
│  └──────────────┘  └──────────────┘  └────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## Key Metrics & KPIs

### Payment Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Payment Success Rate** | > 98% | < 95% | < 90% |
| **Average Response Time** | < 2s | > 3s | > 5s |
| **Payment Processing Time** | < 5s | > 8s | > 15s |
| **Failed Transaction Rate** | < 2% | > 3% | > 5% |
| **Webhook Delivery Rate** | > 99% | < 98% | < 95% |

### Business Metrics

```sql
-- Total Revenue (Monthly)
SELECT 
  SUM(amount_inr) as total_revenue_inr,
  SUM(amount_usd) as total_revenue_usd,
  COUNT(*) as total_transactions,
  TRUNC(DATE_TRUNC('month', created_at)) as month
FROM subscriptions
WHERE status IN ('active', 'completed')
GROUP BY DATE_TRUNC('month', created_at);

-- Active Subscriptions by Plan
SELECT 
  plan_id,
  COUNT(*) as count,
  SUM(amount_inr) as monthly_revenue,
  AVG(amount_inr) as avg_amount
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_id;

-- Monthly Recurring Revenue (MRR)
SELECT 
  SUM(amount_inr) as mrr_inr,
  SUM(amount_usd) as mrr_usd
FROM subscriptions
WHERE status = 'active';

-- Churn Rate (30-day)
SELECT 
  COUNT(*) as churned_users,
  ROUND(
    COUNT(*)::numeric / 
    LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at))::numeric * 100,
    2
  ) as churn_rate_percent
FROM subscriptions
WHERE status = 'cancelled'
  AND cancellation_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('month', cancellation_date);

-- Customer Acquisition Cost (CAC)
SELECT 
  COUNT(DISTINCT user_id) as new_customers,
  CASE 
    WHEN plan_id = 'starter' THEN 'Low CAC'
    WHEN plan_id = 'growth' THEN 'Medium CAC'
    ELSE 'High CAC'
  END as acquisition_tier,
  DATE_TRUNC('month', created_at) as month
FROM subscriptions
GROUP BY plan_id, DATE_TRUNC('month', created_at);
```

### Technical Metrics

```
Performance:
├── API Response Time (p50, p95, p99)
├── Payment Modal Load Time
├── Webhook Processing Latency
└── Database Query Performance

Reliability:
├── System Uptime
├── Error Rate
├── Timeout Rate
├── Database Connection Errors
└── Network Errors

Security:
├── Failed Authentication Attempts
├── Signature Verification Failures
├── Rate Limiting Events
├── Suspicious Activity Alerts
└── Unauthorized Access Attempts
```

---

## Alert Configuration

### Setup Alerts in Vercel

```bash
# Connect monitoring tool
# Vercel → Settings → Integrations → Monitoring

# Configure thresholds for:
# - Response time > 3s
# - Error rate > 2%
# - Webhook failures > 5
```

### Setup Alerts in Sentry

```typescript
// Configure Sentry for error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Payment-Specific Alerts

Create custom alerts for payment events:

```typescript
// apps/platform/src/lib/alerts.ts

export async function sendAlert(
  severity: "info" | "warning" | "error" | "critical",
  title: string,
  details: Record<string, any>
) {
  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    body: JSON.stringify({
      severity,
      title,
      details,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
  });

  // Log to Sentry
  if (severity === "error" || severity === "critical") {
    Sentry.captureException(new Error(title), {
      extra: details
    });
  }
}

// Usage
await sendAlert("critical", "Payment Success Rate Below Threshold", {
  successRate: 0.89,
  threshold: 0.95,
  failedPayments: 45,
  totalPayments: 420,
  actionRequired: "Investigate payment processing"
});
```

### Alert Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Success rate < 90% | Critical | Page on-call engineer |
| Success rate < 95% | Warning | Send email to team |
| Response time > 5s | Warning | Investigate performance |
| Webhook delivery < 95% | Error | Check webhook endpoint |
| Failed signature verification | Error | Investigate security |

---

## Dashboards

### Dashboard 1: Real-Time Payments

```typescript
// apps/platform/src/app/dashboard/payments/real-time.tsx

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function RealtimePaymentsDashboard() {
  const supabase = createClient();
  const [metrics, setMetrics] = useState({
    successRate: 0,
    todayRevenue: 0,
    activeTransactions: 0,
    failedPayments: 0
  });

  useEffect(() => {
    // Subscribe to real-time payment updates
    const channel = supabase
      .channel("payments:live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions"
        },
        (payload) => {
          // Update metrics
          console.log("Payment update:", payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="dashboard">
      <div className="metric success-rate">
        <h3>Success Rate</h3>
        <p className="value">{(metrics.successRate * 100).toFixed(2)}%</p>
        <p className="status">Target: 98%</p>
      </div>

      <div className="metric revenue">
        <h3>Today's Revenue</h3>
        <p className="value">₹{metrics.todayRevenue.toLocaleString()}</p>
        <p className="status">+12% vs yesterday</p>
      </div>

      <div className="metric transactions">
        <h3>Active Transactions</h3>
        <p className="value">{metrics.activeTransactions}</p>
        <p className="status">Processing...</p>
      </div>

      <div className="metric failures">
        <h3>Failed Payments</h3>
        <p className="value">{metrics.failedPayments}</p>
        <p className="status">Requires attention</p>
      </div>
    </div>
  );
}
```

### Dashboard 2: Business Analytics

```typescript
// apps/platform/src/app/dashboard/analytics/business.tsx

"use client";

import { LineChart, BarChart, PieChart } from "@/components/charts";

export function BusinessAnalyticsDashboard() {
  return (
    <div className="analytics-dashboard">
      <section className="revenue-trends">
        <h2>Revenue Trends (30 Days)</h2>
        <LineChart
          data={revenueData}
          x="date"
          y="revenue"
          title="Daily Revenue"
        />
      </section>

      <section className="subscription-distribution">
        <h2>Subscription Distribution</h2>
        <PieChart
          data={subscriptionData}
          title="Active Subscriptions by Plan"
        />
      </section>

      <section className="mrr-tracking">
        <h2>Monthly Recurring Revenue</h2>
        <div className="mrr-card">
          <h3>Current MRR</h3>
          <p>₹{currentMRR.toLocaleString()}</p>
          <p className="change">+18% vs last month</p>
        </div>
      </section>

      <section className="churn-analysis">
        <h2>Churn Analysis</h2>
        <BarChart
          data={churnData}
          x="month"
          y="churnRate"
          title="Monthly Churn Rate"
        />
      </section>
    </div>
  );
}
```

---

## Error Tracking

### Track Payment Errors

```typescript
// apps/platform/src/lib/error-tracking.ts

export async function trackPaymentError(
  error: Error,
  context: {
    userId: string;
    orderId: string;
    amount: number;
    step: string;
  }
) {
  // Log to Sentry
  Sentry.captureException(error, {
    tags: {
      component: "payment",
      step: context.step,
      orderId: context.orderId
    },
    extra: context
  });

  // Log to Supabase
  const supabase = await createClient();
  await supabase.from("error_logs").insert([{
    error_type: error.name,
    error_message: error.message,
    error_stack: error.stack,
    context: JSON.stringify(context),
    timestamp: new Date()
  }]);

  // Send alert if critical
  if (isCriticalError(error)) {
    await sendAlert("critical", `Payment Error: ${error.message}`, context);
  }
}

function isCriticalError(error: Error): boolean {
  const criticalMessages = [
    "Signature verification failed",
    "Database connection error",
    "Razorpay API error",
    "Webhook processing failed"
  ];
  return criticalMessages.some(msg => error.message.includes(msg));
}
```

---

## Payment Analytics

### Detailed Payment Analysis

```sql
-- Payment Status Distribution
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as percentage
FROM subscriptions
GROUP BY status;

-- Payment Methods Analysis
SELECT 
  payment_method,
  COUNT(*) as count,
  SUM(amount_inr) as total_revenue,
  AVG(amount_inr) as avg_amount
FROM subscriptions
WHERE status IN ('active', 'completed')
GROUP BY payment_method
ORDER BY total_revenue DESC;

-- Customer Lifetime Value (CLV)
SELECT 
  user_id,
  COUNT(*) as total_payments,
  SUM(amount_inr) as lifetime_value,
  MAX(created_at) as last_payment_date
FROM subscriptions
WHERE status IN ('active', 'completed')
GROUP BY user_id
ORDER BY lifetime_value DESC;

-- Payment Timing Analysis
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as payment_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM subscriptions
WHERE status != 'failed'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;
```

---

## Business Intelligence

### Cohort Analysis

```python
# Analyze user cohorts

SELECT 
  DATE_TRUNC('month', s1.created_at) as cohort_month,
  DATE_TRUNC('month', s2.created_at) as activity_month,
  COUNT(DISTINCT s1.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN s2.status = 'active' THEN s1.user_id END) as active_users
FROM subscriptions s1
LEFT JOIN subscriptions s2 
  ON s1.user_id = s2.user_id 
  AND DATE_TRUNC('month', s2.created_at) >= DATE_TRUNC('month', s1.created_at)
GROUP BY cohort_month, activity_month
ORDER BY cohort_month, activity_month;
```

### Funnel Analysis

```sql
-- Conversion Funnel
WITH funnel AS (
  SELECT 
    'visited_pricing' as step,
    COUNT(DISTINCT user_id) as users
  FROM page_views
  WHERE page = '/pricing'
  
  UNION ALL
  
  SELECT 
    'started_checkout',
    COUNT(DISTINCT user_id)
  FROM orders
  WHERE status = 'initiated'
  
  UNION ALL
  
  SELECT 
    'completed_payment',
    COUNT(DISTINCT user_id)
  FROM subscriptions
  WHERE status IN ('active', 'completed')
)
SELECT 
  step,
  users,
  ROUND(
    users::numeric / FIRST_VALUE(users) OVER (ORDER BY step) * 100,
    2
  ) as conversion_percent
FROM funnel
ORDER BY users DESC;
```

---

## Reporting

### Daily Report Template

```markdown
# Daily Payment Report - {DATE}

## Summary
- **Total Transactions**: {count}
- **Successful Payments**: {count} ({percentage}%)
- **Failed Payments**: {count} ({percentage}%)
- **Total Revenue**: ₹{amount}
- **Average Transaction Value**: ₹{amount}

## Key Metrics
- **Success Rate**: {percentage}% (Target: 98%)
- **Processing Time**: {seconds}s avg
- **Webhook Delivery Rate**: {percentage}%
- **Error Rate**: {percentage}%

## Issues & Alerts
- {list of issues}

## Recommendations
- {actionable recommendations}
```

### Weekly Report Template

```markdown
# Weekly Payment Analytics - {WEEK}

## Revenue
- **Total Revenue**: ₹{amount}
- **Weekly Growth**: +{percentage}% vs previous week
- **Top Performing Day**: {day} with ₹{amount}

## Subscriptions
- **New Subscriptions**: {count}
- **Churned Subscriptions**: {count}
- **Net Growth**: {count}
- **Churn Rate**: {percentage}%

## Performance
- **Average Success Rate**: {percentage}%
- **P95 Response Time**: {time}ms
- **Uptime**: {percentage}%

## Insights & Next Steps
- {insights}
```

---

## Implementation Checklist

- [ ] Set up Sentry error tracking
- [ ] Configure Vercel monitoring
- [ ] Create real-time dashboard
- [ ] Build business analytics dashboard
- [ ] Set up Slack alerts
- [ ] Configure alert thresholds
- [ ] Create daily report automation
- [ ] Set up weekly reports
- [ ] Monitor for 2 weeks
- [ ] Adjust thresholds based on data
- [ ] Add team access to dashboards
- [ ] Create runbook for alerts

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-29
