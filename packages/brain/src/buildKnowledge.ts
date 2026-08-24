import { parseFaqMarkdown, slideBodyToChunk } from "./parseKnowledge.js";
import type { BrainKnowledge } from "./types.js";

export function buildBrainKnowledge(options: {
  personaText: string;
  faqMarkdown: string;
  faqId?: string;
  slideEntries: Array<{ page: number; body: string }>;
  deckId: string;
}): BrainKnowledge {
  return {
    personaText: options.personaText,
    faqChunks: parseFaqMarkdown(options.faqMarkdown, options.faqId ?? "faq"),
    slideChunks: options.slideEntries.map((entry) =>
      slideBodyToChunk(entry.page, entry.body, options.deckId),
    ),
  };
}
