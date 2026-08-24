export type {
  AnswerQuestionInput,
  AnswerQuestionResult,
  BrainKnowledge,
  BrainLlmClient,
  KnowledgeChunk,
  KnowledgeChunkKind,
  SlideIndexEntry,
} from "./types.js";

export { answerQuestion } from "./answerQuestion.js";
export { buildBrainKnowledge } from "./buildKnowledge.js";
export {
  buildQaSystemPrompt,
  buildQaUserPrompt,
} from "./buildQaPrompt.js";
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
export {
  buildSlideIndex,
  slideIndexToChunks,
  type SlideMarkdownFile,
} from "./slideIndex.js";
