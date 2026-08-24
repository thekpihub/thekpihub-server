/**
 * The KPI Hub — homepage pre-renderer
 *
 * Runs the existing landing bundles in a sandbox with a stubbed ReactDOM, captures the
 * exact element tree app.js would mount, renders it to HTML, and injects it into #root.
 *
 * Nothing is reimplemented: whatever the browser renders is what gets baked in.
 *
 *   node prerender.mjs --src <website-source> [--out <file>] [--write-hydrate]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';
import React from 'react';
import { renderToString } from 'react-dom/server';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : d; };
const SRC = resolve(arg('--src'));
const LANDING = join(SRC, 'landing');
const TOOLS = join(SRC, 'tools');
const OUT = resolve(arg('--out', join(SRC, 'index.html')));

// Load order must match the <script> tags in index.html.
const BUNDLES = ['hero.js', 'sections-a.js', 'sections-b.js', 'sections-c.js',
                 'sections-d.js', 'sections-e.js', 'sections-f.js', 'app.js'];

console.log('The KPI Hub — homepage pre-render\n' + '─'.repeat(58));
console.log('source :', SRC);

/* ── 1. Sandbox ────────────────────────────────────────────────────────────
   Only what the bundles touch at module scope. Everything else (window,
   IntersectionObserver, requestAnimationFrame) lives inside useEffect, which
   React never runs on the server — so those stubs are never called. They exist
   only so a stray reference can't throw during evaluation. */
let captured = null;
let capturedContainerId = null;

const sandbox = {
  React,
  ReactDOM: {
    createRoot(container) {
      capturedContainerId = container?.id ?? null;
      return { render(el) { captured = el; } };
    },
    hydrateRoot(container, el) {
      capturedContainerId = container?.id ?? null;
      captured = el;
      return {};
    },
  },
  document: {
    getElementById: (id) => ({ id }),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: { add() {} } }),
  },
  window: { location: { href: '' }, addEventListener() {}, removeEventListener() {} },
  performance,
  console,
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout: () => 0,
  clearTimeout: () => {},
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

/* ── 2. Evaluate the bundles in order ─────────────────────────────────────── */
console.log('\nevaluating bundles');
for (const file of BUNDLES) {
  const p = join(LANDING, file);
  if (!existsSync(p)) { console.error(`  MISSING ${file}`); process.exit(1); }
  const code = readFileSync(p, 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: file });
    console.log(`  ok  ${file.padEnd(15)} ${String(code.length).padStart(6)} B`);
  } catch (e) {
    console.error(`  FAIL ${file}: ${e.message}`);
    process.exit(1);
  }
}

if (!captured) {
  console.error('\napp.js never called ReactDOM.createRoot().render() — nothing captured.');
  process.exit(1);
}
console.log(`\ncaptured mount into #${capturedContainerId}`);

/* ── 3. Render ─────────────────────────────────────────────────────────────
   renderToString (not renderToStaticMarkup) so the client can hydrate rather
   than throw the server markup away and rebuild it. */
const warnings = [];
const realError = console.error;
console.error = (...a) => { warnings.push(a.join(' ')); };
let html;
try {
  html = renderToString(captured);
} finally {
  console.error = realError;
}

console.log(`rendered ${html.length.toLocaleString()} B of markup`);
if (warnings.length) {
  console.log('\nreact warnings during render:');
  for (const w of [...new Set(warnings)]) console.log('  ! ' + w.slice(0, 160));
}

/* ── 4. Inject into #root, replacing the loading spinner ───────────────────
   Brace-free tag scanner: find <div id="root"> and walk to its matching close,
   so the nested spinner markup can't confuse a regex. */
/* Read the SHELL, never the built page — otherwise a second run would re-render
   already-rendered markup. index.shell.html is the template; index.html is the
   shipped artifact that the build overwrites.

   The shell lives in tools/, NOT the web root. Everything at the root is rsynced
   to the server, and this file served as a page is a content-free duplicate of
   the homepage carrying an identical <title> — exactly the problem the
   pre-render exists to solve. tools/ is in .deploy-exclude, so it never ships. */
