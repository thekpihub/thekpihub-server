# design-sync notes — thekpihub-wingcommander-frontend

## Repo-specific gotchas

- **No library build existed before this sync.** `frontend/` is a Vite *app* (`vite.config.ts` has no `build.lib`, `tsconfig.json` has `noEmit: true`). Added `vite.lib.config.ts` + `tsconfig.lib.json` + `src/index.ts` to produce a real `dist-lib/` entry + `.d.ts` tree for the converter, and `"module"`/`"types"` fields in `package.json` pointing at it. Run via `npm run build:lib` (`cfg.buildCmd`). This build is separate from the app's own `npm run build` and doesn't affect it.
- **`pkgJson.types`/`typings` is the only hook for the converter's `.d.ts` discovery** — there's no `.design-sync/config.json` override for it. If the library entry path ever moves, update `package.json`'s `types`/`module` fields, not just `cfg.entry`.
- **`.glass-dark`** is defined in `src/index.css` (`@layer utilities`) but isn't referenced by any of the 12 synced `components/ui/*` files, so Tailwind's content scan correctly drops it from the compiled output (`_ds_bundle.css`). Documented in source, absent from the build — not a bug, just not part of this design system's surface. Only `.glass` (used by `Button`'s `glass` variant) ships.
- **35 Radix subpart exports excluded via `componentSrcMap: {Name: null}`** (`CardHeader`, `DialogTrigger`, `TooltipProvider`, etc.) — this library exports subparts as flat names, not dotted namespaces, so the converter's auto subcomponent-grouping can't detect them and would otherwise list all 47 as separate top-level cards. Keep this list in sync if new subparts are added to any of the 12 components.
- **Fonts** (`DM Sans`, `Syne`, `JetBrains Mono`) load at runtime via a Google Fonts `<link>` in `index.html`, not bundled — `cfg.runtimeFontPrefixes` suppresses the `[FONT_MISSING]` warning for them. `Cormorant Garamond` is also loaded there but isn't referenced by any of the 12 synced components, so it never triggers the warning either; no action needed unless a future component starts using `font-serif`.
- **Overlay components** (`Dialog`, `DropdownMenu`, `Tooltip`) use `cfg.overrides.<Name>: {cardMode: "single", viewport: "WxH"}` because Radix portals their content outside the card's normal flow. Viewports were sized for the current authored previews (420x320 / 260x320 / 240x140) — if a preview's composition grows taller/wider, bump the matching viewport.
- **Playwright pinned to `1.60.0`** (`.ds-sync/package.json` devDeps via manual `npm i playwright@1.60.0` in `.ds-sync/`) to match a Chromium build (revision 1223) already cached on this machine. A fresh machine/CI runner won't have that constraint — `npm i playwright` (latest) is fine there.

## Known render warns

None — render check is fully clean (0 bad, 0 thin, 0 variantsIdentical) as of this sync.

## Re-sync risks

- The library build (`vite.lib.config.ts`, `tsconfig.lib.json`, `src/index.ts`) is new infrastructure added specifically to support this sync, not pre-existing project tooling — if it's ever refactored or removed, `cfg.buildCmd` and the `module`/`types` fields in `package.json` must be updated together, or the converter will silently fall back to a weaker synth-entry extraction.
- The `componentSrcMap` exclusion list is hand-maintained against the current 12 components' subparts. Adding a 13th component (or new subparts to an existing one) needs a matching `componentSrcMap` entry, or it will appear as an unwanted extra top-level card on the next sync.
- `cssEntry` points at `dist-lib/style.css`, which only exists after `build:lib` runs — a re-sync that skips the build step (assuming `dist-lib/` is current) will silently sync stale styles if components changed since the last build.
