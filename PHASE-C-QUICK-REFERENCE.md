# Phase C: GitHub Secrets Setup - Quick Reference Card

## 3 Required Secrets

| Secret | Source | Format | Expires |
|--------|--------|--------|---------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens | Long alphanumeric string | 90 days |
| `VERCEL_ORG_ID` | https://vercel.com/account/general | `team_xxxxx` | Never |
| `VERCEL_PROJECT_ID` | https://vercel.com/projects/kpihub-platform/settings | `prj_xxxxx` | Never |

## Step-by-Step Setup (5 minutes)

### 1. Get Credentials from Vercel (2 min)
```
https://vercel.com/account/tokens → Create Token (Full Access)
https://vercel.com/account/general → Copy Team ID
https://vercel.com/projects/kpihub-platform/settings → Copy Project ID
```

### 2. Add to GitHub (3 min)
```
https://github.com/hsharmagxi-debug/kpihub-assembled/settings/secrets/actions
  → New repository secret
  → Name: VERCEL_TOKEN → Value: [paste token]
  → New repository secret
  → Name: VERCEL_ORG_ID → Value: [paste org ID]
  → New repository secret
  → Name: VERCEL_PROJECT_ID → Value: [paste project ID]
```

### 3. Verify ✓
```bash
gh secret list --repo hsharmagxi-debug/kpihub-assembled
# Should show all 3 secrets
```

## Common Issues & Quick Fixes

| Issue | Fix | Time |
|-------|-----|------|
| "Secrets not found" | Re-add with exact uppercase name | 2 min |
| "Invalid token" | Create new token at vercel.com/account/tokens | 5 min |
| "Org ID not found" | Copy from vercel.com/account/general (team_, not personal) | 2 min |
| "Project not found" | Copy exact ID from project settings | 2 min |

## Using in Workflow

```yaml
- uses: vercel/action@v1
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Security Reminders

- ⚠️ Rotate VERCEL_TOKEN every 90 days
- ⚠️ Never commit secrets to git
- ⚠️ Never log or echo secret values
- ⚠️ Revoke immediately if compromised

## Resources

- Full Guide: [`PHASE-C-GITHUB-SECRETS-SETUP.md`](./PHASE-C-GITHUB-SECRETS-SETUP.md)
- Vercel Docs: https://vercel.com/docs/api
- GitHub Docs: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

**Status:** Ready to Setup | **Time Required:** 5 minutes | **Complexity:** Low
