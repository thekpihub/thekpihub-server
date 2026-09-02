# Server Memory

Running log of findings and state for this repo. **Mandatory rule: update this file after
every commit made locally or pushed, from 2026-09-02 onward, for as long as this repo exists.**
Newest entry on top. See also `mistakesdone.md` for mistake+correction entries specifically,
and `C:\Projects\CLAUDE.md` for the broader cross-project working notes this repo's local
clone sits under.

---

## 2026-09-02 — Baseline: consolidation session summary

This repo (`thekpihub/thekpihub-server`, renamed from `kpihub-assembled`) is the canonical
single source of truth for KPI Hub, consolidated from ~13 GitHub repos. State as of this entry:

**Confirmed working, deployed from this repo:**
- Vercel — project `platform` (`apps/platform`), live.
- Hostinger (thekpihub.com) — `.github/workflows/deploy-website-hostinger.yml`, verified
  live deploy 2026-09-02.
- Railway — `ditto-wingman-backend`/`ditto-wingman-frontend` (project `jubilant-growth`),
  repointed and verified live (`/api/health` → 200) 2026-09-02.

**Fixed this session:**
- `apps/platform`: Supabase SSR cookie typing (CI fix), lazy Razorpay client init (build fix).
- `services/pipeline/pipeline.py`: retired Anthropic model id → `claude-sonnet-5`.
- Added root-level `.github/workflows/pipeline.yml`, `daily-pipeline.yml`,
  `premium-pipeline.yml` — ported from source repos before their deletion (GitHub Actions only
  reads a repo's ROOT `.github/workflows/`, never a subdirectory's — nested copies from the
  original merge were dead on arrival).
- `apps/wingcommander-reference`: replaced stale (2026-07-08) content with current
  `thekpihub/ditto-wingman` code — it's load-bearing for `apps/website`'s free tools via its
  Cloudflare Worker, not reference-only as originally classified.

**Known broken, NOT yet fixed (need real credential values only the user has):**
- `daily-pipeline.yml` / `premium-pipeline.yml`: several GitHub secrets were entered malformed
  from the start (e.g. `SERPAPI_KEY`'s stored value is literally the text `"SERPAPI_KEY"`).
  Can't be fixed via API — secrets are write-only. Needs real keys re-entered by the user.
- `publish-signals.yml` (`apps/platform`): fails daily but is designed to no-op (dry-run) until
  deliberately switched on with real credentials — never live, lower priority.

**Deleted 2026-09-02** (superseded, content verified merged): `thekpihub-website`,
`thekpihub-platform` (org), `thekpihub-app`, `thekpihub-pipeline`,
`thekpihub-wingcommander-design-sync`, `automated-website-builder`, `thekpihub` (archived) +
`hsharmagxi-debug/thekpihub` mirror, `hsharmagxi-debug/thekpihub-platform`, `thekpihub_1554`,
`hsharmagxi-debug/kpihub-vault`, `hsharmagxi-debug/ditto-wingman` (empty).

**Deleted on an unverified inference — see `mistakesdone.md`:** `thekpihub-wing-commander`.
Recovery status unknown as of this entry.

**Not yet done:**
- `thekpihub_1554`'s live Anthropic key / old repos' other credential exposure — user has
  said not to rotate anything without being asked; not urgent per user (personal project).
- Domain `.COM` auto-renew is off, expires 2026-11-22 — user's call.
- `ditto-wingman-frontend` Vercel project: fixed Root Directory/build-command mismatch
  (`buildCommand`/`outputDirectory` now correct), but no fresh deployment has actually been
  triggered/verified yet (API trigger blocked by permission classifier; needs a dashboard
  "Redeploy" click or a new push to `thekpihub/ditto-wingman` main).
