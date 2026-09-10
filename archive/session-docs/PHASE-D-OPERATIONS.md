# Phase D: Operations & Maintenance Guide
## Production Monitoring Management

---

## Overview

This guide covers ongoing management, maintenance, and troubleshooting of Phase D monitoring systems.

**Audience:** DevOps engineers, platform engineers, on-call team  
**Reading Time:** 20-30 minutes  
**References:** Sentry, UptimeRobot, Slack, Vercel dashboards

---

## Daily Operations (5 minutes)

### Morning Health Check

Every morning, verify the platform is healthy:

```bash
# 1. Check uptime
curl https://thekpihub-platform.vercel.app/api/health/detailed | jq '.checks'

# Expected: All healthy

# 2. Review overnight alerts
# Go to Slack → #alerts channel
# Check for any alerts received

# 3. Quick status
# Go to https://uptimerobot.com/dashboard
# Verify monitor shows "Up" ✅
```

### Alert Response

When you receive an alert:

1. **Receive alert** (via Slack, email, etc.)
2. **Assess severity**
   - Green (degraded): Monitor, no immediate action
   - Yellow (unhealthy): Investigate within 1 hour
   - Red (down): Investigate immediately
3. **Verify issue**
   ```bash
   curl https://thekpihub-platform.vercel.app/api/health/detailed
   ```
4. **Check dashboards**
   - Vercel: https://vercel.com/dashboard/kpihub-platform
   - Sentry: https://sentry.io/issues/
5. **Take action**
   - See "Incident Response" section below

---

## Weekly Operations (20 minutes)

### Weekly Review Meeting

Every Monday, review:

1. **Uptime Report**
   ```bash
   # Get from UptimeRobot dashboard
   # Target: > 99.9%
   # Review: Uptime %, incident list
   ```

2. **Error Trends**
   ```bash
   # From Sentry dashboard
   # Check: New issues, error rate, trend
   ```

3. **Performance Metrics**
   ```bash
   # From Vercel Analytics
   # Check: Response time, request volume
   ```

4. **Alert Quality**
   - False positives: Too many alerts?
   - Missed issues: Any alerts you didn't receive?
   - Adjust thresholds if needed

### Weekly Maintenance Checklist

```
[ ] Check uptime percentage (target: 99.9%)
[ ] Review error trends (target: < 0.1% error rate)
[ ] Check response times (target: < 500ms p95)
[ ] Review alert false positive rate
[ ] Verify all monitoring tools are accessible
[ ] Check Sentry quota usage
[ ] Verify Slack channel is receiving alerts
[ ] Update on-call rotation if needed
```

---

## Monthly Operations (1 hour)

### Monthly Health Review

First week of each month:

1. **Uptime Analysis**
   ```bash
   # Calculate monthly uptime
   # Sample: 99.95% uptime = 21.6 minutes downtime/month
   
   # From UptimeRobot: Export monthly report
   # Review incidents: causes, resolution time
   ```

2. **Error Analysis**
   ```bash
   # From Sentry: Get monthly error report
   # Top 10 errors: frequency, impact
   # New errors vs. recurring
   ```

3. **Performance Trends**
   ```bash
   # From Vercel: Get performance metrics
   # Average response time: trending up/down?
   # Peak load: when? how much?
   ```

4. **Cost Review**
   ```bash
   # Monitor costs
   - Vercel hosting: $$
   - Sentry error tracking: $$
   - UptimeRobot monitoring: $$
   - Slack: (included)
   - Total: $$
   
   # Target: Stay within budget
   ```

5. **Team Feedback**
   - Are alerts useful?
   - Are thresholds appropriate?
   - What's missing?

### Monthly Actions

```
[ ] Generate uptime report
[ ] Review top errors
[ ] Analyze performance trends
[ ] Update runbooks based on incidents
[ ] Adjust alert thresholds if needed
[ ] Review monitoring coverage
[ ] Plan improvements for next month
[ ] Document any configuration changes
```

