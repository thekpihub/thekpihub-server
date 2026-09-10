# 🔒 PRIVATE FILES SETUP GUIDE
**Status:** Complete Setup Instructions for All Gitignored Secrets  
**Date:** 2026-09-05  
**Security Level:** CRITICAL - Never commit these files  

---

## ⚠️ SECURITY RULES (MANDATORY)

```
❌ NEVER: Commit .env.local to Git
❌ NEVER: Commit .htaccess to Git
❌ NEVER: Paste secrets in Slack/Email
❌ NEVER: Share credentials via chat
❌ NEVER: Hardcode secrets in code

✅ ALWAYS: Use .gitignore to exclude
✅ ALWAYS: Store locally in password manager
✅ ALWAYS: Use Vercel secrets for production
✅ ALWAYS: Use GitHub secrets for CI/CD
✅ ALWAYS: Rotate keys quarterly
```

---

## 📋 RECOMMENDED BUILD SEQUENCE

### Phase 1: Local Development (Days 1-2)
1. ✅ `.env.local` - Platform app development
2. ✅ `.env.local` - Website app development (if needed)
3. ✅ Password manager entry creation
4. ✅ Verify all keys work locally

### Phase 2: Deployment Infrastructure (Days 3-4)
5. ✅ Vercel environment variables (platform)
6. ✅ GitHub repository secrets (CI/CD)
7. ✅ .htaccess on production server
8. ✅ Verify all endpoints respond

### Phase 3: Production Configuration (Days 5-7)
9. ✅ Stripe live credentials (when launching)
10. ✅ Razorpay live credentials (when ready)
11. ✅ Webhook secrets
12. ✅ Final verification

---

## 🔐 FILE 1: `.env.local` (Platform App)

**Location:** `/apps/platform/.env.local`  
**Gitignored:** YES (Line 2 of .gitignore: `.env.*`)  
**Access:** Local development only  
**Type:** Shell environment variables  

### Template & Setup Instructions

```bash
# =============================================================================
# SUPABASE CONFIGURATION (Development/Test)
# =============================================================================
# Source: Supabase Dashboard → Project Settings → API
# URL Format: https://[PROJECT-ID].supabase.co
# Keys: Found in Project Settings → API → Reveal Keys

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Public Supabase Credentials (SAFE - can be public)
NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldXdraXNsaWR6bnBnZGJ2dmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTI5MTUzNTAsImV4cCI6MTk5ODQ5MTM1MH0.TkNKWGJFYmdXVkVNUkxObzdhOFV6NDJVL0phRUtqMmk

# Private Supabase Credentials (NEVER COMMIT - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldXdraXNsaWR6bnBnZGJ2dmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MjkxNTM1MCwiZXhwIjoxOTk4NDkxMzUwfQ.AyG_Fho0gplXzVmAR2gJkM_fFn1RqfxVU80gLXuVPas
SUPABASE_PUBLISHABLE_KEY=sb_publishable_gGBxpcGlteGAZ9tLShw1tg_U5YwzT7e
SUPABASE_SECRET_KEY=sb_secret__S0vk
SUPABASE_JWKS_URL=https://eeuwkislidznpgdbvvbo.supabase.co/auth/v1/.well-known/jwks.json

# =============================================================================
# DATABASE CONFIGURATION (Prisma ORM)
# =============================================================================
# Connection pooler URL (for API routes + serverless)
# Direct URL (for migrations + batch operations)
# Source: Supabase → Project Settings → Database → Connection String

DATABASE_URL=postgresql://postgres.eeuwkislidznpgdbvvbo:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:password@db.eeuwkislidznpgdbvvbo.supabase.co:5432/postgres

# =============================================================================
# RAZORPAY CONFIGURATION (Test Mode)
# =============================================================================
# Source: Razorpay Dashboard → Settings → API Keys → Test Keys
# Key ID: Starts with rzp_test_ (for test mode) or rzp_live_ (production)
# Key Secret: Long alphanumeric string, NEVER share

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TVRO90Zju7EZ01
RAZORPAY_KEY_SECRET=71v7yj6qxuMP5UUiMHW5C8as

# =============================================================================
# VERCEL AI GATEWAY CONFIGURATION
# =============================================================================
# Source: Vercel Dashboard → AI Gateway
# Format: vck_... (Vercel Created Key)
# Features: Text generation, image generation, video, realtime speech, audio

AI_GATEWAY_API_KEY=vck_5eIlOHEt6CfP39CLHBRReONwHJY1tsSLK7vZo4u3oJ0z4UasF73N4Hst

# =============================================================================
# ANTHROPIC API CONFIGURATION (Claude)
# =============================================================================
# Source: Anthropic Console → API Keys
# Format: sk-ant-... (Anthropic created)
# Usage: For Claude API calls (optional, if using direct API)

ANTHROPIC_API_KEY=sk-ant-example

# =============================================================================
# STRIPE CONFIGURATION (COMMENTED OUT - Not yet in use)
# =============================================================================
# Source: Stripe Dashboard → Developers → API Keys
# Key ID format: sk_test_... (test) or sk_live_... (production)
# When launching subscriptions, uncomment and fill in:

# STRIPE_SECRET_KEY=sk_test_replace_me
# STRIPE_WEBHOOK_SECRET=whsec_replace_me
# STRIPE_PRICE_STARTER=price_starter_replace_me
# STRIPE_PRICE_GROWTH=price_growth_replace_me
# STRIPE_PRICE_ENTERPRISE=price_enterprise_replace_me

# =============================================================================
# OTHER API KEYS (Development/Testing)
# =============================================================================

OPENROUTER_API_KEY=sk-or-example
WINGMAN_API_URL=https://agent-backend.example.com
WINGMAN_URL=https://agent.example.com
HANDOFF_SECRET=example-secret
```

