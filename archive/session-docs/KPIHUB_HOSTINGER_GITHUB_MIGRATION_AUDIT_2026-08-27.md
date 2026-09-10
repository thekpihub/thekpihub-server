# KPI Hub Hostinger/GitHub Migration Audit — 2026-08-27

## Scope and safety constraints

This audit covers the deployment connection for `thekpihub.com`. Hostinger
remains the hosting provider, DNS remains unchanged, repositories are preserved,
and no secret values are recorded. The assembled monorepo root must never be
published to Hostinger.

## Verified pre-migration state

| Item | Evidence |
|---|---|
| Hostinger site | `thekpihub.com` in hPanel |
| Hosting type | Static/PHP website under Hostinger `public_html` |
| Document root | `/home/u117990013/domains/thekpihub.com/public_html` |
| Server Git remote | `https://github.com/thekpihub/thekpihub-website.git` |
| Server branch | `main` |
| Server Git HEAD | `9240e0082dada24b18760d8e64f77c544a65759a` |
| Server working tree | 49 dirty entries before migration |
| Old repo current `main` | `cb572897579a4f242be8e9a4795e254870de37bb` |
| Current deploy method | GitHub Actions SSH/rsync from the old website repo |
| Old Hostinger webhook | Active push webhook at a redacted `webhooks.hostinger.com` URL |
| Native hPanel Git | No managed repository shown; hPanel displayed only the private-repo SSH key and empty create form |
| Canonical repository | `https://github.com/hsharmagxi-debug/kpihub-assembled` |
| Canonical production branch | `main` |

The live homepage and `apps/website/index.html` had the same size and matched
after normalizing generated asset fingerprint query strings. This proves that
the assembled website snapshot represents the live website content; it does
not replace the server Git-remote and Actions evidence above.

## Old deployment authority found

### `thekpihub/thekpihub-website`

- Active Hostinger push webhook, ID recorded privately during the audit.
- Active `Deploy to Hostinger (SSH)` workflow.
- Hostinger deployment secret names present; values were never read.
- Successful production deployments through 2026-08-18.
- Workflow deploys the standalone repository root with `rsync --delete` and a
  deny-list. It must not be transplanted into the monorepo.

### `hsharmagxi-debug/thekpihub-platform`

- Active `Deploy to Hostinger` workflow with Hostinger secret names.
- Every inspected deployment run failed.
- Still represents duplicate deployment authority and is a post-cutover
  disable candidate.

### `thekpihub/thekpihub`

- Write-enabled deploy key titled `Sync auto deploy`.
- Its purpose was not proven to be Hostinger. Preserve it unchanged pending a
  separate access review.

No repositories, workflows, hooks, keys, secrets, or environments were deleted.

## Existing production exposure

The following source/meta categories returned HTTP 200 before remediation:

- repository handoffs, agent instructions, and Markdown files;
- `docs/`, including a SQL schema and deployment documentation;
- Python, JSX, build, and server source;
- package manifests and lockfiles;
- Vercel/Firebase configuration and configuration examples/templates;
- WordPress plugin source and `api/index.js`.

Dotfiles such as `.git`, `.env`, and `.htaccess` returned HTTP 403. The current
server `.htaccess` predates the repository's newer source-denial template.

## Approved target deployment

The target is a governed root workflow in KPIHUB-Assembled that:

1. builds only `apps/website`;
2. creates an explicit allow-listed staging payload;
3. makes the payload and manifest reviewable GitHub artifacts;
4. requires manual dispatch for every Hostinger network operation;
5. performs a non-destructive rsync dry run;
6. requires the `hostinger-production` environment for deployment;
7. overlays only the immutable staged payload without `--delete`;
8. proves `config.js` and `.htaccess` checksums are unchanged;
9. smoke-tests production after deployment.

Server-only `config.js`, `.htaccess`, WordPress paths, uploads, `cgi-bin`, and
`.well-known` are neither uploaded nor deleted.

## Implementation verification

The following local tests are required before commit:

```text
bash scripts/test-stage-hostinger-site.sh
bash scripts/test-hostinger-workflow.sh
bash scripts/test-hostinger-source-deny.sh
npm ci --prefix apps/website
npm run build:site --prefix apps/website
npm run check:assets --prefix apps/website
```

The staging-policy and workflow tests were developed with a red-green cycle:
each failed because its implementation was absent, then passed after the
minimal implementation was added.

