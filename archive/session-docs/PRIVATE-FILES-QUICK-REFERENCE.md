# 🔑 PRIVATE FILES QUICK REFERENCE
**Print this page and keep it safe**

---

## 📋 WHAT TO CREATE (In Order)

### STEP 1: Development Environment
```
File: apps/platform/.env.local
What to get:
  1. Supabase URL → app.supabase.com → Project Settings → API → Project URL
  2. Supabase Anon Key → app.supabase.com → Project Settings → API → Anon Key
  3. Supabase Service Role → app.supabase.com → Project Settings → API → Service Role Key
  4. Razorpay Test Key ID → dashboard.razorpay.com → Settings → API Keys → rzp_test_*
  5. Razorpay Test Secret → dashboard.razorpay.com → Settings → API Keys → Secret
  6. Vercel AI Key → vercel.com → AI Gateway → Create API Key → vck_*

Where to store: .env.local (gitignored, never commit)
When created: Before running `npm run dev`
Status: 🔄 IN PROGRESS
```

### STEP 2: Password Manager
```
File: Your Password Manager (1Password/LastPass/Bitwarden)
Entry Name: "KPI Hub - Development"
What to store:
  - All 6 keys from STEP 1
  - Source/purpose for each
  - Creation date
  - Rotation date (90 days from now)

Where to store: Encrypted local password manager
When created: After creating .env.local
Status: 🔄 IN PROGRESS
```

### STEP 3: GitHub Secrets
```
File: GitHub → Repository Settings → Secrets → Actions
What to add:
  (For now, leave empty - needed when switching to LIVE mode)
  
When needed: After getting live Razorpay credentials
URL: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
Status: ⏳ PENDING (Live credentials needed)
```

### STEP 4: Vercel Environment Variables
```
File: Vercel → Project Settings → Environment Variables
What to add:
  NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_TVRO90Zju7EZ01
  RAZORPAY_KEY_SECRET = (from .env.local)
  NEXT_PUBLIC_SUPABASE_URL = (from .env.local)
  NEXT_PUBLIC_SUPABASE_ANON_KEY = (from .env.local)
  AI_GATEWAY_API_KEY = (from .env.local)

Environment: Production
URL: https://vercel.com/hs-debugs/kpihub-assembled/settings/environment-variables
Status: 🔄 IN PROGRESS
```

### STEP 5: Website Config
```
File: apps/website/config.js
What to add:
  - NEXT_PUBLIC_SUPABASE_URL from .env.local
  - NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local
  - STRIPE_PUBLISHABLE_KEY (when ready)

Where to store: Git repo (public keys only)
When created: After .env.local created
Status: ✅ DONE (file exists)
```

### STEP 6: .htaccess on Production
```
File: /public_html/.htaccess on Hostinger
Access: ssh u117990013@thekpihub.com
What to add:
  SetEnv SUPABASE_URL ...
  SetEnv SUPABASE_SERVICE_ROLE_KEY ...
  SetEnv RAZORPAY_KEY_SECRET ...
  (and others from template)

Where to store: Production server only
When created: Before production deployment
Status: ⏳ PENDING
```

---

## 🔐 QUICK COPY-PASTE CHECKLIST

### Before Development
```
✓ Supabase URL:          ______________________________________
✓ Supabase Anon Key:     ______________________________________
✓ Supabase Service Role: ______________________________________
✓ Razorpay Test ID:      rzp_test_TVRO90Zju7EZ01
✓ Razorpay Test Secret:  ______________________________________
✓ Vercel AI Key:         vck_____________________________________

✓ Password manager entry created
✓ .env.local created and filled
✓ npm run dev works without errors
✓ Can access /razorpay-demo
✓ Supabase auth working (can see login form)
```

### Before Production
```
✓ apps/website/config.js created and filled
✓ Vercel env vars configured (6 variables)
✓ Registration page loads
✓ Razorpay demo button visible
✓ Test payment works (test card: 4111 1111 1111 1111)
✓ .htaccess created on server (when live credentials ready)
✓ GitHub secrets configured (when live credentials ready)
```

---

## 🚨 NEVER DO THESE

```
❌ NEVER paste secrets in Slack
❌ NEVER email API keys
❌ NEVER commit .env.local to Git
❌ NEVER commit .htaccess to Git
❌ NEVER hardcode secrets in code
❌ NEVER share GitHub secrets link
❌ NEVER print secrets to console
❌ NEVER put secrets in comments
❌ NEVER take screenshots of keys
❌ NEVER share password manager entry via email
```

---

