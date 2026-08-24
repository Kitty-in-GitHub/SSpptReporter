export interface VrmCameraFraming {
  /** -1…1，正值把视线中心向右移（角色在画面中偏左） */
  panX: number;
  /** -1…1，正值把视线中心向上移（更多下半身 / 脸相对下移） */
  panY: number;
  /** 0.5…2，越大镜头越近 */
  zoom: number;
}

export const DEFAULT_VRM_CAMERA_FRAMING: VrmCameraFraming = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

export const MIN_VRM_FRAMING_ZOOM = 0.5;
export const MAX_VRM_FRAMING_ZOOM = 2;

export function clampVrmFramingZoom(value: number | undefined): number {
  return clampFinite(value, MIN_VRM_FRAMING_ZOOM, MAX_VRM_FRAMING_ZOOM, 1);
}

export function clampVrmFramingPan(value: number | undefined): number {
  return clampFinite(value, -1, 1, 0);
}

export function normalizeVrmCameraFraming(
  partial?: Partial<VrmCameraFraming> | null,
): VrmCameraFraming {
  return {
    panX: clampVrmFramingPan(partial?.panX),
    panY: clampVrmFramingPan(partial?.panY),
    zoom: clampVrmFramingZoom(partial?.zoom),
  };
}

export interface VrmCameraFramingBase {
  lookAtX: number;
  lookAtY: number;
  cameraY: number;
  baseDistance: number;
  panSpanX: number;
  panSpanY: number;
}

export function resolveVrmCameraFramingOffsets(
  base: VrmCameraFramingBase,
  framing: VrmCameraFraming,
): { offsetX: number; offsetY: number; distance: number } {
  const safe = normalizeVrmCameraFraming(framing);
  return {
    offsetX: safe.panX * base.panSpanX,
    offsetY: safe.panY * base.panSpanY,
    distance: Math.max(0.35, base.baseDistance / safe.zoom),
  };
}

export function framingFromTargetOffset(
  base: VrmCameraFramingBase,
  targetX: number,
  targetY: number,
  zoom: number,
): VrmCameraFraming {
  const panX =
    base.panSpanX > 0 ? (targetX - base.lookAtX) / base.panSpanX : 0;
  const panY =
    base.panSpanY > 0 ? (targetY - base.lookAtY) / base.panSpanY : 0;
  return normalizeVrmCameraFraming({ panX, panY, zoom });
}

function clampFinite(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}