const shellPath = existsSync(join(TOOLS, 'index.shell.html'))
  ? join(TOOLS, 'index.shell.html')
  : join(SRC, 'index.html');
console.log('template :', shellPath.endsWith('index.shell.html') ? 'tools/index.shell.html' : 'index.html (no shell found)');
const shell = readFileSync(shellPath, 'utf8');
const openIdx = shell.search(/<div\s+id=["']root["']\s*>/i);
if (openIdx === -1) { console.error('no <div id="root"> in index.html'); process.exit(1); }
const openTag = shell.match(/<div\s+id=["']root["']\s*>/i)[0];
const innerStart = openIdx + openTag.length;

let depth = 1, i = innerStart;
const tag = /<(\/?)div\b[^>]*>/gi;
tag.lastIndex = innerStart;
let m;
while ((m = tag.exec(shell))) {
  depth += m[1] ? -1 : 1;
  if (depth === 0) { i = m.index; break; }
}
if (depth !== 0) { console.error('unbalanced <div id="root">'); process.exit(1); }

const removed = shell.slice(innerStart, i);

/* No padding around the markup. React hydration compares the DOM node-for-node and a
   whitespace text node is a node — a newline here becomes a stray text sibling of the
   sections, which fails hydration and forces a full client re-render. The page still
   looks correct, so this only ever shows up in the console. Keep it flush. */
let out = shell.slice(0, innerStart) + html + shell.slice(i);

/* ── 5. Unblock the render path ────────────────────────────────────────────
   The markup no longer needs JS to appear, so every script can defer.
   defer preserves execution order, so React still evaluates before the bundles. */
let deferred = 0;
out = out.replace(/<script\s+([^>]*?)src=(["'])(.*?)\2([^>]*?)><\/script>/gi,
  (full, pre, q, src, post) => {
    if (/\bdefer\b|\basync\b/i.test(full)) return full;
    if (/googletagmanager|clarity/i.test(src)) return full;   // already async
    deferred++;
    return `<script ${pre}src=${q}${src}${q}${post} defer></script>`;
  });

// Point at the hydrating bootstrap.
out = out.replace(/(<script[^>]*src=["'])landing\/app\.js(["'])/i, '$1landing/app.hydrate.js$2');

writeFileSync(OUT, out, 'utf8');

/* ── 6. Hydrating bootstrap ────────────────────────────────────────────────
   Same App, but hydrates when markup is already present and falls back to a
   fresh mount when it isn't — so this file is safe on both HTML versions. */
if (args.includes('--write-hydrate')) {
  const appSrc = readFileSync(join(LANDING, 'app.js'), 'utf8');
  const patched = appSrc.replace(
    /ReactDOM\.createRoot\(\s*document\.getElementById\(['"]root['"]\)\s*\)\s*\.render\([\s\S]*?\);\s*$/,
    `(function () {
  var el = document.getElementById('root');
  var vdom = /*#__PURE__*/React.createElement(App, null);
  if (el.firstElementChild) {
    ReactDOM.hydrateRoot(el, vdom);
  } else {
    ReactDOM.createRoot(el).render(vdom);
  }
})();
`);
  if (patched === appSrc) {
    console.error('\ncould not patch app.js bootstrap — pattern not found');
    process.exit(1);
  }
  writeFileSync(join(LANDING, 'app.hydrate.js'), patched, 'utf8');
  console.log('wrote   landing/app.hydrate.js');
}

/* ── 7. Report ─────────────────────────────────────────────────────────────*/
const text = out.replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const before = shell.replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

console.log('\n' + '─'.repeat(58));
console.log('removed spinner  :', removed.replace(/\s+/g, ' ').trim().slice(0, 62) + '…');
console.log('scripts deferred :', deferred);
console.log('HTML   :', shell.length.toLocaleString(), 'B  →', out.length.toLocaleString(), 'B');
console.log('text   :', before.length.toLocaleString(), 'B  →', text.length.toLocaleString(), 'B');
console.log('h1     :', (out.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '(none)').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
console.log('links  :', new Set([...out.matchAll(/href="(?!http|#|mailto)([^"]+)"/g)].map(x => x[1])).size, 'internal');
console.log('out    :', OUT);
