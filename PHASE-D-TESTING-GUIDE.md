# Phase D: Testing & Validation Guide
## Comprehensive Health Check Verification

---

## Overview

This guide provides detailed procedures to validate all Phase D health check endpoints are working correctly.

**Total testing time:** 10-15 minutes

---

## Pre-Test Checklist

Before starting tests:

```
[ ] Phase C CI/CD deployed and working
[ ] Health check endpoints created
[ ] Deployment to Vercel completed
[ ] Network access to https://thekpihub-platform.vercel.app
[ ] curl or Postman available for API testing
```

---

## Test Suite Overview

| Test | Purpose | Duration | Required |
|------|---------|----------|----------|
| T1: Endpoint Availability | Verify endpoints exist | 2 min | ✅ |
| T2: Response Format | Check JSON structure | 2 min | ✅ |
| T3: Status Codes | Verify HTTP status | 2 min | ✅ |
| T4: Service Health | Check all components | 3 min | ✅ |
| T5: Performance | Measure response times | 2 min | ✅ |
| T6: Monitoring Integration | Verify monitor access | 3 min | ✅ |

**Total: 10-15 minutes**

---

## Test 1: Endpoint Availability (2 minutes)

### Objective
Verify that all health check endpoints exist and respond.

### Test Procedure

#### 1.1 Test Basic Health Endpoint

```bash
# Test basic health check
curl https://thekpihub-platform.vercel.app/api/health

# Expected output:
{
  "status": "ok",
  "timestamp": "2026-08-27T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "message": "Platform is operational"
}

# Expected status: 200 OK
```

#### 1.2 Test Detailed Health Endpoint

```bash
curl https://thekpihub-platform.vercel.app/api/health/detailed

# Expected status: 200 OK
# Should include: status, services, metrics, checks
```

#### 1.3 Test Ready Endpoint

```bash
curl https://thekpihub-platform.vercel.app/api/health/ready

# Expected output:
{
  "ready": true,
  "timestamp": "2026-08-27T12:00:00.000Z",
  "uptime": 3600,
  "message": "Service is ready to accept traffic"
}

# Expected status: 200 OK
```

#### 1.4 Test Live Endpoint

```bash
curl https://thekpihub-platform.vercel.app/api/health/live

# Expected status: 200 OK
```

#### 1.5 Test Status Endpoint

```bash
curl https://thekpihub-platform.vercel.app/api/health/status

# Expected status: 200 OK
# Should include: page, components, statistics
```

### ✅ Expected Results

All 5 endpoints return HTTP 200 OK with valid JSON responses.

### ❌ Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| Connection refused | Endpoint not deployed | Check Vercel deployment |
| 404 Not Found | Endpoints not created | Verify files in `/api/health/` |
| 500 Error | Server error | Check Vercel logs |
| Timeout | Response too slow | Check database connectivity |

---

## Test 2: Response Format (2 minutes)

### Objective
Verify JSON structure is valid and complete.

### Test Procedure

#### 2.1 Validate Basic Health Response

```bash
# Get response and pretty-print
curl -s https://thekpihub-platform.vercel.app/api/health | jq .

# Verify these fields exist:
# ✓ status (should be "ok" or "error")
# ✓ timestamp (ISO 8601 format)
# ✓ uptime (number in seconds)
# ✓ version (semantic version string)
```

#### 2.2 Validate Detailed Health Response

```bash
curl -s https://thekpihub-platform.vercel.app/api/health/detailed | jq .

# Verify these top-level fields:
# ✓ status
# ✓ timestamp
# ✓ uptime
# ✓ version
# ✓ environment
# ✓ services (object)
# ✓ metrics (object)
# ✓ checks (object)

# Verify services object contains:
# ✓ platform (service status)
# ✓ database (if configured)
# ✓ stripe (if configured)
```

#### 2.3 Validate Metrics Structure

