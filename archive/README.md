# Archive

Everything under this folder is **frozen**: kept for reference/history, not deployed anywhere,
not built or tested by CI, and not expected to change except by explicit decision. Moved here
2026-09-10 during a repo-wide cleanup — see `docs/ARCHITECTURE.md` for the current-vs-archived
model and `servermemory.md`'s 2026-09-10 entries for the full reasoning behind each item below.

- **`apps/legacy-app`** — a complete, separate SaaS backend (auth, RBAC, Stripe+Razorpay
  billing, admin panel, a real 12-migration Postgres schema) that was investigated in full for
  a possible `kpihub-backend` deployment and deliberately not activated: no live database
  anywhere has any KPI data for it to serve regardless of which backend hosts it, and deploying
  it wholesale would stand up a second live user/billing system alongside `apps/platform`'s
  existing one. Its root-level Next.js frontend really is an untouched `create-next-app`
  scaffold (its own old `MEMORY.md` was right about that much); the `backend/` subfolder is not.
- **`tools/automated-website-builder`** — a local WSL/Ollama experiment ("AMSDV Pipeline"),
  last touched 2026-05-31, never deployed to Hostinger as its own notes intended.
- **`session-docs/`** — ~70 historical planning/status/audit markdown files that had
  accumulated at the repo root (SPRINT-*, PHASE-A/B/C/D-*, RAZORPAY-*,
  MIGRATION-VERIFICATION-*, an old root `MEMORY.md`, etc.). Verified via a repo-wide grep before
  moving: zero references from any code or CI — pure documentation clutter.

If something here ever needs to come back into active use, that's a deliberate decision (move
it back, wire up any CI/deploy config it needs, update `docs/ARCHITECTURE.md`) — not something
to do by just referencing a file inside this folder from live code.
