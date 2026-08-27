# KPI Hub Archive Index — 2026-08-27

## Active production source

- Canonical root: `C:\Users\Admin\OneDrive\10-projects\11-The KPI Hub`
- Website source: `C:\Users\Admin\OneDrive\10-projects\11-The KPI Hub\website-source`
- GitHub: `https://github.com/hsharmagxi-debug/kpihub-assembled.git`
- Branch: `main`
- Verified commit: `ef15d0f`
- Production: `https://platform-two-zeta-31.vercel.app`
- Clone verification: clean working tree; 493 tracked files

## Security quarantine

Root: `C:\Users\Admin\OneDrive\20-areas\22-security-and-access\The KPI Hub\2026-08-27-security-review`

| Entry | Original location | Result | Reason |
|---|---|---|---|
| `01-contaminated-wsl-kpihub` | `C:\Users\Admin\Downloads\wsl kpihub` | Moved intact; 926 items | Embedded classic GitHub PAT and environment files |
| `02-environment-files` through `06-sensitive-screenshots` | Approved KPI Hub project, archive, export, and Downloads locations | 15 files quarantined | Environment credentials, API/OAuth/backend credentials, and potentially sensitive images |
| `07-other-sensitive-material\01-htaccess-secrets` | Legacy project tree | 2 files quarantined | Secret-labeled deployment instructions |

Credential values and secret-bearing filenames are intentionally omitted.
The exposed GitHub PAT is quarantined but **not yet revoked**. Revoke it on
2026-08-28 before treating the security incident as closed.

## Completed manual-review moves

| Entry | Original location | Items | Why retained for review |
|---|---|---:|---|
| `01-legacy-kpihub-project-root-2026-08-27` | `...\10-projects\01-ACTIVE-PROJECTS\11-The KPI Hub` | 19,437 | Different legacy repo, nested repos, 23 dirty entries |
| `02-kpihub-assembled-dirty-windows-checkout-2026-08-27` | `...\10-projects\02-ORG-REPOS\Hsharmagxi-debug (Personal)\kpihub-assembled` | 13,264 | Stale commit and 440 dirty entries |
| `03-platform-backup-before-recovery-2026-07-02` | `...\10-projects\90-ARCHIVE\11-The KPI Hub-BACKUP-20260702-BEFORE-RECOVERY` | 13,464 | Pre-recovery backup |
| `04-platform-backup-recovery-2026-07-02` | `...\10-projects\90-ARCHIVE\11-The KPI Hub-BACKUP-20260702-RECOVERY` | 13,584 | Recovery backup |

Every completed move was collision-checked and verified by recounting the
destination and confirming that the original top-level path was absent. No
files were deleted, overwritten, merged, or flattened.

## Items deliberately left in place for later manual review

- The legacy Hostinger `thekpihub-website` source until its live status is confirmed.
- Distinct organization repositories including app, pipeline, and Wing Commander projects.
- Git bundles, database exports, packaged backups, and historical handoffs until inspected individually.
- Unclear Downloads folders and extracted packages until a secret scan and content comparison are complete.

## Never delete without checking

- The canonical production clone and its Git history.
- Any dirty repository or nested `.git` directory.
- Git bundles and full-history exports.
- Recovery backups, database exports, migrations, or deployment snapshots.
- Historical handoffs that document credentials, deployment, or recovery decisions.
- Anything in security quarantine until credentials are rotated and its contents are reviewed.

## Final clean folder map

```text
11-The KPI Hub/
  website-source/          clean kpihub-assembled clone
  production-fixes/
  docs/
  tools/
  screenshots-reference/
  incoming-review/
  HANDOFF.md
  KPI-Hub-Decision-Tree.txt

The KPI Hub archive/
  2026-08-27-kpihub-cleanup-index/
  01-old-repositories/
  02-duplicate-source-copies/
  03-build-and-deployment-snapshots/
  04-claude-codex-handoffs/
  05-design-and-screenshots/
  06-docs-and-research/
  07-zips-and-exported-packages/
  08-manual-review-needed/
```
