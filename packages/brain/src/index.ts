export type {
  AnswerQuestionInput,
  AnswerQuestionResult,
  BrainKnowledge,
  BrainLlmClient,
  KnowledgeChunk,
  KnowledgeChunkKind,
  SlideIndexEntry,
} from "./types.js";

export type {
  BrainEmbedder,
  BrainVectorChunk,
  BrainVectorIndex,
} from "./embedTypes.js";
export { DEFAULT_EMBEDDING_MODEL } from "./embedTypes.js";

export { answerQuestion } from "./answerQuestion.js";
export { buildBrainKnowledge } from "./buildKnowledge.js";
export {
  buildQaSystemPrompt,
  buildQaUserPrompt,
} from "./buildQaPrompt.js";
export { createOpenAiCompatibleEmbedder } from "./embedClient.js";
export { parseFaqMarkdown, slideBodyToChunk } from "./parseKnowledge.js";
export {
  createFallbackQaAction,
  extractJsonObject,
  parseDirectorActionFromLlm,
} from "./parseLlmResponse.js";
export {
  mergeKnowledgePools,
  retrieveChunks,
} from "./retrieve.js";
export { retrieveHybrid } from "./retrieveHybrid.js";
export {
  attachEmbeddingsFromIndex,
  buildBrainVectorIndex,
  chunkTextForEmbedding,
  computeKnowledgeContentHash,
  isVectorIndexCompatible,
  parseBrainVectorIndex,
} from "./vectorIndex.js";
export {
  cosineSimilarity,
  reciprocalRankFusion,
  retrieveByEmbedding,
} from "./vectorRetrieve.js";
export {
  buildBrainVectorsForDeck,
  parseBrainVectorsCliArgs,
} from "./buildBrainVectorsCli.js";
export {
  buildSlideIndex,
  slideIndexToChunks,
  type SlideMarkdownFile,
} from "./slideIndex.js";
