import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildBrainVectorsForDeck,
  parseBrainVectorsCliArgs,
} from "./buildBrainVectorsCli.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("build brain vectors cli", () => {
  it(
    "builds brain-vectors.json when RUN_BRAIN_VECTORS_CLI=1",
    async () => {
      if (process.env.RUN_BRAIN_VECTORS_CLI !== "1") {
        expect(true).toBe(true);
        return;
      }

      const parsed = parseBrainVectorsCliArgs(
        process.env.BRAIN_VECTORS_ARGV?.split(/\s+/).filter(Boolean) ??
          process.argv.slice(2),
      );
      const result = await buildBrainVectorsForDeck({
        repoRoot,
        deckId: parsed.deckId,
        baseUrl: parsed.baseUrl,
        model: parsed.model,
      });
      expect(result.chunkCount).toBeGreaterThan(0);
      // eslint-disable-next-line no-console -- CLI feedback
      console.log(
        `Wrote ${result.outPath} (${result.chunkCount} chunk vectors)`,
      );
    },
    180_000,
  );
});
