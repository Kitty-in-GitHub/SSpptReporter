import { describe, expect, it } from 'vitest';
import {
  framingFromTargetOffset,
  normalizeVrmCameraFraming,
  resolveVrmCameraFramingOffsets,
} from './vrmCameraFraming';

describe('vrmCameraFraming', () => {
  const base = {
    lookAtX: 0,
    lookAtY: 1.2,
    cameraY: 1.2,
    baseDistance: 2,
    panSpanX: 0.3,
    panSpanY: 0.25,
  };

  it('normalizes framing values', () => {
    expect(
      normalizeVrmCameraFraming({ panX: 2, panY: -2, zoom: 9 }),
    ).toEqual({ panX: 1, panY: -1, zoom: 2 });
  });

  it('resolves target offsets from framing', () => {
    expect(
      resolveVrmCameraFramingOffsets(base, { panX: 0.5, panY: -0.4, zoom: 2 }),
    ).toEqual({
      offsetX: 0.15,
      offsetY: -0.1,
      distance: 1,
    });
  });

  it('round-trips target offset to framing', () => {
    const framing = { panX: 0.25, panY: 0.5, zoom: 1.2 };
    const offsets = resolveVrmCameraFramingOffsets(base, framing);
    const roundTrip = framingFromTargetOffset(
      base,
      base.lookAtX + offsets.offsetX,
      base.lookAtY + offsets.offsetY,
      framing.zoom,
    );
    expect(roundTrip).toEqual(framing);
  });
});
