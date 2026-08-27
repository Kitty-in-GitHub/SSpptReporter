import type { AppSettings, FaceCaptureMouthDriver, FaceCaptureSource } from '../../types/settings';

export const DEFAULT_FACE_CAPTURE_SETTINGS: AppSettings['faceCapture'] = {
  mouthDriver: 'faceCapture',
  source: 'webcam',
  deviceId: '',
  showCameraPreview: false,
  smoothing: 0.35,
};

export function normalizeFaceCaptureSettings(
  partial?: Partial<AppSettings['faceCapture']> | null,
): AppSettings['faceCapture'] {
  const defaults = DEFAULT_FACE_CAPTURE_SETTINGS;
  const mouthDriver: FaceCaptureMouthDriver =
    partial?.mouthDriver === 'tts' ? 'tts' : defaults.mouthDriver;
  const source: FaceCaptureSource =
    partial?.source === 'webcam' ? 'webcam' : defaults.source;
  const smoothing =
    typeof partial?.smoothing === 'number' && Number.isFinite(partial.smoothing)
      ? Math.min(1, Math.max(0, partial.smoothing))
      : defaults.smoothing;

  return {
    mouthDriver,
    source,
    deviceId: partial?.deviceId?.trim() ?? defaults.deviceId,
    showCameraPreview: partial?.showCameraPreview ?? defaults.showCameraPreview,
    smoothing,
  };
}
