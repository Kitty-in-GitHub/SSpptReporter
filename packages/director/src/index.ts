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
