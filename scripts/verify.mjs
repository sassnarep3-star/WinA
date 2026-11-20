#!/usr/bin/env node
/**
 * Compatibility entry point for verifying the published repository tree.
 *
 * The former verifier inspected a retired `site/` output and read the removed
 * `data/site.json`. `scripts/check-site.mjs` is the independent gate for the
 * current root-served GitHub Pages publication.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, ['scripts/check-site.mjs'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Unable to start the repository publication gate: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
