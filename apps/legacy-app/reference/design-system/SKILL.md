---
name: The KPI Hub
description: Design system for The KPI Hub (thekpihub.com) — a SaaS intelligence platform. Use whenever creating marketing pages, pitch decks, product UI mockups, investor reports, or any branded surface for The KPI Hub. Mood is "Bloomberg terminal meets editorial magazine": near-black navy ground, gold hero accent, serif display type, zero-fluff editorial voice.
---

# The KPI Hub — Design System Skill

## First steps

1. **Read `README.md` in full.** It's the canonical reference — context, content fundamentals, visual foundations, iconography, and font-file notes.
2. **Link `colors_and_type.css`** in every HTML deliverable. It provides all tokens as CSS variables plus self-hosted `@font-face` for the brand typefaces. Copy the file (or reference it relative to the skill dir) into the project — don't re-declare tokens inline.
3. **Copy required font files** from `fonts/` if your output lives outside this directory: `SourceSerif4Variable-Roman.ttf.woff2`, `Beiruti-VariableFont_wght.woff2`, `Manrope-VariableFont_wght.woff2`, `source-serif-4-latin-600-normal.1fa3c140bffa465b.woff`. Preserve the relative path `fonts/<file>` so the `@font-face` `src:` URLs resolve.
4. **For marketing-site recreations**, start from `ui_kits/website/` — it has a full Babel/JSX component set (`Primitives.jsx`, `Sections.jsx`) plus `kit.css`. Copy the whole folder + `colors_and_type.css` + `fonts/` into the deliverable.
5. **For reference reading**, `reference/` contains the original production HTML pages (index, dashboard, blog, login, etc.) for copy, structure, and verified component behavior. Don't ship these files — they're source-of-truth for lifting exact strings and patterns.

## Core rules (non-negotiable)

- **Ground color is `#06071A`** (near-black navy). Never pure black, never true white on light surfaces. Alt sections use `#0C0E28`.
- **Gold `#E9A123` is the single hero accent.** Used for CTAs, the logo dot, `<em>` emphasis inside headlines, KPI numerals, glow effects. Don't introduce new accent colors — teal `#00C9A7` is reserved for positive/up-signal only; red `#FF6B6B` for negative/down-signal.
- **Type stack:** Source Serif 4 (display, serif), Beiruti (labels/UI, sans), Manrope (body, sans). Italic serif with gold fill is the signature move for hero emphasis — preserve it.
- **Icons are Lucide**, always stroke-only, stroke-width **1.5** (not the Lucide default of 2), stroked in gold. Sit inside a 50×50 gold-glow tile with gold-rim border in feature contexts.
- **No emoji in UI.** The only exception is `☕` in the footer ("Made with ☕ in Delhi, India"). Don't propagate emoji elsewhere.
- **Voice:** confident, editorial, "zero fluff." Triple constructions with em-dashes. Proper-noun feature names (Intelligence Feed, Decision Reports). Second-person "you." No "empower / unleash / seamless / streamline."

## What's in this directory

```
README.md              Full brand + system documentation (READ FIRST)
colors_and_type.css    All tokens + @font-face — link this
SKILL.md               This file
fonts/                 Self-hosted brand fonts (Source Serif 4, Beiruti, Manrope)
assets/                Logos (favicon, mark, wordmark SVG)
preview/               Design-system review cards (Type / Colors / Spacing / Components / Brand)
ui_kits/website/       React (Babel JSX) recreation of the marketing site
reference/             Original production HTML pages — read-only source
```

## When the user asks for…

- **"A new marketing page"** → start from `ui_kits/website/index.html`; reuse `<Nav>`, `<Hero>`, `<FeatureCard>`, `<Ticker>`, `<CtaBlock>`, `<Footer>`. Pull any missing section (e.g. testimonials) from `reference/index.html`.
- **"A pitch deck / investor deck"** → use `deck_stage.js` starter; apply `colors_and_type.css`; treat slide titles as Source Serif 4 italic with gold em, body as Manrope, all labels/footers as Beiruti uppercase. Hero slide should mirror the website hero's radial-glow + faint-gold-grid background.
- **"Dashboard / product UI"** → read `reference/dashboard.html` first. Note: the dashboard ALREADY uses a slightly different token set (`--teal` as primary, not gold) — ask the user whether to stay marketing-accent (gold) or product-accent (teal) before starting.
- **"Article / blog post layout"** → `reference/article-template.html` is the canonical template.
- **"Social / OG images"** → use the logo from `assets/logo-wordmark.svg`, Source Serif 4 headline with italic gold `<em>`, 64px gold grid background, radial gold glow.

## Substitution policy

If a deliverable must be printed, or exported to PPTX without embedded fonts, or shipped to a platform that can't load `.woff2`, **tell the user** which fonts are being substituted and offer Georgia (for Source Serif 4), Arial/Helvetica (for Beiruti), system-sans (for Manrope) as the lowest-friction fallbacks.
