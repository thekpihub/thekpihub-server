# Phase C: Complete CI/CD Automation Setup Guide
## Step-by-Step Instructions for Full Implementation

---

## Overview

This guide provides detailed, step-by-step instructions to set up complete CI/CD automation for the KPI Hub Platform. Follow each section carefully.

**Total time: 25-30 minutes**

---

## Part 1: Gather Required Information (5 minutes)

Before you start, you need to collect three pieces of information from Vercel.

### Step 1.1: Create/Find Your Vercel API Token

1. **Go to Vercel Settings → Tokens**
   - URL: https://vercel.com/account/tokens
   - Click your profile icon → Settings → Tokens → API Tokens

2. **Create a new token**
   - Click "Create" button
   - Name it: `github-actions-ci-cd`
   - Scope: Full account access (or limit to kpihub-platform project)
   - Click "Create Token"

3. **Copy and save the token**
   ```
   Save this in a secure location:
   ┌─────────────────────────────────────────┐
   │ VERCEL_TOKEN: ___________________       │
   └─────────────────────────────────────────┘
   ```
   ⚠️ You'll only see this token once. Copy it now!

### Step 1.2: Find Your Vercel Organization ID

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com/dashboard

2. **Look for Organization ID**
   - Bottom left corner: "Org ID: xxxxxxx"
   - Or in any project settings under "Org ID"

3. **Save it**
   ```
   Save this:
   ┌─────────────────────────────────────────┐
   │ VERCEL_ORG_ID: __________________       │
   └─────────────────────────────────────────┘
   ```

### Step 1.3: Find Your Vercel Project ID

1. **Go to your project**
   - Go to https://vercel.com/dashboard
   - Click "kpihub-platform" project

2. **Find Project ID**
   - Project Settings → General
   - Look for "Project ID: xxxxxxx"

3. **Save it**
   ```
   Save this:
   ┌─────────────────────────────────────────┐
   │ VERCEL_PROJECT_ID: _________________    │
   └─────────────────────────────────────────┘
   ```

**✅ All three pieces of info collected. You're ready for Part 2.**

---

## Part 2: Configure GitHub Secrets (5 minutes)

These secrets allow GitHub Actions to authenticate with Vercel and deploy your application.

### Step 2.1: Open GitHub Secrets Settings

1. **Go to your GitHub repository**
   - URL: https://github.com/hsharmagxi-debug/kpihub-assembled

2. **Navigate to Secrets**
   - Click "Settings" tab
   - Left sidebar → "Secrets and variables" → "Actions"
   - URL: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions

3. **You should see**
   - "Repository secrets" section
   - "New repository secret" button

### Step 2.2: Add VERCEL_TOKEN Secret

1. **Click "New repository secret"**

2. **Fill in the form:**
   - Name: `VERCEL_TOKEN`
   - Value: Paste your token from Step 1.1
   
3. **Click "Add secret"**

✅ First secret added!

### Step 2.3: Add VERCEL_ORG_ID Secret

1. **Click "New repository secret"** again

2. **Fill in the form:**
   - Name: `VERCEL_ORG_ID`
   - Value: Paste your org ID from Step 1.2

3. **Click "Add secret"**

✅ Second secret added!

### Step 2.4: Add VERCEL_PROJECT_ID Secret

1. **Click "New repository secret"** one more time

2. **Fill in the form:**
   - Name: `VERCEL_PROJECT_ID`
   - Value: Paste your project ID from Step 1.3

3. **Click "Add secret"**

✅ Third secret added!

**Verify you have all three secrets:**

After adding all three, you should see:
```
Repository secrets (3)
├── VERCEL_ORG_ID
├── VERCEL_PROJECT_ID
└── VERCEL_TOKEN
```

**✅ All secrets configured. You're ready for Part 3.**

---

## Part 3: Create Deployment Workflow (5 minutes)

Now you'll create the GitHub Actions workflow that automatically deploys to Vercel.

### Step 3.1: Create the deploy.yml File

1. **Navigate to workflow directory**
   ```bash
   cd /home/user/kpihub-assembled
   mkdir -p .github/workflows
   ```

2. **Create the file** (copy the entire content below):
   ```bash
   cat > .github/workflows/deploy.yml << 'EOF'
   name: Deploy to Vercel

   on:
     workflow_run:
       workflows: ["CI"]
       types: [completed]
       branches: [main]

   # Only deploy if CI passed
   jobs:
     deploy:
       name: Deploy to Vercel
       runs-on: ubuntu-latest
       if: ${{ github.event.workflow_run.conclusion == 'success' }}
       
       steps:
         - name: Checkout code
           uses: actions/checkout@v4
           with:
             ref: ${{ github.event.workflow_run.head_sha }}

         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v20
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             vercel-args: '--prod'
             scope: ${{ secrets.VERCEL_ORG_ID }}

         - name: Get deployment URL
           id: deployment
           run: echo "url=https://thekpihub-platform.vercel.app" >> $GITHUB_OUTPUT

         - name: Comment PR with deployment info
           if: github.event.workflow_run.event == 'pull_request'
           uses: actions/github-script@v7
           with:
             script: |
               const deploymentUrl = '${{ steps.deployment.outputs.url }}';
               github.rest.issues.createComment({
                 issue_number: context.issue.number,
                 owner: context.repo.owner,
                 repo: context.repo.repo,
                 body: `✅ Deployed to Vercel!\n\nPreview: ${deploymentUrl}`
               });
   EOF
   ```

