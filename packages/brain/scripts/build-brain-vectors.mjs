#!/usr/bin/env node
/**
 * Build content/decks/<id>/brain-vectors.json via embedding API.
 * Usage: npm run build:brain-vectors -- --deck demo
 * Requires OPENAI_API_KEY (or SSREPORTER_EMBED_API_KEY).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const vitest = path.join(packageRoot, "../../node_modules/vitest/vitest.mjs");
const passthrough = process.argv.slice(2).join(" ");

const result = spawnSync(
  process.execPath,
  [vitest, "run", "src/build-brain-vectors-cli.test.ts", "--reporter=verbose"],
  {
    cwd: packageRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_BRAIN_VECTORS_CLI: "1",
      BRAIN_VECTORS_ARGV: passthrough,
    },
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
