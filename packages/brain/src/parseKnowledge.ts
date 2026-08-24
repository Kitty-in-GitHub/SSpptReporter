import type { KnowledgeChunk } from "./types.js";

const FAQ_HEADING_RE = /^##\s+Q:\s*(.+)$/im;

export function parseFaqMarkdown(content: string, sourceId = "faq"): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const sections = content.split(/\n(?=##\s+Q:)/i).filter(Boolean);

  for (const section of sections) {
    const headingMatch = section.match(FAQ_HEADING_RE);
    if (!headingMatch) {
      continue;
    }
    const title = headingMatch[1].trim();
    const body = section
      .replace(FAQ_HEADING_RE, "")
      .trim();
    if (!body) {
      continue;
    }
    chunks.push({
      kind: "faq",
      id: `${sourceId}:${title.slice(0, 48)}`,
      title,
      body,
    });
  }

  return chunks;
}

export function slideBodyToChunk(
  page: number,
  body: string,
  deckId: string,
): KnowledgeChunk {
  return {
    kind: "slide",
    id: `${deckId}:slide:${page}`,
    title: `第 ${page} 页讲稿`,
    body,
    page,
  };
}
