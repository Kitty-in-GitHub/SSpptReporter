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
      voice: { speed: 1 },
      timing: {},
    },
    confident: {
      vrm: { expression: "happy", intensity: 0.35, gesture: "explain" },
      voice: { speed: 0.95 },
      timing: { pause_after_ms: 300 },
    },
    friendly: {
      vrm: { expression: "happy", intensity: 0.45, gesture: "open_hands" },
      voice: { speed: 1 },
      timing: { pause_after_ms: 250 },
    },
    serious: {
      vrm: { expression: "relaxed", intensity: 0.4, gesture: "explain" },
      voice: { speed: 0.92 },
      timing: { pause_after_ms: 400 },
    },
    thinking: {
      vrm: { expression: "thinking", intensity: 0.5, gesture: "think" },
      voice: { speed: 0.88 },
      timing: { pause_before_ms: 200, pause_after_ms: 500 },
    },
    apologetic: {
      vrm: { expression: "sad", intensity: 0.35, gesture: "nod" },
      voice: { speed: 0.9 },
      timing: { pause_after_ms: 350 },
    },
    emphatic: {
      vrm: { expression: "surprised", intensity: 0.4, gesture: "emphasize" },
      voice: { speed: 1.05 },
      timing: { pause_after_ms: 450 },
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
      vrm: { ...existing?.vrm, ...profile.vrm },
      voice: { ...existing?.voice, ...profile.voice },
      timing: { ...existing?.timing, ...profile.timing },
    };
  }

  return { profiles };
}

export function resolveProfileName(action: DirectorAction): string {
  return action.profile?.trim() || action.emotion || "neutral";
}

export function resolveBeatPerformance(
  action: DirectorAction,
  catalog: PerformanceCatalog = DEFAULT_PERFORMANCE_CATALOG,
): ResolvedBeatPerformance {
  const profileName = resolveProfileName(action);
  const profile =
    catalog.profiles[profileName] ??
    catalog.profiles.neutral ??
    DEFAULT_PERFORMANCE_CATALOG.profiles.neutral;

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
