#!/usr/bin/env node
/**
 * Compile deck script.jsonl from content/decks/<id>/slides/*.md
 * Wraps vitest compile test with inherited stdio (reliable on Windows).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vitest = path.join(packageRoot, '../../node_modules/vitest/vitest.mjs');
const result = spawnSync(
  process.execPath,
  [vitest, 'run', 'src/compile-deck-cli.test.ts', '--reporter=verbose'],
  { cwd: packageRoot, stdio: 'inherit', env: process.env },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
