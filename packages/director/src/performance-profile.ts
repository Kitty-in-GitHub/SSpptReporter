import { emotionToVrmExpression } from "./emotion-map.js";
import type {
  DirectorAction,
  Emotion,
  Gesture,
  TimingBeat,
  VoiceBeatOverrides,
} from "./types.js";
import { EMOTIONS, GESTURES } from "./types.js";

export interface PerformanceVrmSlice {
  expression?: string;
  intensity?: number;
  gesture?: Gesture;
}

export interface PerformanceProfile {
  /** UI 显示名（自定义预设；写入 deck performance.json） */
  label?: string;
  /** UI 简短说明 */
  hint?: string;
  /** 卡片/时间轴色条（CSS 颜色） */
  color?: string;
  vrm?: PerformanceVrmSlice;
  voice?: VoiceBeatOverrides;
  timing?: TimingBeat;
}

export interface PerformanceCatalog {
  profiles: Record<string, PerformanceProfile>;
}

export interface ResolvedBeatPerformance {
  profileName: string;
  emotion: Emotion;
  vrmExpression: string;
  vrmIntensity?: number;
  gesture: Gesture;
  voice: VoiceBeatOverrides;
  timing: TimingBeat;
}

export const DEFAULT_PERFORMANCE_CATALOG: PerformanceCatalog = {
  profiles: {
    neutral: {
      vrm: { expression: "neutral" },
      voice: { speaker: "zh-CN-XiaoxiaoNeural", speed: 1 },
      timing: {},
    },
    confident: {
      vrm: { expression: "happy", intensity: 0.35, gesture: "explain" },
      voice: { speaker: "zh-CN-YunxiNeural", speed: 0.95, pitch: "-2Hz" },
      timing: { pause_after_ms: 300 },
    },
    friendly: {
      vrm: { expression: "happy", intensity: 0.45, gesture: "open_hands" },
      voice: { speaker: "zh-CN-XiaoxiaoNeural", speed: 1 },
      timing: { pause_after_ms: 250 },
    },
    serious: {
      vrm: { expression: "relaxed", intensity: 0.4, gesture: "explain" },
      voice: { speaker: "zh-CN-YunjianNeural", speed: 0.92, pitch: "-3Hz" },
      timing: { pause_after_ms: 400 },
    },
    thinking: {
      vrm: { expression: "thinking", intensity: 0.5, gesture: "think" },
      voice: { speaker: "zh-CN-XiaoxiaoNeural", speed: 0.88, pitch: "-4Hz" },
      timing: { pause_before_ms: 200, pause_after_ms: 500 },
    },
    apologetic: {
      vrm: { expression: "sad", intensity: 0.35, gesture: "nod" },
      voice: { speaker: "zh-CN-XiaoxiaoNeural", speed: 0.9, volume: "-5%" },
      timing: { pause_after_ms: 350 },
    },
    emphatic: {
      vrm: { expression: "surprised", intensity: 0.4, gesture: "emphasize" },
      voice: {
        speaker: "zh-CN-YunxiNeural",
        speed: 1.05,
        volume: "+8%",
        pitch: "+2Hz",
      },
      timing: { pause_after_ms: 450 },
    },
    /** Q&A 基线：统一短答 TTS 音色/语速/停顿（表情由 emotion/profile 驱动） */
    qa: {
      vrm: { expression: "neutral" },
      voice: { speaker: "zh-CN-XiaoxiaoNeural", speed: 1.02 },
      timing: { pause_before_ms: 100, pause_after_ms: 200 },
    },
  },
};

function isEmotion(value: string): value is Emotion {
  return (EMOTIONS as readonly string[]).includes(value);
}

function isGesture(value: string | undefined): value is Gesture {
  return Boolean(value && (GESTURES as readonly string[]).includes(value));
}

export function mergePerformanceCatalogs(
  base: PerformanceCatalog,
  overlay: PerformanceCatalog,
): PerformanceCatalog {
  const profiles: Record<string, PerformanceProfile> = { ...base.profiles };

  for (const [name, profile] of Object.entries(overlay.profiles)) {
    const existing = profiles[name];
    profiles[name] = {
      label: profile.label ?? existing?.label,
      hint: profile.hint ?? existing?.hint,
      color: profile.color ?? existing?.color,
      vrm: { ...existing?.vrm, ...profile.vrm },
      voice: { ...existing?.voice, ...profile.voice },
      timing: { ...existing?.timing, ...profile.timing },
    };
  }

  return { profiles };
}

export function isBuiltInProfile(name: string): boolean {
  return isEmotion(name);
}

const PROFILE_ID_RE = /^[a-z][a-z0-9_]{0,31}$/;

export function sanitizeProfileId(input: string): string | null {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!normalized || !PROFILE_ID_RE.test(normalized)) {
    return null;
  }
  return normalized;
}

