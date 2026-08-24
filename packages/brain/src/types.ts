import type { DirectorAction } from "@ssreporter/director";

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
}

export interface AnswerQuestionResult {
  action: DirectorAction;
  /** Raw LLM text when fallback was used */
  usedFallback: boolean;
  retrieved: KnowledgeChunk[];
}
