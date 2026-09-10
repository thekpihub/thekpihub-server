# Project Memory — thekpihub-app

A running, dated record of what's been done in this repo, why, and what's next — kept so
this picks up cleanly from any machine. This repo itself has had no feature work yet (it's
the default `create-next-app` scaffold), but it's where a Claude Code session on 2026-06-21
was rooted, and where the next real work is queued.

## Log

### 2026-06-21 — Scaffold investigated, real work happened elsewhere, remote created

**What:** A Claude Code session anchored in this repo investigated using it as a
`/design-sync` target (syncing a component library to claude.ai/design). Found it has no
components yet — just the default Next.js scaffold (`src/app/layout.tsx`, `page.tsx`,
`globals.css`). Checked `thekpihub-website` (pure vanilla HTML/CSS/JS, no component
framework) and `ditto-wingman` (a real React/Radix/Tailwind app) as alternatives —
`ditto-wingman/frontend` was used instead. That work (a packaged library build, a 12-component
design-sync to claude.ai/design, and 3 CI fixes) lives in
**https://github.com/thekpihub/thekpihub-wingcommander-design-sync** — see that repo's
`MEMORY.md` for the full log.

The same session also audited and partially fixed `thekpihub-website`'s CI (a dead-RSS-feed
fix merged via PR #7, a GCP migration scaffold shipped via PR #9) — see
**https://github.com/thekpihub/thekpihub-website**'s `MEMORY.md` for that log.

**Why this repo got a remote + this file today:** it had none before — meaning nothing here,
including the "what's next" note below, would have been visible from a different machine.
Created `thekpihub/thekpihub-app` (private) and pushed so that gap is closed.

**Benefit:** Anyone (or any future Claude Code session, on any machine) opening this repo
cold can `git log`/read this file and immediately know: this is a fresh scaffold, the related
work this session produced lives in two sibling repos, and a specific task is queued next —
no need to re-derive any of that from scratch.

## Next steps — recommended, in priority order

1. **Scaffold this app properly**, with these corrections already agreed with the user
   before starting:
   - Run `npm install` first — `node_modules` doesn't exist yet, nothing works without it.
   - This repo's `AGENTS.md` says this Next.js install has breaking changes vs. typical
     training-data knowledge ("This is NOT the Next.js you know") — **read
     `node_modules/next/dist/docs/` before writing any code**, once it exists post-install.
   - Use the existing `@/*` path alias (already configured in `tsconfig.json`) for imports,
     not relative paths.
   - Include a small diagram of the dependency graph between components/pages as part of
     the scaffolding deliverable.
2. **Decide this app's actual purpose** before building further — it's not yet clear from
   the repo itself what `thekpihub-app` is meant to become (a new product surface? a rebuild
   of `thekpihub-website`? something else?). Confirm with the user rather than assuming.
3. **Once there's real UI here**, consider whether it should get its own `/design-sync`
   target, or consume the already-synced "Wingcommander Design System" components from
   `thekpihub-wingcommander-design-sync` instead of building a parallel design system from
   scratch — reusing what's already brand-correct and graded is strictly less work than
   re-deriving it here.
