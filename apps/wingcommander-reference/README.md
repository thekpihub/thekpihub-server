# thekpihub WingCommander

> The premium AI intelligence layer built into [thekpihub.com](https://thekpihub.com) — exclusively for paid subscribers.

Powered by **Claude Opus 4.7** — the most capable AI model available.

## What is WingCommander?

WingCommander is not a standalone product. It is the most premium feature of The KPI Hub — unlocked for Pro and Business subscribers. It gives subscribers access to a full AI agent platform: chat, code generation, document intelligence, image generation, and autonomous multi-step agents.

## Feature Comparison

| Feature | WingCommander | Others |
|---|---|---|
| AI Model | Claude Opus 4.7 (best available) | Unknown / GPT-4 |
| Context Window | 200,000 tokens | ~32K tokens |
| Extended Thinking | ✅ | ❌ |
| RAG / Document Upload | ✅ | ❌ |
| Image Generation + Vision | ✅ | ❌ |
| Autonomous Agents | ✅ | Limited |
| Integrated with KPI Hub | ✅ | ❌ |

## Agent Modes

| Mode | Description |
|---|---|
| **Chat** | Conversational AI with 200K token context |
| **Code** | Full-stack app generation with automatic file extraction |
| **RAG** | Document upload + intelligent retrieval + citations |
| **Image** | Prompt enhancement + Claude Vision analysis |
| **Autonomous** | Multi-step agent loops with extended thinking |

## Architecture

```
thekpihub-wingcommander/
├── frontend/           # React 18 + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/ # UI library, chat, Monaco editor, workspace
│       ├── pages/      # Landing, Auth, Dashboard, Workspace
│       ├── lib/        # Supabase, theme, utils
│       ├── store/      # Zustand (auth, projects, chat, theme)
│       └── types/      # TypeScript interfaces
├── backend/            # Node.js + Express + Anthropic SDK
│   └── src/
│       └── routes/     # /chat (SSE streaming), /execute, /rag, /image, /auth
└── cloudflare-worker/  # Auth bridge + Stripe/Razorpay webhook handler
```

## Integration with thekpihub.com

WingCommander uses a secure JWT handoff flow:

1. User logs in and pays on **thekpihub.com**
2. Subscriber clicks "Open WingCommander"
3. **Cloudflare Worker** verifies their subscription and mints a short-lived JWT
4. User is redirected to `wingcommander.thekpihub.com?token=...`
5. WingCommander validates the JWT and grants access

See `docs/thekpihub-integration.md` for full integration guide.

## Payment Providers

- **Stripe** — primary (global, 135+ currencies)
- **Razorpay** — fallback (India KYC, UPI, NetBanking support)

Both are handled by the Cloudflare Worker. Supabase stores the plan state.

## Subscription Plans

| Plan | Price | Access |
|---|---|---|
| Free | $0 | Not included |
| Pro | $19/mo | Full WingCommander access |
| Business | $49/mo | Pro + team seats |

Annual pricing available at 20% discount.

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com)
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
git clone https://github.com/hsharmagxi-debug/thekpihub-wingcommander
cd thekpihub-wingcommander
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit both .env files — add ANTHROPIC_API_KEY and Supabase credentials
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel (`vercel.json` preconfigured) |
| Backend | Railway (`railway.toml` preconfigured) |
| Auth Bridge | Cloudflare Worker (`cloudflare-worker/worker.js`) |

## Security

- JWT auth with 1-hour expiry
- HANDOFF_SECRET shared between thekpihub.com and WingCommander (never in client-side code)
- Rate limiting: 60 req/min per IP
- Helmet.js security headers
- HTTPS enforced on all production endpoints
- GDPR + India DPDP Act compliant

## Brand

Colors: Navy `#06071A` · Gold `#E9A123` · Teal `#00C9A7`  
Fonts: Cormorant Garamond · Syne · DM Sans

## Design System Sync — 2026-06-21 session record

This repo (`thekpihub-wingcommander-design-sync`) is a snapshot created to hold the work
below, after a push to the canonical `thekpihub/thekpihub-wing-commander` repo failed on
broken local git credentials. The canonical history/ongoing work for WingCommander still
lives in `thekpihub/ditto-wingman` and `thekpihub/thekpihub-wing-commander` — this repo is a
record, not a replacement.

### What was done

