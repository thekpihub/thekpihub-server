# The KPI Hub — Design System

**The KPI Hub** (`thekpihub.com`) is a SaaS intelligence platform founded by Himanshu Sharma. It synthesizes real-time SaaS industry data (funding rounds, product launches, benchmark shifts, competitive signals) into decision-grade, AI-curated intelligence for SaaS operators, founders, analysts, and investors. The tagline: **"Decision-Grade Intelligence. Zero Fluff."**

Four primary user personas get role-intelligent dashboards post-login. The product is built around a **5-engine AI pipeline** (Harvest → Synthesize → Verify → Deliver → Learn) running daily on Claude + SerpAPI.

---

## Index

| File / folder | What's inside |
|---|---|
| `README.md` | This file — context, content fundamentals, visual foundations, iconography |
| `colors_and_type.css` | All design tokens as CSS variables (colors, type, spacing, motion) |
| `SKILL.md` | Claude Skills manifest — makes this directory invocable as an Agent Skill |
| `fonts/` | Web font files (Google Fonts — Cormorant Garamond, Syne, DM Sans) |
| `assets/` | Logos, favicons, product screenshots, placeholder imagery |
| `preview/` | Individual HTML cards rendered in the Design System review tab |
| `ui_kits/website/` | React (JSX via Babel) recreation of the marketing site — components + clickable `index.html` |
| `reference/` | The original source HTML pages (imported, read-only — not the design system) |

## Source material

- **GitHub repo:** `nitro0dust-pixel/thekpihub-website` — static HTML/CSS/JS marketing site + article pipeline. Pages in `reference/`.
- **WordPress install:** `wordpress-6.9.4/` (attached locally) — empty vanilla install; no custom theme or content. Not used.
- **Founder brief:** product vision for TheKPIHub.com as a "category-creation" SaaS intelligence platform.

---

## CONTENT FUNDAMENTALS

### Tone
**Confident, editorial, slightly adversarial.** The brand positions itself as the anti-dashboard — the product that makes other analytics tools "obsolete." Copy has an authored, almost op-ed voice (rare for SaaS) but never drifts into casual-chatty.

### Casing
- **Headlines & display:** sentence case with intentional *italic emphasis* (the gold-colored `<em>` inside headlines is a signature move — e.g. "*Decision-Grade* Intelligence").
- **Eyebrows, buttons, nav items:** UPPERCASE with wide tracking (letter-spacing 0.06em–0.14em). Always Syne.
- **Body copy:** sentence case, normal.
- Tasteful ampersand (`&`) over "and" in short UI strings.

### Voice: "you" first
Second-person. "You evaluate faster, decide smarter, and scale with confidence." "Know where you stand." The user is always the protagonist. The brand itself ("we," "our") appears sparingly — mostly in the pipeline / how-it-works section.

### Signature copy moves
- **Short, punchy promise + "zero fluff" / "zero noise" closers.**  
  e.g. "All the research done. All the questions answered. Zero fluff."
- **Triple construction** with em-dashes or periods for rhythm.  
  e.g. "No dashboards to dig through. No fluff to filter. Just signal."
- **Numbers-first credibility.** "40+ Data Sources Wired," "6 KPI Categories Tracked," "Top 300 India Builder · VibeCon 2025."
- **Noun phrases as feature names.** "Intelligence Feed," "Decision Reports," "Smart Alert System," "Benchmark Tracker" — capitalized, treated as proper nouns.
- **Made with ☕ in Delhi, India** as an earnest, founder-scale footer flourish. (This is the ONE place emoji appears in the whole site.)

### What NOT to do
- No exclamation marks in marketing copy.
- No "empower," "unleash," "seamless," "streamline" — generic SaaS verbs are avoided.
- No gendered pronouns; "SaaS operators," "analysts," "performance leaders."
- No emoji in product copy (the chat assistant KB uses them, as a character trait of that feature).
- Don't pad. Every sentence earns its line.

### Example strings
> *"Decision-Grade Intelligence. Zero Fluff."* — tagline  
> *"Intelligence that actually moves the needle"* — section headline  
> *"From raw data to ready decisions"* — section headline  
> *"Ask any question about SaaS tools, vendors, or KPIs and get a verified, sourced answer in seconds — not hours of Googling across 40 tabs."* — feature body  
> *"Built by night-shift cloud engineer turned SaaS founder. Building decision-grade intelligence for operators who can't afford to be wrong."* — founder bio

---

## VISUAL FOUNDATIONS

