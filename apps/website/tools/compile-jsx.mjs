/**
 * Compile a landing .jsx to the .js the browser loads.
 *
 * Config reproduces the project's existing output byte-for-byte (verified against the
 * committed sections-c.js before any edits were made).
 *
 * Babel resolves presets from `cwd`, NOT from this script's location — so cwd is pinned
 * to this directory, where node_modules lives. Without it the preset silently fails to
 * resolve whenever the caller's working directory differs.
 *
 *   node compile.mjs <input.jsx> <output.js>
 */
import babel from '@babel/core';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('usage: node compile.mjs <input.jsx> <output.js>');
  process.exit(1);
}

const src = readFileSync(input, 'utf8');
const res = babel.transformSync(src, {
  cwd: HERE,
  root: HERE,
  configFile: false,
  babelrc: false,
  presets: [['@babel/preset-react', { runtime: 'classic' }]],
  compact: false,
  retainLines: false,
  comments: true,
});

if (!res || typeof res.code !== 'string') {
  console.error('babel produced no output');
  process.exit(1);
}
writeFileSync(output, res.code + '\n', 'utf8');
console.log(`compiled ${input} -> ${output} (${res.code.length} B)`);
