# Phase C: 5-Minute Quick Setup
## Fast Track to CI/CD Automation

**⏱️ Estimated time: 5 minutes**

For the full guide with explanations, see `PHASE-C-AUTOMATION-GUIDE.md`

---

## Step 1: Get Vercel Credentials (2 minutes)

### 1A: Get Vercel API Token
- Go to: https://vercel.com/account/tokens
- Click "Create Token"
- Name: `github-actions`
- Save the token (you'll only see it once!)
- **Save as:** `VERCEL_TOKEN`

### 1B: Get Vercel Org ID
- Go to: https://vercel.com/dashboard
- Bottom left: "Org ID: xxxxxxx"
- **Save as:** `VERCEL_ORG_ID`

### 1C: Get Vercel Project ID
- Go to kpihub-platform project
- Settings → General
- Copy "Project ID"
- **Save as:** `VERCEL_PROJECT_ID`

---

## Step 2: Add GitHub Secrets (1 minute)

Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions

Click "New repository secret" three times:

1. **Name:** `VERCEL_TOKEN`  
   **Value:** _(paste from Step 1A)_

2. **Name:** `VERCEL_ORG_ID`  
   **Value:** _(paste from Step 1B)_

3. **Name:** `VERCEL_PROJECT_ID`  
   **Value:** _(paste from Step 1C)_

Done! ✅

---

## Step 3: Create Deployment Workflow (1 minute)

### Option A: Using Terminal (Recommended)

```bash
cd /home/user/kpihub-assembled
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Vercel

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - uses: actions/checkout@v4
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
EOF

git add .github/workflows/deploy.yml
git commit -m "chore: Add automated deployment workflow for Phase C CI/CD"
git push origin main
```

### Option B: Using GitHub Web UI

1. Go to: https://github.com/hsharmagxi-debug/kpihub-assembled
2. Click "Add file" → "Create new file"
3. Path: `.github/workflows/deploy.yml`
4. Paste the content above
5. Commit with message: `chore: Add automated deployment workflow for Phase C CI/CD`

---

## Step 4: Test It (1 minute)

Make a test commit:

```bash
cd /home/user/kpihub-assembled
echo "# Phase C test" >> apps/platform/README.md
git add apps/platform/README.md
git commit -m "test: Verify Phase C CI/CD automation"
git push origin main
```

Monitor:
- Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
- Watch CI run (3-5 min)
- Watch Deploy run (2-3 min after CI passes)
- Check: https://vercel.com/dashboard → Deployments

---

## Expected Outcomes

### ✅ Successful Setup

After ~8 minutes you should see:

1. **In GitHub Actions:** Both CI and Deploy workflows show green ✅
2. **In Vercel Dashboard:** New deployment marked "Ready" ✅
3. **In Browser:** Site loads at https://thekpihub-platform.vercel.app ✅
4. **On GitHub:** Commit shows deployment status badge ✅

### ❌ If Something Failed

**CI failed?**
- Check logs at: https://github.com/hsharmagxi-debug/kpihub-assembled/actions
- Look for ✗ error messages
- Fix the issue locally and push again

**Deploy didn't run?**
- CI must pass first (it's a requirement)
- Wait up to 1 minute after CI passes for deploy to start
- Check secrets are set correctly (all 3 needed)

**Site still not loading?**
- Check Vercel logs: https://vercel.com/dashboard → Deployments → [latest] → Logs
- Verify environment variables in Vercel Settings

---

## Quick Checklist

```
[ ] Step 1: Vercel credentials saved
[ ] Step 2: All 3 GitHub secrets added
[ ] Step 3: deploy.yml file created and pushed
[ ] Step 4: Test commit pushed
[ ] CI workflow ran successfully
[ ] Deploy workflow ran successfully  
[ ] Site loads in browser
[ ] Vercel shows "Ready" status
```

---

## What Happens Now

Every time you push to main:

```
Push commit → GitHub → CI runs (3-5 min) → Tests pass?
  ├─ YES → Deploy runs (2-3 min) → Vercel → Live site updated
  └─ NO → Deployment skipped, team notified
```

---

## If Something Breaks

### Workflow won't start?
- Check secrets: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
- All 3 secrets must be present
- Try pushing another commit to trigger it

### Deploy fails?
- Check Vercel logs for the error
- Most common: Missing environment variable
- Go to Vercel → Settings → Environment Variables
- Add any missing vars

### Need to disable CI/CD temporarily?
- Go to: https://github.com/hsharmagxi-debug/kpihub-assembled/settings/actions
- Disable workflows if needed
- Push commits still work, just won't auto-deploy

---

## Useful Links

| What | Link |
|------|------|
| GitHub Actions | https://github.com/hsharmagxi-debug/kpihub-assembled/actions |
| GitHub Secrets | https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions |
| Vercel Dashboard | https://vercel.com/dashboard |
| Live Platform | https://thekpihub-platform.vercel.app |
| Workflow File | https://github.com/hsharmagxi-debug/kpihub-assembled/blob/main/.github/workflows/deploy.yml |

---

## Next Steps

### Immediate:
- [ ] Complete the 5 steps above
- [ ] Verify everything works

### When Confident:
- [ ] Team notified that CI/CD is active
- [ ] Everyone pushes to main (not separate branches for now)

### Optional Enhancements (Later):
- Add preview URLs for pull requests (Phase D)
- Add Slack notifications (Phase D)
- Add performance monitoring (Phase D)
- Add automated rollback (Phase D)

---

## Full Documentation

For more details, see:
- `PHASE-C-OVERVIEW.md` - Understand what Phase C does
- `PHASE-C-AUTOMATION-GUIDE.md` - Detailed step-by-step
- `PHASE-C-TESTING-GUIDE.md` - How to validate
- `CI-CD-WORKFLOW-ARCHITECTURE.md` - Technical details
- `PHASE-C-MAINTENANCE.md` - Ongoing operations

---

**Phase C: Ready! ✅**

Once these 5 steps are done, your CI/CD pipeline is live.

🚀 **Every push to main now auto-deploys!**
