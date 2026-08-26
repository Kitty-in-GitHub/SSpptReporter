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
  TimingBeat,
  VoiceBeatOverrides,
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
  compileDeckDir,
  resolveDeckDir,
  writeSlideMarkdown,
  type CompileDeckDirResult,
} from "./compile-deck-dir.js";
export {
  pageToSlideFilename,
  parseSlideMarkdownFile,
  parseSlideMarkdownToDraft,
  parseSlideMarkdownToPageDraft,
  serializeSlideMarkdown,
  serializeSlideMarkdownFromBeat,
  slideMarkdownFileFromPageDraft,
  type SlideBeatDraft,
  type SlidePageDraft,
  type SlideScriptDraft,
} from "./slide-script-draft.js";
export {
  enqueueManyValidated,
  enqueueValidated,
  isPreemptiveAction,
  mergeQueueItems,
  runDirectorQueue,
  type DirectorEnqueueRejection,
  type DirectorEnqueueResult,
} from "./queue.js";

export { emotionToVrmExpression } from "./emotion-map.js";
export {
  normalizeEmphasisRanges,
  resolveVoiceDirective,
  splitUtteranceByEmphasis,
  voiceBeatOverridesToDirective,
  type EmphasisTextSegment,
  type IntraUtteranceEmphasisMode,
  type TtsEngineCapabilities,
  type VoiceDirective,
} from "./voice-directive.js";
export {
  DEFAULT_PERFORMANCE_CATALOG,
  directorActionForPerformance,
  mergePerformanceCatalogs,
  resolveBeatPerformance,
  resolveProfileName,
  type PerformanceCatalog,
  type PerformanceProfile,
  type PerformanceVrmSlice,
  type ResolvedBeatPerformance,
} from "./performance-profile.js";
