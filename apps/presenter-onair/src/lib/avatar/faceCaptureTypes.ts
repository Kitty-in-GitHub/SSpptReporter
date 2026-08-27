/** 呈现层面捕帧（与 VRM / MediaPipe 实现无关） */

export interface FaceCaptureRotation {
  x: number;
  y: number;
  z: number;
}

export interface FaceCaptureFrame {
  headRotation: FaceCaptureRotation;
  eyeBlink: { left: number; right: number };
  pupil: { x: number; y: number };
  mouthShapes: { a: number; e: number; i: number; o: number; u: number };
  blendshapes: Record<string, number>;
  timestamp: number;
}

export const EMPTY_FACE_CAPTURE_FRAME: FaceCaptureFrame = {
  headRotation: { x: 0, y: 0, z: 0 },
  eyeBlink: { left: 0, right: 0 },
  pupil: { x: 0, y: 0 },
  mouthShapes: { a: 0, e: 0, i: 0, o: 0, u: 0 },
  blendshapes: {},
  timestamp: 0,
};
