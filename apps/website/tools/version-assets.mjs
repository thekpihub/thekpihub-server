/**
 * The KPI Hub — asset fingerprinting
 *
 * Stamps every local asset reference with ?v=<content hash> so the browser can be
 * told to cache assets for a year without ever serving a stale one.
 *
 * WHY QUERY STRINGS AND NOT HASHED FILENAMES
 *
 * The deploy is `rsync --delete`. Renaming tailwind.css -> tailwind.a1b2c3d4.css
 * would delete the previous filename on every deploy, so anyone still holding
 * older HTML would 404 on assets that vanished underneath them. A query string
 * keeps exactly one file on disk while still changing the URL when the bytes
 * change. It also keeps .htaccess working: those rules match on extension
 * (`FilesMatch "\.(css|js|svg)$"`), which a query string preserves and a rename
 * would not.
 *
 * The hash is of file CONTENT, so the URL changes when — and only when — the
 * asset actually changes. Re-running with nothing changed rewrites nothing.
 *
 *   node tools/version-assets.mjs --src . [--check]
 *
 * --check exits non-zero if anything would change, for use as a CI guard.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : d; };
const SRC = resolve(arg('--src', '.'));
const CHECK = args.includes('--check');

/* index.shell.html is the pre-render TEMPLATE, not a shipped page. Leaving it
   unversioned keeps the build deterministic: prerender always starts from clean
   source and this step stamps the generated index.html afterwards. */
const SKIP_FILES = new Set(['index.shell.html']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'platform', 'docs',
                           'revenue-sprint-week1', 'Attention Required', 'wp-plugin']);

const VERSIONABLE = /\.(js|css|svg|png|jpe?g|webp|ico|woff2?)$/i;

/* config.js holds the real API keys and lives ONLY on the server — it is in
   .deploy-exclude and is deliberately absent from this repo. It can never be
   hashed here, and must never be reported as a broken reference. */
const SERVER_ONLY = new Set(['config.js']);

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) htmlFiles(p, out);
    else if (entry.endsWith('.html') && !entry.startsWith('live_') && !SKIP_FILES.has(entry)) out.push(p);
  }
  return out;
}

const hashCache = new Map();
function hashOf(assetPath) {
  if (hashCache.has(assetPath)) return hashCache.get(assetPath);
  const h = createHash('sha256').update(readFileSync(assetPath)).digest('hex').slice(0, 8);
  hashCache.set(assetPath, h);
  return h;
}

const files = htmlFiles(SRC);
console.log('The KPI Hub — asset fingerprinting\n' + '─'.repeat(58));
console.log('source :', SRC);
console.log('pages  :', files.length);

const missing = new Map();
const stamped = new Map();
let changedFiles = 0, totalRefs = 0;

// src="..." or href="..." pointing at a local versionable asset, with any existing query.
const REF = /((?:src|href)=")(?!https?:|\/\/|#|mailto:|data:)([^"?#]+?\.(?:js|css|svg|png|jpe?g|webp|ico|woff2?))(\?[^"#]*)?(#[^"]*)?(")/gi;

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = before.replace(REF, (full, pre, path, query, hash, post) => {
    if (!VERSIONABLE.test(path)) return full;

    const bare = path.startsWith('/') ? path.slice(1) : path;
    const onDisk = join(SRC, bare.split('/').join(sep));

    if (!existsSync(onDisk)) {
      const name = bare.split('/').pop();
      if (!SERVER_ONLY.has(name) && !SERVER_ONLY.has(bare)) {
        missing.set(path, (missing.get(path) || 0) + 1);
      }
      return full;   // never invent a version for something we cannot hash
    }

    totalRefs++;
    const v = hashOf(onDisk);
    stamped.set(bare, v);

    /* Preserve any other query params; replace only our own v=. Without this,
       re-running would append a second ?v= and corrupt the URL. */
    let rest = '';
    if (query) {
      const kept = query.slice(1).split('&').filter(p => p && !p.startsWith('v='));
      if (kept.length) rest = '&' + kept.join('&');
    }
    return `${pre}${path}?v=${v}${rest}${hash || ''}${post}`;
  });

  if (after !== before) {
    changedFiles++;
    if (!CHECK) writeFileSync(file, after, 'utf8');
  }
}

console.log('refs stamped :', totalRefs, 'across', files.length, 'pages');
console.log('files changed:', changedFiles);

if (stamped.size) {
  console.log('\nasset versions:');
  for (const [p, v] of [...stamped].sort()) console.log(`  ${v}  ${p}`);
}

if (missing.size) {
  console.log('\n⚠ referenced but not on disk (left untouched):');
  for (const [p, n] of missing) console.log(`  ${p}  (${n} reference${n > 1 ? 's' : ''})`);
}

if (CHECK && changedFiles) {
  console.error(`\n::error::${changedFiles} page(s) have stale asset versions. Run: npm run version-assets`);
  process.exit(1);
}
if (missing.size) {
  console.error(`\n::error::${missing.size} asset reference(s) point at files that do not exist.`);
  process.exit(1);
}
console.log('\nok');