### Mood
**Bloomberg-terminal-meets-editorial-magazine.** Deep navy ground, gold as the single hero accent, occasional teal for positive signal. Serif display typography collides with geometric Syne UI labels and DM Sans body — an intentional tension between "authored" and "analytical."

### Color
- **Ground:** `#06071A` (near-black navy) everywhere. Alternate sections use `#0C0E28`. Never pure black, never true white.
- **Hero accent:** `#E9A123` (warm gold/amber). Used for CTAs, the dot in the logo, the `<em>` inside headlines, KPI numerals, active nav, scrollbar thumb, and glow effects. Aggressive monochromatic accent strategy — the whole page has one accent color doing all the lifting.
- **Secondary accent:** `#00C9A7` (teal) — strictly for positive signal (up-trends, "online" indicators, success states).
- **Negative signal:** `#FF6B6B` (coral red) for down-trends.
- **Text hierarchy:** `#EAEDF5` → 62% → 32% opacity (fg1/fg2/fg3). Never #fff.

### Backgrounds
- **Faint grid pattern** on the hero: 64px gold gridlines at 5% opacity, animated via a 5s `gridBreath` keyframe (opacity 0.55 → 1 → 0.55).
- **Radial glow** behind hero h1: 900×700px gold-to-teal gradient, low opacity.
- **No photography** in the hero surfaces. Photography appears only in avatars and possibly future blog imagery. Keep it grayscale-leaning / warm if used.
- **No textures, no hand-drawn illustrations, no emoji backgrounds.**
- **Full-bleed sections alternate** `--bg` and `--bg-2` with 1px hairline borders between.

### Typography
- **Source Serif 4** (self-hosted variable serif, 200–900 axis) — hero H1s, section titles, KPI numerals, italic emphasis. Weight 600–800 for display; italics pull gold as the accent. **Brand replacement for Cormorant Garamond.**
- **Beiruti** (self-hosted variable sans, 200–900 axis) — eyebrows, buttons, nav, labels, card subheads. Weight 600–800, uppercase with wide tracking. **Brand replacement for Syne.** Syne remains as a fallback in the stack.
- **Manrope** (self-hosted variable sans, 200–800 axis) — body copy, meta, form inputs. Weight 300 (hero sub) / 400 / 500. **Brand replacement for DM Sans.**
- Display weight is **800 with ls: -0.03em**. Beiruti labels are **700 with ls: 0.06–0.14em uppercase**. Body is **400 lh: 1.65**.
- All three are shipped as local `.woff2` / `.woff` files in `fonts/` and loaded via `@font-face` in `colors_and_type.css` — the design system is **fully self-contained offline**.

### Spacing & layout
- **8pt grid** throughout. Section padding `100px 48px` desktop, `80px 24px` tablet. Max container `1180px`.
- **Grids are 3-up** for value props, features, steps. Stats are 4-up. Content is contained; the eye rests often.
- **Fixed-position nav** (72px, backdrop-blur 24px, 88% opacity bg). Custom cursor (10px gold dot + 36px gold ring, mix-blend screen) — disabled on touch.

### Corner radii
- `--r-lg: 12px` is the default card radius — everything rounds gently, never brutally.
- Buttons: 8px (primary), 8px (ghost), 6px (small nav CTA).
- Badges/pills: 100px.
- **No fully-rounded or fully-square surfaces.**

### Borders
- Hairline `rgba(255,255,255,0.08)` between sections and around cards — default.
- On hover, borders shift to `--gold-rim` (gold at 0.28 alpha).
- Gold rims appear on badges (gold-glow fill + gold-rim border).

### Shadows & glows
- **Glow-forward, not drop-shadow forward.** Primary CTA has `0 0 50px rgba(233,161,35,0.35)` — on hover, amplified to `0 0 80px rgba(233,161,35,0.55)`.
- Cards use subtle translateY lift + border-color change, not shadow growth.
- Inner shadows: not used.
- Scroll-linked radial glows behind hero & CTA sections.

### Hover & press states
- **Buttons (primary gold):** `translateY(-3px)` + stronger gold glow. No color shift — the glow is the affordance.
- **Buttons (ghost):** border color shifts to gold-rim, text to full white, `translateY(-2px)`.
- **Cards:** border color → gold-rim, `translateY(-5px)`, a top-edge gradient bar (gold → teal) fades in.
- **Overlay nav links:** color → gold AND letter-spacing widens from -0.025em to +0.01em. (Wonderful micro-interaction.)
- **Press:** no explicit pressed state defined; hover→transform reverts via default.