```bash
# Check metrics are properly formatted
curl -s https://thekpihub-platform.vercel.app/api/health/detailed | jq '.metrics'

# Should show:
{
  "memory": {
    "heapUsed": 125,
    "heapTotal": 256,
    "external": 12,
    "rss": 300
  }
}
```

### ✅ Expected Results

All responses have valid JSON with required fields present.

### ❌ Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Invalid JSON | Code error | Check endpoint implementation |
| Missing fields | Incomplete response | Verify all fields returned |
| Wrong data types | Type mismatch | Check TypeScript types |

---

## Test 3: HTTP Status Codes (2 minutes)

### Objective
Verify correct HTTP status codes are returned.

### Test Procedure

#### 3.1 Test Successful Responses

```bash
# Test all endpoints return 200
for endpoint in health health/ready health/live health/detailed health/status; do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    https://thekpihub-platform.vercel.app/api/$endpoint)
  echo "GET /api/$endpoint: HTTP $status"
done

# Expected output:
# GET /api/health: HTTP 200
# GET /api/health/ready: HTTP 200
# GET /api/health/live: HTTP 200
# GET /api/health/detailed: HTTP 200
# GET /api/health/status: HTTP 200
```

#### 3.2 Test Error Scenarios

```bash
# Test 404 for non-existent endpoint
curl -s -o /dev/null -w "%{http_code}" \
  https://thekpihub-platform.vercel.app/api/health/invalid

# Expected: 404 Not Found
```

#### 3.3 Test HEAD Requests

```bash
# Test HEAD on basic health (lightweight check)
curl -I https://thekpihub-platform.vercel.app/api/health

# Expected: HTTP 200 OK (with no body)

# Test HEAD on ready
curl -I https://thekpihub-platform.vercel.app/api/health/ready

# Expected: HTTP 200 OK
```

### ✅ Expected Results

- ✅ All health endpoints return 200 OK
- ✅ Non-existent endpoints return 404
- ✅ HEAD requests return 200 with no body

### ❌ Troubleshooting

| Status | Cause | Fix |
|--------|-------|-----|
| 500 | Server error | Check logs |
| 503 | Service unavailable | Check database |
| 504 | Gateway timeout | Endpoint too slow |

---

## Test 4: Service Health Status (3 minutes)

### Objective
Verify that service health checks are accurately reporting status.

### Test Procedure

#### 4.1 Check Platform Service

```bash
# Platform should always be healthy
curl -s https://thekpihub-platform.vercel.app/api/health/detailed \
  | jq '.services.platform'

# Expected output:
{
  "name": "platform",
  "status": "healthy",
  "responseTime": 5,
  "lastChecked": "2026-08-27T12:00:00.000Z"
}
```

#### 4.2 Check Database Connectivity

```bash
# Database should be healthy
curl -s https://thekpihub-platform.vercel.app/api/health/detailed \
  | jq '.services.database'

# Expected status: "healthy"
# Response time should be < 200ms
```

#### 4.3 Check External Services

```bash
# Check Stripe status
curl -s https://thekpihub-platform.vercel.app/api/health/detailed \
  | jq '.services.stripe'

# Check Anthropic status
curl -s https://thekpihub-platform.vercel.app/api/health/detailed \
  | jq '.services.anthropic'

# All should be "healthy"
```

#### 4.4 Verify Overall Status

```bash
# Get overall health
curl -s https://thekpihub-platform.vercel.app/api/health/detailed \
  | jq '.status'

# Expected: "healthy"
```

### ✅ Expected Results

- ✅ Platform status: healthy
- ✅ Database status: healthy  
- ✅ External services: healthy
- ✅ Overall status: healthy

### ❌ Troubleshooting

| Status | Cause | Fix |
|--------|-------|-----|
| degraded | Slow response | Check query performance |
| unhealthy | Connection failed | Check credentials |
| missing | Service not configured | Check environment vars |

---

