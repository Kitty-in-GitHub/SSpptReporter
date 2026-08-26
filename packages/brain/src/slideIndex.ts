import {
  parseFrontmatter,
  parseSlideFilenamePage,
} from "@ssreporter/director";
import { slideBodyToChunk } from "./parseKnowledge.js";
import type { SlideIndexEntry } from "./types.js";

export interface SlideMarkdownFile {
  filename: string;
  content: string;
}

export function buildSlideIndex(
  _deckId: string,
  files: SlideMarkdownFile[],
): SlideIndexEntry[] {
  const entries: SlideIndexEntry[] = [];

  for (const file of files) {
    const page = parseSlideFilenamePage(file.filename);
    if (!page) {
      continue;
    }
    const { body } = parseFrontmatter(file.content);
    if (!body.trim()) {
      continue;
    }
    entries.push({
      page,
      filename: file.filename,
      body: body.trim(),
    });
  }

  entries.sort((a, b) => a.page - b.page);
  return entries;
}

export function slideIndexToChunks(
  deckId: string,
  entries: SlideIndexEntry[],
) {
  return entries.map((entry) =>
    slideBodyToChunk(entry.page, entry.body, deckId),
  );
}
