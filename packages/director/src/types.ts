/** Mirror of schemas/director-action.schema.json (v1.0). */

export type PresenterMode = "present" | "qa" | "idle" | "system";

export type Emotion =
  | "neutral"
  | "confident"
  | "friendly"
  | "serious"
  | "thinking"
  | "apologetic"
  | "emphatic";

export type Gesture =
  | "none"
  | "idle"
  | "bow"
  | "nod"
  | "think"
  | "explain"
  | "point_slide"
  | "open_hands"
  | "emphasize";

export type CameraShot = "bust" | "medium" | "wide";

export type Priority = "normal" | "high" | "emergency";

export interface SlideAction {
  goto?: number;
  next?: boolean;
  prev?: boolean;
  highlight?: string;
  cite_only?: boolean;
}

export interface VoiceBeatOverrides {
  speed?: number;
  pitch?: number;
  style_hint?: string;
}

export interface TimingBeat {
  pause_before_ms?: number;
  pause_after_ms?: number;
}

export interface QaSource {
  kind: "slide" | "faq" | "doc" | "skill";
  ref?: string;
}

export interface QaMeta {
  question_summary?: string;
  confidence?: number;
  sources?: QaSource[];
  admit_unknown?: boolean;
}

export interface DirectorAction {
  schema_version: "1.0";
  action_id?: string;
  mode: PresenterMode;
  utterance: string;
  profile?: string;
  emotion?: Emotion;
  gesture?: Gesture;
  camera?: CameraShot;
  voice?: VoiceBeatOverrides;
  timing?: TimingBeat;
  slide_action?: SlideAction;
  emphasis?: [number, number][];
  qa?: QaMeta;
  priority?: Priority;
  barge_in?: boolean;
  notes?: string;
}

export const EMOTIONS: readonly Emotion[] = [
  "neutral",
  "confident",
  "friendly",
  "serious",
  "thinking",
  "apologetic",
  "emphatic",
] as const;

export const GESTURES: readonly Gesture[] = [
  "none",
  "idle",
  "bow",
  "nod",
  "think",
  "explain",
  "point_slide",
  "open_hands",
  "emphasize",
] as const;
