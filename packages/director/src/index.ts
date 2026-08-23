export type {
  CameraShot,
  DirectorAction,
  Emotion,
  Gesture,
  PresenterMode,
  Priority,
  QaMeta,
  QaSource,
  SlideAction,
} from "./types.js";
export { EMOTIONS, GESTURES } from "./types.js";
export {
  parseDirectorActionJson,
  validateDirectorAction,
  type ValidateDirectorResult,
} from "./validate.js";
export type {
  DirectorExecutorCallbacks,
  DirectorQueuePlaybackState,
} from "./execute-types.js";
export {
  compileDeckScript,
  compileSlideMarkdown,
  formatScriptJsonl,
  parseFrontmatter,
  parseScriptJsonl,
  parseSlideFilenamePage,
  type CompileDeckScriptIssue,
  type CompileDeckScriptResult,
  type SlideMarkdownFile,
} from "./compile-deck-script.js";
export {
  enqueueManyValidated,
  enqueueValidated,
  isPreemptiveAction,
  mergeQueueItems,
  runDirectorQueue,
  type DirectorEnqueueRejection,
  type DirectorEnqueueResult,
} from "./queue.js";

/** Map Director emotion → VRM expression / OnAir reaction emotion names. */
export const emotionToVrmExpression: Record<string, string> = {
  neutral: "neutral",
  confident: "happy",
  friendly: "happy",
  serious: "relaxed",
  thinking: "thinking",
  apologetic: "sad",
  emphatic: "surprised",
};