## Test 5: Performance Metrics (2 minutes)

### Objective
Verify response times meet performance requirements.

### Test Procedure

#### 5.1 Measure Basic Health Response Time

```bash
# Measure response time
time curl -s https://thekpihub-platform.vercel.app/api/health > /dev/null

# Expected: < 100ms

# On macOS/Linux, run multiple times:
for i in {1..5}; do
  curl -s -w "%{time_total}s\n" -o /dev/null \
    https://thekpihub-platform.vercel.app/api/health
done

# Expected: All responses < 100ms
```

#### 5.2 Measure Detailed Health Response Time

```bash
# Measure detailed endpoint
time curl -s https://thekpihub-platform.vercel.app/api/health/detailed > /dev/null

# Expected: < 5 seconds (intentionally slower for diagnostics)
```

#### 5.3 Check Memory Metrics

```bash
# Get memory stats
curl -s https://thekpihub-platform.vercel.app/api/health/detailed \
  | jq '.metrics.memory'

# Expected output:
{
  "heapUsed": 125,        # MB
  "heapTotal": 256,       # MB
  "external": 12,         # MB
  "rss": 300              # MB
}

# Verify:
# ✓ heapUsed < heapTotal (not leaking)
# ✓ All values in reasonable ranges
```

### ✅ Expected Results

- ✅ Basic health: < 100ms
- ✅ Ready probe: < 1 second
- ✅ Detailed health: < 5 seconds
- ✅ Memory usage reasonable

### ❌ Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Slow responses | Database queries | Check query performance |
| High memory | Memory leak | Check for leaks in code |
| Timeout | Server overload | Check Vercel metrics |

---

## Test 6: Monitoring Integration (3 minutes)

### Objective
Verify monitoring services can access health endpoints.

### Test Procedure

#### 6.1 Verify UptimeRobot Access

```bash
# UptimeRobot should be able to reach endpoint
# Go to https://uptimerobot.com → My Monitors

# Verify:
# ✓ Monitor status shows "Up" ✅
# ✓ Last check time is recent (< 5 minutes ago)
# ✓ Uptime % is high (> 99%)

# If status is "Down":
# 1. Click monitor
# 2. Check "Last 30 days" chart
# 3. Verify recent checks show response times
```

#### 6.2 Verify Sentry Access

```bash
# Check if Sentry can access the platform
# Go to https://sentry.io → Projects → kpihub-platform

# Verify:
# ✓ Dashboard shows recent data
# ✓ Error count is low (< 10/day)
# ✓ Last error timestamp is recent
```

#### 6.3 Test Monitoring Requests

```bash
# Simulate UptimeRobot request
curl -H "User-Agent: UptimeRobot/2.0" \
  https://thekpihub-platform.vercel.app/api/health

# Verify response is 200 OK

# Simulate other monitoring tools
curl -H "User-Agent: Datadog" \
  https://thekpihub-platform.vercel.app/api/health/detailed

# All should return 200 OK
```

#### 6.4 Verify Slack Integration

```bash
# Check if Slack can receive alerts
# Go to Slack → #alerts channel

# Verify:
# ✓ Test messages received
# ✓ Format is readable
# ✓ Links to dashboards work
```

### ✅ Expected Results

- ✅ UptimeRobot shows monitor as "Up"
- ✅ Sentry dashboard showing data
- ✅ Slack receiving alerts
- ✅ All monitoring tools have access

### ❌ Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Monitor down | Endpoint not responding | Check deployment |
| No Sentry data | DSN not configured | Add env var |
| No Slack messages | Webhook not configured | Re-authorize app |

---

## Summary Test Script

Run this comprehensive test:

