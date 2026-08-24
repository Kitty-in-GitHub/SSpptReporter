import type { Gesture } from '@ssreporter/director';
import type { VrmExpressionPart } from './vrmExpressionController';
import type { VrmAvatarReactionDraft } from './vrmReactions';

export interface GestureVrmReactionSpec {
  parts: readonly VrmExpressionPart[];
  fadeMs?: number;
  holdMs?: number;
  /** Optional VRMA one-shot; Expression parts used as fallback when file missing. */
  vrmaUrl?: string;
}

const GESTURE_BASE = `${import.meta.env.BASE_URL}avatar/gestures`;

export const GESTURE_VRMA_URLS: Partial<Record<Gesture, string>> = {
  bow: `${GESTURE_BASE}/bow.vrma`,
  nod: `${GESTURE_BASE}/nod.vrma`,
  think: `${GESTURE_BASE}/think.vrma`,
  explain: `${GESTURE_BASE}/explain.vrma`,
  point_slide: `${GESTURE_BASE}/point_slide.vrma`,
  open_hands: `${GESTURE_BASE}/open_hands.vrma`,
  emphasize: `${GESTURE_BASE}/emphasize.vrma`,
};

const GESTURE_REACTIONS: Partial<Record<Gesture, GestureVrmReactionSpec>> = {
  bow: {
    parts: [
      { name: 'happy', intensity: 0.35 },
      { name: 'mouthSmileLeft', intensity: 0.28 },
      { name: 'mouthSmileRight', intensity: 0.28 },
      { name: 'eyeSquintLeft', intensity: 0.22 },
      { name: 'eyeSquintRight', intensity: 0.22 },
      { name: 'browInnerUp', intensity: 0.18 },
    ],
    fadeMs: 380,
    holdMs: 1400,
    vrmaUrl: GESTURE_VRMA_URLS.bow,
  },
  nod: {
    parts: [
      { name: 'browInnerUp', intensity: 0.38 },
      { name: 'eyeSquintLeft', intensity: 0.24 },
      { name: 'eyeSquintRight', intensity: 0.24 },
      { name: 'mouthSmileLeft', intensity: 0.2 },
      { name: 'mouthSmileRight', intensity: 0.2 },
    ],
    fadeMs: 180,
    holdMs: 520,
    vrmaUrl: GESTURE_VRMA_URLS.nod,
  },
  think: {
    parts: [
      { name: 'thinking', intensity: 0.5 },
      { name: 'relaxed', intensity: 0.22 },
      { name: 'browInnerUp', intensity: 0.55 },
      { name: 'eyeSquintLeft', intensity: 0.32 },
      { name: 'eyeSquintRight', intensity: 0.28 },
    ],
    fadeMs: 420,
    holdMs: 2800,
    vrmaUrl: GESTURE_VRMA_URLS.think,
  },
  explain: {
    parts: [
      { name: 'relaxed', intensity: 0.38 },
      { name: 'mouthSmileLeft', intensity: 0.32 },
      { name: 'mouthSmileRight', intensity: 0.32 },
      { name: 'browOuterUpLeft', intensity: 0.28 },
      { name: 'browOuterUpRight', intensity: 0.22 },
    ],
    fadeMs: 320,
    holdMs: 2200,
    vrmaUrl: GESTURE_VRMA_URLS.explain,
  },
  point_slide: {
    parts: [
      { name: 'surprised', intensity: 0.28 },
      { name: 'eyeWideLeft', intensity: 0.42 },
      { name: 'eyeWideRight', intensity: 0.22 },
      { name: 'browOuterUpLeft', intensity: 0.48 },
      { name: 'mouthSmileLeft', intensity: 0.18 },
    ],
    fadeMs: 280,
    holdMs: 1800,
    vrmaUrl: GESTURE_VRMA_URLS.point_slide,
  },
  open_hands: {
    parts: [
      { name: 'happy', intensity: 0.42 },
      { name: 'relaxed', intensity: 0.35 },
      { name: 'mouthSmileLeft', intensity: 0.38 },
      { name: 'mouthSmileRight', intensity: 0.38 },
      { name: 'browOuterUpLeft', intensity: 0.3 },
      { name: 'browOuterUpRight', intensity: 0.3 },
    ],
    fadeMs: 360,
    holdMs: 2400,
    vrmaUrl: GESTURE_VRMA_URLS.open_hands,
  },
  emphasize: {
    parts: [
      { name: 'surprised', intensity: 0.45 },
      { name: 'eyeWideLeft', intensity: 0.5 },
      { name: 'eyeWideRight', intensity: 0.5 },
      { name: 'browInnerUp', intensity: 0.42 },
      { name: 'mouthSmileLeft', intensity: 0.25 },
      { name: 'mouthSmileRight', intensity: 0.25 },
    ],
    fadeMs: 220,
    holdMs: 1200,
    vrmaUrl: GESTURE_VRMA_URLS.emphasize,
  },
};

export function gestureToVrmReactionSpec(
  gesture: Gesture | undefined,
): GestureVrmReactionSpec | null {
  if (!gesture || gesture === 'none' || gesture === 'idle') {
    return null;
  }
  return GESTURE_REACTIONS[gesture] ?? null;
}

export function gestureToVrmReactionDraft(
  gesture: Gesture | undefined,
): VrmAvatarReactionDraft | null {
  const spec = gestureToVrmReactionSpec(gesture);
  if (!spec) {
    return null;
  }

  return {
    type: 'gesture',
    parts: spec.parts,
    fadeMs: spec.fadeMs,
    holdMs: spec.holdMs,
    vrmaUrl: spec.vrmaUrl,
  };
}
