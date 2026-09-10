# Phase D: Quick Setup (5 Minutes)
## Fast-Track Health Check Deployment

Skip the details? Here's what you need to do:

---

## Step 1: Deploy Endpoints (Already Done!)

Health check endpoints are already created and ready:

```
✅ /api/health (basic)
✅ /api/health/detailed (diagnostics)
✅ /api/health/ready (readiness)
✅ /api/health/live (liveness)
✅ /api/health/status (display)
```

Commit and push to Vercel:

```bash
cd /home/user/kpihub-assembled
git add apps/platform/src/app/api/health/
git commit -m "feat: add Phase D health check endpoints"
git push origin main
```

Wait for deployment to complete (1-2 minutes)

---

## Step 2: Verify Deployment (1 min)

```bash
# Test live endpoints
curl https://thekpihub-platform.vercel.app/api/health
curl https://thekpihub-platform.vercel.app/api/health/detailed

# Both should return 200 OK with JSON
```

---

## Step 3: Set Up Monitoring (3 min)

### Option A: UptimeRobot (Recommended for beginners)

1. Go to https://uptimerobot.com/
2. Sign up (free account)
3. Add monitor: `https://thekpihub-platform.vercel.app/api/health`
4. Add alert email
5. Done! ✅

### Option B: Sentry (Recommended for error tracking)

1. Go to https://sentry.io/
2. Sign up
3. Create Next.js project
4. Get DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
5. Add to Vercel:
   ```
   NEXT_PUBLIC_SENTRY_DSN=<your-dsn>
   ```
6. Done! ✅

### Option C: Both (Recommended)

Do both UptimeRobot + Sentry for complete coverage:
- UptimeRobot: Uptime monitoring
- Sentry: Error tracking

---

## Step 4: Add Slack Alerts (1 min)

### Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Create New App
3. Enable Incoming Webhooks
4. Add to `#alerts` channel
5. Copy webhook URL

### Connect to Monitoring

**UptimeRobot:**
1. Settings → Alert Contacts
2. Add Slack
3. Paste webhook URL

**Sentry:**
1. Project Settings → Integrations
2. Slack → Install
3. Select channel `#alerts`

---

## Step 5: Test (1 min)

### Test Health Endpoints

```bash
# All should return 200
curl https://thekpihub-platform.vercel.app/api/health
curl https://thekpihub-platform.vercel.app/api/health/detailed
curl https://thekpihub-platform.vercel.app/api/health/ready
curl https://thekpyhub-platform.vercel.app/api/health/live
curl https://thekpihub-platform.vercel.app/api/health/status
```

### Test Monitoring

1. Check UptimeRobot → should show "Up" ✅
2. Send test message to Slack
3. Verify message received

---

## Done! ✅

Your platform now has:

- ✅ 5 health check endpoints
- ✅ Automatic uptime monitoring
- ✅ Error tracking & alerts
- ✅ Slack notifications
- ✅ Real-time dashboards

### Endpoints Reference

| Endpoint | Use For | Response Time |
|----------|---------|---------------|
| `/api/health` | Load balancer checks | < 50ms |
| `/api/health/ready` | Orchestration probes | < 1s |
| `/api/health/live` | Process monitoring | < 50ms |
| `/api/health/detailed` | Dashboards & diagnostics | < 5s |
| `/api/health/status` | Status page display | < 200ms |

---

## Monitoring URLs

Save these:

| Service | URL |
|---------|-----|
| UptimeRobot | https://uptimerobot.com/dashboard |
| Sentry | https://sentry.io/organizations/your-org/issues/ |
| Vercel | https://vercel.com/dashboard/kpihub-platform |
| Slack Alerts | Slack → #alerts |

---

## Need Help?

- Full setup: See `PHASE-D-IMPLEMENTATION-GUIDE.md`
- Test procedures: See `PHASE-D-TESTING-GUIDE.md`
- Operations: See `PHASE-D-OPERATIONS.md`
- Architecture: See `PHASE-D-OVERVIEW.md`

---

**Time to Complete:** 5 minutes  
**Difficulty:** Easy  
**Result:** Production-grade monitoring ✅

🎉 Phase D Complete!
