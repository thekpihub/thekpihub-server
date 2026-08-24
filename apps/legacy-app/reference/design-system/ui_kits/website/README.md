# Website UI Kit — The KPI Hub

A React (Babel inline JSX) recreation of `thekpihub.com`'s marketing site, componentized.

## What's here

- `index.html` — full click-through marketing page (nav → hero → ticker → value props → how it works → features → stats → CTA → footer)
- `Primitives.jsx` — `Logo`, `Eyebrow`, `Badge`, `ButtonPrimary`, `ButtonGhost`, `KpiCard`, `Icon`, `FeatureCard`, `Step`, `StatCell`
- `Sections.jsx` — `Nav`, `CredibilityBar`, `Hero`, `Ticker`, `ValueProps`, `HowItWorks`, `Features`, `Stats`, `CtaBlock`, `Footer`
- `kit.css` — component styles (class-prefixed `kh-`), pairs with `../../colors_and_type.css`

## Usage

Open `index.html`. Scroll. The waitlist form accepts any email and shows a success state.

Import components elsewhere by copying the JSX file + kit.css + colors_and_type.css. All components attach to `window` so multiple Babel scripts share scope.

## Notes

- **Icons:** Lucide via CDN, always stroke-only, 1.5 stroke, color `#E9A123`.
- **Fonts:** Google Fonts (Cormorant Garamond, Syne, DM Sans) via `@import` in `colors_and_type.css`.
- **Custom cursor / full-screen overlay nav / cookie banner / chat FAB** from the prod site are NOT recreated here — they're site-level chrome, not UI-kit components. Pull the source from `reference/index.html` if you need them verbatim.
