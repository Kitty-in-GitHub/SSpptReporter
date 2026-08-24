import fs from "node:fs";
import path from "node:path";
import { buildBrainKnowledge } from "./buildKnowledge.js";
import { buildSlideIndex, slideIndexToChunks } from "./slideIndex.js";
import type { BrainKnowledge } from "./types.js";

function readTextIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

export function loadBrainKnowledgeFromRoots(
  contentRoots: string[],
  deckId: string,
): BrainKnowledge {
  let personaText = "";
  let faqMarkdown = "";

  for (const root of contentRoots) {
    if (!personaText) {
      personaText =
        readTextIfExists(path.join(root, "persona", "presenter.md")) ?? "";
    }
    if (!faqMarkdown) {
      faqMarkdown =
        readTextIfExists(path.join(root, "faq", `${deckId}.md`)) ??
        readTextIfExists(path.join(root, "faq", "demo.md")) ??
        "";
    }
  }

  const slideFiles: Array<{ filename: string; content: string }> = [];
  for (const root of contentRoots) {
    const slidesDir = path.join(root, "decks", deckId, "slides");
    if (!fs.existsSync(slidesDir)) {
      continue;
    }
    for (const filename of fs.readdirSync(slidesDir)) {
      if (!filename.endsWith(".md")) {
        continue;
      }
      slideFiles.push({
        filename,
        content: fs.readFileSync(path.join(slidesDir, filename), "utf8"),
      });
    }
    if (slideFiles.length > 0) {
      break;
    }
  }

  const slideIndex = buildSlideIndex(deckId, slideFiles);
  const slideChunks = slideIndexToChunks(deckId, slideIndex);

  return buildBrainKnowledge({
    personaText,
    faqMarkdown,
    faqId: deckId,
    deckId,
    slideEntries: slideIndex.map((entry) => ({
      page: entry.page,
      body: entry.body,
    })),
  });
}
