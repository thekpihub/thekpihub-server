# 🏗️ COMPLETE ARCHITECTURE & INFRASTRUCTURE CONTEXT

**Document Purpose**: Comprehensive project overview for new Claude Code sessions  
**Last Updated**: 2026-08-29  
**Status**: Production Deployment Phase 2  
**Repo**: https://github.com/hsharmagxi-debug/kpihub-assembled  

---

## 📋 EXECUTIVE SUMMARY

**TheKPIHub Platform** is a Next.js 16 monorepo with complete Razorpay payment integration, Supabase authentication, and Vercel AI Gateway multi-modal capabilities. The system is production-deployed with test mode active; live payments require credential activation (65 minutes).

**Key Facts**:
- **Status**: ✅ Code live on Vercel (test mode)
- **Demo**: https://kpihub-platform.vercel.app/razorpay-demo
- **Architecture**: Monorepo (Next.js app + supporting services)
- **Database**: Supabase PostgreSQL with SSR pattern
- **Payments**: Razorpay Standard Web Checkout (HMAC-SHA256 verification)
- **AI**: Vercel AI Gateway (multi-modal)
- **Hosting**: Vercel (auto-deploy from main branch)
- **Phase**: Phase 2 - Production Deployment (credential activation pending)

---

## 🏛️ SYSTEM ARCHITECTURE

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│  (React / TypeScript / Next.js Client Components)           │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────────────────────┐
│           VERCEL EDGE NETWORK (Deployment)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  NEXT.JS 16 APPLICATION SERVER (apps/platform)          ││
│  │                                                          ││
│  │  API Routes (Server Components):                        ││
│  │  ├─ POST /api/razorpay/create-order                     ││
│  │  ├─ POST /api/razorpay/verify-payment                   ││
│  │  ├─ GET  /api/health/*                                  ││
│  │  └─ POST /api/billing/webhook                           ││
│  │                                                          ││
│  │  Frontend Pages:                                        ││
│  │  ├─ / (homepage)                                        ││
│  │  ├─ /login (Supabase auth)                              ││
│  │  ├─ /register (Supabase auth)                           ││
│  │  ├─ /dashboard (authenticated)                          ││
│  │  ├─ /razorpay-demo (payment test)                       ││
│  │  └─ /reset-password (magic link)                        ││
│  │                                                          ││
│  │  Middleware:                                            ││
│  │  └─ Session refresh & auth state management             ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────┬─────────────┬─────────────┬────────────────┘
                 │             │             │
    ┌────────────▼──┐ ┌────────▼──┐ ┌──────▼─────┐
    │   SUPABASE    │ │ RAZORPAY  │ │  VERCEL    │
    │  PostgreSQL   │ │  API      │ │ AI Gateway │
    │   Auth + DB   │ │ Payment   │ │  (Multi)   │
    └───────────────┘ └───────────┘ └────────────┘
```

### Component Breakdown

#### Frontend Layer
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Custom CSS + glassmorphism panels
- **State Management**: React hooks + Supabase client
- **Build Tool**: turbo (monorepo)

#### Backend Layer
- **API Framework**: Next.js API routes
- **Authentication**: Supabase Auth (JWT)
- **Session Management**: Supabase SSR client + middleware
- **Payment Processing**: Razorpay API + HMAC-SHA256 verification
- **Logging**: Vercel Analytics + console logs

#### Data Layer
- **Database**: Supabase PostgreSQL
- **Connection Pool**: pgBouncer (3 connection types)
  - Pooler URL: for serverless functions
  - Direct URL: for migrations
  - Session URL: for persistent connections
- **Auth**: Supabase Auth service (JWT tokens)
- **Realtime**: Supabase Realtime subscriptions (configured)

#### Infrastructure Layer
- **Hosting**: Vercel (auto-deploys from main)
- **CDN**: Vercel Edge Network
- **CI/CD**: GitHub Actions (build, test, deploy)
- **Monitoring**: Vercel Analytics + logs
- **Secrets**: Vercel environment variables (encrypted)

---

## 🔌 EXTERNAL INTEGRATIONS

### 1. RAZORPAY PAYMENT INTEGRATION

#### Configuration
```
Live Mode: DISABLED (awaiting credentials)
Test Mode: ACTIVE
Test Key ID: rzp_test_TVRO90Zju7EZ01
Test Key Secret: [REDACTED]
```

#### Flow
```
1. User enters amount on /razorpay-demo
2. Frontend calls POST /api/razorpay/create-order
3. Backend creates order on Razorpay API
4. Backend returns order_id to frontend
5. Frontend opens Razorpay modal with order_id
6. User completes payment
7. Frontend receives success callback
8. Frontend calls POST /api/razorpay/verify-payment
9. Backend verifies HMAC-SHA256 signature
10. Backend returns payment status to frontend
11. Frontend displays success/error message
```

#### Security
- ✅ HMAC-SHA256 signature verification
- ✅ Timing-safe comparison (prevents timing attacks)
- ✅ No hardcoded secrets in code
- ✅ Server-side secret handling
- ✅ Input validation on all fields
- ✅ Error handling without data leakage

#### Files
- `apps/platform/src/app/api/razorpay/create-order/route.ts` (120 LOC)
- `apps/platform/src/app/api/razorpay/verify-payment/route.ts` (150 LOC)
- `apps/platform/src/components/razorpay/RazorpayCheckout.tsx` (185 LOC)
- `apps/platform/src/app/razorpay-demo/page.tsx` (184 LOC)

#### Environment Variables
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TVRO90Zju7EZ01
RAZORPAY_KEY_SECRET=[REDACTED]
```

---

### 2. SUPABASE INTEGRATION

#### Configuration
```
Project URL: https://eeuwkislidznpgdbvvbo.supabase.co
Region: ap-southeast-1 (Singapore)
Database Engine: PostgreSQL 15+
```

#### Features Configured
- ✅ Authentication (Email/Password + Magic Links)
- ✅ Realtime subscriptions
- ✅ Row-Level Security (RLS)
- ✅ Connection pooling (pgBouncer)
- ✅ Direct database access for migrations

#### Authentication Pattern (SSR)
```typescript
// Server Component (app/page.tsx)
import { createServerClient } from "@supabase/ssr";
const supabase = createServerClient(url, key, {
  cookies: {
    get(name) { return request.cookies.get(name)?.value },
    set(name, value, options) { response.cookies.set(name, value, options) },
    remove(name, options) { response.cookies.delete(name) }
  }
});
const { data: { session } } = await supabase.auth.getSession();
```

#### Authentication Pattern (Browser)
```typescript
// Client Component (use 'use client')
import { createBrowserClient } from "@supabase/ssr";
const supabase = createBrowserClient(url, key);
const { data: { session } } = await supabase.auth.getSession();
```

#### Middleware Pattern
```typescript
// middleware.ts - runs on every request
const supabase = createServerClient(url, key, { cookies });
const { data: { session } } = await supabase.auth.getSession();
// Refresh token if needed
const isValid = await supabase.auth.refreshSession();
// Continue with request
```

#### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED] (server-side only)
```

#### Files
- `apps/platform/src/utils/supabase/server.ts` (50 LOC)
- `apps/platform/src/utils/supabase/client.ts` (30 LOC)
- `apps/platform/src/utils/supabase/middleware.ts` (60 LOC)

---

### 3. VERCEL AI GATEWAY

#### Configuration
```
API Endpoint: https://api.vercel.ai/
API Key: [REDACTED]
Features Enabled:
  ✅ Text generation (Claude, GPT-4, Llama)
  ✅ Image generation (DALL-E, Stable Diffusion)
  ✅ Video generation (Runway)
  ✅ Realtime speech (OpenAI Realtime)
  ✅ Audio transcription (Whisper)
```

#### Integration Points
- Currently configured but not actively used in payment flow
- Ready for Phase 3 business intelligence features
- Can be invoked from API routes via SDK

#### Files
- Configuration stored in Vercel environment variables
- Can be accessed in API routes via `process.env.VERCEL_AI_GATEWAY_KEY`

---

## 📁 MONOREPO FILE STRUCTURE

```
kpihub-assembled/
├── apps/
│   ├── platform/                          # MAIN NEXT.JS APP
│   │   ├── public/                        # Static assets
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx            # Root layout
│   │   │   │   ├── page.tsx              # Homepage
│   │   │   │   ├── login/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── LoginForm.tsx
│   │   │   │   ├── register/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── reset-password/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── ResetPasswordForm.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── intelligence-hub/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── recommendation-engine/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── razorpay-demo/
│   │   │   │   │   └── page.tsx          # PAYMENT DEMO
│   │   │   │   ├── api/
│   │   │   │   │   ├── razorpay/
│   │   │   │   │   │   ├── create-order/
│   │   │   │   │   │   │   └── route.ts  # POST /api/razorpay/create-order
│   │   │   │   │   │   └── verify-payment/
│   │   │   │   │   │       └── route.ts  # POST /api/razorpay/verify-payment
│   │   │   │   │   ├── billing/
│   │   │   │   │   │   └── webhook/
│   │   │   │   │   │       └── route.ts  # POST /api/billing/webhook
│   │   │   │   │   ├── health/
│   │   │   │   │   │   ├── route.ts      # GET /api/health
│   │   │   │   │   │   ├── live/
│   │   │   │   │   │   │   └── route.ts  # K8s liveness probe
│   │   │   │   │   │   ├── ready/
│   │   │   │   │   │   │   └── route.ts  # K8s readiness probe
│   │   │   │   │   │   ├── status/
│   │   │   │   │   │   │   └── route.ts  # Status summary
│   │   │   │   │   │   └── detailed/
│   │   │   │   │   │       └── route.ts  # Full service check
│   │   │   │   │   └── auth/
│   │   │   │   │       └── callback/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── middleware.ts         # Session refresh
│   │   │   │   ├── globals.css           # Design system
│   │   │   │   └── error.tsx             # Error boundary
│   │   │   ├── components/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── AuthShell.tsx
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   └── ResetPasswordForm.tsx
│   │   │   │   ├── razorpay/
│   │   │   │   │   └── RazorpayCheckout.tsx  # PAYMENT COMPONENT
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── DecisionCard.tsx
│   │   │   │   └── ui/
│   │   │   │       └── [shared components]
│   │   │   ├── lib/
│   │   │   │   ├── intelligence/
│   │   │   │   │   ├── types.ts
│   │   │   │   │   ├── hub.ts
│   │   │   │   │   ├── scoring.ts
│   │   │   │   │   └── recommendations.ts
│   │   │   │   ├── utils/
│   │   │   │   │   └── [utility functions]
│   │   │   │   └── supabase/
│   │   │   │       ├── server.ts          # SERVER CLIENT
│   │   │   │       ├── client.ts          # BROWSER CLIENT
│   │   │   │       └── middleware.ts      # SESSION MANAGEMENT
│   │   │   └── styles/
│   │   │       └── [CSS modules]
│   │   ├── .env.example                  # Environment template
│   │   ├── .env.local                    # Local secrets (gitignored)
│   │   ├── .vercel/                      # Vercel config (gitignored)
│   │   ├── package.json                  # Dependencies
│   │   ├── tsconfig.json                 # TypeScript config
│   │   ├── next.config.ts                # Next.js config
│   │   └── middleware.ts                 # App middleware
│   ├── website/                          # Static website (Hostinger)
│   └── legacy-app/                       # Reference only
│
├── services/
│   └── pipeline/                         # Python pipeline service
│       └── pipeline.py
│
├── tools/
│   └── automated-website-builder/        # Build tooling
│
├── docs/                                 # Documentation
│   ├── PHASE-B-*.md
│   ├── PHASE-C-*.md
│   └── [architecture docs]
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                       # Build & test pipeline
│   │   └── deploy.yml                   # Deployment workflow
│   └── [GitHub config]
│
├── .gitignore                           # Git ignore rules
├── package.json                         # Root dependencies
├── turbo.json                           # Turbo config
├── MEMORY.md                            # Project history
├── HANDOFF.md                           # Next actions
├── ARCHITECTURE-CONTEXT.md              # THIS FILE
├── RAZORPAY-*.md                        # Payment docs (7 files, 4160+ lines)
└── README.md                            # Main readme
```

---

## 🔄 DATA FLOW DIAGRAMS

### Authentication Flow
```
User visits /login
        ↓
LoginForm collects email + password
        ↓
Calls: supabase.auth.signInWithPassword()
        ↓
Supabase validates credentials
        ↓
Returns: JWT token + session
        ↓
Middleware stores in httpOnly cookie
        ↓
Redirects to /dashboard
        ↓
Server Component checks session
        ↓
Renders authenticated dashboard
```

### Payment Flow (3-Step)
```
USER INITIATES PAYMENT
    ↓
1. Create Order
    Client: POST /api/razorpay/create-order { amount, currency }
    ↓
    Server: Validate amount (min ₹1)
    ↓
    Server: Call Razorpay API → create order
    ↓
    Server: Return order_id to client
    
2. Open Modal & Collect Payment
    Client: Open Razorpay modal with order_id
    ↓
    User: Enters card details in modal
    ↓
    Razorpay: Processes payment
    ↓
    Modal: Returns payment_id on success
    
3. Verify Signature
    Client: POST /api/razorpay/verify-payment 
            { order_id, payment_id, signature }
    ↓
    Server: Calculate HMAC-SHA256(order_id + "|" + payment_id)
    ↓
    Server: Compare with provided signature
    ↓
    Server: If match → ✅ Valid
            If no match → ❌ Invalid (potential fraud)
    ↓
    Server: Return { valid: true/false, message }
    ↓
    Client: Display success/error message
```

### Database Query Flow
```
Client (React) 
    ↓
Server Component or API Route
    ↓
createServerClient(url, key, { cookies })
    ↓
Supabase Client (connects via pooler URL)
    ↓
pgBouncer Connection Pool
    ↓
PostgreSQL Database
    ↓
Return results
    ↓
Format response
    ↓
Send to client
```

---

## 🔐 ENVIRONMENT VARIABLES

### Production (Vercel)

**Public Variables** (accessible in browser):
```
NEXT_PUBLIC_APP_URL=https://kpihub-platform.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[browser-safe key, not secret]
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TVRO90Zju7EZ01 (or rzp_live_*)
```

**Secret Variables** (server-side only):
```
RAZORPAY_KEY_SECRET=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED] (for privileged operations)
STRIPE_SECRET_KEY=[not yet configured]
STRIPE_WEBHOOK_SECRET=[not yet configured]
VERCEL_AI_GATEWAY_KEY=[REDACTED]
```

### Local Development (.env.local)
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dev key]
RAZORPAY_KEY_SECRET=[test secret]
SUPABASE_SERVICE_ROLE_KEY=[dev service key]
```

### GitHub Secrets (for CI/CD)
```
RAZORPAY_LIVE_KEY_ID=rzp_live_*
RAZORPAY_LIVE_KEY_SECRET=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
VERCEL_TOKEN=[auth token]
```

---

## 🚀 DEPLOYMENT PIPELINE

### GitHub Actions Workflow

**Trigger**: Push to `main` or `claude/kpihub-repo-assembly-y1i0kv`

**Steps**:
```yaml
1. Checkout code
   └─ Fetches latest from GitHub

2. Install dependencies
   └─ npm ci (clean install)

3. Run typecheck
   └─ tsc --noEmit (TypeScript verification)

4. Build application
   └─ npm run build
   └─ Compiles Next.js, verifies routes

5. Run security checks
   └─ CodeQL analysis
   └─ Secret scanning
   └─ Dependency audit

6. Deploy to Vercel
   └─ Automatic if all checks pass
   └─ Deployed to: kpihub-platform.vercel.app

7. Smoke tests
   └─ GET /api/health → HTTP 200
   └─ GET / → HTTP 200
   └─ GET /razorpay-demo → HTTP 200
```

### Vercel Deployment

**Project**: platform (https://vercel.com/hs-debugs/kpihub-assembled)  
**Auto-Deploy**: Enabled on main branch  
**Environment**: Production (auto)  
**Duration**: ~2-3 minutes per deployment

**What Happens**:
1. GitHub webhook triggers Vercel
2. Vercel pulls latest code from main
3. Installs dependencies
4. Builds Next.js app
5. Deploys to Edge Network
6. CDN caches static assets
7. API routes ready to handle requests

---

## 📊 CURRENT DEPLOYMENT STATUS

### ✅ What's Live

| Component | Status | URL | Details |
|-----------|--------|-----|---------|
| **Homepage** | ✅ LIVE | https://kpihub-platform.vercel.app | Marketing page |
| **Login** | ✅ LIVE | /login | Supabase auth working |
| **Register** | ✅ LIVE | /register | Supabase signup working |
| **Dashboard** | ✅ LIVE | /dashboard (protected) | Shows user profile |
| **Payment Demo** | ✅ LIVE | /razorpay-demo | Test mode operational |
| **Health Checks** | ✅ LIVE | /api/health/* | 5 endpoints |
| **Order Creation** | ✅ LIVE | /api/razorpay/create-order | Creates orders |
| **Payment Verify** | ✅ LIVE | /api/razorpay/verify-payment | Verifies signatures |

### ⏳ What's Pending

| Component | Status | Action | Timeline |
|-----------|--------|--------|----------|
| **Live Payments** | 🔴 BLOCKED | Get live Razorpay creds | Today (30 min) |
| **Webhooks** | ⏳ READY | Activate in Razorpay | Phase 2 (5 min) |
| **Subscriptions** | ⏳ READY | Build database schema | Phase 3 (Week 2) |
| **Email Notifications** | ⏳ READY | Set up Resend/SendGrid | Phase 3 (Week 3) |
| **Monitoring Dashboards** | ⏳ READY | Configure Sentry | Phase 4 (Week 5) |

---

## 🔧 TECHNICAL DETAILS

### API Endpoints

#### Razorpay Endpoints

**POST /api/razorpay/create-order**
```
Request:
{
  "amount": 10000,           // In paise (₹100)
  "currency": "INR",
  "receipt": "receipt-001",
  "description": "KPI Hub Subscription"
}

Response (Success):
{
  "success": true,
  "order_id": "order_XXXXXXX",
  "message": "Order created"
}

Response (Error):
{
  "success": false,
  "message": "Amount must be at least ₹1",
  "error": "VALIDATION_ERROR"
}
```

**POST /api/razorpay/verify-payment**
```
Request:
{
  "order_id": "order_XXXXXXX",
  "payment_id": "pay_XXXXXXX",
  "signature": "HMAC_SIGNATURE"
}

Response (Valid):
{
  "success": true,
  "verified": true,
  "message": "Payment verified successfully"
}

Response (Invalid):
{
  "success": false,
  "verified": false,
  "message": "Payment verification failed"
}
```

#### Health Check Endpoints

**GET /api/health** - Simple liveness
```
Response: { "status": "healthy" }
```

**GET /api/health/live** - Kubernetes liveness probe
```
Response: { "status": "ok" }
```

**GET /api/health/ready** - Kubernetes readiness probe
```
Response: { "ready": true }
```

**GET /api/health/status** - Status summary
```
Response: {
  "status": "operational",
  "timestamp": "2026-08-29T...",
  "uptime": 3600,
  "services": { "database": "ok", "auth": "ok" }
}
```

**GET /api/health/detailed** - Full service check
```
Response: {
  "status": "operational",
  "services": {
    "supabase": { "status": "connected", "latency": 45 },
    "razorpay": { "status": "available", "latency": 200 },
    "vercel_ai": { "status": "available", "latency": 150 }
  },
  "metrics": {
    "memory_used_mb": 120,
    "cpu_usage_percent": 15,
    "uptime_seconds": 3600
  }
}
```

### Database Schema (Supabase)

#### Current Tables
- `auth.users` (Supabase managed)
- `public.user_profiles` (custom)
- `public.subscriptions` (Phase 3)
- `public.payments` (Phase 3)
- `public.refunds` (Phase 3)

#### Planned Migrations
```sql
-- Phase 3: Subscription table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  plan_id VARCHAR(50),
  status VARCHAR(20), -- active, cancelled, paused
  amount_inr DECIMAL(10,2),
  amount_usd DECIMAL(10,2),
  razorpay_subscription_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: Payment logs table
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY,
  order_id VARCHAR(100),
  payment_id VARCHAR(100),
  user_id UUID REFERENCES auth.users,
  amount_inr DECIMAL(10,2),
  status VARCHAR(20),
  verification_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: Refunds table
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY,
  payment_id VARCHAR(100),
  razorpay_refund_id VARCHAR(100),
  amount_inr DECIMAL(10,2),
  status VARCHAR(20),
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 SECURITY ARCHITECTURE

### Authentication
- **Method**: JWT tokens (Supabase Auth)
- **Storage**: httpOnly cookies (secure)
- **Refresh**: Automatic via middleware
- **Protection**: CSRF tokens via form actions

### Authorization
- **Public Routes**: /, /login, /register, /razorpay-demo, /api/health/*
- **Protected Routes**: /dashboard, /dashboard/*, requires valid session
- **Admin Routes**: Not yet implemented

### Secrets Management
- **Storage**: Vercel environment variables (encrypted at rest)
- **Access**: Only in server-side code
- **Rotation**: Manual process (documented)
- **Scanning**: GitHub push protection enabled

### Payment Security
- **Signature Verification**: HMAC-SHA256 (mandatory)
- **Timing Attack Prevention**: Timing-safe comparison
- **Amount Validation**: Server-side only
- **Rate Limiting**: Configured (50 requests/minute per IP)

### HTTPS & Transport
- **Protocol**: HTTPS enforced (Vercel)
- **TLS Version**: 1.2+
- **Certificates**: Auto-managed by Vercel

---

## 📈 PERFORMANCE METRICS (Targets)

### API Response Times
- Payment order creation: < 2 seconds
- Payment verification: < 1 second
- Supabase queries: < 500ms
- Razorpay API calls: < 3 seconds

### Frontend Performance
- Initial page load: < 3 seconds
- Payment modal load: < 1 second
- Dashboard render: < 2 seconds

### Infrastructure
- Vercel Edge latency: < 50ms (avg)
- Database connection pool: 10-20 concurrent
- Uptime target: 99.9%

---

## 📚 DOCUMENTATION STRUCTURE

```
Project Documentation Files:
├── ARCHITECTURE-CONTEXT.md          ← YOU ARE HERE
├── MEMORY.md                        ← Project history & status
├── HANDOFF.md                       ← Next immediate actions
├── RAZORPAY-INTEGRATION-GUIDE.md    ← Deep dive on payment system
├── RAZORPAY-SETUP-COMPLETE.md       ← Quick reference
├── RAZORPAY-PRODUCTION-DEPLOYMENT.md ← Deployment procedures
├── RAZORPAY-BUSINESS-INTEGRATION.md ← Phase 3 planning
├── RAZORPAY-MONITORING-ANALYTICS.md ← Phase 4 planning
├── RAZORPAY-IMPLEMENTATION-ROADMAP.md ← 4-phase timeline
├── RAZORPAY-COMPLETE-SUMMARY.md     ← Executive overview
└── DEPLOYMENT-REPORT-2026-08-29.md  ← Latest deployment report
```

### Quick Reference
- **Starting Point**: HANDOFF.md (immediate actions)
- **Understanding Code**: RAZORPAY-INTEGRATION-GUIDE.md (architecture)
- **Deploying Changes**: RAZORPAY-PRODUCTION-DEPLOYMENT.md (procedures)
- **Project History**: MEMORY.md (complete context)
- **Phase Planning**: RAZORPAY-IMPLEMENTATION-ROADMAP.md (timeline)

---

## 🎯 CURRENT PHASE & NEXT STEPS

### Phase 2: Production Deployment (Active Now)

**Status**: ✅ Code deployed, ⏳ credentials pending

**Actions**:
1. ✅ Code merged to main
2. ✅ Deployed to Vercel
3. ⏳ Obtain live Razorpay credentials (30 minutes)
4. ⏳ Update Vercel env vars (10 minutes)
5. ⏳ Update GitHub secrets (5 minutes)
6. ⏳ Re-deploy with live creds (5 minutes)
7. ⏳ Test live payment flow (10 minutes)

**Timeline**: Today → +65 minutes to activate live payments

### Phase 3: Business Integration (Starts Week 2)

**Focus**: Database schema + subscriptions + webhooks

**Deliverables**:
- Subscription table design
- Subscription plan definitions
- Webhook event processor
- Refund handling logic
- Email notifications

**Timeline**: 2-3 weeks

### Phase 4: Monitoring & Optimization (Starts Week 5)

**Focus**: Dashboards + alerts + analytics

**Deliverables**:
- Real-time metrics dashboards
- Alert configuration
- Business intelligence queries
- Performance optimization

**Timeline**: Ongoing

---

## 🛠️ DEVELOPMENT SETUP

### Prerequisites
```bash
Node.js: v18+
npm: v9+
Git: latest
PostgreSQL: 15+ (Supabase provides)
```

### Clone & Setup
```bash
# Clone repository
git clone https://github.com/hsharmagxi-debug/kpihub-assembled.git
cd kpihub-assembled

# Install dependencies
npm install
cd apps/platform && npm install

# Create .env.local (copy from .env.example)
cp .env.example .env.local
# Edit with your Supabase keys

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Running Tests
```bash
# Typecheck
npm run typecheck

# Build
npm run build

# Run dev server
npm run dev
```

### Debugging
```
Browser DevTools:
- F12 → Console → Check for errors
- F12 → Network → Inspect API calls

Vercel Logs:
- https://vercel.com/hs-debugs/kpihub-assembled/logs

GitHub Actions:
- https://github.com/hsharmagxi-debug/kpihub-assembled/actions
```

---

## 📞 QUICK REFERENCE

### Important URLs
- **Live Demo**: https://kpihub-platform.vercel.app/razorpay-demo
- **GitHub Repo**: https://github.com/hsharmagxi-debug/kpihub-assembled
- **Vercel Dashboard**: https://vercel.com/hs-debugs/kpihub-assembled
- **Razorpay Dashboard**: https://dashboard.razorpay.com
- **Supabase Console**: https://app.supabase.com

### Key Contacts
- **Razorpay Support**: https://dashboard.razorpay.com → Help
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs

### Troubleshooting
- **Build fails**: Check GitHub Actions logs
- **Deploy fails**: Check Vercel deployment logs
- **Payment fails**: Check Razorpay dashboard
- **Auth fails**: Check Supabase Auth settings
- **DB connection fails**: Verify pooler URL in .env

---

## 📋 CHECKLIST FOR NEW SESSIONS

When starting a new Claude Code session, verify:

- [ ] Git branch is correct: `claude/kpihub-repo-assembly-y1i0kv`
- [ ] Latest commit is e54ecf8+ (PR #4 merged)
- [ ] All documentation files present (RAZORPAY-*.md)
- [ ] MEMORY.md exists with complete history
- [ ] HANDOFF.md exists with current actions
- [ ] .env.local configured with Supabase keys
- [ ] `npm install` completed without errors
- [ ] `npm run typecheck` passes
- [ ] `npm run build` completes successfully
- [ ] `npm run dev` starts server on http://localhost:3000
- [ ] `/razorpay-demo` page loads in browser
- [ ] Test card payment shows success message

---

**Document Version**: 1.0  
**Created**: 2026-08-29  
**Scope**: Complete system overview for Claude Code sessions  
**Status**: Production Phase 2 - Credential Activation Pending

---

**Next**: Read HANDOFF.md for immediate actions.  
**Questions**: Refer to specific RAZORPAY-*.md guides.  
**History**: See MEMORY.md for complete project context.
