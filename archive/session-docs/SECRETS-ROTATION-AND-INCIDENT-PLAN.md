# 🔄 SECRETS ROTATION & INCIDENT RESPONSE PLAN
**Critical Security Documentation**

---

## 📅 QUARTERLY ROTATION SCHEDULE

### Rotation Dates (Every 90 days)

```
Rotation Cycle 1: September 2026
├── Q3 Rotation: Sep 5, 2026
└── Q4 Rotation: Dec 5, 2026

Rotation Cycle 2: March 2027
├── Q1 Rotation: Mar 5, 2027
└── Q2 Rotation: Jun 5, 2027

Rotation Cycle 3: September 2027
├── Q3 Rotation: Sep 5, 2027
└── Q4 Rotation: Dec 5, 2027
```

### Add to Calendar NOW
- **Event:** KPI Hub Secrets Rotation - Q4 2026
- **Date:** December 5, 2026
- **Recurring:** Every 90 days
- **Reminder:** 1 week before (Nov 28, 2026)
- **Duration:** 2 hours
- **Attendees:** Ops team lead, Security team lead

---

## 🔑 ROTATION PROCEDURE (Step by Step)

### Step 1: Preparation (Day Before Rotation)
```bash
1. Notify team 24 hours in advance
2. Prepare rotation checklist
3. Test procedure in staging (if available)
4. Schedule downtime window (off-peak hours)
5. Brief team on what to expect
```

### Step 2: Generate New Keys

#### Supabase Keys Rotation
```
1. Log into: https://app.supabase.com
2. Select project: kpihub-assembled
3. Go to: Project Settings → API → Keys
4. Click: Rotate Key (for Anon Key)
   - New key generated
   - Copy new anon key
5. Click: Rotate Key (for Service Role)
   - New key generated
   - Copy new service role key
6. Note: Old keys revoked after 5 minute grace period
```

#### Razorpay Keys Rotation
```
1. Log into: https://dashboard.razorpay.com
2. Go to: Settings → API Keys
3. Click: Generate Test Keys (for TEST mode)
   - New test key ID generated (rzp_test_*)
   - New test key secret generated
   - Copy both
4. Click: Generate Live Keys (for LIVE mode)
   - New live key ID generated (rzp_live_*)
   - New live key secret generated
   - Copy both
5. Note: Store old keys for 7-day grace period before revoke
```

#### Vercel AI Gateway Key Rotation
```
1. Log into: https://vercel.com/dashboard
2. Go to: AI Gateway → API Keys
3. Select existing key: (current vck_* key)
4. Click: Rotate Key
   - New key generated
   - Copy new key
5. Old key available for 24 hours before expiry
```

#### Stripe Publishable Key Rotation
```
1. Log into: https://dashboard.stripe.com
2. Go to: Developers → API Keys
3. Note: Publishable keys don't rotate (they're public)
4. Only rotate Secret Key (if compromised)
5. Click: Reveal Secret Key
6. Copy the current sk_test_* or sk_live_*
```

### Step 3: Update All Locations

#### Update .env.local (Local Development)
```bash
cd /path/to/kpihub-assembled
nano apps/platform/.env.local

# Replace old values with new ones:
NEXT_PUBLIC_SUPABASE_URL=https://... (same)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<NEW_RAZORPAY_ID>
RAZORPAY_KEY_SECRET=<NEW_RAZORPAY_SECRET>
AI_GATEWAY_API_KEY=<NEW_VERCEL_KEY>

# Save and exit
```

#### Update GitHub Repository Secrets
```
URL: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions

For each secret (if configured):
1. Click the secret name
2. Click "Update"
3. Paste new value
4. Click "Update secret"

Secrets to update (if they exist):
  - RAZORPAY_LIVE_KEY_ID
  - RAZORPAY_LIVE_KEY_SECRET
  - VERCEL_AI_GATEWAY_KEY
  - Any others using rotated keys
```

