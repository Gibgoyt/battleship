// Tiny single-purpose bundler that concatenates the worker source files into
// one self-contained file `src/worker.bundle.js`, suitable for pasting into
// the Cloudflare dashboard's inline worker editor.
//
// Why a custom bundler instead of esbuild/rollup?
//   - Zero npm dependencies needed for the build
//   - One file in, one file out — trivial to read & audit
//   - The worker's module graph is a flat tree (no transitive third-party
//     deps), so simple import/export rewriting is enough.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ORDER = ['src/board.js', 'src/game.js', 'src/schema.js', 'src/durable.js', 'src/index.js'];
const OUT   = 'src/worker.bundle.js';

const HEADER = `// === AUTO-GENERATED single-file bundle of the monopoly-game worker. ===
// Regenerate with: ./build.sh   (from workers/monopoly/monopoly-game/)
// Sources: ${ORDER.join(', ')}
// Paste this file into the Cloudflare dashboard worker editor.

import { DurableObject } from 'cloudflare:workers';

`;

function strip(text) {
  // Drop "import { ... } from './x.js';" (single or multi-line).
  text = text.replace(
    /^\s*import\s+\{[\s\S]*?\}\s+from\s+['"][.][^'"]*['"]\s*;?\s*$/gm,
    '',
  );
  // Drop "import x from './y.js';" form too.
  text = text.replace(
    /^\s*import\s+\w+\s+from\s+['"][.][^'"]*['"]\s*;?\s*$/gm,
    '',
  );
  // Drop the cloudflare:workers DurableObject import (re-added in HEADER).
  text = text.replace(
    /^\s*import\s+\{[^}]*DurableObject[^}]*\}\s+from\s+['"]cloudflare:workers['"]\s*;?\s*$/gm,
    '',
  );
  // Drop "export { a, b };" re-exports — bindings are already in-scope after
  // concatenation. We re-add `export { MonopolyGameDO };` at the very end.
  text = text.replace(/^\s*export\s+\{[^}]*\}\s*;\s*$/gm, '');
  // Strip leading "export " from declarations.
  text = text.replace(/^export\s+(const|let|var|class|function|async\s+function)\s+/gm, '$1 ');
  return text;
}

const parts = [HEADER];
for (const rel of ORDER) {
  const path = resolve(HERE, rel);
  const src = await readFile(path, 'utf8');
  parts.push(`// ==================== ${rel} ====================\n`);
  parts.push(strip(src));
  parts.push('\n');
}
parts.push('\n// Cloudflare looks up the DO class on the module\'s named exports.\n');
parts.push('export { MonopolyGameDO };\n');

const out = parts.join('');
await writeFile(resolve(HERE, OUT), out);

const lines = out.split('\n').length;
console.log(`wrote ${OUT}  (${lines} lines, ${out.length} bytes)`);