---

## Incident Response

### Quick Decision Tree

```
Alert received
    │
    ├─→ Is service down?
    │   ├─→ YES: Critical (RED)
    │   │   └─→ Go to: CRITICAL INCIDENT
    │   │
    │   └─→ NO: Continue
    │
    ├─→ Are errors > 1%?
    │   ├─→ YES: High (YELLOW)
    │   │   └─→ Go to: HIGH PRIORITY
    │   │
    │   └─→ NO: Continue
    │
    └─→ Is response time > 2s?
        ├─→ YES: Medium (YELLOW)
        │   └─→ Go to: MEDIUM PRIORITY
        │
        └─→ NO: Low (GREEN)
            └─→ Go to: MONITOR & LOG
```

### CRITICAL INCIDENT (Service Down)

**Response Time:** < 5 minutes

1. **Acknowledge Alert** (30 seconds)
   - In Slack: React with 👀
   - Set status: "Investigating incident"

2. **Assess Situation** (1 minute)
   ```bash
   # 1. Check status endpoint
   curl https://thekpihub-platform.vercel.app/api/health/detailed
   
   # 2. Check Vercel deployment status
   # https://vercel.com/dashboard → kpihub-platform
   
   # 3. Check recent errors
   # https://sentry.io → Issues
   
   # 4. Check database status
   # https://supabase.com → Project → Database
   ```

3. **Find Root Cause** (2-3 minutes)
   - Check error messages in logs
   - Check recent deployments
   - Check external service status
   - See "Troubleshooting" section below

4. **Take Immediate Action**
   
   **If code issue:**
   ```bash
   git revert <bad-commit>
   git push origin main
   # Wait for redeploy (1-2 minutes)
   ```
   
   **If database issue:**
   - Check Supabase project status
   - Look for connection pool exhaustion
   - Restart connections if possible
   
   **If external service:**
   - Check service status page
   - Try fallback/degraded mode
   - Notify affected services

5. **Verify Recovery** (1 minute)
   ```bash
   curl https://thekpihub-platform.vercel.app/api/health
   # Should return 200 OK
   ```

