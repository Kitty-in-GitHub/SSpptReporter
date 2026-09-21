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
  /** 演讲语义手势：待自制 VRMA，当前为空实现（无动作） */
  | "bow"
  | "nod"
  | "think"
  | "explain"
  | "point_slide"
  | "open_hands"
  | "emphasize"
  /** hikari-archive 占位动作：名字即实际姿势 */
  | "wave_both"
  | "wave_left"
  | "wave_right"
  | "idle_stretch"
  | "idle_shoot"
  | "idle_vsign"
  | "idle_sport";

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
  /** Engine-specific voice id, e.g. `zh-CN-YunxiNeural` or `edge:zh-CN-YunxiNeural`. */
  speaker?: string;
  speed?: number;
  pitch?: number | string;
  volume?: number | string;
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
  // 演讲语义手势（待自制 VRMA）
  "bow",
  "nod",
  "think",
  "explain",
  "point_slide",
  "open_hands",
  "emphasize",
  // 占位动作（hikari-archive，名字即实际姿势）
  "wave_both",
  "wave_left",
  "wave_right",
  "idle_stretch",
  "idle_shoot",
  "idle_vsign",
  "idle_sport",
] as const;
