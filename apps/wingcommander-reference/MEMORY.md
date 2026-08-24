# Project Memory — WingCommander

A running, dated record of what's been done in this repo, why, and what it bought — kept so
any engineer, designer, or AI agent picking this up later doesn't have to re-derive the
reasoning from the diff alone. Every entry below traces back to one underlying motive: **the
paying subscriber's experience on WingCommander should never be the place we cut corners.**
Append new entries at the top of "Log" as work happens; don't rewrite history below.

## Log

### 2026-06-21 — Component library build + Claude Design sync

**What:** Added a packaged library build (`frontend/vite.lib.config.ts`,
`frontend/tsconfig.lib.json`, `frontend/src/index.ts`, `npm run build:lib`) for
`frontend/src/components/ui` — the app itself had no importable `dist/`+`.d.ts` entry.
Used it to run Claude Code's `/design-sync` and upload all 12 real, authored, graded
components (Avatar, Badge, Button, Card, Dialog, DropdownMenu, Input, ScrollArea, Separator,
Tabs, Textarea, Tooltip) to a new claude.ai/design project, **"Wingcommander Design
System"** (https://claude.ai/design/p/02211231-7100-42d6-9d91-61635511d84a).

**Why:** Founders/designers had no way to prototype new WingCommander screens using the
*real* gold-on-navy KPI Hub components — any mockup tool defaults to generic components,
producing throwaway designs that don't map to shippable code.

**Two real bugs found and fixed along the way** (documented in
`frontend/.design-sync/NOTES.md`):
- `frontend/package.json` was missing `types`/`module` fields, so the sync tooling silently
  found 0 components even though the bundle was correct.
- The library entry had to live at `frontend/src/index.ts` (package root), not nested under
  `components/ui/`, or TypeScript's declaration emit puts `index.d.ts` in the wrong place
  relative to the JS bundle.
- 35 Radix subpart exports (`CardHeader`, `DialogTrigger`, `TooltipProvider`, etc.) had to be
  explicitly excluded from the top-level component list (`componentSrcMap` in
  `.design-sync/config.json`) — this library exports them as flat names, so the sync tool's
  auto-detection couldn't tell a subpart from a real component and listed 47 instead of 12.

**Documentation, split by audience** (so neither audience gets content useless to them):
`.design-sync/conventions.md` (short, strictly agent-actionable — read by the Claude Design
agent itself), `frontend/COMPONENT_LIBRARY.md` (full human-facing install/usage/
troubleshooting doc), `.design-sync/NOTES.md` (re-sync gotchas/risks for the next person).

**Benefit:** Every future screen designed in claude.ai/design for WingCommander now starts
from real, on-brand, working components — not a generic placeholder a developer has to
re-build from scratch. Design-to-ship time for new subscriber-facing features drops, and
brand consistency stops depending on someone remembering the gold/navy tokens by hand.
Verified bit-for-bit reproducible (a full re-sync against the live project's own anchor came
back "unchanged" on all 12) — this isn't a one-time upload that quietly rots.

A second, empty claude.ai/design project, **"PostPilot AI"**
(https://claude.ai/design/p/6c5a5f79-1fdc-4685-873e-c97dbe6518be), was also created for an
unrelated future product brief — not part of this WingCommander work.

### 2026-06-21 — Push credential failure → fallback repo

**What:** Couldn't push the above work to the intended `thekpihub/thekpihub-wing-commander`
repo — git's stored credential for `github.com` was invalid for that private repo (the `gh`
CLI itself was authenticated fine; plain git just wasn't wired to use it — fix is
`gh auth setup-git`, left for the repo owner to run). Created
`thekpihub/thekpihub-wingcommander-design-sync` (private) as a temporary home, pushed
everything there with a full session record in that repo's README.

**Why:** Work shouldn't sit only on a local machine waiting on an unrelated credential fix.

**Benefit:** Zero work lost, fully recorded with reasoning either way. See "Next steps"
below for migrating this back to the canonical repo once credentials are fixed.

A Word document physical record
(`WingCommander_Design_Sync_Session_Record_2026-06-21.docx`, local-only, not committed) was
also generated for an offline record independent of GitHub/Claude access.

### 2026-06-21 — Fixed 3 real CI failures

**What:** Found via the actual failing GitHub Actions checks on the new repo, fixed in
order:
1. A pre-existing `react-hooks/exhaustive-deps` ESLint warning in
   `frontend/src/pages/AdminPage.tsx` (the lint script uses `--max-warnings 0`, so even one
   warning fails CI) — fixed by memoizing `apiFetch`/`loadRequests`/`loadApproved`/
   `loadStats` with `useCallback`.
2. `.github/workflows/docker-image.yml` was GitHub's unmodified default template, building a
   nonexistent root `Dockerfile` — fixed to build `backend/Dockerfile` and
   `frontend/Dockerfile` explicitly.
3. `frontend/Dockerfile` itself had a latent bug independent of the workflow — it assumed a
   self-contained build context with its own lockfile, but this npm-workspaces monorepo only
   has a root-level `package-lock.json`. Rewritten to use repo-root context, mirroring
   `backend/Dockerfile`'s already-working pattern.

**Why:** "Resolve all the errors" — these were real, reproducible failures, not flakes; left
unfixed, every future push would keep showing red regardless of whether the actual change
was good, training everyone to ignore CI.

**Benefit:** All 4 GitHub Actions checks (`CI/Frontend`, `CI/Backend`, `CI/All checks
passed`, `Docker Image CI`) are green. CI now gives real signal again — a future PR that
actually breaks something will be caught, instead of failing alongside permanent noise.

## Next steps — recommended, in priority order

Framed the same way every step above was: **does this directly improve what a paying
subscriber experiences, or remove a risk to that experience?**

1. **Restore push access to the canonical repos.** Run `gh auth setup-git` (repo owner
   action), then migrate the commits from `thekpihub-wingcommander-design-sync` to
   `thekpihub/thekpihub-wing-commander` and retire the temporary repo. Until this happens,
   the canonical repo is missing today's work entirely.
2. **Keep the design system in sync as the product grows.** Any new component added to
   `frontend/src/components/ui` needs a `componentSrcMap` entry if it has Radix subparts, and
   an authored preview before the next `/design-sync` run — otherwise it either won't appear
   or will appear as a noisy floor card. This is what keeps "real components, not mockups"
   true over time instead of just on day one.
3. **Fix the now-stale `docker-compose.yml`** (flagged in `.design-sync/NOTES.md`) — its
   `context: ./backend` / `context: ./frontend` settings no longer match either Dockerfile's
   actual context requirements after today's fix. Low urgency (no CI depends on it) but worth
   closing so local Docker-based dev doesn't silently break for the next engineer who tries it.
4. **Extend `/design-sync` coverage to the rest of the app's UI** (editor, chat, workspace
   components) once those stabilize — they're the actual screens subscribers spend the most
   time in, so getting them into the same on-brand, agent-buildable design system compounds
   the benefit from item 1 well beyond the 12 primitives covered today.
5. **Add visual regression checks** (e.g. Chromatic/Percy, or even just diffing the
   design-sync's own per-component screenshots run-to-run) tied to the existing render-check
   pipeline — catches accidental brand/style drift before it reaches subscribers, for
   near-zero extra setup since the screenshot infrastructure already exists.
6. **Re-run `/design-sync` after any Tailwind token or brand change** (color, font, radius)
   — the whole point of syncing real components is that the design agent's knowledge decays
   the moment the source of truth changes and nobody re-syncs it.