export function listSelectableProfiles(
  catalog: PerformanceCatalog = DEFAULT_PERFORMANCE_CATALOG,
): string[] {
  const custom = Object.keys(catalog.profiles)
    .filter(
      (name) =>
        !isBuiltInProfile(name) && name !== QA_BASELINE_PROFILE_NAME,
    )
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  return [...EMOTIONS, ...custom];
}

export function cloneProfileTemplate(
  baseName: string,
  catalog: PerformanceCatalog = DEFAULT_PERFORMANCE_CATALOG,
): PerformanceProfile {
  const resolved = resolveBeatPerformance(
    {
      schema_version: "1.0",
      mode: "present",
      utterance: "",
      profile: baseName,
      emotion: isEmotion(baseName) ? baseName : "neutral",
    },
    catalog,
  );
  const baseProfile = catalog.profiles[baseName];

  return {
    vrm: {
      expression: resolved.vrmExpression,
      intensity: resolved.vrmIntensity,
      gesture:
        baseProfile?.vrm?.gesture ??
        (resolved.gesture !== "none" ? resolved.gesture : undefined),
    },
    voice: { ...resolved.voice },
    timing: { ...resolved.timing },
  };
}

export function resolveProfileName(action: DirectorAction): string {
  return action.profile?.trim() || action.emotion || "neutral";
}

export const QA_BASELINE_PROFILE_NAME = "qa";

export const QA_DEFAULT_EXPRESSION_PROFILE = "friendly";

/** Q&A 模式：表情/手势 preset（不含 TTS voice） */
export function resolveQaExpressionProfileName(action: DirectorAction): string {
  const candidate = action.profile?.trim() || action.emotion;
  if (candidate && candidate !== QA_BASELINE_PROFILE_NAME) {
    return candidate;
  }
  return QA_DEFAULT_EXPRESSION_PROFILE;
}

function resolveProfileFromCatalog(
  name: string,
  catalog: PerformanceCatalog,
): PerformanceProfile {
  return (
    catalog.profiles[name] ??
    catalog.profiles.neutral ??
    DEFAULT_PERFORMANCE_CATALOG.profiles.neutral
  );
}

function resolveQaBeatPerformance(
  action: DirectorAction,
  catalog: PerformanceCatalog,
): ResolvedBeatPerformance {
  const expressionProfileName = resolveQaExpressionProfileName(action);
  const expressionProfile = resolveProfileFromCatalog(
    expressionProfileName,
    catalog,
  );
  const qaProfile = resolveProfileFromCatalog(QA_BASELINE_PROFILE_NAME, catalog);

  const emotion = isEmotion(expressionProfileName)
    ? expressionProfileName
    : action.emotion ?? QA_DEFAULT_EXPRESSION_PROFILE;

  const vrmExpression =
    expressionProfile.vrm?.expression ??
    emotionToVrmExpression[emotion] ??
    emotionToVrmExpression.neutral ??
    "neutral";

  const gesture =
    action.gesture ??
    (isGesture(expressionProfile.vrm?.gesture)
      ? expressionProfile.vrm.gesture
      : undefined) ??
    "none";

  return {
    profileName: expressionProfileName,
    emotion,
    vrmExpression,
    vrmIntensity: expressionProfile.vrm?.intensity,
    gesture,
    voice: {
      ...qaProfile.voice,
      ...action.voice,
    },
    timing: {
      ...qaProfile.timing,
      ...action.timing,
    },
  };
}

export function resolveBeatPerformance(
  action: DirectorAction,
  catalog: PerformanceCatalog = DEFAULT_PERFORMANCE_CATALOG,
): ResolvedBeatPerformance {
  if (action.mode === "qa") {
    return resolveQaBeatPerformance(action, catalog);
  }

  const profileName = resolveProfileName(action);
  const profile = resolveProfileFromCatalog(profileName, catalog);

  const emotion = isEmotion(profileName) ? profileName : action.emotion ?? "neutral";
  const vrmExpression =
    profile?.vrm?.expression ??
    emotionToVrmExpression[emotion] ??
    emotionToVrmExpression.neutral ??
    "neutral";

  const gesture =
    action.gesture ??
    (isGesture(profile?.vrm?.gesture) ? profile.vrm.gesture : undefined) ??
    "none";

  return {
    profileName,
    emotion,
    vrmExpression,
    vrmIntensity: profile?.vrm?.intensity,
    gesture,
    voice: {
      ...profile?.voice,
      ...action.voice,
    },
    timing: {
      ...profile?.timing,
      ...action.timing,
    },
  };
}

export function directorActionForPerformance(
  action: DirectorAction,
  resolved: ResolvedBeatPerformance,
): DirectorAction {
  return {
    ...action,
    emotion: resolved.emotion,
    gesture: resolved.gesture,
  };
}
