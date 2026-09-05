# 🚨 IMMEDIATE ACTION PLAN: Fix "Get My KPI Audit" Network Errors

**Status:** CRITICAL - Website forms are broken  
**Pages Affected:** 29 pages (all CTAs linked to get-audit.html)  
**Time to Fix:** 30 minutes total (15 min deployment + 15 min testing)  
**Risk Level:** HIGH - Revenue-blocking issue

---

## WHAT'S BROKEN

When users try to submit the "Get My KPI Audit" form on:
- https://thekpihub.com/get-audit.html
- https://thekpihub.com/contact.html
- And links from 27 other pages

They see: **"Network error. Please email us at info@thekpihub.com"**

**Real cause:** Configuration missing + incomplete PHP files on production server

---

## WHAT HAS BEEN FIXED (In Git)

✅ **brevo-subscribe.php** - Fixed incomplete PHP file  
✅ **stripe-session.php** - Fixed incomplete PHP file  
✅ **stripe-webhook.php** - Fixed incomplete PHP file  
✅ **get-audit.html** - Enhanced error handling  
✅ **contact.html** - Fixed Formspree format  
✅ **WEBSITE-CONFIGURATION-AUDIT-2026-09-05.md** - Complete audit document  

All fixes are committed and pushed. **BUT** they won't work until the next step is done.

---

## WHAT STILL NEEDS TO BE DONE (On Production Server)

### STEP 1: Deploy Code Changes (10 minutes)

This happens automatically when you push to `main` or trigger the GitHub Actions workflow.

**Command to manually trigger deployment:**
```bash
# If you have GitHub CLI access:
gh workflow run deploy-hostinger.yml --ref main

# Or: Push to main branch
git push origin claude/kpihub-repo-assembly-y1i0kv:main
```

**Verify deployment:**
1. Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
2. Look at the latest workflow run
3. Should show: ✅ All checks passed
4. Files deployed to Hostinger via rsync

### STEP 2: Configure Environment Variables on Hostinger (10 minutes)

**SSH to production server:**
```bash
ssh u117990013@thekpihub.com
```

**Edit .htaccess:**
```bash
cd public_html
nano .htaccess
```

**Add these lines** (replace `YOUR_KEY_HERE` with actual values):

```apache
# BREVO (Email Marketing) — Get API key from: https://app.brevo.com/settings/keys-access
SetEnv BREVO_API_KEY "YOUR_BREVO_API_KEY_HERE"
SetEnv BREVO_LIST_ID "YOUR_BREVO_LIST_ID_HERE"

# SUPABASE (Database) — From your Supabase project settings
SetEnv SUPABASE_SERVICE_ROLE_KEY "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"
SetEnv SUPABASE_URL "https://eeuwkislidznpgdbvvbo.supabase.co"

# AI GATEWAY (Vercel) — From vercel.com/dashboard → AI Gateway
SetEnv AI_GATEWAY_API_KEY "YOUR_VERCEL_AI_GATEWAY_KEY_HERE"

# RAZORPAY (Payments) — From dashboard.razorpay.com
SetEnv RAZORPAY_KEY_SECRET "YOUR_RAZORPAY_KEY_SECRET_HERE"

# STRIPE (Subscriptions) — From dashboard.stripe.com → Developers → API Keys
SetEnv STRIPE_SECRET_KEY "YOUR_STRIPE_SECRET_KEY_HERE"
SetEnv STRIPE_WEBHOOK_SECRET "YOUR_STRIPE_WEBHOOK_SECRET_HERE"

# TELEGRAM (Error Alerts) — Optional, for getting alerts when something breaks
SetEnv TELEGRAM_BOT_TOKEN "YOUR_TELEGRAM_BOT_TOKEN_HERE"
SetEnv TELEGRAM_CHAT_ID "YOUR_TELEGRAM_CHAT_ID_HERE"
```

**Save the file:**
```
Ctrl+O (save)
↵ (confirm)
Ctrl+X (exit nano)
```

**Reload Apache:**
```bash
sudo systemctl reload apache2
```

If you get "sudo: command not found", contact Hostinger support:
- Email: support@hostinger.com
- Or: Restart Apache through Hostinger control panel

### STEP 3: Test the Fix (10 minutes)

**Test 1: Direct API Test**
```bash
curl -X POST https://thekpihub.com/brevo-subscribe.php \
  -H "Content-Type: application/json" \
  -d '{
    "firstname":"Test User",
    "email":"test@gmail.com",
    "website":"https://test.com",
    "question":"Test"
  }'

# Expected response: {"brevo_status":200} or {"brevo_status":502}
# NOT a PHP error
```

**Test 2: Form Submission Test**
1. Go to: https://thekpihub.com/get-audit.html
2. Fill form with:
   - Name: "Test User"
   - Email: Your test email
   - Website: https://test.com
   - Question: "Why does my funnel leak?"
3. Click "Get My KPI Audit →"
4. Expected: See "You're in. Last step → secure your slot."
5. Check your email for Brevo confirmation (may take 2 minutes)

**Test 3: Contact Form Test**
1. Go to: https://thekpihub.com/contact.html
2. Fill form with:
   - Name: "Test Sender"
   - Email: Your test email
   - Subject: "Testing contact form"
   - Message: "This is a test"
