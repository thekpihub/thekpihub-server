# Phase C: GitHub Actions Secrets Setup Guide

**Status:** Configuration Documentation  
**Phase:** C - CI/CD Automation  
**Step:** 1 - GitHub Actions Secrets Setup  
**Repository:** `hsharmagxi-debug/kpihub-assembled`  
**Target:** Vercel Deployment CI/CD  
**Date:** August 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Required Secrets](#required-secrets)
3. [Getting Vercel Credentials](#getting-vercel-credentials)
4. [Adding Secrets to GitHub](#adding-secrets-to-github)
5. [Workflow Integration](#workflow-integration)
6. [Validation Checklist](#validation-checklist)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)
9. [Secret Management](#secret-management)

---

## Overview

GitHub Actions secrets enable secure CI/CD automation for deploying the KPI Hub Platform to Vercel. This guide covers setting up the three essential secrets required for automated deployment:

- **VERCEL_TOKEN** - Authentication token for Vercel API access
- **VERCEL_ORG_ID** - Organization identifier for the Vercel project
- **VERCEL_PROJECT_ID** - Project identifier for the deployment target

These secrets will enable automatic deployments when code is pushed to the `main` branch, without exposing sensitive credentials in your codebase.

### Current Architecture

```
GitHub Repository (hsharmagxi-debug/kpihub-assembled)
    ↓
GitHub Actions Workflow (trigger on push to main)
    ↓
Vercel Deployment Service (using VERCEL_TOKEN)
    ↓
Vercel Project (kpihub-platform)
    ↓
Production Environment (https://thekpihub-platform.vercel.app)
```

---

## Required Secrets

### 1. VERCEL_TOKEN

**Purpose:** Authentication token for Vercel API calls  
**Type:** Organization-level secret  
**Scope:** Used by all workflows that deploy to Vercel  
**Permissions Required:**
- Full access to your Vercel account
- Ability to deploy to specified projects
- Access to environment variables
- Access to deployment logs

**Example Format:**
```
(Long alphanumeric string, 40+ characters)
```

### 2. VERCEL_ORG_ID

**Purpose:** Identifier for your Vercel organization/workspace  
**Type:** Organization-level secret  
**Scope:** Organization identifier for the deployment context  
**Format:** Alphanumeric string (typically 15-20 characters)

**Example Format:**
```
teamy_xxxxxxxxxx
```

**Note:** This is NOT your personal Vercel ID; it's your organization/team ID.

### 3. VERCEL_PROJECT_ID

**Purpose:** Identifier for the specific Vercel project  
**Type:** Repository secret (can be organization-level)  
**Scope:** Project-specific identifier for targeting deployments  
**Format:** Alphanumeric string (typically 15-20 characters)

**Example Format:**
```
prj_xxxxxxxxxx
```

**Note:** This identifies the specific `kpihub-platform` project in Vercel.

---

## Getting Vercel Credentials

### Prerequisites

- Vercel account with admin or owner privileges
- Access to https://vercel.com/account
- Vercel project `kpihub-platform` already created (Phase B manual setup)

### Step 1: Obtain VERCEL_TOKEN

1. **Navigate to Vercel Account Settings**
   - Go to https://vercel.com/account
   - Click on **"Tokens"** in the left sidebar
   - Or direct link: https://vercel.com/account/tokens

2. **Create a New Token**
   - Click the **"Create"** or **"Create Token"** button
   - Enter a token name (e.g., `GitHub Actions KPI Hub`)
   - **Scope:** Select `Full Access` (required for deployments)
   - **Expiration:** Set to 90 days or longer (standard practice)
   - Click **"Create"**

3. **Copy the Token**
   - The token will display once after creation
   - **IMPORTANT:** Copy it immediately - you cannot view it again
   - Store it securely (password manager, temporary note)
   - Format: Long alphanumeric string starting with `tok_` or similar

### Step 2: Obtain VERCEL_ORG_ID

**Method A: From Account Settings (Recommended)**

1. Go to https://vercel.com/account/general
2. Scroll to **"Account ID"** or **"Team ID"** section
3. Your organization/team ID is displayed (usually starts with `team_` or similar)
4. Copy this ID exactly as shown

**Method B: From Vercel CLI**

If you have Vercel CLI installed:

```bash
vercel list --teams
# Shows your organization ID
```

**Method C: From Project Settings**

1. Go to your Vercel project: https://vercel.com/projects/kpihub-platform
2. Click **"Settings"** tab
3. Look for **"Team"** or **"Organization"** section
4. The Team ID is displayed here

### Step 3: Obtain VERCEL_PROJECT_ID

1. **Navigate to Project Settings**
   - Go to https://vercel.com/projects/kpihub-platform
   - Click the **"Settings"** tab

2. **Find Project ID**
   - In the Settings page, find **"Project ID"** section
   - The ID is typically displayed as a read-only field
   - Format: Alphanumeric string (e.g., `prj_abc123def456`)

3. **Alternative: Using Vercel CLI**

   ```bash
   cd /path/to/apps/platform
   vercel project info
   
   # Output will show:
   # Project ID: prj_xxxxxxxxxx
   ```

4. **Copy Project ID**
   - Copy the exact string (no spaces or special characters)

---

## Adding Secrets to GitHub

### Method 1: GitHub Web UI (Recommended for Initial Setup)

#### Step 1: Navigate to Repository Secrets

1. Go to your GitHub repository: https://github.com/hsharmagxi-debug/kpihub-assembled
2. Click **"Settings"** tab at the top
3. In the left sidebar, expand **"Security"** section
4. Click **"Secrets and variables"** → **"Actions"**

   **URL:** `https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions`

#### Step 2: Add VERCEL_TOKEN Secret

1. Click **"New repository secret"** button
2. **Name:** `VERCEL_TOKEN` (exactly as shown, uppercase)
3. **Value:** Paste your Vercel token (obtained from Step 1 above)
4. Click **"Add secret"**

   **Screenshot markers:**
   - Form shows: Name field with placeholder
   - Form shows: Value field (large text area)
   - Green "Add secret" button appears

#### Step 3: Add VERCEL_ORG_ID Secret

1. Click **"New repository secret"** button again
2. **Name:** `VERCEL_ORG_ID` (exactly as shown, uppercase)
3. **Value:** Paste your Vercel organization ID
4. Click **"Add secret"**

#### Step 4: Add VERCEL_PROJECT_ID Secret

1. Click **"New repository secret"** button
2. **Name:** `VERCEL_PROJECT_ID` (exactly as shown, uppercase)
3. **Value:** Paste your Vercel project ID
4. Click **"Add secret"**

#### Verification in Web UI

After adding all three secrets, you should see:

```
✓ VERCEL_TOKEN       (Last used: [date])
✓ VERCEL_ORG_ID      (Last used: [date])
✓ VERCEL_PROJECT_ID  (Last used: [date])
```

### Method 2: GitHub CLI (For Automation)

If you have GitHub CLI installed, you can add secrets programmatically:

```bash
# Navigate to repository root
cd /path/to/kpihub-assembled

# Add VERCEL_TOKEN
gh secret set VERCEL_TOKEN \
  --body "your-vercel-token-here" \
  --repo hsharmagxi-debug/kpihub-assembled

# Add VERCEL_ORG_ID
gh secret set VERCEL_ORG_ID \
  --body "your-vercel-org-id-here" \
  --repo hsharmagxi-debug/kpihub-assembled

# Add VERCEL_PROJECT_ID
gh secret set VERCEL_PROJECT_ID \
  --body "your-vercel-project-id-here" \
  --repo hsharmagxi-debug/kpihub-assembled

# Verify secrets were added
gh secret list --repo hsharmagxi-debug/kpihub-assembled
```

### Method 3: Organization-Level Secrets (Optional)

If you have multiple repositories that need Vercel access, you can set organization-level secrets:

1. Go to Organization Settings: https://github.com/organizations/hsharmagxi-debug/settings
2. Navigate to **"Security"** → **"Secrets and variables"** → **"Actions"**
3. Follow the same process as repository secrets
4. These secrets will be available to all repositories in the organization

---

## Workflow Integration

### Where Secrets Are Used

The following workflows will use these secrets:

#### 1. Main CI/CD Workflow (`.github/workflows/deploy-vercel.yml`)

**Purpose:** Automated deployment to Vercel on main branch push

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'apps/platform/**'
      - '.github/workflows/deploy-vercel.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/platform
```

#### 2. Pull Request Preview Deployments

**Purpose:** Automatic preview deployments for pull requests

```yaml
- uses: vercel/action@v1
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: apps/platform
    prod: false  # Creates preview URL, not production
```

### Secret Access Scope

| Secret | Scope | Environment | Usage |
|--------|-------|-------------|-------|
| VERCEL_TOKEN | Organization/Repository | All workflows | API authentication |
| VERCEL_ORG_ID | Organization/Repository | All deployments | Organization context |
| VERCEL_PROJECT_ID | Repository | Platform project only | Target project identifier |

### Environment Variables vs Secrets

**Secrets (GitHub Actions):**
- Used for sensitive values (tokens, keys, IDs)
- Masked in logs
- Not accessible to forks
- Set in GitHub Settings

**Environment Variables (Vercel):**
- Application configuration values
- Set in Vercel project settings
- Available at build time and runtime
- Include: NEXT_PUBLIC_SUPABASE_URL, ANTHROPIC_API_KEY, etc.

---

## Validation Checklist

### Pre-Deployment Validation

- [ ] VERCEL_TOKEN created and copied correctly
- [ ] VERCEL_ORG_ID obtained from Vercel account settings
- [ ] VERCEL_PROJECT_ID obtained from Vercel project settings
- [ ] All three secrets added to GitHub Actions secrets
- [ ] Secret names match exactly (uppercase, no spaces)
- [ ] No extra whitespace in secret values
- [ ] Vercel project `kpihub-platform` exists and is accessible

### GitHub Configuration Validation

1. **Verify Secrets Are Listed**

   ```bash
   # Using GitHub CLI
   gh secret list --repo hsharmagxi-debug/kpihub-assembled
   
   # Expected output:
   # VERCEL_TOKEN        Last used: Less than a minute ago
   # VERCEL_ORG_ID       Last used: Less than a minute ago
   # VERCEL_PROJECT_ID   Last used: Less than a minute ago
   ```

2. **Check Secret Visibility**
   - Go to repository Settings → Secrets and variables → Actions
   - All three secrets should be listed with checkmark icons (✓)
   - Dates may show as "Never used" before first deployment

3. **Verify in Web UI**
   ```
   ✓ VERCEL_TOKEN
   ✓ VERCEL_ORG_ID
   ✓ VERCEL_PROJECT_ID
   ```

### Vercel Configuration Validation

1. **Confirm Project Settings**

   ```bash
   cd /path/to/apps/platform
   vercel env ls
   
   # Should show all environment variables configured in Vercel
   ```

2. **Check Integration Status**
   - Go to Vercel project settings: https://vercel.com/projects/kpihub-platform/settings
   - Look for Git integration status
   - Verify GitHub repository is connected
   - Check that branch deployments are enabled

### Dry-Run Deployment Test

1. **Trigger Test Deployment**

   ```bash
   # Option 1: Push a test commit to main
   git checkout -b test/vercel-secrets
   echo "# Test deployment" >> README.md
   git add README.md
   git commit -m "test: trigger vercel deployment"
   git push origin test/vercel-secrets
   
   # Option 2: Create a test pull request and monitor
   # Then check GitHub Actions workflow status
   ```

2. **Monitor Deployment**
   - Go to GitHub repository → Actions tab
   - Find the workflow run triggered by your commit
   - Watch for workflow completion

3. **Check for Success Indicators**

   ```
   ✓ Workflow runs without "Secrets not found" errors
   ✓ Vercel action completes successfully
   ✓ Deployment URL appears in workflow output
   ✓ Vercel project shows new deployment
   ✓ Preview URL is accessible
   ```

4. **Verify Deployment Access**
   - Check Vercel deployments: https://vercel.com/projects/kpihub-platform/deployments
   - New deployment should appear from GitHub
   - Status should be "Ready" or "Building"
   - No errors in deployment logs

### Environment Variables Validation

1. **Verify Vercel Environment Variables**

   ```bash
   # List all environment variables in Vercel project
   vercel env ls
   
   # Should include:
   # NEXT_PUBLIC_SUPABASE_URL
   # NEXT_PUBLIC_SUPABASE_ANON_KEY
   # SUPABASE_SERVICE_ROLE_KEY
   # STRIPE_SECRET_KEY
   # ANTHROPIC_API_KEY
   # WINGMAN_API_URL
   # etc.
   ```

2. **Check Deployment Logs**
   - Go to Vercel deployment details
   - Check "Build" and "Deployment" tabs for errors
   - Look for missing environment variable warnings

### Failure Troubleshooting

If validation fails, refer to the [Troubleshooting](#troubleshooting) section below.

---

## Troubleshooting

### Issue 1: "Secrets not found" Error

**Error Message:**
```
Error: VERCEL_TOKEN not found in the Secrets store
```

**Causes:**
1. Secret name doesn't match exactly (case-sensitive)
2. Secret hasn't been synced yet (GitHub caches secrets)
3. Secret added to wrong organization/repository level
4. Workflow is in a fork (forks don't have access to secrets)

**Solutions:**

```bash
# Step 1: Verify secret exists and is named correctly
gh secret list --repo hsharmagxi-debug/kpihub-assembled

# Step 2: Check workflow file uses exact secret name
grep "secrets\." .github/workflows/deploy-vercel.yml
# Should show: ${{ secrets.VERCEL_TOKEN }} (uppercase)

# Step 3: If secret doesn't exist, re-add it
gh secret set VERCEL_TOKEN --body "your-token"

# Step 4: Clear GitHub Actions cache
# Go to Actions tab → Caches → Delete all caches
```

### Issue 2: "Invalid Token" Error

**Error Message:**
```
Error: Invalid Vercel token provided
```

**Causes:**
1. Token is expired
2. Token was copied incorrectly
3. Token was regenerated in Vercel (old token is invalidated)
4. Token has insufficient permissions

**Solutions:**

```bash
# Step 1: Create new token in Vercel
# Go to: https://vercel.com/account/tokens
# Create a new token with full access

# Step 2: Update GitHub secret with new token
gh secret set VERCEL_TOKEN --body "new-token-value"

# Step 3: Verify token has correct permissions
# In Vercel account settings, check token scope is "Full Access"

# Step 4: Test token directly (optional)
# Using Vercel CLI
vercel list --token "your-token-here"
```

### Issue 3: "Organization ID not found" Error

**Error Message:**
```
Error: Organization with ID XXX not found
```

**Causes:**
1. ORG_ID is incorrect or mistyped
2. ORG_ID is a personal account ID instead of team ID
3. Token doesn't have access to the organization

**Solutions:**

```bash
# Step 1: Get correct organization ID
# From Vercel: https://vercel.com/account/general
# Look for "Team ID" or "Account ID"

# Step 2: Verify it's a team ID (starts with 'team_'), not personal
# Personal IDs won't work with team deployments

# Step 3: Update the secret
gh secret set VERCEL_ORG_ID --body "correct-org-id"

# Step 4: List your organizations
vercel list --token "your-token"
```

### Issue 4: "Project ID not found" Error

**Error Message:**
```
Error: Project XXX not found in organization YYY
```

**Causes:**
1. PROJECT_ID is incorrect
2. Project doesn't exist in Vercel
3. Project is in different organization
4. Token doesn't have access to project

**Solutions:**

```bash
# Step 1: List all projects in organization
vercel list --token "your-token"

# Step 2: Get correct project ID for kpihub-platform
# Should show: kpihub-platform (prj_xxxxx)

# Step 3: Update the secret with correct project ID
gh secret set VERCEL_PROJECT_ID --body "prj_correct_id"

# Step 4: Verify project exists
cd apps/platform
vercel project info
```

### Issue 5: Workflow Doesn't Trigger on Push

**Symptoms:**
- Code pushed to main, but workflow doesn't run
- Deployments don't happen automatically

**Causes:**
1. Workflow file not committed to repository
2. Workflow is disabled in GitHub settings
3. Branch protection rules preventing workflow
4. Workflow has wrong branch trigger

**Solutions:**

```bash
# Step 1: Ensure workflow file exists and is committed
ls -la .github/workflows/deploy-vercel.yml

# Step 2: Check file content
cat .github/workflows/deploy-vercel.yml | head -10
# Should show: on: push: branches: [main]

# Step 3: Push workflow file to repository
git add .github/workflows/deploy-vercel.yml
git commit -m "Add Vercel deployment workflow"
git push origin main

# Step 4: Enable workflow in GitHub
# Go to: Actions tab → Select workflow → Enable
```

### Issue 6: Deployment Fails with Build Error

**Error Message:**
```
Build step failed - NEXT_PUBLIC_SUPABASE_URL not provided
```

**Causes:**
1. Environment variables not set in Vercel project
2. Environment variables not synced to new deployments
3. Secrets file not properly configured

**Solutions:**

```bash
# Step 1: Check Vercel project environment variables
vercel env ls

# Step 2: Add missing environment variables to Vercel
# Go to: Project Settings → Environment Variables
# Add all required variables from vercel.json

# Step 3: Retrigger deployment
gh workflow run deploy-vercel.yml --repo hsharmagxi-debug/kpihub-assembled

# Step 4: Check deployment logs
# Go to: Vercel project → Deployments → select latest → Build logs
```

### Issue 7: "Access Denied" Errors

**Error Message:**
```
Access denied: You don't have permission to modify this project
```

**Causes:**
1. Token doesn't have project access
2. Token permissions are too restrictive
3. Account doesn't have admin rights in Vercel organization

**Solutions:**

```bash
# Step 1: Verify token permissions in Vercel
# Go to: https://vercel.com/account/tokens
# Ensure token has "Full Access"

# Step 2: Create new token with full permissions
# Create → Full Access → Generate

# Step 3: Verify personal account is admin in organization
# Go to: Vercel Team Settings → Members
# Ensure your account has admin role

# Step 4: Update secret with new token
gh secret set VERCEL_TOKEN --body "new-full-access-token"
```

### Issue 8: Deployment Takes Too Long or Times Out

**Symptoms:**
- Workflow runs for 30+ minutes
- Workflow fails with timeout error
- Vercel shows "Building" indefinitely

**Causes:**
1. Large dependencies being installed
2. Build process is slow
3. Memory constraints in Vercel build environment
4. Infinite loops in build scripts

**Solutions:**

```bash
# Step 1: Check build logs in Vercel
# Go to: Project → Deployments → select latest → Build logs
# Look for slow steps or errors

# Step 2: Optimize build locally
cd apps/platform
npm run build
# Time this locally to establish baseline

# Step 3: Check for large dependencies
npm ls --depth=0

# Step 4: Increase Vercel build timeout (if available)
# In vercel.json or project settings

# Step 5: Check for missing .vercelignore
# Ensure unnecessary files are excluded
cat .vercelignore
```

---

## Security Best Practices

### Secret Management

1. **Token Rotation**
   - Rotate VERCEL_TOKEN every 90 days
   - Keep track of rotation dates
   - Immediately rotate if token is compromised
   
   ```bash
   # Create reminder
   echo "2026-11-27 - Rotate VERCEL_TOKEN" > /tmp/rotation_schedule.txt
   ```

2. **Secret Access Audit**
   - Review who has access to repository
   - Limit admin access to necessary users
   - Use GitHub's member audit logs
   
   ```bash
   # Check repository collaborators
   gh repo view --json collaborators hsharmagxi-debug/kpihub-assembled
   ```

3. **Minimize Token Scope**
   - Use organization-level tokens only if necessary
   - Prefer project-specific access when available
   - Verify token only has necessary permissions

4. **Incident Response**
   - If token is compromised:
     ```bash
     # Immediately invalidate in Vercel
     # Go to: https://vercel.com/account/tokens → Delete token
     
     # Create new token
     # Update GitHub secret
     gh secret set VERCEL_TOKEN --body "new-token"
     
     # Review deployment history
     # Check Vercel project for unauthorized deployments
     ```

### Environment Variables

1. **Separate Public from Private**
   - `NEXT_PUBLIC_*` variables are embedded in client-side code (visible in browser)
   - Keep sensitive keys (API keys, tokens) as private environment variables

2. **Use Vercel Environment Variable UI**
   - Set environment variables through Vercel dashboard
   - Apply variable restrictions by environment (Preview/Production)
   - Document each variable's purpose in vercel.json

3. **Avoid Hardcoding**
   - Never commit secrets to repository
   - Never pass secrets as workflow parameters
   - Always use GitHub Actions secrets

### Workflow Security

1. **Review Workflow Files**
   - Audit all `.github/workflows/*.yml` files
   - Ensure secrets aren't logged or exported
   - Use `--mask-env` for sensitive output
   
   ```yaml
   # Good: Secrets are masked
   - run: echo "Deploy token length: ${#VERCEL_TOKEN}"
   
   # Bad: Secrets are exposed
   - run: echo "Token is: $VERCEL_TOKEN"
   ```

2. **Restrict Branch Access**
   - Only deploy from trusted branches (main, release-*)
   - Require pull request reviews before merge to main
   - Protect main branch with status checks

3. **Monitor Workflow Execution**
   - Review GitHub Actions audit logs regularly
   - Set up alerts for failed deployments
   - Monitor Vercel deployment logs

### Repository Access Control

```bash
# Best practice: Require 2 reviewers for main branch
# Go to: Settings → Branches → Add rule
# - Branch name pattern: main
# - Require pull request reviews: Yes
# - Required number of reviews: 2
# - Require status checks to pass: Yes

# Audit current settings
gh repo view --json branchProtectionRules \
  --repo hsharmagxi-debug/kpihub-assembled
```

---

## Secret Management

### Updating Secrets

When you need to update a secret (e.g., new token):

```bash
# Using GitHub CLI
gh secret set SECRET_NAME --body "new-value" \
  --repo hsharmagxi-debug/kpihub-assembled

# Web UI
# 1. Go to Settings → Secrets and variables → Actions
# 2. Click on secret name
# 3. Click "Update"
# 4. Enter new value
# 5. Click "Update secret"
```

### Deleting Secrets

```bash
# Using GitHub CLI
gh secret delete SECRET_NAME \
  --repo hsharmagxi-debug/kpihub-assembled

# Web UI
# 1. Go to Settings → Secrets and variables → Actions
# 2. Click delete icon (🗑️) next to secret
# 3. Confirm deletion
```

### Viewing Secret Usage

You cannot view the actual secret value after creation, but you can see:
- When it was last used
- Which workflows access it

```bash
# Check secret list
gh secret list --repo hsharmagxi-debug/kpihub-assembled

# Output shows "Last used" timestamp
```

### Secret Rotation Schedule

| Secret | Rotation Frequency | Last Rotated | Next Rotation |
|--------|-------------------|--------------|---------------|
| VERCEL_TOKEN | Every 90 days | [Date] | [Date] |
| VERCEL_ORG_ID | As needed | Never* | On org change |
| VERCEL_PROJECT_ID | As needed | Never* | On project change |

*ORG_ID and PROJECT_ID don't expire; only update if Vercel IDs change

### Backup and Recovery

1. **Backup Location**
   - Store secret creation information securely
   - Keep Vercel account credentials in password manager
   - Document token creation date and purpose

2. **Recovery Process**
   - If secrets are lost, they must be regenerated from Vercel
   - Regenerating invalidates old tokens
   - Update GitHub secrets immediately after regeneration

---

## References

### Official Documentation

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel API Documentation](https://vercel.com/docs/api)
- [Vercel GitHub Integration](https://vercel.com/docs/git/github)
- [Vercel Deploy Action](https://github.com/vercel/action)

### Vercel Resources

- Account Settings: https://vercel.com/account
- Tokens Page: https://vercel.com/account/tokens
- Projects: https://vercel.com/projects
- Deployments: https://vercel.com/projects/kpihub-platform/deployments

### GitHub Resources

- Repository Settings: https://github.com/hsharmagxi-debug/kpihub-assembled/settings
- Secrets Page: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
- Actions Tab: https://github.com/hsharmagxi-debug/kpihub-assembled/actions

---

## Checklist for Setup Completion

### Pre-Setup
- [ ] Vercel account with admin access ready
- [ ] Vercel project `kpihub-platform` created (Phase B)
- [ ] GitHub repository access with admin permissions
- [ ] Secure location to temporarily store tokens

### Credential Retrieval
- [ ] VERCEL_TOKEN obtained from vercel.com/account/tokens
- [ ] VERCEL_ORG_ID obtained from vercel.com/account/general
- [ ] VERCEL_PROJECT_ID obtained from project settings
- [ ] All credentials verified for correctness

### Secret Configuration
- [ ] Navigated to repository secrets page
- [ ] Added VERCEL_TOKEN with correct name
- [ ] Added VERCEL_ORG_ID with correct name
- [ ] Added VERCEL_PROJECT_ID with correct name
- [ ] Verified all three secrets appear in secrets list

### Validation
- [ ] Tested with dry-run deployment
- [ ] Workflow completed successfully
- [ ] Deployment appeared in Vercel dashboard
- [ ] Preview URL is accessible
- [ ] Environment variables properly set in Vercel

### Documentation
- [ ] This guide has been reviewed
- [ ] Rotation schedule documented
- [ ] Emergency contacts identified
- [ ] Team informed of setup completion

### Security Audit
- [ ] Verified token permissions are correct
- [ ] Confirmed branch protection rules enabled
- [ ] Checked pull request review requirements
- [ ] Audit access logs reviewed

---

## Support and Escalation

### Quick Reference

| Problem | Solution | Time |
|---------|----------|------|
| Secret not found | Re-add secret with correct name | 5 min |
| Invalid token | Create new token in Vercel, update secret | 10 min |
| Deployment fails | Check Vercel build logs, verify env vars | 15 min |
| Access denied | Verify token permissions, recreate if needed | 10 min |

### Escalation Path

1. **Immediate Action** - Check this troubleshooting guide
2. **Verification** - Run validation checklist
3. **Reconfiguration** - Follow step-by-step setup again
4. **Documentation** - Reference official docs linked above
5. **Support** - Contact Vercel support if issues persist

### Emergency Token Revocation

If token is compromised or leaked:

```bash
# IMMEDIATELY
# 1. Go to https://vercel.com/account/tokens
# 2. Delete/revoke the token
# 3. Create new token
# 4. Update GitHub secret
gh secret set VERCEL_TOKEN --body "new-token"

# 5. Review deployment logs for unauthorized access
# 6. Document incident
```

---

## Next Steps

After completing this Phase C Step 1 setup:

1. **Phase C Step 2:** Create GitHub Actions workflow files (deploy-vercel.yml)
2. **Phase C Step 3:** Configure environment variables in Vercel
3. **Phase C Step 4:** Test automated deployments
4. **Phase D:** Production deployment and monitoring

---

**Document Status:** Complete  
**Last Updated:** August 2026  
**Review Date:** November 2026 (quarterly)  
**Version:** 1.0.0
