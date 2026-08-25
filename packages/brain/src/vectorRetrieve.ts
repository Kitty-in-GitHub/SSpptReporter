import type { KnowledgeChunk } from "./types.js";

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function retrieveByEmbedding(
  queryEmbedding: number[],
  chunks: Array<KnowledgeChunk & { embedding: number[] }>,
  options: { topK?: number; minScore?: number } = {},
): KnowledgeChunk[] {
  const topK = options.topK ?? 4;
  const minScore = options.minScore ?? 0.25;

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((chunk) => (chunk.score ?? 0) >= minScore)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topK)
    .map(({ embedding: _embedding, ...rest }) => rest);
}

/**
 * Reciprocal Rank Fusion over multiple ranked lists (by chunk id).
 * score = sum 1 / (k + rank) with rank starting at 1.
 */
export function reciprocalRankFusion(
  rankedLists: KnowledgeChunk[][],
  options: { topK?: number; k?: number } = {},
): KnowledgeChunk[] {
  const topK = options.topK ?? 4;
  const k = options.k ?? 60;
  const scores = new Map<string, { chunk: KnowledgeChunk; score: number }>();

  for (const list of rankedLists) {
    list.forEach((chunk, index) => {
      const rank = index + 1;
      const add = 1 / (k + rank);
      const existing = scores.get(chunk.id);
      if (existing) {
        existing.score += add;
      } else {
        scores.set(chunk.id, { chunk, score: add });
      }
    });
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk, score }) => ({ ...chunk, score }));
}