### Animations
- **Easing is decisive.** Primary ease `cubic-bezier(0.77, 0, 0.175, 1)` (strong in-out) for overlays; `cubic-bezier(0.16, 1, 0.3, 1)` (smooth out) for reveals.
- **Clip-path reveals:** the full-screen nav overlay opens via `clip-path: inset(...)` over 0.75s — cinematic, curtain-like.
- **Fade-up on scroll:** 28px translate + opacity, `transition: 0.7s`, staggered via `transition-delay` cascades of 0.07–0.15s.
- **Floating KPI cards** in hero drift vertically on 5.5–7s loops.
- **Blinking status dots:** 2s `scale(1) → scale(0.8)` + opacity pulse.
- **Ticker bar:** infinite 36s linear translateX.
- **NO bounces.** Nothing springs.

### Transparency & blur
- **Nav bar:** `rgba(6,7,26,0.88)` + `backdrop-filter: blur(24px)`.
- **Chat window:** same pattern.
- **Cards:** `rgba(255,255,255,0.04)` — not translucent blur; just a faint sheen.
- Used sparingly — mostly on fixed elements that need to sit over moving content.

### Imagery vibe
- When photography is used (currently: founder avatar only), **warm-leaning, natural, no heavy grain, no filter**.
- Avatar is round, gold 2px border, `rgba(233,161,35,0.08)` fallback bg.
- No stock photography, no illustrations of people.

### Layout rules
- **Fixed elements:** nav (top), chat FAB (bottom-right), cookie banner (bottom sliding).
- **Scroll behavior:** `scroll-behavior: smooth`. Custom gold scrollbar (5px thumb, rounded 3px).
- **Center-aligned hero**, left-aligned section headers with right-aligned subcopy (flexbox `justify-content: space-between; align-items: flex-end`).

---

## ICONOGRAPHY

### System in use
**Lucide Icons** via CDN (`https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`). Every icon on the marketing site is a Lucide SVG. Usage pattern:

```html
<i data-lucide="brain"
   style="width:28px; height:28px;
          stroke:#E9A123; stroke-width:1.5;
          fill:none;"></i>
```

### Stroke & style
- **Stroke-only, never filled.** Stroke is always the gold `#E9A123`.
- **Stroke width 1.5** — the Lucide default is 2; this site intentionally uses 1.5 for a more refined, editorial feel. **Preserve 1.5 when substituting.**
- **Size:** 28×28 within feature cards (inside a 50×50 rounded-square tile with gold-glow bg + gold-rim border).
- Nav hamburger is rendered as 3 custom `<span>` lines (not an icon) — don't replace.

### Logo icon
The K-mark. Rendered as a favicon SVG (inline data URI) and as the chat-FAB avatar:
- 32×32 rounded square, `#06071A` bg, bold gold `K` glyph centered (Syne 18px weight 800).
- See `assets/favicon.svg` and `assets/logo-mark.svg`.

### Emoji
- **Not used in product copy or UI.** The single exception is `☕` in the footer ("Made with ☕ in Delhi, India") as a founder flourish.
- The chat assistant's knowledge-base *responses* contain emoji (🎯 🤖 💰) — scope-limited to bot dialogue only. Don't propagate.

### Unicode as icons
- `→` (arrow) in CTA copy and nav links: "Get Early Access →", "See How It Works →".
- `◆` (diamond) separator in the ticker bar, gold-colored.
- `↑` / `↓` in KPI card delta lines.
- `·` (middle dot) as separator in meta lines.

### Social icons
Inline SVG, full-color brand marks (Google, Microsoft, GitHub, Yahoo, Discord, LinkedIn) on the login/CTA blocks. These are literal brand logos — don't restyle.

### Specific Lucide icons used
`brain`, `target`, `zap`, `bar-chart-2`, `search`, `trending-up`, `bot`, `bell`, `lightbulb`. For any new feature card, pick from this vocabulary first.

---

## A note on font files

All three brand fonts ship as local files in `fonts/` — no CDN dependency. The stack is:

| Role | Family | File(s) |
|---|---|---|
| Display (serif) | Source Serif 4 | `SourceSerif4Variable-Roman.ttf.woff2`, `source-serif-4-latin-600-normal.1fa3c140bffa465b.woff` |
| Head (sans label) | Beiruti | `Beiruti-VariableFont_wght.woff2` |
| Body (sans) | Manrope | `Manrope-VariableFont_wght.woff2` |

All variable fonts are declared with full weight ranges (200–900 / 200–800) so any weight works without loading additional files. Syne is still imported from Google Fonts as a fallback behind Beiruti, but the design system no longer depends on Google Fonts reaching the client.
