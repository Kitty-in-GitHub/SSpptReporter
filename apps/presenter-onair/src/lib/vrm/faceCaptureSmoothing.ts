import type { FaceCaptureFrame } from '../avatar/faceCaptureTypes';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** smoothing 0 = 跟手，1 = 更平滑 */
export function smoothFaceCaptureFrame(
  previous: FaceCaptureFrame | null,
  next: FaceCaptureFrame,
  smoothing: number,
): FaceCaptureFrame {
  if (!previous) {
    return next;
  }

  const alpha = clamp01(1 - smoothing * 0.88);

  const blendshapes: Record<string, number> = {};
  const keys = new Set([
    ...Object.keys(previous.blendshapes),
    ...Object.keys(next.blendshapes),
  ]);
  for (const key of keys) {
    blendshapes[key] = lerp(
      previous.blendshapes[key] ?? 0,
      next.blendshapes[key] ?? 0,
      alpha,
    );
  }

  return {
    headRotation: {
      x: lerp(previous.headRotation.x, next.headRotation.x, alpha),
      y: lerp(previous.headRotation.y, next.headRotation.y, alpha),
      z: lerp(previous.headRotation.z, next.headRotation.z, alpha),
    },
    eyeBlink: {
      left: lerp(previous.eyeBlink.left, next.eyeBlink.left, alpha),
      right: lerp(previous.eyeBlink.right, next.eyeBlink.right, alpha),
    },
    pupil: {
      x: lerp(previous.pupil.x, next.pupil.x, alpha),
      y: lerp(previous.pupil.y, next.pupil.y, alpha),
    },
    mouthShapes: {
      a: lerp(previous.mouthShapes.a, next.mouthShapes.a, alpha),
      e: lerp(previous.mouthShapes.e, next.mouthShapes.e, alpha),
      i: lerp(previous.mouthShapes.i, next.mouthShapes.i, alpha),
      o: lerp(previous.mouthShapes.o, next.mouthShapes.o, alpha),
      u: lerp(previous.mouthShapes.u, next.mouthShapes.u, alpha),
    },
    blendshapes,
    timestamp: next.timestamp,
  };
}
