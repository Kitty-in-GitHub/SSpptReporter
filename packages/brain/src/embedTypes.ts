/** Pluggable embedding client (usually OpenAI-compatible HTTP). */
export interface BrainEmbedder {
  embedTexts(texts: string[]): Promise<number[][]>;
  /** Model id used for cache invalidation */
  model: string;
}

export interface BrainVectorChunk {
  id: string;
  embedding: number[];
}

export interface BrainVectorIndex {
  version: 1;
  model: string;
  contentHash: string;
  chunks: BrainVectorChunk[];
}

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