#### Update Vercel Environment Variables
```
URL: https://vercel.com/hs-debugs/kpihub-assembled/settings/environment-variables

For each variable:
1. Click the variable name
2. Click "Edit"
3. Paste new value
4. Click "Save"

Variables to update:
  - NEXT_PUBLIC_RAZORPAY_KEY_ID
  - RAZORPAY_KEY_SECRET
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - AI_GATEWAY_API_KEY
  - Any others using rotated keys

Note: Vercel auto-redeploys after env var change
```

#### Update .htaccess on Production Server
```bash
SSH to server:
  ssh u117990013@thekpihub.com

Edit .htaccess:
  cd public_html
  nano .htaccess

Replace old SetEnv values with new ones:
  SetEnv SUPABASE_SERVICE_ROLE_KEY "<NEW_KEY>"
  SetEnv RAZORPAY_KEY_SECRET "<NEW_SECRET>"
  SetEnv AI_GATEWAY_API_KEY "<NEW_KEY>"

Save and exit:
  Ctrl+O → Enter → Ctrl+X

Reload Apache (if available):
  sudo systemctl reload apache2
  Or wait for next server restart
```

#### Update apps/website/config.js
```bash
cd /path/to/kpihub-assembled
nano apps/website/config.js

# If Supabase anon key changed:
anonKey: '<NEW_ANON_KEY>'

# Commit and push:
git add apps/website/config.js
git commit -m "chore: Rotate Supabase anon key in config.js"
git push origin main
```

#### Update Password Manager
```
1. Open password manager entry: "KPI Hub - Development"
2. Click "Edit"
3. Update each rotated key:
   - Old value → New value
   - Update "Modified" timestamp
4. Update "Next Rotation" date (90 days from now)
5. Save encrypted

Repeat for: "KPI Hub - Production" (if exists)
```

### Step 4: Verification (Critical!)

#### Test Development Environment
```bash
cd /path/to/kpihub-assembled

# Test with new keys:
npm run dev

# Navigate to test pages:
1. http://localhost:3000/razorpay-demo
   → Should load without errors
   → Razorpay button should appear
   
2. http://localhost:3000/register.html
   → Should load without errors
   → Form should be interactive

# Check browser console (F12):
   → No 404 errors
   → No "Invalid API key" messages
   → No undefined CONFIG errors

# Test Supabase connection:
   → Try to sign up with test email
   → Should either create account or show validation error
   → NOT an API error

Outcome: ✅ PASS or ❌ FAIL
```

#### Test Production Deployment
```
URL: https://kpihub-platform.vercel.app/razorpay-demo

Checks:
1. Page loads without 404
2. Razorpay button visible
3. No console errors (F12)
4. Try test payment (test card: 4111 1111 1111 1111)
5. Payment should complete
6. Success message appears

URL: https://thekpihub.com/register.html

Checks:
1. Registration page loads
2. No console errors
3. Can fill and submit form
4. Supabase receives signup

Outcome: ✅ PASS or ❌ FAIL
```

#### Test GitHub Actions Deployment
```
1. Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
2. Look at latest workflow run
3. Should show: ✅ ALL CHECKS PASSED
4. Or check if any jobs failed
5. Review logs if any failures

If deployment failed after rotation:
  → Run workflow again
  → Check env var configuration
  → Check GitHub secrets
```

### Step 5: Document and Close Out

#### Update Rotation Log
```
File: SECRETS-ROTATION-LOG.md (create if doesn't exist)

Entry:
───────────────────────────────────────
Rotation Date: September 5, 2026
Rotated Keys:
  ✅ Supabase Anon Key
  ✅ Supabase Service Role Key
  ✅ Razorpay Test Keys
  ✅ Vercel AI Gateway Key
  ✅ All locations updated
  
Verification Results:
  ✅ Development environment: PASS
  ✅ Production deployment: PASS
  ✅ GitHub Actions: PASS
  
Old Keys Status:
  - Supabase: Revoked (grace period: 5 min)
  - Razorpay: Archived (grace period: 7 days)
  - Vercel: Expired (grace period: 24 hrs)
  
Next Rotation: December 5, 2026
Performed By: [Your Name]
───────────────────────────────────────
```

