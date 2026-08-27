import { useCallback } from 'react';
import type {
  FaceCaptureMouthDriver,
  FaceCaptureSource,
} from '../../types/settings';
import { normalizeFaceCaptureSettings } from '../../lib/settings/faceCapture';
import type { SetSettings } from './types';

export interface FaceCaptureUpdaterDeps {
  setSettings: SetSettings;
}

export function createFaceCaptureUpdaters(deps: FaceCaptureUpdaterDeps) {
  const { setSettings } = deps;

  const updateFaceCaptureMouthDriver = useCallback(
    (mouthDriver: FaceCaptureMouthDriver) => {
      setSettings((prev) => ({
        ...prev,
        faceCapture: normalizeFaceCaptureSettings({
          ...prev.faceCapture,
          mouthDriver,
        }),
      }));
    },
    [setSettings],
  );

  const updateFaceCaptureSource = useCallback(
    (source: FaceCaptureSource) => {
      setSettings((prev) => ({
        ...prev,
        faceCapture: normalizeFaceCaptureSettings({
          ...prev.faceCapture,
          source,
        }),
      }));
    },
    [setSettings],
  );

  const updateFaceCaptureDeviceId = useCallback(
    (deviceId: string) => {
      setSettings((prev) => ({
        ...prev,
        faceCapture: normalizeFaceCaptureSettings({
          ...prev.faceCapture,
          deviceId,
        }),
      }));
    },
    [setSettings],
  );

  const updateFaceCaptureShowCameraPreview = useCallback(
    (showCameraPreview: boolean) => {
      setSettings((prev) => ({
        ...prev,
        faceCapture: normalizeFaceCaptureSettings({
          ...prev.faceCapture,
          showCameraPreview,
        }),
      }));
    },
    [setSettings],
  );

  const updateFaceCaptureSmoothing = useCallback(
    (smoothing: number) => {
      setSettings((prev) => ({
        ...prev,
        faceCapture: normalizeFaceCaptureSettings({
          ...prev.faceCapture,
          smoothing,
        }),
      }));
    },
    [setSettings],
  );

  return {
    updateFaceCaptureMouthDriver,
    updateFaceCaptureSource,
    updateFaceCaptureDeviceId,
    updateFaceCaptureShowCameraPreview,
    updateFaceCaptureSmoothing,
  };
}
