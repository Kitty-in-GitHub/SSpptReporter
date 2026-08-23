import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileDeckDir } from "./compile-deck-dir.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const contentRoot = path.join(repoRoot, "content");

describe("compile deck cli", () => {
  it("compiles content/decks/demo from slides/*.md", () => {
    const deckId = process.env.DECK_ID?.trim() || "demo";
    const result = compileDeckDir(contentRoot, deckId);
    if (result.issues.length > 0) {
      throw new Error(
        result.issues.map((issue) => `${issue.source}: ${issue.message}`).join("\n"),
      );
    }
    expect(result.count).toBeGreaterThan(0);
    expect(fs.existsSync(result.outPath)).toBe(true);
    // eslint-disable-next-line no-console -- CLI feedback when run via npm run compile:deck
    console.log(`Wrote ${result.outPath} (${result.count} actions)`);
  });
});
