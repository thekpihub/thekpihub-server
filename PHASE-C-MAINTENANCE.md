# Phase C: Maintenance & Operations Guide
## Long-Term CI/CD Pipeline Management

---

## Overview

This guide covers the ongoing maintenance, monitoring, and operations of your Phase C CI/CD pipeline.

**Intended audience:** DevOps engineers, technical leads, developers with deployment responsibilities

---

## Daily Operations

### Daily Checklist (5 minutes)

**Every day, review:**

1. **GitHub Actions Status**
   - URL: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
   - Look for: Any red X marks on recent CI or Deploy workflows
   - Action: If red, check what failed and notify team

2. **Vercel Deployment Status**
   - URL: https://vercel.com/dashboard
   - Look for: Any failed deployments
   - Action: If red, check logs and redeploy if needed

3. **Live Site Status**
   - URL: https://thekpihub-platform.vercel.app
   - Check: Page loads, no error messages
   - Action: If broken, investigate immediately

### Quick Status Check Commands

```bash
# Check if CI is passing on latest commits
cd /home/user/kpihub-assembled
git log --oneline -n 5

# Then go to GitHub Actions to see status of each commit
# Or use GitHub CLI:
gh run list --repo hsharmagxi-debug/kpihub-assembled --limit 5

# Check live site health
curl -I https://thekpihub-platform.vercel.app

# Expected: HTTP 200 OK
```

---

## Weekly Maintenance (30 minutes)

### Weekly Tasks

**Every Monday (or start of week):**

1. **Review CI/CD Logs**
   ```bash
   # Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
   # Check all workflows from past week
   # Look for patterns or repeated failures
   # Document any issues
   ```

2. **Check Deployment Success Rate**
   ```
   Target: >95% of deployments should succeed
   If <95%: Investigate root cause of failures
   ```

3. **Review Vercel Logs for Errors**
   - Go to: https://vercel.com/dashboard → Deployments
   - Click on failed deployments (if any)
   - Note error messages
   - Fix underlying issues

4. **Update Documentation**
   - If procedures changed, update these guides
   - Document new issues discovered
   - Update troubleshooting guide

5. **Performance Review**
   - Check average CI duration (should be 3-5 min)
   - Check average Deploy duration (should be 2-3 min)
   - Note any regressions
   - Optimize if needed (see Performance Optimization below)

6. **Team Communication**
   - Email team with status report
   - Share deployment statistics
   - Note any upcoming changes

---

## Secret Rotation (Every 3 months)

### Why Rotate Secrets?

- Reduces impact if token is compromised
- Removes access from inactive team members
- Follows security best practices
- Required by some compliance standards

### Secret Rotation Procedure

**Time required: 10 minutes**

**Step 1: Create New Vercel Token**