6. **Update Team** (in Slack #alerts)
   ```
   🔴 CRITICAL: Platform down
   🚨 Root cause: [description]
   ✅ Action taken: [what you did]
   ⏱️ Time to recovery: [X minutes]
   📝 Post-mortem: [link to document]
   ```

### HIGH PRIORITY (Errors or Slow Response)

**Response Time:** < 1 hour

1. **Acknowledge Alert**
2. **Investigate** (see troubleshooting)
3. **Monitor** - Watch error rate for 10 minutes
4. **If not improving** - Escalate to team lead
5. **Document** - Add to incident log

### MEDIUM PRIORITY (Degradation)

**Response Time:** < 4 hours

1. **Log incident**
2. **Investigate when convenient**
3. **Plan fix** - Add to sprint
4. **Monitor** - Track trends

### LOW PRIORITY (Monitor Only)

**Response Time:** Next business day

1. **Log in incident tracker**
2. **Investigate during sprint planning**
3. **Fix in next release**

---

## Troubleshooting Guide

### Health Endpoint Returning 503

**Symptoms:** API returns HTTP 503 when checking health

```bash
# Verify what's actually failing
curl -v https://thekpihub-platform.vercel.app/api/health/detailed

# Check each service
curl -s https://thekpihub-platform.vercel.app/api/health/detailed | jq '.services'

# Expected: All services showing "healthy"
# Actual: Some showing "unhealthy"
```

**Diagnosis:**

```bash
# If database unhealthy:
# 1. Check Supabase status
#    Go to https://supabase.com/dashboard
# 2. Check connection pool
#    Settings → Database → Connection pooler
# 3. Check resource usage
#    Metrics → Check for high CPU/memory

# If Stripe unhealthy:
# 1. Verify STRIPE_SECRET_KEY is set
#    Go to Vercel → Settings → Environment Variables
# 2. Check key format (should start with sk_test_ or sk_live_)
# 3. Test key with Stripe dashboard

# If Anthropic unhealthy:
# 1. Verify ANTHROPIC_API_KEY is set
# 2. Check key format (should start with sk-)
# 3. Verify not rate-limited
```

**Fix:**

```bash
# Restart connection pool (Supabase)
# Settings → Database → Restart

# Reissue API key if expired (Stripe, Anthropic)
# Get new key from service dashboard
# Update Vercel environment variable
# Redeploy: git push origin main

# Clear Vercel cache
# Dashboard → Deployments → [Latest] → Redeploy
```

### High Error Rate (> 1%)

**Symptoms:** Sentry showing lots of errors

```bash
# Check top errors
# https://sentry.io → Issues → Order by "Frequency"

# Get recent error details
# Click on top error → See stack trace
```

**Common Causes:**

| Error | Cause | Fix |
|-------|-------|-----|
| Database connection error | Pool exhausted | Restart connection pool |
| Timeout error | Server overload | Check Vercel metrics |
| Auth error | Invalid credentials | Check env vars |
| Rate limit error | Too many requests | Check API usage |
| Missing env var | Config error | Update Vercel env vars |

**Fix:**

1. **Identify root cause** (see above)
2. **Apply fix** (varies by error)
3. **Monitor error rate** (should drop within 5 min)
4. **If not fixed**, escalate to team

### Slow Response Time (> 2s)

**Symptoms:** Health check returns responseTime > 2000

```bash
# Measure latency
time curl https://thekpihub-platform.vercel.app/api/health/detailed

# Check where time is spent
curl -s https://thekpihub-platform.vercel.app/api/health/detailed | jq '.services' | grep responseTime
```

**Common Causes:**

| Cause | Symptom | Fix |
|-------|---------|-----|
| Database slow | database.responseTime > 1000 | Check query performance |
| Cold start | First request slow | Enable keep-alive |
| Network latency | All responses slow | Check Vercel region |
| Memory pressure | GC pauses | Check memory usage |

**Fix:**

```bash
# For database slowness:
# 1. Check Supabase metrics
# 2. Look for slow queries
# 3. Add indexes if needed
# 4. Query optimization

# For cold starts:
# 1. Enable Vercel's "Always On" (if available)
# 2. Use keep-alive connections
# 3. Optimize bundle size

# For memory issues:
# 1. Check heap usage
# 2. Look for memory leaks
# 3. Reduce logging verbosity
```

### Monitor Showing "Down" But Platform Is Up

**Symptoms:** UptimeRobot or Sentry says down, but manual check shows up

```bash
# Verify manually
curl -I https://thekpihub-platform.vercel.app/api/health

# Check from different locations
# (Some monitoring services use multiple regions)
```

**Common Causes:**

| Cause | Solution |
|-------|----------|
| Temporary network issue | Wait 5 minutes, usually resolves |
| Monitor misconfigured | Verify URL in UptimeRobot settings |
| Firewall blocking monitor | Contact platform provider |
| DNS propagation delay | Wait for DNS cache clear (< 1 hour) |

**Fix:**

```bash
# 1. Verify endpoint manually
curl https://thekpihub-platform.vercel.app/api/health

# 2. Check monitor URL in UptimeRobot
# https://uptimerobot.com/dashboard → Monitor settings

# 3. Force monitor recheck
# Click "Refresh" button if available

# 4. If persistent, reconfigure monitor
# Delete and recreate with exact URL
```

---

## Alert Tuning

### Too Many False Alarms?

**Problem:** Receiving alerts for non-critical issues

**Solution:**

1. **Identify the pattern**
   - Which alerts are false?
   - When do they occur?
   - What's the actual impact?

2. **Adjust thresholds**

   **UptimeRobot:**
   - Current: Alert on first failure
   - Better: Alert after 2 consecutive failures
   - Go to: Monitor Settings → Alert Contacts

   **Sentry:**
   - Current: Alert on every error
   - Better: Alert only on > 1% error rate
   - Go to: Settings → Alerts → Alert Rules

3. **Create custom rules**
   ```bash
   # Example: Alert only on production errors
   # Sentry: Add filter for environment:production
   
   # Example: Ignore known-safe errors
   # Sentry: Add rule to ignore 404s from crawlers
   ```

### Missing Critical Alerts?

**Problem:** Critical issue occurred but no alert received

**Solution:**

1. **Check alert configuration**
   ```bash
   # Verify Slack webhook is working
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test alert"}'
   
   # Should appear in #alerts within 1 second
   ```

2. **Check thresholds**
   ```bash
   # Are thresholds too high?
   # Example: Alerting only on 100% error rate
   # Solution: Lower to 5% or 10%
   ```

3. **Verify alert routing**
   - Sentry → Settings → Integrations → Slack ✓
   - UptimeRobot → Settings → Alert Contacts ✓
   - Both pointing to correct channels?

4. **Test alerts**
   ```bash
   # Create test incident
   # Sentry: Manually create test issue
   # UptimeRobot: Temporarily break monitor
   # Verify alert received
   ```

---

## Performance Optimization

### Improve Response Time

**Target:** < 500ms for /api/health/detailed

1. **Measure baseline**
   ```bash
   time curl https://thekpihub-platform.vercel.app/api/health/detailed
   ```

2. **Identify slow component**
   ```bash
   curl -s https://thekpihub-platform.vercel.app/api/health/detailed | jq '.services[] | {name, responseTime}'
   ```

3. **Optimize slowest service**

   **Database slow:**
   - Add query indexes
   - Optimize ORM queries
   - Enable connection pooling

   **External API slow:**
   - Add caching (5-10 seconds)
   - Use async checks
   - Implement timeout (< 1 second)

4. **Verify improvement**
   ```bash
   time curl https://thekpihub-platform.vercel.app/api/health/detailed
   # Should be faster than baseline
   ```

### Reduce Memory Usage

**Target:** heapUsed < 100MB

1. **Check current usage**
   ```bash
   curl -s https://thekpihub-platform.vercel.app/api/health/detailed | jq '.metrics.memory'
   ```

2. **Identify leaks**
   - Look for increasing memory over time
   - Compare after major operations
   - Use Vercel metrics dashboard

3. **Optimize code**
   - Clear unused connections
   - Implement object pooling
   - Reduce logging verbosity
   - Cache aggressively

4. **Verify improvement**
   ```bash
   # Check memory after changes
   curl -s https://thekpihub-platform.vercel.app/api/health/detailed | jq '.metrics.memory'
   ```

---

## Runbooks

### Runbook Template

```markdown
# [Service] Incident Runbook

## Quick Facts
- Service: [name]
- Criticality: [High/Medium/Low]
- MTTR Target: [X minutes]
- On-call: [@person]

## Detection
- Alert: [UptimeRobot/Sentry/Datadog]
- Symptom: [what user sees]

## Diagnosis
1. Step 1
2. Step 2
3. Step 3

## Resolution
### If cause is X:
- Action 1
- Action 2

### If cause is Y:
- Action 1
- Action 2

## Post-Incident
- [ ] Document root cause
- [ ] Create ticket for fix
- [ ] Post-mortem review
```

### Common Runbooks

1. **Database Connection Pool Exhausted**
   ```
   Symptom: Database errors, health check returns unhealthy
   Fix: Restart connection pool in Supabase dashboard
   Prevention: Monitor connection count, set higher limit
   ```

2. **High Memory Usage**
   ```
   Symptom: Slowdown, potential OOM kill
   Fix: Identify and fix memory leak, restart service
   Prevention: Monitor trends, add memory alerts
   ```

3. **Stripe Integration Down**
   ```
   Symptom: Billing failures
   Fix: Check Stripe API status, verify credentials
   Prevention: Add Stripe status to monitoring
   ```

---

## Dashboards

### Create Executive Dashboard

For leadership visibility:

1. **Daily Status**
   - Uptime % (24h, 7d, 30d)
   - Error rate
   - Response time

2. **Trends**
   - Uptime trend (30d)
   - Error rate trend (30d)
   - Performance trend (30d)

3. **Incidents**
   - Incidents this month
   - Average MTTR
   - Top causes

### Tools

- **Vercel:** Built-in analytics
- **Sentry:** Custom dashboards
- **Datadog:** APM dashboards (paid)
- **Grafana:** Open-source (self-hosted)

---

## Escalation Procedures

### Escalation Levels

```
Level 1: On-Call Engineer
- Incident response
- Temporary mitigations
- Investigation

Level 2: Team Lead
- Complex issues
- System design decisions
- Customer communication

Level 3: Engineering Director
- Major incidents
- Service architecture changes
- Post-incident reviews
```

### When to Escalate

```
Escalate to Level 2 if:
- Outage > 15 minutes
- Unable to identify root cause
- Multiple services affected
- Customer impact confirmed

Escalate to Level 3 if:
- Outage > 1 hour
- Data loss or security issue
- Requires system redesign
- Public communication needed
```

---

## Documentation

Maintain these documents:

1. **Runbooks** - Incident response procedures
2. **Incident Log** - History of issues
3. **Alert Configuration** - Current thresholds
4. **Architecture Diagram** - System overview
5. **Escalation Procedures** - Who to contact
6. **Known Issues** - Workarounds

---

## Metrics to Track

### Key Performance Indicators (KPIs)

| Metric | Target | Frequency |
|--------|--------|-----------|
| Uptime % | 99.9% | Daily |
| Error Rate | < 0.1% | Daily |
| Response Time p95 | < 500ms | Daily |
| MTTR | < 30 min | Weekly |
| Alert Accuracy | > 95% | Weekly |
| Incident Count | < 2/month | Monthly |

### Example Report

```
Weekly Operational Report
Week of Aug 21-27, 2026

Uptime: 99.96% ✅ (Target: 99.9%)
Error Rate: 0.03% ✅ (Target: 0.1%)
Response Time: 245ms ✅ (Target: 500ms)
MTTR: 12 minutes ✅ (Target: 30 min)
Incidents: 1 (Database slowness - resolved)

Alerts:
- Total: 47
- False positives: 3 (6%)
- Actionable: 44 (94%)

Actions:
- Adjusted alert threshold for response time
- Added monitoring for Stripe API
- Optimized database query performance
```

---

## Monthly Checklist

```
First Monday of Month:
[ ] Review uptime report
[ ] Analyze error trends
[ ] Check performance metrics
[ ] Review alert quality
[ ] Generate executive report

Mid-Month:
[ ] Verify monitoring tools working
[ ] Check disk space / quotas
[ ] Review incident backlog
[ ] Plan improvements

End of Month:
[ ] Document lessons learned
[ ] Update runbooks
[ ] Plan next month's improvements
[ ] Archive incident data
```

---

## Support & Escalation

### Getting Help

| Issue | Contact | Response Time |
|-------|---------|---|
| Health endpoints down | On-call engineer | 5 min |
| Monitoring not working | Platform team | 15 min |
| Sentry quota exceeded | DevOps lead | 30 min |
| False alerts tuning | Team lead | 2 hours |

### Resources

- **Sentry Docs:** https://docs.sentry.io/
- **UptimeRobot Help:** https://uptimerobot.com/help
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

**Last Updated:** Aug 27, 2026  
**Status:** Production  
**Review Frequency:** Monthly

🚀 Phase D Operations Complete!