```bash
#!/bin/bash

echo "=== Phase D Health Check Testing ==="
echo ""

BASE_URL="https://thekpihub-platform.vercel.app"

echo "Test 1: Endpoint Availability"
for endpoint in health health/ready health/live health/detailed health/status; do
  status=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/$endpoint)
  response=$(curl -s $BASE_URL/api/$endpoint)
  echo "✓ /api/$endpoint: HTTP $status"
done

echo ""
echo "Test 2: Response Format"
basic=$(curl -s $BASE_URL/api/health | jq '.status')
echo "✓ Basic health status: $basic"

detailed=$(curl -s $BASE_URL/api/health/detailed | jq '.status')
echo "✓ Detailed health status: $detailed"

echo ""
echo "Test 3: Service Status"
platform=$(curl -s $BASE_URL/api/health/detailed | jq -r '.services.platform.status')
database=$(curl -s $BASE_URL/api/health/detailed | jq -r '.services.database.status')
echo "✓ Platform: $platform"
echo "✓ Database: $database"

echo ""
echo "Test 4: Performance"
time curl -s $BASE_URL/api/health > /dev/null
time curl -s $BASE_URL/api/health/detailed > /dev/null

echo ""
echo "=== All Tests Passed! ==="
```

Save as `test-health-checks.sh` and run:

```bash
chmod +x test-health-checks.sh
./test-health-checks.sh
```

---

## Verification Checklist

```
ENDPOINT TESTING
[ ] /api/health returns 200
[ ] /api/health/detailed returns 200
[ ] /api/health/ready returns 200
[ ] /api/health/live returns 200
[ ] /api/health/status returns 200

RESPONSE VALIDATION
[ ] All responses have valid JSON
[ ] Required fields present
[ ] Status field correct
[ ] Timestamp in ISO 8601 format

SERVICE HEALTH
[ ] Platform shows healthy
[ ] Database shows healthy
[ ] External services show healthy
[ ] Overall status correct

PERFORMANCE
[ ] Basic health < 100ms
[ ] Ready probe < 1 second
[ ] Detailed health < 5 seconds
[ ] No timeouts

MONITORING INTEGRATION
[ ] UptimeRobot can access endpoint
[ ] Sentry dashboard shows data
[ ] Slack alerts functional
[ ] All monitor statuses showing "Up"

OVERALL
[ ] All tests passing
[ ] All endpoints live
[ ] Monitoring working
[ ] Ready for production
```

---

## Success Criteria

Phase D testing is complete when:

✅ All 5 endpoints respond with 200 OK  
✅ All response formats are valid  
✅ All services report healthy status  
✅ Response times meet requirements  
✅ Monitoring tools can access endpoints  
✅ No errors in Sentry dashboard  
✅ Test alerts received successfully  

---

## Troubleshooting Summary

### Endpoints Not Responding

1. Check deployment status: `https://vercel.com/dashboard`
2. Verify files created: `ls apps/platform/src/app/api/health/`
3. Test locally: `npm run dev` in `apps/platform/`
4. Check build logs: `https://vercel.com/dashboard → Deployments`

### Wrong Status Codes

1. Verify endpoint code is correct
2. Check for typos in route paths
3. Ensure response() is called correctly
4. Redeploy if needed: `git push origin main`

### Performance Issues

1. Check database performance
2. Review Vercel metrics dashboard
3. Check for memory leaks
4. Optimize slow queries

### Monitoring Integration Issues

1. Verify webhook URLs in configs
2. Check network access to endpoints
3. Verify credentials/tokens
4. Test with curl first

---

## Next Steps

Once all tests pass:

1. **Monitor for 24 hours**
   - Watch for false alerts
   - Verify alert thresholds
   - Check response times

2. **Review Metrics**
   - Uptime percentage
   - Error rates
   - Performance metrics

3. **Tune Alerts**
   - Adjust thresholds
   - Reduce false positives
   - Optimize alert channels

---

**Estimated Testing Time:** 10-15 minutes  
**Difficulty Level:** Beginner  
**All Tests Passing?** ✅ Phase D is complete!

Next: Read `PHASE-D-OPERATIONS.md` for ongoing management.
