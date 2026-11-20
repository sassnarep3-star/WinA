#!/usr/bin/env node
/**
 * Compatibility entry point for the authoritative publication build.
 *
 * The old standalone `site/` generator was retired. The live GitHub Pages site
 * is generated at the repository root by `_src/build.mjs` from `data/`.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, ['_src/build.mjs'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Unable to start the publication build: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