**1. Continued the Ditto Wingman → WingCommander rebrand.** Package names
(`ditto-wingman-frontend`/`-backend` → `thekpihub-wingcommander-frontend`/`-backend`),
deploy configs (`ecosystem.config.js`, `vercel.json`), theme/localStorage keys, meta tags,
and brand fonts/colors (Navy `#06071A`, Gold `#E9A123`, Cormorant Garamond / Syne / DM Sans)
were updated across the monorepo to match the WingCommander identity.

**2. Added a packaged library build for `frontend/src/components/ui`.** The frontend is a
Vite *app* (no library `dist/` entry, no `.d.ts` emit — `tsconfig.json` has `noEmit: true`).
Added `frontend/vite.lib.config.ts`, `frontend/tsconfig.lib.json`, and
`frontend/src/index.ts` to produce a real importable build (`npm run build:lib` →
`dist-lib/index.es.js` + `dist-lib/index.d.ts` + `dist-lib/style.css`), and pointed
`package.json`'s new `module`/`types` fields at it. This doesn't touch the existing app
build (`npm run build`) at all — it's a second, additive build path.

**3. Synced all 12 UI components to Claude Design.** Using Claude Code's `/design-sync`
skill, the library was converted and uploaded to a new claude.ai/design project,
**"Wingcommander Design System"**
(https://claude.ai/design/p/02211231-7100-42d6-9d91-61635511d84a):

- Components: `Avatar`, `Badge`, `Button`, `Card`, `Dialog`, `DropdownMenu`, `Input`,
  `ScrollArea`, `Separator`, `Tabs`, `Textarea`, `Tooltip`.
- Each component has a real authored preview (`frontend/.design-sync/previews/<Name>.tsx`)
  with 2-6 realistic example "stories", graded `good` on Styled/Complete/Plausible criteria
  against actual screenshots — not placeholder content.
- 35 Radix subpart exports (`CardHeader`, `DialogTrigger`, `TooltipProvider`, etc.) were
  deliberately excluded from the top-level component list (`componentSrcMap` overrides in
  `frontend/.design-sync/config.json`) since this library exports them as flat names rather
  than dotted namespaces, and the converter can't otherwise tell they're subparts of the 12
  real components rather than 47 separate ones.
- Overlay components (`Dialog`, `DropdownMenu`, `Tooltip`) use a `cardMode: "single"` +
  fixed `viewport` override so their Radix-portaled open state renders inside the preview
  card instead of escaping it.
- **Verified, not just uploaded**: a full driver re-sync (`node .ds-sync/resync.mjs ...
  --remote <fetched-anchor>`) was run against the live project's own `_ds_sync.json`
  immediately after upload, confirming all 12 components come back `unchanged` —
  i.e. the bundle is bit-for-bit reproducible from this exact source tree.

**4. Documentation, split by audience:**
- `frontend/.design-sync/conventions.md` — short (~3.3k characters), strictly agent-actionable
  conventions (theming, real Tailwind class names, where the source of truth lives, one build
  snippet), baked into the uploaded project's `README.md` for the Claude Design *agent* to
  read. Every class/token name in it was checked against the actual compiled CSS before
  shipping — one inaccurate claim (`.glass-dark`, unused by these 12 components and dropped
  by Tailwind's build) was caught and removed this way.
- `frontend/COMPONENT_LIBRARY.md` — the full human-facing doc: what the library is, why the
  separate build exists, install/build steps, a usage example, and troubleshooting (rootDir
  errors, missing components, styling mismatches, Playwright/render-check pinning, overlay
  rendering issues).
- `frontend/.design-sync/NOTES.md` — repo-specific gotchas and re-sync risks for whoever runs
  this next.

**5. A second, empty claude.ai/design project, "PostPilot AI"**
(https://claude.ai/design/p/6c5a5f79-1fdc-4685-873e-c97dbe6518be) was also created at the
user's request, ready for a separate, unrelated AI social-content-generator design brief to
be pasted into claude.ai/design directly — not part of the WingCommander sync.

### Where things live

| What | Path |
|---|---|
| Library build config | `frontend/vite.lib.config.ts`, `frontend/tsconfig.lib.json` |
| Library entry | `frontend/src/index.ts` |
| Sync config/state | `frontend/.design-sync/` (`config.json`, `NOTES.md`, `conventions.md`, `previews/`) |
| Human-facing doc | `frontend/COMPONENT_LIBRARY.md` |
| Sync scripts (gitignored, regenerated) | `frontend/.ds-sync/` |
| Build output (gitignored, regenerated) | `frontend/dist-lib/`, `frontend/ds-bundle/` |

## License

MIT — part of The KPI Hub product suite.