## Rollback evidence

Before any Hostinger modification, create and verify:

- a protected timestamped `public_html.tar.gz` outside the webroot;
- its SHA-256 checksum;
- a full path/permission/time manifest;
- redacted Git remote metadata and the 49-entry dirty status;
- an exact copy of the pre-change `.htaccess` and its checksum.

Rollback is to disable the new workflow, restore the protected archive, verify
the prior `.htaccess` and `config.js` checksums, and re-run the baseline route,
TLS, and exposure matrix. DNS restoration is not part of rollback because no
DNS change is approved or planned.

## Execution log

| Step | Status | Evidence |
|---|---|---|
| Read-only GitHub/Hostinger/DNS audit | Complete | Findings above |
| GitHub CLI browser/device OAuth repair | Complete | Authenticated as `hsharmagxi-debug`; no PAT reused |
| Exposed PAT rotation | Deferred | Owner scheduled manual rotation for 2026-08-28 |
| Hostinger password rotation | Deferred | Plaintext credential was exposed in chat; never copied into repo/tool commands |
| Protected Hostinger backup | Complete | `/home/u117990013/kpihub-migration-backups/2026-08-27-before-kpihub-assembled/public_html.tar.gz`; SHA-256 `184ecb5de1c4fcbd457f9bac9a45f3895e3b84e843bc2cc24cdb9a1b3a9550a3`; 641 manifest entries; 49 dirty Git entries preserved |
| Scoped workflow implementation | Complete | Merged to `main` in governed deployment commits |
| New deploy-key installation | Complete | Dedicated key authorized in Hostinger SSH access; masked in `hostinger-production` |
| Dry run and deployment | Complete | Dry run `33103169805`; production overlay `33103604181`; both successful |
| Source exposure remediation | Complete | Append-only `.htaccess` hardening run `33103331526`; rollback copy `.htaccess.pre-source-deny` retained in backup |
| Old deployment authority disabled | Partial | `hsharmagxi-debug/thekpihub-platform` workflow `306005775` disabled; server Git remote still points to inaccessible legacy repository and requires owner-side webhook confirmation |

## Credential handling notes

- The exposed classic GitHub PAT is quarantined but not confirmed revoked.
- All long-lived KPI Hub tokens and deployment credentials require rotation on
  2026-08-28.
- GitHub CLI reported that its OAuth credential was stored in plaintext because
  no credential store was available. Secure or remove that local credential
  during the rotation review.
- Never print, copy, reuse, or commit credential values. Record only the
  credential type, owner, and rotation date.

## Final verification record

Populate after execution with:

- backup path and SHA-256;
- canonical deployed commit and GitHub Actions run IDs;
- dry-run and deployment results;
- live apex/`www` TLS and HTTP matrix;
- denied-source and preserved-runtime path results;
- old workflow/webhook disabled evidence;
- exact rollback commands and any remaining blockers.

## Final execution evidence

- Canonical repository: `https://github.com/hsharmagxi-debug/kpihub-assembled`
- Production branch: `main`; deployed workflow head: `9f34a3094c37e55a0782e366030ad96cd9f098db`
- Hostinger document root: `/home/u117990013/domains/thekpihub.com/public_html`
- Hostinger remains authoritative for `thekpihub.com`; DNS and nameservers were not changed.
- HTTPS apex and `www` return HTTP 200 with the existing valid certificate.
- Static pages `/`, `/login.html`, `/register.html`, `/pricing.html`, `/auditor.html`, and `/benchmarks.html` return HTTP 200.
- Source/config probes now return HTTP 403 for `README.md`, `CLAUDE.md`, `vercel.json`, `firebase.json`, `package.json`, `config.example.js`, `docs/`, `tools/`, `.github/`, `api/index.js`, `server.js`, `tailwind.config.js`, and `package-lock.json`.
- Hostinger `/login`, `/register`, `/api/health`, and `/api/health/ready` remain HTTP 404 because this host is the static website; the platform health routes are served by the separate Vercel app.
- Temporary backup and hardening workflows are disabled but retained for auditability. No files or repositories were deleted.
- Remaining blocker: obtain owner access to `thekpihub/thekpihub-website` (or its Hostinger webhook owner) to prove the historical webhook is disconnected; the known accessible duplicate Hostinger workflow is disabled.