### Setup Steps

1. **Copy template:** `cp apps/platform/.env.example apps/platform/.env.local`
2. **Get Supabase credentials:**
   - Visit: https://app.supabase.com
   - Select project: kpihub-assembled
   - Settings → API → Copy URL and Anon Key
   - Copy Service Role Key (KEEP PRIVATE)
3. **Get Razorpay credentials:**
   - Visit: https://dashboard.razorpay.com
   - Settings → API Keys
   - Copy Test Key ID and Test Key Secret
4. **Get Vercel AI Gateway key:**
   - Visit: https://vercel.com/dashboard
   - AI Gateway → Create API Key
   - Copy vck_... key
5. **Verify locally:**
   ```bash
   npm run dev
   # Navigate to /razorpay-demo
   # Test payment with card: 4111 1111 1111 1111
   ```
6. **Store in password manager:**
   - Entry name: "KPI Hub - Development"
   - Save all keys with source/purpose
   - Set to expire quarterly for rotation

---

## 🔐 FILE 2: `.env.local` (Website App)

**Location:** `/apps/website/.env.local`  
**Gitignored:** YES  
**Access:** Local development only  
**Type:** Static HTML (usually doesn't need .env)  

### Template & Setup Instructions

**Note:** Website app typically uses `config.js` for public credentials. Only create `.env.local` if website has backend/PHP processing.

```bash
# =============================================================================
# WEBSITE APP ENVIRONMENT VARIABLES (if backend processing)
# =============================================================================
# Website typically uses static config.js for public keys
# Only needed if website has PHP backend or Node.js middleware

# =============================================================================
# SUPABASE (if website has auth processing)
# =============================================================================
SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================================
# STRIPE WEBHOOK PROCESSING (if website processes payments)
# =============================================================================
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe dashboard)
```

### Setup Steps

1. Typically not needed (website uses `config.js`)
2. Only create if website backend requires secrets
3. Follow same guidelines as platform `.env.local`

---

## 🔐 FILE 3: `.htaccess` (Production Server)

**Location:** `/htdocs/.htaccess` on Hostinger  
**Gitignored:** YES (via .deploy-exclude)  
**Access:** Production server only  
**Type:** Apache configuration with SetEnv directives  

### Template & Setup Instructions

```apache
# =============================================================================
# THE KPI HUB - PRODUCTION CONFIGURATION
# =============================================================================
# Location: /home/u117990013/public_html/.htaccess on Hostinger
# Access: SSH to u117990013@thekpihub.com
# 
# NOTE: This file is NEVER included in Git pushes
# The deploy script (.github/workflows/deploy-hostinger.yml) has:
#   .deploy-exclude entry that protects this file from deletion

<IfModule mod_php.c>
    # =============================================================================
    # SUPABASE - Production Credentials
    # =============================================================================
    SetEnv SUPABASE_URL "https://eeuwkislidznpgdbvvbo.supabase.co"
    SetEnv SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldXdraXNsaWR6bnBnZGJ2dmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MjkxNTM1MCwiZXhwIjoxOTk4NDkxMzUwfQ.AyG_Fho0gplXzVmAR2gJkM_fFn1RqfxVU80gLXuVPas"
    
    # =============================================================================
    # RAZORPAY - Production Credentials (when live keys obtained)
    # =============================================================================
    # CURRENTLY TEST MODE - Replace with live keys when ready
    SetEnv RAZORPAY_KEY_ID "rzp_test_TVRO90Zju7EZ01"
    SetEnv RAZORPAY_KEY_SECRET "71v7yj6qxuMP5UUiMHW5C8as"
    
    # =============================================================================
    # STRIPE - Production Credentials (when launching subscriptions)
    # =============================================================================
    SetEnv STRIPE_SECRET_KEY "sk_live_YOUR_LIVE_KEY"
    SetEnv STRIPE_WEBHOOK_SECRET "whsec_YOUR_WEBHOOK_SECRET"
    
    # =============================================================================
    # HANDOFF SECRET - For internal API authentication
    # =============================================================================
    SetEnv HANDOFF_SECRET "your-production-handoff-secret"
    
    # =============================================================================
    # ANTHROPIC API - For Claude integration
    # =============================================================================
    SetEnv ANTHROPIC_API_KEY "sk-ant-YOUR_LIVE_KEY"
    
    # =============================================================================
    # VERCEL AI GATEWAY - For AI features
    # =============================================================================
    SetEnv AI_GATEWAY_API_KEY "vck_YOUR_PRODUCTION_KEY"
</IfModule>

# =============================================================================
# SECURITY HEADERS
# =============================================================================
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header always set X-Frame-Options "SAMEORIGIN"
    
    # Enable XSS protection
    Header always set X-XSS-Protection "1; mode=block"
    
    # Prevent MIME sniffing
    Header always set X-Content-Type-Options "nosniff"
    
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net unpkg.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com"
</IfModule>

# =============================================================================
# HTTPS REDIRECT
# =============================================================================
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# =============================================================================
# CACHE CONTROL
# =============================================================================
<IfModule mod_headers.c>
    # Cache static assets for 30 days
    <FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=2592000, public"
    </FilesMatch>
    
    # Don't cache HTML files
    <FilesMatch "\.(html|htm|php)$">
        Header set Cache-Control "max-age=3600, must-revalidate"
    </FilesMatch>
</IfModule>
```

### Setup Steps

1. **SSH to production server:**
   ```bash
   ssh u117990013@thekpihub.com
   ```

2. **Edit .htaccess:**
   ```bash
   cd public_html
   nano .htaccess
   ```

3. **Add SetEnv directives** from template above

4. **Fill in real credentials:**
   - Supabase Service Role Key (from Supabase dashboard)
   - Razorpay Key Secret (from Razorpay dashboard)
   - Stripe Secret Key (when launching)
   - All other API keys

5. **Verify syntax:**
   - Test: `php -l .htaccess` should return no errors
   - Or access website and check for 500 errors

6. **Backup locally:**
   - Keep a copy in password manager
   - Never commit to Git

7. **Add to .deploy-exclude:**
   - Ensure line in deploy workflow protects this file

---

## 🔐 FILE 4: `config.js` (Website - PUBLIC VERSION)

**Location:** `/apps/website/config.js`  
**Gitignored:** NO (exception added: `!apps/website/config.js`)  
**Access:** Public (safe, contains only public API keys)  
**Type:** JavaScript configuration  

### Template & Setup Instructions

```javascript
// =============================================================================
// THE KPI HUB - PUBLIC CONFIGURATION (SAFE TO COMMIT)
// =============================================================================
// This file contains ONLY public API credentials
// - Supabase anon key (public)
// - Stripe publishable key (public)
// - Application URLs (public)
// 
// NEVER include:
// - Service role keys
// - Secret API keys
// - Webhook secrets
// - Private credentials

const CONFIG = Object.freeze({
  supabase: Object.freeze({
    // Source: Supabase Dashboard → Settings → API → Anon Key
    // Safe to expose to frontend
    url: 'https://eeuwkislidznpgdbvvbo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldXdraXNsaWR6bnBnZGJ2dmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTI5MTUzNTAsImV4cCI6MTk5ODQ5MTM1MH0.TkNKWGJFYmdXVkVNUkxObzdhOFV6NDJVL0phRUtqMmk'
  }),
  
  stripe: Object.freeze({
    // Source: Stripe Dashboard → Developers → API Keys → Publishable Key
    // Format: pk_test_... (test) or pk_live_... (production)
    // Safe to expose to frontend
    publishableKey: 'pk_live_YOUR_STRIPE_PUBLISHABLE_KEY',
    
    // Price IDs for subscription plans
    // Source: Stripe Dashboard → Product Catalog → Copy Price IDs
    prices: Object.freeze({
      starter: 'price_YOUR_STARTER_PRICE_ID',
      growth: 'price_YOUR_GROWTH_PRICE_ID',
      enterprise: 'price_YOUR_ENTERPRISE_PRICE_ID'
    })
  }),
  
  app: Object.freeze({
    // Application URLs
    url: 'https://thekpihub.com',
    loginUrl: '/login.html',
    upgradeUrl: '/upgrade.html',
    dashboardUrl: '/dashboard.html'
  })
});
```

### Setup Steps

1. **Use .env.local values:**
   ```bash
   # From apps/platform/.env.local:
   NEXT_PUBLIC_SUPABASE_URL → config.js: supabase.url
   NEXT_PUBLIC_SUPABASE_ANON_KEY → config.js: supabase.anonKey
   ```

2. **Get Stripe publishable key:**
   - Visit: https://dashboard.stripe.com/apikeys
   - Copy "Publishable key"
   - Format: pk_test_... or pk_live_...

3. **Get Stripe price IDs:**
   - Visit: https://dashboard.stripe.com/products
   - For each product, copy the price ID
   - Format: price_...

4. **Create config.js:**
   ```bash
   cp apps/website/config.example.js apps/website/config.js
   # Fill in real values
   ```

5. **Verify:**
   - Test registration at https://thekpihub.com/register.html
   - Check browser console (F12) for errors
   - Verify Supabase connection works

6. **Commit to Git:**
   ```bash
   git add apps/website/config.js
   git commit -m "config: Update website configuration"
   git push
   ```

---

## 🔐 FILE 5: `.env` Files (Other Apps)

**Location:** Various apps in monorepo  
**Gitignored:** YES (global .env.* rule)  
**Access:** Local development only  

### Directory

```
apps/platform/.env.local          ← PRIMARY (documented above)
apps/website/.env.local           ← Optional (usually not needed)
apps/legacy-app/.env.local        ← (if exists, follow platform pattern)
apps/wingcommander-reference/.env.local ← (if exists, follow platform pattern)
```

### Setup Steps

1. For each app, check if `.env.example` exists
2. If yes, copy to `.env.local`
3. Fill in credentials specific to that app
4. Verify: `npm run dev` in that app directory works

---

## 🔐 FILE 6: GitHub Repository Secrets

**Location:** GitHub repo settings  
**URL:** https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions  
**Access:** CI/CD workflows only  
**Type:** Encrypted environment variables  

### Required Secrets for Deployment

```bash
# For Razorpay (when switching to live mode)
RAZORPAY_LIVE_KEY_ID = rzp_live_XXXXXXXXX
RAZORPAY_LIVE_KEY_SECRET = your_live_secret

# For Stripe (when launching)
STRIPE_SECRET_KEY = sk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET = whsec_YOUR_SECRET

# For Vercel (if deploying via GitHub Actions)
VERCEL_TOKEN = your_vercel_token
VERCEL_PROJECT_ID = prj_YOUR_PROJECT_ID

# For Anthropic API (if using in CI/CD)
ANTHROPIC_API_KEY = sk-ant-YOUR_KEY

# For Email/Notifications (if needed)
SENDGRID_API_KEY = SG.YOUR_KEY
```

### Setup Steps

1. **Open GitHub repository:**
   - URL: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions

2. **Create new secret:**
   - Click "New repository secret"
   - Name: (e.g., RAZORPAY_LIVE_KEY_ID)
   - Value: (paste the actual key)
   - Click "Add secret"

3. **Verify in workflow:**
   - Check `.github/workflows/deploy-hostinger.yml`
   - Should reference secrets as: `${{ secrets.RAZORPAY_LIVE_KEY_ID }}`

4. **Never display secrets:**
   - GitHub masks secrets in logs
   - Cannot view after creation
   - Must delete and recreate to update

---

## 🔐 FILE 7: Vercel Environment Variables

**Location:** Vercel project settings  
**URL:** https://vercel.com/hs-debugs/kpihub-assembled/settings/environment-variables  
**Access:** Deployment environment  
**Type:** Encrypted environment variables  

### Required Variables

```
Environment: Production

NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_TVRO90Zju7EZ01 (or rzp_live_... when ready)
RAZORPAY_KEY_SECRET = (secret key from Razorpay dashboard)

NEXT_PUBLIC_SUPABASE_URL = https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = (anon key from Supabase)
SUPABASE_SERVICE_ROLE_KEY = (service role key - production only)

AI_GATEWAY_API_KEY = (Vercel AI Gateway key)
ANTHROPIC_API_KEY = (Claude API key if using)
```

### Setup Steps

1. **Open Vercel project:**
   - URL: https://vercel.com/hs-debugs/kpihub-assembled/settings/environment-variables

2. **Add variable:**
   - Click "Add New"
   - Name: NEXT_PUBLIC_RAZORPAY_KEY_ID
   - Value: rzp_test_TVRO90Zju7EZ01
   - Environment: Production
   - Click "Save"

3. **Repeat for all required vars**

4. **Trigger redeploy:**
   - After adding vars, Vercel auto-redeploys
   - Or manually: git push to main

5. **Verify:**
   - Check deployment logs
   - No errors about missing env vars
   - `/razorpay-demo` loads Razorpay button

---

## 🔐 FILE 8: Password Manager Entry

**Location:** Your password manager (1Password, LastPass, Bitwarden, etc.)  
**Access:** Local only  
**Type:** Encrypted credentials storage  

### Entry Structure

```
Entry Name: "KPI Hub - Development"
URL: https://github.com/hsharmagxi-debug/kpihub-assembled

Fields:
├── Supabase URL
│   └── https://eeuwkislidznpgdbvvbo.supabase.co
├── Supabase Anon Key
│   └── eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
├── Supabase Service Role Key
│   └── eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
├── Razorpay Test Key ID
│   └── rzp_test_TVRO90Zju7EZ01
├── Razorpay Test Key Secret
│   └── 71v7yj6qxuMP5UUiMHW5C8as
├── Vercel AI Gateway Key
│   └── vck_5eIlOHEt6CfP39CLHBRReONwHJY1tsSLK7vZo4u3oJ0z4UasF73N4Hst
├── Anthropic API Key
│   └── sk-ant-example
└── Notes:
    ├── Updated: 2026-09-05
    ├── Status: Test mode (all keys are test keys)
    ├── Rotation: Quarterly
    └── Access: Development team only

Entry Name: "KPI Hub - Production"
URL: https://thekpihub.com

Fields:
├── Razorpay Live Key ID
│   └── (not yet obtained)
├── Razorpay Live Key Secret
│   └── (not yet obtained)
├── Stripe Live Secret Key
│   └── (not yet obtained)
├── SSH Credentials
│   └── u117990013@thekpihub.com
├── Hostinger .htaccess Content
│   └── (saved encrypted)
└── Notes:
    ├── Updated: (when credentials obtained)
    ├── Status: Ready for activation
    └── Rotation: Quarterly
```

### Setup Steps

1. **Create entry in password manager**
2. **Add all development credentials**
3. **Add source/purpose for each key**
4. **Set expiration reminder** for quarterly rotation
5. **Share with team** (if applicable) via password manager
6. **NEVER share** via email/chat/Git

---

## ✅ VERIFICATION CHECKLIST

### Before Starting Development

- [ ] `.env.local` created in `apps/platform/`
- [ ] All Supabase keys filled in
- [ ] All Razorpay test keys filled in
- [ ] Vercel AI Gateway key added
- [ ] `npm run dev` starts without env var errors
- [ ] Can navigate to `/razorpay-demo` without 404
- [ ] Supabase auth working (can test login)
- [ ] Password manager entry created

### Before Production Deployment

- [ ] `config.js` created in `apps/website/`
- [ ] Supabase anon key in config.js matches `.env.local`
- [ ] `.htaccess` created on Hostinger server
- [ ] All SetEnv directives added to `.htaccess`
- [ ] GitHub Actions secrets configured
- [ ] Vercel environment variables configured
- [ ] Registration page accessible and working
- [ ] Razorpay demo page functional

### Before Going Live with Payments

- [ ] Live Razorpay credentials obtained
- [ ] Live credentials added to: GitHub secrets + Vercel + .htaccess
- [ ] Deployment updated with live keys
- [ ] Test payment completed successfully
- [ ] Payment visible in Razorpay dashboard
- [ ] Webhook secrets configured (if using)

---

## 🔄 ROTATION & UPDATES

### Quarterly Key Rotation

1. **Generate new keys** in respective dashboards
2. **Update .env.local** locally
3. **Update GitHub secrets** with new values
4. **Update Vercel env vars** with new values
5. **Update .htaccess** on production server
6. **Test thoroughly** before rotation completes
7. **Revoke old keys** in dashboards
8. **Update password manager** entry

### When a Key is Compromised

1. **Immediately revoke** in respective dashboard
2. **Generate new key**
3. **Update all locations:**
   - .env.local
   - GitHub secrets
   - Vercel env vars
   - .htaccess
   - Password manager
4. **Test immediately**
5. **Document** the incident
6. **Notify team** of rotation

---

## 📞 TROUBLESHOOTING

### "Invalid API key" Error

**Cause:** Key not configured or mismatched  
**Solution:**
1. Check `.env.local` exists
2. Verify SUPABASE_* keys match dashboard
3. Run `npm run dev` and watch console
4. Check for typos in key values

### Razorpay Button Not Loading

**Cause:** RAZORPAY_KEY_ID not configured  
**Solution:**
1. Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env.local`
2. Format: Must start with `rzp_test_` or `rzp_live_`
3. Restart dev server: `npm run dev`
4. Clear browser cache

### Deployment Fails with Env Var Error

**Cause:** Missing variable in Vercel  
**Solution:**
1. Check Vercel dashboard → Environment Variables
2. Add missing variable
3. Trigger redeploy
4. Check deployment logs

### .htaccess Syntax Error on Server

**Cause:** Invalid Apache configuration  
**Solution:**
1. SSH to server
2. Run: `php -l .htaccess` (should have no output)
3. Or check error logs: `/error.log` in home directory
4. Fix syntax and reload Apache

---

## 📊 SECURITY SUMMARY

| File | Location | Gitignored | Access | Contents |
|------|----------|-----------|--------|----------|
| `.env.local` | `apps/platform/` | YES | Local dev | All secrets (PRIVATE) |
| `.env.local` | `apps/website/` | YES | Local dev | Optional secrets |
| `.htaccess` | Hostinger server | YES | Production | SetEnv secrets |
| `config.js` | `apps/website/` | NO* | Public | Public keys only (SAFE) |
| GitHub Secrets | GitHub repo | Built-in | CI/CD | Encrypted secrets |
| Vercel Env Vars | Vercel dashboard | Built-in | Deployment | Encrypted secrets |
| Password Manager | Local | Private | Local only | All backups |

*Exception added to .gitignore: `!apps/website/config.js`

---

## 🎯 FINAL CHECKLIST

Once all private files are created and configured:

- [ ] All 8 file types created
- [ ] All credentials configured
- [ ] All endpoints tested
- [ ] No 404/500 errors
- [ ] No env var errors in logs
- [ ] Registration working
- [ ] Payment demo working
- [ ] Password manager backup complete
- [ ] Team notified of setup
- [ ] Ready for production

---

**Created:** 2026-09-05  
**Security Level:** CRITICAL  
**Review:** Quarterly  
**Rotation:** Every 90 days  

