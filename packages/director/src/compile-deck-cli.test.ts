import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileDeckScript, formatScriptJsonl } from "./compile-deck-script.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function compileDeck(deckId: string) {
  const deckDir = path.join(repoRoot, "content/decks", deckId);
  const slidesDir = path.join(deckDir, "slides");
  const files = fs
    .readdirSync(slidesDir)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => ({
      filename,
      content: fs.readFileSync(path.join(slidesDir, filename), "utf8"),
    }));

  const result = compileDeckScript(files);
  if (result.issues.length > 0) {
    const detail = result.issues
      .map((issue) => `${issue.source}: ${issue.message}`)
      .join("\n");
    throw new Error(`compile failed for ${deckId}:\n${detail}`);
  }

  const outPath = path.join(deckDir, "script.jsonl");
  fs.writeFileSync(outPath, formatScriptJsonl(result.actions), "utf8");
  return { outPath, count: result.actions.length };
}

describe("compile deck cli", () => {
  it("compiles content/decks/demo from slides/*.md", () => {
    const deckId = process.env.DECK_ID?.trim() || "demo";
    const { outPath, count } = compileDeck(deckId);
    expect(count).toBeGreaterThan(0);
    expect(fs.existsSync(outPath)).toBe(true);
    // eslint-disable-next-line no-console -- CLI feedback when run via npm run compile:deck
    console.log(`Wrote ${outPath} (${count} actions)`);
  });
});