#### Notify Team
```
Subject: ✅ Secrets Rotation Complete - September 5, 2026

Team,

Quarterly secrets rotation completed successfully.

Updated Keys:
  • Supabase (Anon + Service Role)
  • Razorpay (Test Keys)
  • Vercel AI Gateway
  
Verification Status:
  ✅ Development: PASS
  ✅ Production: PASS
  ✅ All deployments: PASS

No action needed on your end.

Next rotation: December 5, 2026
```

---

## 🚨 INCIDENT RESPONSE PLAN

### If a Key is Compromised

#### Severity Assessment
```
CRITICAL: Key exposed in:
  - Public GitHub repository
  - Public Slack/Email
  - Compromised developer machine
  
HIGH: Key at risk:
  - Failed authentication attempt
  - Stolen credential file
  - Unauthorized access detected
  
MEDIUM: Key potentially at risk:
  - Employee departure
  - Lost device
  - Suspicious activity
```

### CRITICAL Incident (Immediate Action)

#### Minutes 1-5: Isolate and Revoke
```
1. IMMEDIATELY revoke the compromised key:
   
   Supabase:
   → app.supabase.com → Project Settings → API
   → Rotate the compromised key
   
   Razorpay:
   → dashboard.razorpay.com → Settings → API Keys
   → Mark compromised key as revoked
   
   Vercel:
   → vercel.com → AI Gateway → API Keys
   → Delete/disable compromised key
   
   Stripe:
   → dashboard.stripe.com → Developers → API Keys
   → Revoke compromised key

2. IMMEDIATELY notify:
   - Security team lead
   - Operations team lead
   - Project manager
   - Do NOT notify via compromised channels
```

#### Minutes 5-15: Generate New Keys
```
1. Generate new keys in each service:
   - Supabase: Rotate affected keys
   - Razorpay: Generate new test/live keys
   - Vercel: Create new API key
   - Stripe: Generate new secret key

2. Store new keys securely:
   - Temporary location: Encrypted file or email
   - Do NOT commit to Git
   - Do NOT paste in Slack
   - Use password manager or encrypted message
```

#### Minutes 15-30: Update All Locations
```
1. Update .env.local with new keys
2. Update GitHub Secrets with new keys
3. Update Vercel Environment Variables
4. Update .htaccess on server
5. Update password manager entry

Do NOT skip any location!
```

#### Minutes 30-45: Verify and Deploy
```
1. Test development environment
   npm run dev
   Check: /razorpay-demo loads
   
2. Verify Vercel deployment
   Check: kpihub-platform.vercel.app loads
   
3. Verify production server
   Check: thekpihub.com/register.html loads
   
4. Run full test suite
   npm test (if available)
```

#### Minutes 45-60: Document and Report
```
1. Create incident report:
   - What happened
   - Which key(s) compromised
   - Discovery method
   - Time from discovery to remediation
   - Root cause
   - Prevention measures

2. Notify stakeholders:
   - Security update sent
   - No user data compromised
   - All systems restored
   - Post-incident review scheduled

3. Store incident report:
   - Encrypted file
   - Password manager note
   - Do NOT commit to Git
```

### HIGH Incident (Urgent Action)

#### Step 1: Assess
```
1. Determine if key was actually accessed
2. Check service logs for unusual activity
3. Review if data was accessed/modified
4. Time window of potential exposure
```

#### Step 2: Decide
```
If actual compromise confirmed:
  → Follow CRITICAL incident procedure above

If just risk (not actual compromise):
  → Proceed with rotation (see Quarterly Rotation)
  → No emergency notification needed
  → Log in normal rotation schedule
```

#### Step 3: Monitor
```
For 48-72 hours after high-risk incident:
- Monitor service logs for anomalies
- Check for unauthorized transactions
- Alert on unusual API usage
- Review account access logs
```

### MEDIUM Incident (Precautionary Action)

#### Step 1: Evaluate
```
- Is the device/account secure now?
- Was key actually exposed?
- Is there evidence of unauthorized use?
```

#### Step 2: Decide
```
If device/account secured and no evidence of use:
  → Proceed with next quarterly rotation
  → No emergency action needed
  
If any doubt:
  → Treat as HIGH incident
  → Proceed with urgent rotation
```

---