## ✅ ALWAYS DO THESE

```
✅ ALWAYS store locally in password manager
✅ ALWAYS use .gitignore to exclude
✅ ALWAYS use environment variables
✅ ALWAYS rotate keys quarterly
✅ ALWAYS verify after updating
✅ ALWAYS add to .deploy-exclude
✅ ALWAYS test thoroughly first
✅ ALWAYS document in password manager
✅ ALWAYS keep backups encrypted
✅ ALWAYS revoke old keys after rotation
```

---

## 🔑 WHERE TO GET EACH KEY

### Supabase Keys
```
URL: https://app.supabase.com
→ Select project: kpihub-assembled
→ Project Settings (gear icon)
→ API
→ Copy: Project URL, Anon Key, Service Role Key
```

### Razorpay Keys
```
URL: https://dashboard.razorpay.com
→ Settings (gear icon)
→ API Keys
→ Test Keys section (currently)
→ Copy: Key ID (rzp_test_*), Key Secret
```

### Vercel AI Gateway Key
```
URL: https://vercel.com/dashboard
→ AI Gateway (left sidebar)
→ Create API Key
→ Copy: vck_* key
```

### Stripe Publishable Key
```
URL: https://dashboard.stripe.com
→ Developers (left sidebar)
→ API Keys
→ Copy: Publishable Key (pk_test_* or pk_live_*)
```

---

## 📊 QUICK REFERENCE TABLE

| Key Name | Format | Where | Status |
|----------|--------|-------|--------|
| Supabase URL | https://PROJECT.supabase.co | app.supabase.com | ✅ |
| Supabase Anon | eyJhbGci... (JWT) | app.supabase.com | ✅ |
| Supabase Service | eyJhbGci... (JWT) | app.supabase.com | ✅ |
| Razorpay Test ID | rzp_test_* | dashboard.razorpay.com | ✅ |
| Razorpay Secret | [alphanumeric] | dashboard.razorpay.com | ✅ |
| Vercel AI Key | vck_* | vercel.com | ✅ |
| Stripe Publishable | pk_test_* or pk_live_* | dashboard.stripe.com | ⏳ |
| Razorpay Live ID | rzp_live_* | dashboard.razorpay.com | ⏳ |
| Razorpay Live Secret | [alphanumeric] | dashboard.razorpay.com | ⏳ |
| Stripe Secret | sk_test_* or sk_live_* | dashboard.stripe.com | ⏳ |

---

## 🎯 IMMEDIATE ACTION ITEMS

### Right Now (5 minutes)
- [ ] Go to app.supabase.com
- [ ] Copy Project URL
- [ ] Copy Anon Key
- [ ] Copy Service Role Key
- [ ] Paste into password manager temporarily

### Next (10 minutes)
- [ ] Go to dashboard.razorpay.com
- [ ] Copy Test Key ID (rzp_test_*)
- [ ] Copy Test Key Secret
- [ ] Paste into password manager

### After (15 minutes)
- [ ] Go to vercel.com
- [ ] Create AI Gateway key
- [ ] Copy vck_* key
- [ ] Paste into password manager

### Then (20 minutes)
- [ ] Create password manager entry "KPI Hub - Development"
- [ ] Add all 6 keys with sources
- [ ] Set expiration reminder for 90 days
- [ ] Save and verify access

### Finally (10 minutes)
- [ ] Create .env.local in apps/platform/
- [ ] Fill in all 6 keys
- [ ] Run: npm run dev
- [ ] Verify no env var errors
- [ ] Test /razorpay-demo loads

**Total time: ~60 minutes**

---

## 🆘 IF SOMETHING GOES WRONG

### "Invalid API key" error
→ Check .env.local exists and has all 6 keys filled in correctly

### Razorpay button not loading
→ Verify NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local starts with rzp_test_

### Supabase login fails
→ Verify SUPABASE_URL and SUPABASE_ANON_KEY are exact (including quotes)

### Vercel deployment fails
→ Check https://vercel.com/hs-debugs/kpihub-assembled/settings/environment-variables
→ Verify all 6 required env vars are set

---

## 📞 QUICK LINKS

- Supabase: https://app.supabase.com
- Razorpay: https://dashboard.razorpay.com
- Vercel: https://vercel.com/hs-debugs/kpihub-assembled
- Stripe: https://dashboard.stripe.com
- GitHub Secrets: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
- SSH to Server: `ssh u117990013@thekpihub.com`

---

**Print this page and keep it near your workspace**  
**Update checklist as you complete each step**  
**This is your private reference guide**

