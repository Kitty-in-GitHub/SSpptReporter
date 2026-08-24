import type { KnowledgeChunk } from "./types.js";

const STOP_WORDS = new Set([
  "的",
  "了",
  "是",
  "在",
  "和",
  "与",
  "或",
  "及",
  "请",
  "什么",
  "怎么",
  "如何",
  "吗",
  "呢",
  "啊",
  "the",
  "a",
  "an",
  "is",
  "are",
  "what",
  "how",
  "why",
]);

function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens: string[] = [];

  for (const match of normalized.matchAll(/[\u4e00-\u9fff]+|[a-z0-9]+/gi)) {
    const token = match[0];
    if (token.length < 2 || STOP_WORDS.has(token)) {
      continue;
    }
    tokens.push(token);
  }

  return tokens;
}

function scoreChunk(questionTokens: string[], chunk: KnowledgeChunk): number {
  const haystack = `${chunk.title}\n${chunk.body}`.toLowerCase();
  let score = 0;

  for (const token of questionTokens) {
    if (haystack.includes(token)) {
      score += token.length >= 3 ? 2 : 1;
    }
  }

  if (chunk.kind === "slide") {
    score *= 0.95;
  }

  return score;
}

export function retrieveChunks(
  question: string,
  chunks: KnowledgeChunk[],
  options: { topK?: number; minScore?: number } = {},
): KnowledgeChunk[] {
  const topK = options.topK ?? 4;
  const minScore = options.minScore ?? 1;
  const questionTokens = tokenize(question);

  if (questionTokens.length === 0) {
    return [];
  }

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(questionTokens, chunk),
    }))
    .filter((chunk) => (chunk.score ?? 0) >= minScore)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topK);
}

export function mergeKnowledgePools(
  faqChunks: KnowledgeChunk[],
  slideChunks: KnowledgeChunk[],
): KnowledgeChunk[] {
  return [...faqChunks, ...slideChunks];
}
