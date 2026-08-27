import { describe, expect, it } from 'vitest';
import { landmarksToFaceCaptureFrame } from './faceCaptureMapper';

function buildLandmarks(count: number): Array<{ x: number; y: number; z: number }> {
  return Array.from({ length: count }, (_, index) => ({
    x: 0.5 + Math.sin(index * 0.01) * 0.02,
    y: 0.5 + Math.cos(index * 0.01) * 0.02,
    z: 0,
  }));
}

describe('landmarksToFaceCaptureFrame', () => {
  it('returns null when landmark count is insufficient', () => {
    expect(landmarksToFaceCaptureFrame(buildLandmarks(100))).toBeNull();
  });

  it('maps mediapipe landmarks into a face capture frame', () => {
    const frame = landmarksToFaceCaptureFrame(buildLandmarks(478), {
      width: 640,
      height: 480,
    });

    expect(frame).not.toBeNull();
    if (!frame) return;

    expect(frame.headRotation.x).toBeTypeOf('number');
    expect(frame.headRotation.y).toBeTypeOf('number');
    expect(frame.headRotation.z).toBeTypeOf('number');
    expect(frame.eyeBlink.left).toBeGreaterThanOrEqual(0);
    expect(frame.eyeBlink.right).toBeLessThanOrEqual(1);
    expect(frame.mouthShapes.a).toBeGreaterThanOrEqual(0);
    expect(frame.blendshapes.aa ?? frame.blendshapes.A).toBeDefined();
    expect(frame.timestamp).toBeGreaterThan(0);
  });
});