3. **Verify the file was created**
   ```bash
   cat .github/workflows/deploy.yml | head -20
   ```

You should see the workflow file. ✅

### Step 3.2: Push the workflow to GitHub

1. **Add the file to git**
   ```bash
   cd /home/user/kpihub-assembled
   git add .github/workflows/deploy.yml
   ```

2. **Commit the change**
   ```bash
   git commit -m "chore: Add automated deployment workflow for Phase C CI/CD"
   ```

3. **Push to GitHub**
   ```bash
   git push origin main
   ```

4. **Verify the push**
   ```bash
   # Check if pushed successfully
   git log --oneline -n 2
   # Should show your commit as the latest
   ```

✅ Workflow file is now in GitHub!

---

## Part 4: Verify Workflow in GitHub (3 minutes)

Let's confirm everything is set up correctly.

### Step 4.1: Check GitHub Actions

1. **Go to GitHub Actions**
   - URL: https://github.com/hsharmagxi-debug/kpihub-assembled/actions

2. **You should see**
   - "Deploy to Vercel" workflow listed
   - Recent workflow runs

### Step 4.2: Review Workflow File

1. **Go to workflow file**
   - URL: https://github.com/hsharmagxi-debug/kpihub-assembled/blob/main/.github/workflows/deploy.yml

2. **Verify content**
   - Check that all your IDs are referenced correctly
   - Look for references to secrets (they appear as `${{ secrets.VERCEL_* }}`)

---

## Part 5: Test the Automation (10 minutes)

Now let's test that everything works end-to-end.

### Step 5.1: Create a Test Commit

1. **Make a small test change**
   ```bash
   cd /home/user/kpihub-assembled
   echo "# CI/CD Phase C - Automated deployment test" >> apps/platform/README.md
   ```

2. **Commit and push**
   ```bash
   git add apps/platform/README.md
   git commit -m "test: Verify Phase C CI/CD automation pipeline"
   git push origin main
   ```

3. **Note the commit SHA**
   ```bash
   git log --oneline -n 1
   # You'll see something like: abc1234 test: Verify Phase C...
   ```

### Step 5.2: Watch CI Run

1. **Go to GitHub Actions**
   - URL: https://github.com/hsharmagxi-debug/kpihub-assembled/actions

2. **Click the "CI" workflow** (should be running)

