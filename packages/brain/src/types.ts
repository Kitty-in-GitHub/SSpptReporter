import type { DirectorAction } from "@ssreporter/director";
import type { BrainEmbedder, BrainVectorIndex } from "./embedTypes.js";

export type KnowledgeChunkKind = "persona" | "faq" | "slide";

export interface KnowledgeChunk {
  kind: KnowledgeChunkKind;
  id: string;
  title: string;
  body: string;
  /** slide chunks only */
  page?: number;
  score?: number;
}

export interface SlideIndexEntry {
  page: number;
  filename: string;
  body: string;
}

export interface BrainKnowledge {
  personaText: string;
  faqChunks: KnowledgeChunk[];
  slideChunks: KnowledgeChunk[];
}

export interface BrainLlmClient {
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
}

export interface AnswerQuestionInput {
  question: string;
  currentSlidePage: number;
  deckId: string;
  knowledge: BrainKnowledge;
  llm: BrainLlmClient;
  /** When set, hybrid retrieval (vector + TF + RRF); otherwise TF only */
  embedder?: BrainEmbedder;
  /** Optional precomputed / cached embeddings for the knowledge pool */
  vectorIndex?: BrainVectorIndex | null;
}

export interface AnswerQuestionResult {
  action: DirectorAction;
  /** Raw LLM text when fallback was used */
  usedFallback: boolean;
  retrieved: KnowledgeChunk[];
  /** True when vector similarity participated in retrieval */
  usedVector?: boolean;
  /** Index used or built during this call (caller may keep in memory) */
  vectorIndex?: BrainVectorIndex | null;
}
