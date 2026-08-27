import { Face } from 'kalidokit';
import type { FaceCaptureFrame } from '../avatar/faceCaptureTypes';
import { FACE_CAPTURE_MOUTH_MAP } from './faceCaptureBlendshapeMap';

export interface FaceLandmarkPoint {
  x: number;
  y: number;
  z: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function buildBlendshapesFromMouth(
  mouthShapes: FaceCaptureFrame['mouthShapes'],
  eyeBlink: FaceCaptureFrame['eyeBlink'],
): Record<string, number> {
  const blendshapes: Record<string, number> = {};

  for (const [key, candidates] of Object.entries(FACE_CAPTURE_MOUTH_MAP)) {
    const value =
      mouthShapes[key as keyof FaceCaptureFrame['mouthShapes']] ?? 0;
    const primary = candidates[0];
    blendshapes[primary] = clamp01(value);
  }

  blendshapes.eyeBlinkLeft = clamp01(eyeBlink.left);
  blendshapes.eyeBlinkRight = clamp01(eyeBlink.right);

  return blendshapes;
}

export function landmarksToFaceCaptureFrame(
  landmarks: FaceLandmarkPoint[],
  imageSize?: { width: number; height: number } | null,
): FaceCaptureFrame | null {
  if (landmarks.length < 468) {
    return null;
  }

  const solved = Face.solve(landmarks, {
    runtime: 'mediapipe',
    imageSize: imageSize ?? null,
    smoothBlink: true,
  });

  if (!solved) {
    return null;
  }

  const mouthShapes = {
    a: clamp01(solved.mouth.shape.A),
    e: clamp01(solved.mouth.shape.E),
    i: clamp01(solved.mouth.shape.I),
    o: clamp01(solved.mouth.shape.O),
    u: clamp01(solved.mouth.shape.U),
  };

  const eyeBlink = {
    left: clamp01(solved.eye.l),
    right: clamp01(solved.eye.r),
  };

  return {
    headRotation: {
      x: solved.head.x,
      y: solved.head.y,
      z: solved.head.z,
    },
    eyeBlink,
    pupil: {
      x: solved.pupil.x,
      y: solved.pupil.y,
    },
    mouthShapes,
    blendshapes: buildBlendshapesFromMouth(mouthShapes, eyeBlink),
    timestamp: performance.now(),
  };
}
