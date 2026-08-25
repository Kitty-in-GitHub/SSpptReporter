import type { BrainEmbedder, BrainVectorIndex } from "./embedTypes.js";
import type { KnowledgeChunk } from "./types.js";

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Stable hash of chunk text used to invalidate vector cache. */
export function computeKnowledgeContentHash(chunks: KnowledgeChunk[]): string {
  const normalized = [...chunks]
    .map((chunk) => `${chunk.id}\n${chunk.title}\n${chunk.body}`)
    .sort()
    .join("\n---\n");
  return fnv1aHash(normalized);
}

export function chunkTextForEmbedding(chunk: KnowledgeChunk): string {
  return `${chunk.title}\n${chunk.body}`.trim();
}

export async function buildBrainVectorIndex(
  chunks: KnowledgeChunk[],
  embedder: BrainEmbedder,
): Promise<BrainVectorIndex> {
  const contentHash = computeKnowledgeContentHash(chunks);
  const texts = chunks.map(chunkTextForEmbedding);
  const embeddings = await embedder.embedTexts(texts);

  if (embeddings.length !== chunks.length) {
    throw new Error("Embedding 数量与 chunk 不一致");
  }

  return {
    version: 1,
    model: embedder.model,
    contentHash,
    chunks: chunks.map((chunk, index) => ({
      id: chunk.id,
      embedding: embeddings[index] ?? [],
    })),
  };
}

export function attachEmbeddingsFromIndex(
  chunks: KnowledgeChunk[],
  index: BrainVectorIndex,
): Array<KnowledgeChunk & { embedding: number[] }> {
  const byId = new Map(index.chunks.map((row) => [row.id, row.embedding]));
  const attached: Array<KnowledgeChunk & { embedding: number[] }> = [];
  for (const chunk of chunks) {
    const embedding = byId.get(chunk.id);
    if (!embedding?.length) {
      continue;
    }
    attached.push({ ...chunk, embedding });
  }
  return attached;
}

export function isVectorIndexCompatible(
  index: BrainVectorIndex | null | undefined,
  chunks: KnowledgeChunk[],
  model?: string,
): index is BrainVectorIndex {
  if (!index || index.version !== 1) {
    return false;
  }
  if (model && index.model !== model) {
    return false;
  }
  return index.contentHash === computeKnowledgeContentHash(chunks);
}

export function parseBrainVectorIndex(raw: unknown): BrainVectorIndex | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const value = raw as Partial<BrainVectorIndex>;
  if (value.version !== 1 || typeof value.model !== "string") {
    return null;
  }
  if (typeof value.contentHash !== "string" || !Array.isArray(value.chunks)) {
    return null;
  }
  const chunks = value.chunks.filter(
    (row): row is BrainVectorIndex["chunks"][number] =>
      !!row &&
      typeof row.id === "string" &&
      Array.isArray(row.embedding) &&
      row.embedding.every((n) => typeof n === "number"),
  );
  if (chunks.length === 0) {
    return null;
  }
  return {
    version: 1,
    model: value.model,
    contentHash: value.contentHash,
    chunks,
  };
}
