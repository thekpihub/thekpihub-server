# Reference material (absorbed from the archived `thekpihub` monolith)

These files were copied verbatim from the now-archived `thekpihub/thekpihub`
repository on **2026-06-28**, at commit `3975ea6`, before that repo was retired.
They are kept for reference / rebuild — **they are not wired into the live app.**

## Contents

- `legacy-next14/` — the monolith's old Next.js 14 pages (`blog`, `dashboard`,
  `pricing`, `api/health`, layout/globals). Useful as a starting point when
  building out the canonical Next.js 16 app under `../src/app`.
- `design-system/` — the `designlatest/` design system: brand previews,
  component specimens, landing-page JSX sections, fonts, and UI kits.
  Windows `:Zone.Identifier` alternate-data-stream artifacts were stripped
  during the copy.

## Provenance

| Field | Value |
|---|---|
| Source repo | `thekpihub/thekpihub` (archived) |
| Source commit | `3975ea6` |
| Copied on | 2026-06-28 |
| Copied by | Phase 2 consolidation (see plan: absorb-monolith) |

The canonical SaaS backend (Express API + Prisma + SQL migrations) from the same
monolith now lives at `../backend` and `../prisma` as real, maintained code —
**not** here under reference.
