import { describe, expect, it } from "vitest";
import {
  buildDeckManifestTemplate,
  buildEmptyPerformanceOverlay,
  buildSlideMarkdownTemplate,
  deckIdFromFileName,
  isValidDeckId,
  normalizeDeckId,
} from "./deck-scaffold.js";

describe("normalizeDeckId", () => {
  it("lowercases and turns dashes into underscores", () => {
    expect(normalizeDeckId("  My-Defense ")).toBe("my_defense");
  });
});

describe("isValidDeckId", () => {
  it("accepts lowercase ids starting with a letter", () => {
    expect(isValidDeckId("my_defense_2")).toBe(true);
  });

  it("rejects uppercase, leading digits and punctuation", () => {
    expect(isValidDeckId("My_Defense")).toBe(false);
    expect(isValidDeckId("2_defense")).toBe(false);
    expect(isValidDeckId("my defense")).toBe(false);
  });
});

describe("deckIdFromFileName", () => {
  it("derives a legal id from a pdf file name", () => {
    expect(deckIdFromFileName("My Defense 2026.pdf")).toBe("my_defense_2026");
  });

  it("prefixes ids that would start with a digit", () => {
    expect(deckIdFromFileName("2026-defense.pdf")).toBe("deck_2026_defense");
  });

  it("falls back when nothing usable remains", () => {
    expect(deckIdFromFileName("答辩.pdf")).toBe("deck");
  });
});

describe("buildDeckManifestTemplate", () => {
  it("writes the pdf and script urls for the deck", () => {
    const raw = buildDeckManifestTemplate({
      deckId: "my_defense",
      title: "我的答辩",
    });
    const manifest = JSON.parse(raw);
    expect(manifest.id).toBe("my_defense");
    expect(manifest.slideSource.url).toBe("/decks/my_defense/slides.pdf");
    expect(manifest.scriptUrl).toBe("/content/decks/my_defense/script.jsonl");
  });
});

describe("buildEmptyPerformanceOverlay", () => {
  it("serializes an empty profile catalog", () => {
    expect(JSON.parse(buildEmptyPerformanceOverlay())).toEqual({ profiles: {} });
  });
});

describe("buildSlideMarkdownTemplate", () => {
  it("keeps the page number, padded action id and goto default", () => {
    const markdown = buildSlideMarkdownTemplate({ deckId: "my_defense", page: 3 });
    expect(markdown).toContain("action_id: my_defense-03");
    expect(markdown).toContain("第 3 页讲稿");
    expect(markdown.startsWith("---\n")).toBe(true);
  });
});
