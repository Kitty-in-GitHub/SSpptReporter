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

/**
 * 已实现的占位动作（hikari-archive，MIT），名字即实际姿势。
 * 演讲语义手势（bow / nod / think / explain / point_slide / open_hands / emphasize）
 * 暂无 VRMA，故意不在此表 —— 播放时不做任何动作。
 */
export const GESTURE_VRMA_URLS: Partial<Record<Gesture, string>> = {
  wave_both: `${GESTURE_BASE}/wave_both.vrma`,
  wave_left: `${GESTURE_BASE}/wave_left.vrma`,
  wave_right: `${GESTURE_BASE}/wave_right.vrma`,
  idle_stretch: `${GESTURE_BASE}/idle_stretch.vrma`,
  idle_shoot: `${GESTURE_BASE}/idle_shoot.vrma`,
  idle_vsign: `${GESTURE_BASE}/idle_vsign.vrma`,
  idle_sport: `${GESTURE_BASE}/idle_sport.vrma`,
};

const GESTURE_REACTIONS: Partial<Record<Gesture, GestureVrmReactionSpec>> = {
  wave_both: {
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
    vrmaUrl: GESTURE_VRMA_URLS.wave_both,
  },
  wave_left: {
    parts: [
      { name: 'browInnerUp', intensity: 0.38 },
      { name: 'eyeSquintLeft', intensity: 0.24 },
      { name: 'eyeSquintRight', intensity: 0.24 },
      { name: 'mouthSmileLeft', intensity: 0.2 },
      { name: 'mouthSmileRight', intensity: 0.2 },
    ],
    fadeMs: 180,
    holdMs: 520,
    vrmaUrl: GESTURE_VRMA_URLS.wave_left,
  },
  idle_stretch: {
    parts: [
      { name: 'thinking', intensity: 0.5 },
      { name: 'relaxed', intensity: 0.22 },
      { name: 'browInnerUp', intensity: 0.55 },
      { name: 'eyeSquintLeft', intensity: 0.32 },
      { name: 'eyeSquintRight', intensity: 0.28 },
    ],
    fadeMs: 420,
    holdMs: 2800,
    vrmaUrl: GESTURE_VRMA_URLS.idle_stretch,
  },
  wave_right: {
    parts: [
      { name: 'relaxed', intensity: 0.38 },
      { name: 'mouthSmileLeft', intensity: 0.32 },
      { name: 'mouthSmileRight', intensity: 0.32 },
      { name: 'browOuterUpLeft', intensity: 0.28 },
      { name: 'browOuterUpRight', intensity: 0.22 },
    ],
    fadeMs: 320,
    holdMs: 2200,
    vrmaUrl: GESTURE_VRMA_URLS.wave_right,
  },
  idle_shoot: {
    parts: [
      { name: 'surprised', intensity: 0.28 },
      { name: 'eyeWideLeft', intensity: 0.42 },
      { name: 'eyeWideRight', intensity: 0.22 },
      { name: 'browOuterUpLeft', intensity: 0.48 },
      { name: 'mouthSmileLeft', intensity: 0.18 },
    ],
    fadeMs: 280,
    holdMs: 1800,
    vrmaUrl: GESTURE_VRMA_URLS.idle_shoot,
  },
  idle_vsign: {
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
    vrmaUrl: GESTURE_VRMA_URLS.idle_vsign,
  },
  idle_sport: {
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
    vrmaUrl: GESTURE_VRMA_URLS.idle_sport,
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

/** 演讲语义手势尚未实现：可选，但播放时不做任何动作 */
export function isGesturePending(gesture: Gesture): boolean {
  return (
    gesture !== 'none' && gesture !== 'idle' && !GESTURE_REACTIONS[gesture]
  );
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