1. Go to: https://vercel.com/account/tokens
2. Click "Create"
3. Name: `github-actions-ci-cd-v2` (increment version)
4. Scope: Full account access
5. Click "Create Token"
6. **Copy the token immediately** (you won't see it again)

**Step 2: Update GitHub Secret**

```bash
# Using GitHub CLI (easiest)
gh secret set VERCEL_TOKEN --repo hsharmagxi-debug/kpihub-assembled << EOF
<paste new token here>
EOF

# Or using web UI:
# 1. Go to https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
# 2. Click VERCEL_TOKEN
# 3. Click "Update"
# 4. Paste new token
# 5. Click "Update secret"
```

**Step 3: Verify New Token Works**

```bash
# Push a test commit
cd /home/user/kpihub-assembled
git commit -m "test: verify rotated Vercel token" --allow-empty
git push origin main

# Watch deployment:
# Go to https://github.com/hsharmagxi-debug/kpihub-assembled/actions
# Verify CI and Deploy both pass with new token
```

**Step 4: Revoke Old Token**

1. Go to: https://vercel.com/account/tokens
2. Find the old token (by date or name)
3. Click the delete/revoke button
4. Confirm revocation

**Step 5: Document the Change**

```bash
# Create a log entry
echo "2026-08-27 - Rotated VERCEL_TOKEN - v1 -> v2" >> /tmp/rotation-log.txt
```

### Rotation Schedule

| Secret | Rotation Interval | Last Rotated | Next Due |
|--------|------------------|--------------|----------|
| VERCEL_TOKEN | 3 months | 2026-08-27 | 2026-11-27 |
| VERCEL_ORG_ID | Never* | 2026-08-01 | N/A |
| VERCEL_PROJECT_ID | Never* | 2026-08-01 | N/A |

*Note: ORG_ID and PROJECT_ID are IDs, not tokens. Don't rotate these unless IDs change.

### Setting Rotation Reminders

```bash
# Create a calendar reminder (example using date command)
date -d "+3 months" +"%Y-%m-%d"  # Shows when to rotate next

# Or set a GitHub Issue reminder:
# Go to Issues → New Issue
# Title: "Secret Rotation Due: VERCEL_TOKEN"
# Due date: 3 months from now
# Label: maintenance
```

---

## Troubleshooting & Common Issues

### CI Workflow Issues

#### Issue: CI takes >10 minutes (slow)

**Causes:**
- First-time build (no cache)
- Large dependency update
- GitHub Actions runner overloaded
- Network issues

**Solutions:**

```bash
# 1. Check cache status
# Go to GitHub Actions
# Look for "Cache hit" message in npm ci step
# If "Cache miss", build will be slower

# 2. Force clean cache (last resort)
# Go to https://github.com/hsharmagxi-debug/kpihub-assembled/actions
# Click "Actions" → "Caches"
# Find npm cache
# Click delete ("Remove")
# Next run will be slower but fresh

# 3. Optimize dependencies
npm audit --fix
npm prune  # Remove unused dependencies
git add package*.json
git commit -m "chore: optimize dependencies"
git push origin main

# 4. Check Node.js version
# Ensure using LTS version (20.x)
# See .github/workflows/ci.yml line 20-21
```

#### Issue: CI fails with "Cannot find module X"

**Cause:** Dependency installation failed

**Solutions:**

```bash
# 1. Regenerate lockfile
rm package-lock.json
npm install
git add package-lock.json
git commit -m "chore: regenerate package-lock.json"
git push origin main

# 2. Clear node_modules
rm -rf node_modules
npm install
git add package-lock.json
git commit -m "chore: reinstall dependencies"
git push origin main

# 3. Check for corrupted cache
# Go to GitHub Actions → Caches
# Delete npm cache
# Next push will rebuild from scratch
```

#### Issue: CI fails with TypeScript errors

**Cause:** Code has type errors

**Solutions:**

```bash
# 1. Check errors locally
npm run typecheck

# 2. Fix all errors
# Follow the error messages
# Update type definitions if needed

# 3. Commit and push
git add .
git commit -m "fix: resolve TypeScript compilation errors"
git push origin main
```

### Deployment Issues

#### Issue: Deploy skipped (no deployment workflow starts)

**Causes:**
- CI didn't actually pass
- Secrets not configured
- Workflow file has errors

**Solutions:**

```bash
# 1. Verify CI actually passed
# Go to GitHub Actions
# Check CI workflow status (must be green ✓)

# 2. Verify secrets
gh secret list --repo hsharmagxi-debug/kpihub-assembled
# Should show all 3: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

# 3. Check workflow file
cat .github/workflows/deploy.yml | grep -A 5 "if:"
# Should have: if: ${{ github.event.workflow_run.conclusion == 'success' }}

# 4. Manually trigger deployment
# Go to GitHub Actions
# Find Deploy workflow
# Click "Run workflow"
# Select main branch
# Click "Run workflow"
```

#### Issue: Deploy fails with "Unauthorized" or "403 Forbidden"

**Cause:** Invalid Vercel credentials

**Solutions:**

```bash
# 1. Verify token is valid
# Go to https://vercel.com/account/tokens
# Check if token still exists
# If not, create new one

# 2. Verify token has correct permissions
# Go to https://vercel.com/account/tokens
# Click the token
# Should show full account access

# 3. Verify token in GitHub is correct
gh secret set VERCEL_TOKEN --repo hsharmagxi-debug/kpihub-assembled

# 4. Verify Org ID and Project ID
# Go to https://vercel.com/dashboard
# Bottom left: "Org ID: xxxxxxx"
# Check against GitHub secret: VERCEL_ORG_ID

# Go to project settings
# Check "Project ID: xxxxxxx"
# Check against GitHub secret: VERCEL_PROJECT_ID

# 5. Rotate token if needed
# Follow "Secret Rotation" procedure above
```

#### Issue: Deployment succeeds but site doesn't update

**Cause:** Cache or old deployment still serving

**Solutions:**

```bash
# 1. Force refresh browser
# Ctrl+Shift+Delete → Clear cache
# Or Ctrl+Shift+R (hard refresh)

# 2. Check Vercel has latest version
curl -I https://thekpihub-platform.vercel.app
# Check Last-Modified header (should be recent)

# 3. Redeploy in Vercel
# Go to https://vercel.com/dashboard
# Click kpihub-platform → Deployments
# Find latest deployment
# Click "..." → "Redeploy"

# 4. Check environment variables
# Go to Settings → Environment Variables
# Verify all vars are present
# If changed recently, variables need redeploy to take effect
# Redeploy using option above

# 5. Check Vercel cache settings
# Go to Settings → Cache
# Click "Clear All"
# Then redeploy
```

### Site Accessibility Issues

#### Issue: Site returns 404

**Cause:** Site not deployed or routing issue

**Solutions:**

```bash
# 1. Check deployment status
curl -I https://thekpihub-platform.vercel.app

# 2. Check recent deployments
# Go to https://vercel.com/dashboard
# Verify latest deployment shows "Ready" ✓

# 3. Check deployment logs for errors
# Go to latest deployment
# Click "Logs" tab
# Look for error messages

# 4. Check GitHub Actions
# Verify Deploy job succeeded
# If failed, see "Deploy fails" section above

# 5. Wait for DNS propagation
# New deployments can take up to 2 minutes to be live
# If recent deployment, wait and retry
```

#### Issue: Site returns 500 error

**Cause:** Application crash or missing configuration

**Solutions:**

```bash
# 1. Check environment variables
# Go to https://vercel.com/dashboard
# Click kpihub-platform → Settings → Environment Variables
# Verify all vars present (especially NEXT_PUBLIC_*)

# 2. Check application logs
# Go to Vercel Deployments
# Click latest deployment
# Look for error logs
# Check specific component that's failing

# 3. Check if local build works
cd /home/user/kpihub-assembled/apps/platform
npm run build
npm run start
# If errors, fix locally first

# 4. Review recent code changes
git log --oneline -n 5
git show <commit-sha>
# Check what changed recently

# 5. Redeploy after fixing
git add .
git commit -m "fix: resolve 500 error"
git push origin main
```

---

## Performance Monitoring

### Key Metrics to Track

**CI Performance:**
```bash
# Expected: 3-5 minutes total
# Track:
# - npm ci duration (should be 1-2 min)
# - typecheck duration (should be 1-2 min)
# - build duration (should be 1-3 min)

# If any significantly slower, investigate
```

**Deployment Performance:**
```bash
# Expected: 2-3 minutes total
# Track:
# - Time from CI completion to Deploy start (should be <1 min)
# - Vercel build time (should be 60-180 seconds)
# - Time to "Ready" status (should be 2-3 min)
```

**Application Performance:**
```bash
# Expected: Page load <3 seconds
curl -w "%{time_total}s\n" -o /dev/null -s https://thekpihub-platform.vercel.app
# Should return something like "1.234s"

# If >3 seconds, check:
# - Supabase query performance
# - Image sizes (use CDN)
# - JavaScript bundle size
# - Database load
```

### Performance Optimization

**If CI is slow (>6 minutes):**

1. **Analyze cache effectiveness**
   - Go to GitHub Actions workflow logs
   - Look for "Cache hit: false"
   - If false, dependencies are being reinstalled every time
   - Solution: GitHub cache might be expired or too large

2. **Optimize dependencies**
   ```bash
   # Check for unused dependencies
   npm audit
   
   # Remove unused packages
   npm prune
   
   # Update to latest versions
   npm update
   
   # Reduce bundle size
   npm ls  # Show dependency tree
   ```

3. **Optimize build process**
   ```bash
   # Check what takes time
   # Review .github/workflows/ci.yml
   # Consider adding caching for specific directories
   ```

**If Deployment is slow (>5 minutes):**

1. **Check Vercel build logs**
   - Identify which part is slow
   - Next.js compile time?
   - Static generation?
   - Asset optimization?

2. **Optimize Next.js build**
   ```bash
   # Check vercel.json
   cat vercel.json | grep -E "buildCommand|env"
   
   # Consider:
   # - Reducing static pages generated
   # - Using ISR (Incremental Static Regeneration)
   # - Splitting build into stages
   ```

3. **Reduce application size**
   ```bash
   # Check built application size
   du -sh apps/platform/.next
   
   # Optimize:
   # - Remove unused code
   # - Use dynamic imports
   # - Compress images
   ```

**If site load is slow (>3 seconds):**

1. **Profile with browser DevTools**
   - Open site: https://thekpihub-platform.vercel.app
   - F12 → Network tab
   - Look for slow requests
   - Identify bottleneck (JS? CSS? API?)

2. **Check Vercel analytics**
   - Go to Vercel dashboard → Analytics
   - View Core Web Vitals
   - See where time is spent

3. **Optimize frontend**
   - Lazy load images
   - Code split JavaScript
   - Defer non-critical CSS
   - Cache assets

---

## Monitoring & Alerting

### Setting Up Notifications

**GitHub Notifications:**
1. Go to: https://github.com/notifications
2. Configure notification preferences
3. Set to: Email for workflow failures

**Vercel Notifications:**
1. Go to: https://vercel.com/account/notifications
2. Enable: Deployment failed alerts
3. Enable: Deployment recovery alerts

**Custom Alerts (Optional):**

```bash
# Create a health check script
cat > /home/user/check-deployment.sh << 'EOF'
#!/bin/bash

# Check if site is live
status=$(curl -s -o /dev/null -w "%{http_code}" https://thekpihub-platform.vercel.app)

if [ "$status" -ne 200 ]; then
  echo "ALERT: Site returned HTTP $status at $(date)"
  # Send email or Slack notification
  # curl -X POST https://hooks.slack.com/... -d "{text: 'Site down!'}"
else
  echo "OK: Site is live (HTTP $status) at $(date)"
fi
EOF

chmod +x /home/user/check-deployment.sh

# Run it periodically (every 5 minutes)
# Add to crontab:
# */5 * * * * /home/user/check-deployment.sh
```

### Vercel Analytics

**View deployment metrics:**

1. Go to: https://vercel.com/dashboard → kpihub-platform → Analytics
2. Check:
   - Page load performance
   - Core Web Vitals
   - Top slow pages
   - Error rates

**Track over time:**
- Create weekly performance reports
- Identify trends
- Alert if performance degrades

---

## Emergency Procedures

### Site Down - Immediate Response

**If site is completely down:**

```bash
# 1. Verify it's actually down (not your network)
curl -v https://thekpihub-platform.vercel.app

# 2. Check status pages
# - https://vercel.io/status (Vercel status page)
# - https://status.supabase.com (Supabase status)
# - https://www.google.com/appsstatus (Google status)

# 3. If Vercel/Supabase is down, wait for recovery
# (Nothing you can do; they'll fix it)

# 4. If it's your app, immediate actions:

# a) Check latest deployment
# Go to https://vercel.com/dashboard → Deployments
# If latest shows "Failed" or "Error":
#   Click it and check logs for error

# b) Redeploy previous version
# Go to Deployments
# Find last successful deployment
# Click "..." → "Redeploy"

# c) Or rollback in git and push
cd /home/user/kpihub-assembled
git log --oneline -n 10
git revert <bad-commit-sha>  # or git reset --hard <good-commit-sha>
git push origin main
# Wait for auto-deployment

# d) Notify team
# Email/Slack team immediately
# Share incident details
# Provide ETA for recovery
```

### Broken Deployment - Immediate Response

**If deployment fails:**

```bash
# 1. Don't panic - previous version is still live
# 2. Identify the issue
#    Go to GitHub Actions
#    Check Deploy job logs
#    Look for error message

# 3. Fix the issue
#    Make code changes if needed
#    Commit and push

# 4. If urgent, rollback
#    git revert <broken-commit>
#    git push origin main
#    This will re-deploy previous version

# 5. Monitor next deployment
#    Go to GitHub Actions
#    Watch CI and Deploy complete successfully
```

### Secrets Compromised - Immediate Response

**If you suspect a secret is leaked:**

```bash
# 1. Rotate immediately
# (See "Secret Rotation" section above)

# 2. Check Vercel logs for unauthorized access
# Go to https://vercel.com/account/security
# Look for suspicious IP addresses or usage

# 3. Invalidate old token
# Go to https://vercel.com/account/tokens
# Find the compromised token
# Click delete/revoke

# 4. Update GitHub secret
# (See "Secret Rotation" steps)

# 5. Audit recent deployments
# Verify nothing malicious was deployed

# 6. Notify team/security
# Share details of what happened
# Update security procedures if needed
```

---

## Regular Maintenance Checklist

### Daily (5 min)
- [ ] Check GitHub Actions for red X
- [ ] Check live site is accessible
- [ ] Quick review of deployment status

### Weekly (30 min)
- [ ] Review CI/CD logs
- [ ] Check deployment success rate
- [ ] Update team with status
- [ ] Note any issues for follow-up

### Monthly (1 hour)
- [ ] Performance review
- [ ] Audit recent deployments
- [ ] Check for security issues
- [ ] Update documentation
- [ ] Plan any optimizations

### Quarterly (2 hours)
- [ ] **Rotate VERCEL_TOKEN secret**
- [ ] Review all logs and metrics
- [ ] Audit access logs
- [ ] Plan Phase D enhancements
- [ ] Update disaster recovery procedures

### Annually (4 hours)
- [ ] Complete security audit
- [ ] Review and update all documentation
- [ ] Performance benchmarking
- [ ] Capacity planning
- [ ] Strategic improvements

---

## Disaster Recovery

### Rollback Procedures

**Fast rollback (< 5 minutes):**

```bash
# Option 1: Redeploy previous version in Vercel
# Go to https://vercel.com/dashboard → Deployments
# Find last working deployment
# Click "..." → "Redeploy"
# Wait 2-3 minutes

# Option 2: Git revert
cd /home/user/kpihub-assembled
git log --oneline | head -5  # Find bad commit
git revert <commit-sha>       # Creates undo commit
git push origin main
# Wait 5 minutes for CI/CD to complete
```

**Full rollback (if multiple commits bad):**

```bash
# Use git reset (careful!)
cd /home/user/kpihub-assembled
git log --oneline | head -20  # Find last good commit
git reset --hard <good-commit-sha>
git push --force origin main  # Force push (use with caution!)
# Wait for deployment
```

### Data Backup

**Ensure Supabase is backed up:**

1. Go to: https://supabase.com/dashboard
2. Click database
3. Check "Backups" section
4. Verify backups are configured and running

**Recovery from backup:**

1. Contact Supabase support if needed
2. Backups available in dashboard
3. Can restore from specific point in time
4. Test recovery procedure quarterly

---

## Documentation Maintenance

### Keep These Docs Updated

- [ ] PHASE-C-OVERVIEW.md - Update if goals change
- [ ] PHASE-C-AUTOMATION-GUIDE.md - Update with new steps
- [ ] PHASE-C-TESTING-GUIDE.md - Update with new tests
- [ ] CI-CD-WORKFLOW-ARCHITECTURE.md - Keep technical details current
- [ ] PHASE-C-MAINTENANCE.md (this file) - Add new issues found
- [ ] Troubleshooting section - Add solutions as you discover them

### When Documentation Changes

```bash
# Create commit documenting the change
git add PHASE-C-*.md CI-CD-*.md
git commit -m "docs: update Phase C documentation with new findings"
git push origin main
```

---

## Team Communication

### Status Reports (Weekly)

**Template for team email:**

```
Subject: CI/CD Pipeline Status Report - Week of August 27

Overview:
- Deployments: 12 successful, 0 failed (100% success rate)
- Average CI time: 4 min 30 sec
- Average deploy time: 2 min 45 sec
- Site uptime: 100%

Metrics:
- CI/CD pipeline: ✅ Healthy
- Application performance: ✅ Good (avg load time: 1.2s)
- Integrations: ✅ All working

Issues this week:
- None

Upcoming:
- Quarterly secret rotation scheduled for 2026-11-27

Questions? Let me know!
```

### Incident Reports (When issues occur)

**Template for incident email:**

```
Subject: CI/CD Incident Report - [Date] [Issue]

Description:
- What: [Brief description]
- When: [Timestamp]
- Duration: [How long down]
- Impact: [What users were affected]

Root Cause:
- [Analysis of why it happened]

Resolution:
- [What was done to fix it]
- [Time to resolution]

Prevention:
- [How to prevent in future]

Owner: [Your name]
Date: [Date]
```

---

## Tools & Resources

### Useful Commands

```bash
# Check deployment status
gh run list --repo hsharmagxi-debug/kpihub-assembled --limit 10

# View workflow file
cat .github/workflows/deploy.yml

# Check git log
git log --oneline --graph --all -n 20

# Test site
curl -I https://thekpihub-platform.vercel.app
curl -w "@curl-format.txt" https://thekpihub-platform.vercel.app

# Check environment variables (local only)
env | grep VERCEL
```

### External Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [npm Security Guidelines](https://docs.npmjs.com/getting-started/securely-using-npm)
- [GitHub CLI Reference](https://cli.github.com/manual/)

### Support Contacts

| Resource | Contact |
|----------|---------|
| Vercel Support | https://vercel.com/support |
| GitHub Support | https://support.github.com |
| Supabase Support | https://supabase.com/support |
| Team Lead | [Your name] |

---

## Summary

**Phase C Maintenance Overview:**

- **Daily:** Monitor status (5 min)
- **Weekly:** Review logs and update team (30 min)
- **Monthly:** Performance audit (1 hour)
- **Quarterly:** Secret rotation + full audit (2 hours)
- **Annually:** Strategic review (4 hours)

**Key Responsibilities:**

✅ Keep pipeline healthy and fast
✅ Rotate secrets on schedule
✅ Monitor for issues
✅ Respond to incidents quickly
✅ Keep documentation current
✅ Communicate with team

**Success Criteria:**

✅ >95% deployment success rate
✅ <5 minute average deployment time
✅ <3 second average page load time
✅ Zero unplanned downtime
✅ All secrets rotated quarterly
✅ Documentation kept current

---

**Phase C: Production Ready & Maintained** ✅

Good luck with long-term CI/CD operations!