3. Click "Send Message"
4. Expected: See success message
5. Check your email for Formspree confirmation

**Test 4: Check Server Logs**
```bash
ssh u117990013@thekpihub.com
tail -50 public_html/error_log | grep -E "ERROR|Warning|Fatal"

# Should show NO PHP errors
```

---

## TROUBLESHOOTING

### Issue: Deployment Workflow Fails

**Symptom:** GitHub Actions shows ❌ red status

**Fix:**
```bash
# Re-run the workflow:
gh run rerun <RUN_ID> --failed

# Or re-run manually:
git push origin claude/kpihub-repo-assembly-y1i0kv:main
```

**If it's a connection timeout (Hostinger blocks GitHub runner IP):**
```bash
# Try the re-run, Hostinger usually allows second attempt
gh run rerun <RUN_ID> --failed

# Monitor at: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
```

### Issue: Still Getting "Network error" After .htaccess Update

**Check 1:** Apache actually reloaded?
```bash
ssh u117990013@thekpihub.com
sudo systemctl status apache2
# Should show: active (running)

# If not running:
sudo systemctl start apache2
```

**Check 2:** .htaccess saved correctly?
```bash
ssh u117990013@thekpihub.com
cd public_html
cat .htaccess | grep SetEnv

# Should show all the SetEnv lines you added
```

**Check 3:** Environment variables actually set?
```bash
ssh u117990013@thekpihub.com
php -r "echo getenv('BREVO_API_KEY');"

# Should print your API key (or empty if not set)
```

### Issue: Brevo Test Returns 502

**Means:** SetEnv variables not loaded or .htaccess syntax error

**Check:** .htaccess syntax
```bash
ssh u117990013@thekpihub.com
sudo apache2ctl configtest

# Should show: Syntax OK
# If error: fix the syntax and reload
```

### Issue: Form Submits But No Success Message

**Means:** Form submission succeeded but thank you message not showing

**Fix in get-audit.html:**
```javascript
// Line 413: Should hide the form and show thank you
document.getElementById('auditForm').style.display = 'none';
document.getElementById('thankyou').classList.add('show');
```

**Verify the thankyou element exists:**
```javascript
// In browser console:
document.getElementById('thankyou')
// Should print: <div class="thankyou" id="thankyou">
```

---

## COMPLETE FIX SUMMARY

| Step | Action | Time | Status |
|---|---|---|---|
| 1 | Fix PHP files (brevo, stripe) | ✅ Done | Committed |
| 2 | Enhance error handling (forms) | ✅ Done | Committed |
| 3 | Create audit documentation | ✅ Done | Committed |
| 4 | **Deploy code to production** | ⏳ PENDING | Push to main |
| 5 | **Add .htaccess SetEnv directives** | ⏳ PENDING | SSH & edit |
| 6 | **Test form submissions** | ⏳ PENDING | Manual test |
| 7 | Verify Brevo emails | ⏳ PENDING | Check inbox |

---

## VALIDATION CHECKLIST

After following all steps above, verify:

- [ ] GitHub Actions workflow runs and shows ✅
- [ ] SSH access works: `ssh u117990013@thekpihub.com`
- [ ] .htaccess edited with all SetEnv directives
- [ ] Apache reloaded: `sudo systemctl reload apache2`
- [ ] Brevo API test returns 200 status
- [ ] get-audit.html form submission succeeds
- [ ] contact.html form submission succeeds
- [ ] No PHP errors in error_log
- [ ] Thank you message appears after form submit
- [ ] Email received in test inbox

---

## NEXT STEPS IF STILL BROKEN

If tests still fail after all steps:

1. **Collect debug info:**
   ```bash
   # PHP error log
   ssh u117990013@thekpihub.com
   tail -100 public_html/error_log > /tmp/error_log.txt
   
   # Browser console screenshot
   Open get-audit.html → F12 → Console → Screenshot
   ```

2. **Email details to:** info@thekpihub.com
   - Steps you followed
   - Error log excerpt
   - Screenshot of error

3. **Or check WEBSITE-CONFIGURATION-AUDIT-2026-09-05.md** in repo for full troubleshooting guide

---

## PERMANENT PREVENTION

To prevent this in future:

1. **Pre-deployment checklist:**
   - [ ] All PHP files end with `exit;` and `?>`
   - [ ] All required SetEnv directives in .htaccess
   - [ ] Test .htaccess syntax: `sudo apache2ctl configtest`
   - [ ] Run all forms before pushing to production

2. **Add automated tests:**
   - Test each form submission endpoint
   - Alert if error rate > 5%
   - Monitor Brevo email delivery

3. **Document as you code:**
   - What environment variables each PHP file needs
   - What error codes mean what
   - How to test before deployment

---

**Document Created:** 2026-09-05  
**Last Updated:** 2026-09-05  
**Estimated Fix Time:** 30 minutes  
**Priority:** 🔴 CRITICAL - Revenue-blocking  

**Questions?** Check WEBSITE-CONFIGURATION-AUDIT-2026-09-05.md for detailed technical information.

