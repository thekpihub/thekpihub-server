# Vercel Setup Guide - KPI Hub Platform

## Current Status: Phase B Step 1-2

This document outlines the Vercel linking and environment variable configuration for the KPI Hub Platform Next.js application.

## What Has Been Configured

### Files Created

1. **.vercel/project.json** - Project configuration (with placeholder IDs)
   - Structure follows Vercel's standard format
   - Contains `projectId`, `orgId`, and `zeroConfig` flag

2. **.vercelignore** - Build ignore patterns
   - Excludes non-essential files from deployment

3. **vercel.json** - Vercel deployment configuration
   - Next.js framework specified
   - Build/dev/install commands configured
   - Environment variables schema defined

## Next Steps: Manual Vercel Linking

Due to CLI authentication limitations in the current environment, follow these manual steps:

### 1. Visit Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Sign in to your Vercel account

### 2. Create/Link Project

#### Option A: Create New Project
1. Click "Create New Project"
2. Import from Git (connect GitHub/GitLab if needed)
3. Select the `kpihub-assembled` repository
4. Root Directory: `apps/platform`
5. Framework: Next.js (should auto-detect)
6. Project Name: `kpihub-platform`
7. Click "Deploy"

#### Option B: Link Existing Project
1. If project already exists in Vercel, retrieve the Project ID and Org ID
2. Update `.vercel/project.json` with actual IDs:
   ```json
   {
     "projectId": "prj_ACTUAL_ID_HERE",
     "orgId": "team_ACTUAL_ID_HERE",
     "zeroConfig": true
   }
   ```

### 3. Configure Environment Variables in Vercel Dashboard

Navigate to Project Settings → Environment Variables and add:

#### Required Variables (with placeholders for now)

```
NEXT_PUBLIC_APP_URL=https://thekpihub-platform.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://eeuwkislidznpgdbvvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PLACEHOLDER>
SUPABASE_SERVICE_ROLE_KEY=<PLACEHOLDER>
STRIPE_SECRET_KEY=sk_test_<PLACEHOLDER>
STRIPE_WEBHOOK_SECRET=whsec_<PLACEHOLDER>
STRIPE_PRICE_STARTER=price_<PLACEHOLDER>
STRIPE_PRICE_GROWTH=price_<PLACEHOLDER>
STRIPE_PRICE_ENTERPRISE=price_<PLACEHOLDER>
ANTHROPIC_API_KEY=<PLACEHOLDER>
OPENROUTER_API_KEY=<PLACEHOLDER>
WINGMAN_API_URL=https://agent.example.com
WINGMAN_URL=https://agent.example.com
HANDOFF_SECRET=<GENERATE_RANDOM_32_CHAR>
```

### 4. Configure Per Environment

In Vercel Dashboard, set which variables are available in:
- **Production**: All variables except dev/testing keys
- **Preview**: Non-production API keys and test credentials
- **Development**: Local development keys (usually via .env.local)

### 5. Retrieve Project Information After Linking

Once linked in Vercel, retrieve:

```bash
# After linking, verify connection:
cd /home/user/kpihub-assembled/apps/platform
vercel project ls

# Get project details:
vercel project info

# View environment variables:
vercel env ls
```

## Environment Variables Details

### Public Variables (NEXT_PUBLIC_*)
- **NEXT_PUBLIC_APP_URL**: Application deployment URL
- **NEXT_PUBLIC_SUPABASE_URL**: Supabase project URL (public)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase anonymous key (public, safe)

### Secret Variables
- **SUPABASE_SERVICE_ROLE_KEY**: Server-side Supabase access (keep secret)
- **STRIPE_SECRET_KEY**: Stripe API secret key
- **STRIPE_WEBHOOK_SECRET**: Stripe webhook signing secret
- **STRIPE_PRICE_***: Price IDs for billing tiers
- **ANTHROPIC_API_KEY**: Claude API key
- **OPENROUTER_API_KEY**: OpenRouter API key
- **WINGMAN_API_URL**: Agent API endpoint
- **WINGMAN_URL**: Agent UI endpoint
- **HANDOFF_SECRET**: Generate with: `openssl rand -hex 16`

## Deployment Configuration

### Build Settings
- **Framework**: Next.js (auto-detected from vercel.json)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`
- **Dev Command**: `npm run dev`

### Root Directory
- Set to `.` (root of apps/platform)
- Vercel will auto-detect monorepo structure if needed

## Troubleshooting

### Issue: "Project not found" after linking
- Solution: Verify .vercel/project.json has correct IDs
- Check: Go to Project Settings in Vercel dashboard to confirm IDs

### Issue: Build failing
- Check: Node.js version (Vercel supports 18.x, 20.x, 22.x)
- Check: Environment variables are set in Vercel dashboard
- View: Build logs in Vercel dashboard for errors

### Issue: Environment variables not loading
- Ensure variables are set in correct environment (Production/Preview/Development)
- For local testing: Use .env.local with same variable names
- Verify: Variables are deployed with new version (redeploy if needed)

## Local Testing Before Deployment

```bash
# Test locally with environment variables
cd apps/platform
cp .env.example .env.local
# Edit .env.local with your actual values

# Build locally
npm run build

# Start production server
npm run start

# Or run dev server
npm run dev
```

## Important Notes

1. **Do NOT commit secrets**: The .vercel/project.json is safe to commit, but never commit actual API keys
2. **Use .env.local for development**: Add .env.local to .gitignore (already done)
3. **Sync environment variables**: Keep Vercel dashboard variables in sync with .env.example documentation
4. **Production deployment**: Only merge to main/production branch when ready to deploy
5. **Webhook configuration**: After Stripe keys are added, configure webhooks in Stripe dashboard

## Vercel Project Information (to be filled after linking)

```
Project Name: kpihub-platform
Framework: Next.js
Project URL: https://thekpihub-platform.vercel.app
Project ID: [TO BE FILLED]
Org ID: [TO BE FILLED]
Git Repository: kpihub-assembled (apps/platform)
```

---

**Last Updated**: 2026-08-27
**Status**: Awaiting manual Vercel dashboard configuration
**Next Step**: Complete manual linking in Vercel dashboard and set environment variables
