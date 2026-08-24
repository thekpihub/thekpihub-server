# Governed Deployment — GitHub Actions self-hosted runner → Hostinger

This replaces the old Hostinger "Git auto-deploy" webhook with a governed
pipeline: **checks → manual approval → local rsync on Hostinger → smoke test.**

Workflow: `.github/workflows/deploy-hostinger.yml`
Exclude/protect list: `.deploy-exclude`

---

## How it behaves

| Event | What runs |
|---|---|
| Pull request → `main` | Governance checks only (secret scan + HTML lint). No deploy. |
| Push → `main` | Checks → **waits for manual approval** (`production` environment) → Hostinger self-hosted runner rsync deploy → smoke test. |
| Manual ("Run workflow") | Same, with an optional **dry-run** (default ON) that previews changes and deploys nothing. |

Deploy uses `rsync --delete` on the Hostinger self-hosted runner so the server mirrors the repo — **except** every
path in `.deploy-exclude`, which is skipped on upload **and protected from
deletion** (we never pass `--delete-excluded`).

---

## One-time setup

### 1. Register the Hostinger self-hosted runner
GitHub repo → Settings → Actions → Runners → New self-hosted runner → Linux x64.
Run GitHub's generated commands on Hostinger SSH under `~/actions-runner`, then keep it
online with `./run.sh` or a service manager.

### 2. Add GitHub repository secrets
Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Value |
|---|---|
| `HOSTINGER_USERNAME` | e.g. `u117990013` |

The workflow deploys to `/home/<HOSTINGER_USERNAME>/domains/thekpihub.com/public_html`.

### 3. Add the approval gate (the "governance" part)
Settings → **Environments** → **New environment** → name it `production` →
enable **Required reviewers** and add yourself. Now every push-triggered deploy
pauses until a human approves it, and each approval is logged.

### 4. Disable the old Hostinger Git auto-deploy (avoid double deploys)
hPanel → **Git** (or Advanced → GIT) → remove/disable the auto-deployment on the
`thekpihub.com` repository so only this pipeline writes to the webroot.

---

## First run — do a DRY RUN before trusting it
1. Actions → **Deploy to Hostinger (SSH)** → **Run workflow** → leave **Dry run = true**.
2. Read the rsync output: confirm it would copy the expected files and that it
   does **NOT** touch `config.js`, `.htaccess`, or any `wp-*` paths.
3. If correct, run again with **Dry run = false** (or just push to `main`).

---

## Rollback
The deploy mirrors the committed tree, so rolling back = deploying an older commit:
```bash
git revert <bad-commit>      # or: git checkout <good-commit> -- . && commit
git push origin main         # approve the deploy → site returns to good state
```
The smoke test fails the run if a key page stops returning 200, flagging the need
to roll back. Rollback anchor for the whole repo: tag `pre-governance-2026-06-28`.

---

## Safety notes
- Secrets never appear in the workflow file — only as `${{ secrets.* }}` refs.
- `.deploy-exclude` protects server-only files (`config.js`, `.htaccess`) and the
  WordPress blog from `--delete`. **Do not remove those lines.**
- `.php` files **are** deployed (Hostinger runs PHP) — unlike the dead Firebase
  path, which ignored them.
