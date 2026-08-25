import type { BrainEmbedder, BrainVectorIndex } from "./embedTypes.js";
import { mergeKnowledgePools, retrieveChunks } from "./retrieve.js";
import type { BrainKnowledge, KnowledgeChunk } from "./types.js";
import {
  attachEmbeddingsFromIndex,
  buildBrainVectorIndex,
  isVectorIndexCompatible,
} from "./vectorIndex.js";
import {
  reciprocalRankFusion,
  retrieveByEmbedding,
} from "./vectorRetrieve.js";

export interface RetrieveHybridOptions {
  topK?: number;
  tfMinScore?: number;
  vectorMinScore?: number;
  embedder?: BrainEmbedder;
  /** Precomputed cache; rebuilt when hash/model mismatch if embedder present */
  vectorIndex?: BrainVectorIndex | null;
}

export interface RetrieveHybridResult {
  chunks: KnowledgeChunk[];
  /** Index used or built for this call (caller may cache) */
  vectorIndex: BrainVectorIndex | null;
  usedVector: boolean;
}

export async function retrieveHybrid(
  question: string,
  knowledge: BrainKnowledge,
  options: RetrieveHybridOptions = {},
): Promise<RetrieveHybridResult> {
  const topK = options.topK ?? 4;
  const pool = mergeKnowledgePools(
    knowledge.faqChunks,
    knowledge.slideChunks,
  );
  const tfHits = retrieveChunks(question, pool, {
    topK,
    minScore: options.tfMinScore ?? 1,
  });

  const embedder = options.embedder;
  if (!embedder) {
    return { chunks: tfHits, vectorIndex: null, usedVector: false };
  }

  try {
    let index = options.vectorIndex ?? null;
    if (!isVectorIndexCompatible(index, pool, embedder.model)) {
      index = await buildBrainVectorIndex(pool, embedder);
    }

    const withEmbeddings = attachEmbeddingsFromIndex(pool, index);
    if (withEmbeddings.length === 0) {
      return { chunks: tfHits, vectorIndex: index, usedVector: false };
    }

    const [queryEmbedding] = await embedder.embedTexts([question]);
    if (!queryEmbedding?.length) {
      return { chunks: tfHits, vectorIndex: index, usedVector: false };
    }

    const vecHits = retrieveByEmbedding(queryEmbedding, withEmbeddings, {
      topK,
      minScore: options.vectorMinScore ?? 0.25,
    });

    const fused = reciprocalRankFusion([tfHits, vecHits], { topK });
    return {
      chunks: fused.length > 0 ? fused : tfHits,
      vectorIndex: index,
      usedVector: true,
    };
  } catch {
    return { chunks: tfHits, vectorIndex: null, usedVector: false };
  }
}
