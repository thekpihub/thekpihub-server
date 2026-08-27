# Phase B: Quick Reference - Deployment Test & Verification

**Quick Links & Commands for Phase B Steps 5-6**

---

## **Quick Test Execution** (2 minutes)

### Step 1: Make test change
```bash
cd /home/user/kpihub-assembled
echo "# Phase B deployment test - build verification" >> apps/platform/README.md
```

### Step 2: Commit and push
```bash
git add apps/platform/README.md
git commit -m "test: Phase B deployment test - verify CI/CD pipeline"
git push origin main
```

### Step 3: Monitor deployment
**Option A - Web Dashboard:**
- https://vercel.com/dashboard → kpihub-platform → Deployments
- Watch status: Queued → Building → Ready
- Expected time: 1-2 minutes

**Option B - CLI (if available):**
```bash
vercel logs --tail
```

---

## **Live Verification Tests** (5 minutes total)

### Test 1: Basic Connectivity
```bash
curl -I https://thekpihub-platform.vercel.app
# Expected: HTTP 200 or 308
```

### Test 2: All Key Routes
```bash
for route in "/" "/login" "/register" "/reset-password" "/dashboard"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" https://thekpihub-platform.vercel.app$route)
  echo "Route $route: HTTP $status"
done
# Expected: All 200 or 307 (redirect is OK)
```

### Test 3: Supabase Connected
- Open: https://thekpihub-platform.vercel.app/register
- Open DevTools (F12) → Network tab
- Look for requests to: supabase.co
- Expected: Requests appear, no CORS errors

### Test 4: Stripe Connected
- Open DevTools (F12) → Network tab
- Look for requests to: js.stripe.com or api.stripe.com
- Check: https://dashboard.stripe.com/webhooks
- Look for endpoint: thekpihub-platform.vercel.app/api/webhooks/stripe

### Test 5: API Endpoints
```bash
curl -s https://thekpihub-platform.vercel.app/api/profile | head -20
# Expected: JSON response (not HTML error)
```

### Test 6: Performance
```bash
time curl -s https://thekpihub-platform.vercel.app > /dev/null
# Expected: < 3 seconds total
```

---

## **Build Verification Checklist**

✅ **Pass** (all should be true):
- [ ] Deployment status: "Ready" (green checkmark)
- [ ] Build time: 1-2 minutes
- [ ] HTTP status: 200 or 308
- [ ] No console errors (F12 → Console)
- [ ] All routes accessible
- [ ] Supabase requests appear (Network tab)
- [ ] Stripe requests appear (Network tab)
- [ ] API responses are JSON (not HTML)
- [ ] Response time <3 seconds
- [ ] All 14 env vars in Vercel

❌ **Fail** (any of these = issue):
- [ ] Deployment status: "Failed" (red X)
- [ ] HTTP 404, 500, or 503 errors
- [ ] Build errors in logs (Vercel dashboard)
- [ ] Missing environment variable errors
- [ ] "Cannot find module" errors
- [ ] CORS errors in console
- [ ] No Supabase/Stripe requests (disconnected)
- [ ] Response time >5 seconds

---

## **Common Issues & Quick Fixes**

| Issue | Cause | Fix |
|-------|-------|-----|
| Build stuck on "Building" >5m | Long install or timeout | Click "Redeploy" in Vercel |
| HTTP 500 error | Missing env var | Check Vercel Settings → Env Vars |
| Blank page | No CSS/JS loaded | Hard refresh: Ctrl+Shift+R |
| Auth not working | Wrong Supabase URL | Verify `NEXT_PUBLIC_SUPABASE_URL` in Vercel |
| No Stripe requests | Key not loaded | Check `STRIPE_SECRET_KEY` format |
| API returns 500 | Env var error | Check logs: Vercel → Deployments → [latest] → Logs |

---

## **What to Look for in Logs**

**✅ Good Signs:**
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (12/12)
✓ Finalizing page optimization
```

**❌ Bad Signs:**
```
✗ Failed to compile
✗ Cannot find module
✗ Missing environment variable
✗ Error: ENOENT: no such file
```

---

## **Verification Checklist (Print & Check Off)**

```
DEPLOYMENT TEST:
[ ] Test change committed to main
[ ] Git push successful
[ ] Vercel received notification
[ ] Build started and completed
[ ] Status shows "Ready"
[ ] No build errors in logs

LIVE VERIFICATION:
[ ] HTTP 200/308 response
[ ] Homepage loads in <3s
[ ] All routes (/, /login, /register, etc.) return 2xx
[ ] Supabase requests in Network tab
[ ] Stripe requests in Network tab
[ ] API endpoints return JSON
[ ] All 14 env vars configured
[ ] No console errors
[ ] No cache misses

OVERALL:
[ ] Platform is LIVE and WORKING
[ ] No critical issues
[ ] Ready for Phase C/D
```

---

## **URLs You'll Need**

| Resource | URL |
|----------|-----|
| **Platform (Live)** | https://thekpihub-platform.vercel.app |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Build Logs** | https://vercel.com/dashboard → kpihub-platform → Deployments → [latest] → Logs |
| **Env Variables** | https://vercel.com/dashboard → kpihub-platform → Settings → Environment Variables |
| **GitHub Repo** | https://github.com/hsharmagxi-debug/kpihub-assembled |
| **Supabase** | https://supabase.com/dashboard |
| **Stripe** | https://dashboard.stripe.com |
| **Stripe Webhooks** | https://dashboard.stripe.com/webhooks |

---

## **Success Criteria**

**Phase B Steps 5-6 COMPLETE when:**
- ✅ Deployment triggered and built successfully
- ✅ Platform accessible at https://thekpihub-platform.vercel.app
- ✅ All 8 verification tests pass
- ✅ No critical errors in logs
- ✅ HTTP status 200/308
- ✅ All integrations working (Supabase, Stripe)
- ✅ All 14 environment variables configured

**If anything fails**, refer to the full `PHASE-B-TEST-PLAN.md` for detailed troubleshooting.

---

**Time to Complete**: ~10 minutes total (2 min deploy + 5 min verification + 3 min buffer)

🚀 Ready to deploy!
