# Homepage pre-rendering

The homepage was the only page on thekpihub.com that shipped as a client-rendered shell:
4,271 bytes whose entire `<body>` content was `<div id="root">` plus a loading spinner.
All 18 landing sections were injected by JavaScript, so crawlers saw ~128 characters of text
on the site's highest-authority URL.

`prerender.mjs` bakes those sections into the HTML at build time.

## Run it

```bash
# from anywhere — react and react-dom 18.3.1 must be installed
node tools/prerender.mjs --src . --out index.prerendered.html --write-hydrate
```

Install the dependencies **outside** this folder (a `node_modules/` here would sync ~40k
files to OneDrive):

```bash
mkdir %TEMP%\kpihub-build && cd %TEMP%\kpihub-build
npm init -y && npm install react@18.3.1 react-dom@18.3.1
node "<path-to>/website-source/tools/prerender.mjs" --src "<path-to>/website-source" --write-hydrate
```

React must stay pinned to **18.3.1** — the same version `index.html` loads from unpkg. A
version skew between the renderer used here and the one in the browser breaks hydration.

## How it works

It does not reimplement the page. It runs the existing bundles (`landing/hero.js`,
`sections-a…f.js`, `app.js`) inside a `node:vm` sandbox with a stubbed `ReactDOM`, captures
the exact element tree `app.js` mounts, and renders that with `renderToString`. Whatever the
browser would render is what gets baked in.

Browser APIs the bundles touch (`requestAnimationFrame`, `setInterval`,
`IntersectionObserver`, `window`, `document`) all live inside `useEffect`, which React never
runs on the server. The sandbox stubs exist only so a stray reference cannot throw.

The script then:

1. replaces the spinner inside `<div id="root">` with the rendered markup;
2. adds `defer` to every render-blocking `<script>` (GA and Clarity are already `async`);
3. repoints `landing/app.js` → `landing/app.hydrate.js`;
4. writes `landing/app.hydrate.js`, which calls `hydrateRoot` when markup is already present
   and falls back to `createRoot` when it isn't — so that file is safe on both HTML versions.

## Results

| | before | after |
|---|---|---|
| HTML | 4,271 B | 58,226 B |
| Crawlable text | 128 B | 14,538 B |
| `<h1>` | none | "Find the revenue leaks hiding in your numbers — in 48 hours." |
| `<h2>` | 0 | 12 |
| Render-blocking scripts | 11 | 0 |
| Crawlable internal links | 1 | 24 unique pages |
| Dead `href="#"` links | 15 | 0 |
| Hydration errors | — | 0 |

## Footer and persona links

`SectionFooter` previously rendered every link as `href="#"`, and each persona CTA in
`SectionPersonas` did the same. Pre-rendering makes those visible to crawlers, so they had to
be wired before this page could ship — 15 baked-in dead links is worse than a page nobody can
read.

The footer is now four columns (Product / Intelligence / Free Tools / Company) plus a legal
row in the bottom rail, 27 links total, and the grid went `lg:grid-cols-5` → `lg:grid-cols-6`
to fit the extra column beside the two-column logo block. The four persona CTAs all point at
`dashboard.html`; there are no per-role dashboard pages, so they share the one that exists.

**Every destination was checked for a 200 before being linked.** A `404` is worse than a `#`.
Re-check before adding more — `tools/prerender.mjs` will happily bake in a broken link.

Five of the linked pages were already deployed on production but referenced from nowhere and
absent from `sitemap.xml`: `updates.html`, `register.html`, `sitemap.html`, `upgrade.html`,
`account/integrations.html`. They are live now via the footer. **Add them to `sitemap.xml`** —
that is still outstanding.

## Admin portal exposure

`admin-login.html` was reachable four different ways at once, and the mitigations were
fighting each other:

| | before | after |
|---|---|---|
| Nav overlay menu ("Admin Portal", *Staff* badge) | on `about`, `blog`, `directory`, `articles/template` | removed, items renumbered |
| `sitemap.xml` | listed at priority 0.50 | removed |
| `robots.txt` | `Disallow: /admin-login.html` | removed |
| Page meta | `<meta name="robots" content="index, follow">` | `noindex, nofollow` |

The page itself is untouched apart from that one meta tag — this changes discoverability, not
access control. **It is still a public URL with no server-side protection.** Put it behind
auth, IP restriction, or a non-guessable path if that matters.

Two notes on why it was done this way:

- **`Disallow` and `noindex` cancel out.** A crawler has to fetch a page to read its
  `noindex`, so a disallowed URL never gets the instruction — and can still surface as a bare,
  snippet-less listing if anything links to it. Allow the crawl, refuse the index.