3. **Watch the progress**
   - ⏳ Installing dependencies
   - ⏳ Type checking
   - ⏳ Building application
   - ✅ All checks pass (or ❌ if there's an error)

4. **Expected duration: 3-5 minutes**

5. **Monitor the logs**
   - Click the job to see detailed output
   - Look for "✓ Compiled successfully" message

### Step 5.3: Watch Deployment Run

1. **Once CI passes, deployment should start automatically**
   - Go back to Actions main page
   - Look for "Deploy to Vercel" workflow

2. **If you see it, great!**
   - ✅ Automation is working
   - ⏳ Vercel is deploying
   - ⏳ Takes 2-3 minutes

3. **If you don't see it:**
   - Wait up to 1 minute (GitHub needs time to trigger it)
   - Refresh the page
   - Check if there's a red X on the CI workflow (CI must pass first)

### Step 5.4: Verify Live Deployment

1. **Check the live URL**
   ```bash
   # Try to access your site
   curl -I https://thekpihub-platform.vercel.app
   # Should return HTTP 200
   ```

2. **View in browser**
   - Go to: https://thekpihub-platform.vercel.app
   - Should load without errors
   - Should show your platform

3. **Check Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Click kpihub-platform
   - Look at "Deployments" tab
   - Should see your deployment as "Ready" (green checkmark)

4. **Look for deployment timestamp**
   - Should be very recent (within last few minutes)
   - Build time should be 1-2 minutes

---

## Part 6: Optional - Update CI Workflow for Better Integration (3 minutes)

If you want CI to create a status check that deploy.yml can use, update the CI workflow.

### Step 6.1: Check Current CI Status

1. **View current CI workflow**
   ```bash
   cat /home/user/kpihub-assembled/.github/workflows/ci.yml
   ```

2. **It should already have:**
   ```yaml
   on:
     pull_request:
     push:
       branches: [main]
   ```

3. **This is fine for Phase C!** The deploy workflow can use the completion event.

### Step 6.2 (Optional): Enhance CI Workflow

If you want to add output variables to CI, update it (optional):

```bash
# This is optional - Phase C works without it
# Only do this if you want additional CI feedback
```

**Recommendation:** Keep CI as-is for Phase C. You can enhance it in Phase D.

---

## Part 7: Troubleshooting & Verification (5 minutes)

Common issues and how to fix them:

### Issue: Deployment workflow not triggering

**Symptom:** CI passes but no deployment workflow starts

**Causes & Solutions:**

1. **Secrets not set**
   - Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
   - Verify all 3 secrets are there: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
   - Each should have a green checkmark

2. **Workflow file has errors**
   - Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
   - Look for any red X or error messages
   - Fix YAML syntax (must match exactly)

3. **CI didn't actually pass**
   - Check CI workflow logs
   - Look for ❌ errors
   - Fix the CI errors first

**Solution steps:**

```bash
# 1. Check the deploy.yml file syntax
cd /home/user/kpihub-assembled
yamllint .github/workflows/deploy.yml
# Should output: OK (if yamllint is installed)

# 2. Or manually validate:
cat .github/workflows/deploy.yml | grep -E "workflow_run|on:|jobs:" 
# Should show structure clearly

# 3. Force re-run by making another test commit
echo "# debug" >> apps/platform/README.md
git add .
git commit -m "debug: trigger CI/CD"
git push origin main
```

### Issue: Vercel deployment fails

**Symptom:** Deployment workflow runs but Vercel build fails

**Solution:**

1. **Check Vercel logs**
   - Go to: https://vercel.com/dashboard
   - Click kpihub-platform
   - Click latest deployment
   - Look at "Build" tab for errors

2. **Common causes:**
   - Missing environment variables (Check Settings → Environment Variables)
   - Node.js version mismatch
   - Disk space or timeout
   - Git authentication issue

3. **Fix environment variables:**
   ```bash
   # Ensure all vars are in Vercel dashboard
   # Click Settings → Environment Variables
   # Verify all NEXT_PUBLIC_* and secrets are there
   ```

### Issue: Site loads but is blank

**Symptom:** Deployment succeeds but site shows nothing

**Solution:**

1. **Clear browser cache**
   ```
   Ctrl+Shift+Delete (Clear browsing data)
   Select "Cached images and files"
   Click "Clear data"
   Reload page
   ```

2. **Check console errors**
   - Open site in browser
   - Press F12 (DevTools)
   - Click Console tab
   - Look for red errors
   - Note the error message

3. **Check environment variables**
   - Vercel Dashboard → Settings → Environment Variables
   - All vars should be present
   - NEXT_PUBLIC_* should be in all environments
   - Secrets should be in Production

---

## Part 8: Monitoring the Pipeline (Ongoing)

### Daily Workflow Monitoring

1. **GitHub Actions Dashboard**
   - https://github.com/hsharmagxi-debug/kpihub-assembled/actions
   - Check that CI passes on each push
   - Watch for any red X marks

2. **Vercel Dashboard**
   - https://vercel.com/dashboard
   - View recent deployments
   - Monitor deployment times
   - Check for failed builds

3. **GitHub Commit Status**
   - https://github.com/hsharmagxi-debug/kpihub-assembled/commits/main
   - Each commit shows deployment status
   - Green checkmark = deployed successfully
   - Red X = deployment failed

### Useful Commands for Monitoring

```bash
# Check latest git commits and their status
cd /home/user/kpihub-assembled
git log --oneline -n 5

# Check local workflow file validity
# (requires yq - install with: brew install yq or apt-get install yq)
yq eval '.jobs | keys' .github/workflows/deploy.yml

# Verify secrets are configured (shows only names, not values)
gh secret list --repo hsharmagxi-debug/kpihub-assembled
# (requires GitHub CLI: brew install gh or apt-get install gh)
```

---

## Secrets Security Checklist

✅ **Best practices for Phase C:**

- [ ] Secrets are stored in GitHub (not in code)
- [ ] Secrets are not printed in logs (GitHub masks them automatically)
- [ ] Only necessary secrets are used (3 for Phase C)
- [ ] Secrets expire in Vercel if not rotated (set reminder)
- [ ] Only CI/CD workflows can access secrets
- [ ] Deployment logs are viewed by trusted users only
- [ ] Old secrets are deleted when rotated
- [ ] Audit log is reviewed monthly

**Rotating Secrets (when needed):**

```bash
# In ~3 months, or if token is compromised:
# 1. Create new Vercel token
# 2. Update VERCEL_TOKEN in GitHub secrets
# 3. Delete old token in Vercel
# 4. Document the change
```

---

## Complete Setup Verification Checklist

Use this to verify everything is working:

```
PHASE C COMPLETE SETUP VERIFICATION
═══════════════════════════════════════════════════════

GitHub Configuration:
  [ ] GitHub repository exists and is accessible
  [ ] Current user has admin or write access
  [ ] All 3 secrets added to repository settings
  [ ] Secrets show as "Updated less than 1 minute ago"
  [ ] No error messages in Secrets settings page

Workflow Files:
  [ ] .github/workflows/ci.yml exists
  [ ] .github/workflows/deploy.yml exists
  [ ] Both files are valid YAML (no syntax errors)
  [ ] deploy.yml references all 3 secrets
  [ ] deploy.yml has correct triggers (workflow_run + CI)

Vercel Configuration:
  [ ] Vercel project exists (kpihub-platform)
  [ ] Project is linked to GitHub repo
  [ ] All environment variables are configured
  [ ] Build settings are correct
  [ ] Project has at least one successful deployment

Test Deployment:
  [ ] Created test commit and pushed to main
  [ ] CI workflow started and completed successfully
  [ ] Deployment workflow started after CI completed
  [ ] Vercel received deployment command
  [ ] Deployment completed without errors
  [ ] Live site accessible at: https://thekpihub-platform.vercel.app

Live Site Verification:
  [ ] Site loads in browser
  [ ] No 404 or 500 errors
  [ ] All routes accessible (/login, /register, /dashboard)
  [ ] Supabase integration working
  [ ] Stripe integration working
  [ ] Performance acceptable (<3 seconds load)

Monitoring & Logs:
  [ ] GitHub Actions shows workflow execution
  [ ] Deployment logs are accessible in Vercel
  [ ] GitHub commit shows deployment status badge
  [ ] Can identify who deployed what and when

Documentation:
  [ ] Phase C documentation reviewed
  [ ] Team aware of CI/CD automation
  [ ] Rollback procedure documented
  [ ] Emergency contact list ready

═══════════════════════════════════════════════════════
Phase C Implementation: ✅ COMPLETE
```

---

## What to Do Next

### Immediate Next Steps:
1. ✅ Complete this guide
2. ✅ Verify all checks pass
3. ✅ Make sure team understands CI/CD flow
4. ✅ Document any custom configurations

### When You're Confident (After testing):
1. Delete test changes from README.md
   ```bash
   # Revert test changes if desired
   git log --oneline | grep -i "test: Verify"
   git revert <commit-sha>
   git push origin main
   ```

2. Let team know CI/CD is active
   - Explain that all pushes will auto-deploy
   - Shared responsibility for code quality
   - CI prevents broken code reaching production

### Phase D (Advanced - Later):
- [ ] Add preview deployments for PRs
- [ ] Add Slack notifications
- [ ] Add performance monitoring
- [ ] Add automated rollback capability
- [ ] Add security scanning

---

## Support & Troubleshooting

**If something isn't working:**

1. **Check GitHub Actions logs**
   - Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
   - Click the failed workflow
   - Click the failed job
   - Read the error message carefully

2. **Check Vercel logs**
   - Go to: https://vercel.com/dashboard
   - Click deployment that failed
   - Click "Logs" tab
   - Look for error messages

3. **Verify secrets**
   - All three secrets must be set
   - No typos in secret names
   - Secret values must be correct (including spaces)

4. **Check file syntax**
   - YAML is whitespace-sensitive
   - Use 2-space indentation only
   - No tabs allowed in YAML

5. **Last resort: Check this guide**
   - Search for your error message
   - Follow the recommended solution
   - Try the troubleshooting steps

---

## Summary

You've successfully:

✅ Set up GitHub secrets for Vercel authentication
✅ Created automated deployment workflow
✅ Tested the complete CI/CD pipeline
✅ Verified live deployment
✅ Documented the process

**Phase C is now complete and running!**

Every push to main will now:
1. Automatically run tests (CI)
2. Automatically deploy if tests pass (CD)
3. Appear live on your production URL in 2-3 minutes

🚀 **Your CI/CD automation is live and working!**

---

## Quick Reference: Common Commands

```bash
# Check git status
git status

# View workflow files
ls -la .github/workflows/

# Validate YAML syntax (if yq installed)
yq eval . .github/workflows/deploy.yml

# View GitHub CLI secrets
gh secret list --repo hsharmagxi-debug/kpihub-assembled

# View latest commits
git log --oneline -n 10

# View specific branch
git branch -a
```

---

**Phase C: Complete! ✅**

For additional help, see:
- `PHASE-C-QUICK-SETUP.md` - Fast reference
- `PHASE-C-TESTING-GUIDE.md` - Validation procedures
- `CI-CD-WORKFLOW-ARCHITECTURE.md` - Technical deep dive
- `PHASE-C-MAINTENANCE.md` - Operations guide