## 📋 INCIDENT RESPONSE CHECKLIST

### If Incident Occurs

#### Immediate (0-5 min)
- [ ] REVOKE compromised key immediately
- [ ] Contact security team
- [ ] Do NOT discuss in Slack/Email
- [ ] Verify incident is real (not false alarm)

#### Urgent (5-30 min)
- [ ] Generate new keys in all services
- [ ] Update .env.local
- [ ] Update GitHub Secrets
- [ ] Update Vercel Environment Variables
- [ ] Update .htaccess on server
- [ ] Update password manager

#### Verification (30-45 min)
- [ ] Test development: npm run dev
- [ ] Test /razorpay-demo loads
- [ ] Test registration page loads
- [ ] Check browser console for errors
- [ ] Verify Vercel deployment
- [ ] Verify production server

#### Post-Incident (45-60 min)
- [ ] Document incident report
- [ ] Notify stakeholders
- [ ] Store report securely
- [ ] Schedule post-incident review
- [ ] Plan prevention measures

---

## 🛡️ PREVENTION MEASURES

### To Prevent Compromises

1. **Never commit secrets** to Git (ever)
   - Use .gitignore religiously
   - Pre-commit hooks to scan for secrets
   - GitHub push protection enabled

2. **Rotate regularly** (every 90 days)
   - Set calendar reminders
   - Automate if possible
   - Document every rotation

3. **Limit access** to secrets
   - Only give to essential team members
   - Use GitHub secrets for CI/CD
   - Use Vercel secrets for deployment

4. **Use strong practices**
   - Separate test and live keys
   - Never use live keys in development
   - Never share keys via email
   - Use password manager for storage

5. **Monitor activity**
   - Check service logs regularly
   - Alert on unusual API usage
   - Review access logs quarterly
   - Respond to anomalies immediately

6. **Educate team**
   - Train all developers on secret management
   - Review this plan quarterly
   - Share incident examples
   - Reinforce "never commit" rule

---

## 📞 CONTACTS & ESCALATION

### If Incident Occurs, Contact (In Order)

1. **Security Team Lead**
   - Email: [security-lead@example.com]
   - Phone: [emergency number]
   - Slack: DO NOT USE - too risky

2. **Operations Team Lead**
   - Email: [ops-lead@example.com]
   - Phone: [emergency number]

3. **Project Manager**
   - Email: [pm@example.com]
   - For stakeholder notification

### External Contacts

- **Supabase Support:** https://supabase.com/support
- **Razorpay Support:** https://razorpay.com/support
- **Vercel Support:** https://vercel.com/support
- **Stripe Support:** https://support.stripe.com

---

## 📊 ROTATION TRACKING

### Next Rotation Schedule

| Rotation | Date | Status | By | Notes |
|----------|------|--------|-----|-------|
| Q3 2026 | Sep 5, 2026 | 🔄 IN PROGRESS | [Name] | Initial setup |
| Q4 2026 | Dec 5, 2026 | ⏳ PENDING | TBD | |
| Q1 2027 | Mar 5, 2027 | ⏳ PENDING | TBD | |
| Q2 2027 | Jun 5, 2027 | ⏳ PENDING | TBD | |
| Q3 2027 | Sep 5, 2027 | ⏳ PENDING | TBD | |

---

## ✅ FINAL CHECKLIST

After each rotation:
- [ ] All keys generated and copied
- [ ] All locations updated (.env, GitHub, Vercel, .htaccess, config.js, pwd mgr)
- [ ] All systems tested and verified
- [ ] Rotation log updated
- [ ] Team notified
- [ ] Next rotation date scheduled
- [ ] Old keys archived (for grace period)
- [ ] No errors in any environment

After any incident:
- [ ] Compromised key revoked immediately
- [ ] New keys generated and distributed
- [ ] All systems tested
- [ ] Incident report filed
- [ ] Root cause identified
- [ ] Prevention measures planned
- [ ] Team trained on prevention

---

**Created:** 2026-09-05  
**Review:** Quarterly (before rotation)  
**Update:** Annually or after incident  
**Status:** ACTIVE - CRITICAL DOCUMENT  