- **`robots.txt` is public.** `Disallow: /admin-login.html` was a signed statement of where
  the admin login lives. The replacement comment deliberately does not name the path.

The article template mattered most here: it is the template every future published article
is generated from, so the admin link would have been stamped onto the whole content library.

Originals in `docs/attention-required-backup/_admin-delink-backup/`.

## The article template is generator input, not a page

**Archived 2026-09-04** — `article-template.html` and `publish_articles.py` (formerly
`tools/article-template.html` and `tools/publish_articles.py`) now live in
`archive/static-article-generator/`; see the README there for why. They were never wired
into any GitHub Actions workflow — `pipeline.py` publishes straight to WordPress's DB
instead, and this pair's static-file design never ran in production. Kept below for
history.

`article-template.html` carries `<meta name="robots" content="index, follow">` because
that meta is *copied into every generated article*, where it belongs. The file itself
must never be served: as a page it is raw `{{TITLE}}` / `{{SLUG}}` placeholder text, and
at `/articles/template.html` it was live and indexable. Setting it to `noindex` would
have been the wrong fix — it would de-index the whole future content library.

It used to live under `tools/`, which `.deploy-exclude` keeps off the server, for the
same reason `tools/index.shell.html` does. `publish_articles.py` read it from there.

## Recompiling JSX

`tools/compile-jsx.mjs` reproduces the project's existing compiled output byte-for-byte
(verified against untouched `sections-c.js` and `sections-d.js` before any edits):

```bash
node tools/compile-jsx.mjs landing/sections-c.jsx landing/sections-c.js
```

Babel resolves presets from `cwd`, not from the script's location, so the script pins both
`cwd` and `root` to its own directory. Without that the preset silently fails to resolve
whenever you run it from elsewhere.

## Two traps, both already fixed — do not reintroduce

**Do not pretty-print the injected markup.** React hydration compares the DOM node-for-node
and a whitespace text node *is* a node. Wrapping the markup in newlines for readability adds
stray text siblings to the sections; React fails hydration and silently re-renders the whole
root on the client. The page still looks perfect — you only see it in the console, and you
lose the entire performance benefit while keeping the SEO benefit. The injection is flush on
purpose.

**Keep SVG coordinates rounded.** `PulseBackground` (hero) and `PulseMock` / `AnomalyMock`
(sections-b) derive `cx`/`cy` from `Math.sin`. Node and Chrome disagree on the last unit in
the last place, so an unrounded coordinate serialises as `92.58925156748734` on the server
and `92.58925156748732` in the browser — a hydration mismatch on every load. Those values are
now rounded to 2 decimals at the point of computation (`Math.round(x * 100) / 100`), which is
sub-pixel on a 1600×600 viewBox and deterministic across engines. The polylines were always
fine because they already used `.toFixed(1)`.

Originals of all eight touched files are in `landing/_pre-prerender-backup/`, each verified
byte-identical to `HEAD`. `website-source` is a git repo on `main`, so `git checkout --
landing/` reverts everything regardless.

## Rebuild whenever the landing sections change

`index.prerendered.html` is a build artifact. Any edit to `landing/*.jsx` (and its compiled
`.js`) means re-running the script, or the served HTML drifts from what the client renders —
which reintroduces hydration mismatches.

## Still outstanding

1. **Swap the file in.** `index.html` is untouched; `index.prerendered.html` is the built
   page. Replace one with the other (or point the deploy at it) when you're ready.
2. ~~Add the five newly-linked pages to `sitemap.xml`.~~ **Done** — `sitemap.xml` now carries
   28 URLs (was 23), with `lastmod` taken from each page's real `Last-Modified` header
   (2026-06-28), XML validated, no duplicates, and every URL confirmed 200.
3. ~~Remove `admin-login.html` from `sitemap.xml` and de-link it.~~ **Done** — see
   "Admin portal exposure" below.
4. **Self-host React or add SRI.** The page still pulls React from unpkg with no integrity
   hash and no fallback. Pre-rendering means content now survives a CDN failure, but
   interactivity does not.
5. **`landing/tailwind.css` is a build artifact** of `tailwind-input.css`. If you add classes
   to the JSX that aren't already in the CSS, regenerate it or they'll be silently missing —
   this already bit once: the footer's `lg:grid-cols-6` did not exist, and the desktop layout
   would have collapsed to the mobile two-column fallback with no error anywhere. The utility
   was added by hand inside the existing `@media (min-width:1024px)` block. Check new classes
   against the compiled CSS before shipping.
