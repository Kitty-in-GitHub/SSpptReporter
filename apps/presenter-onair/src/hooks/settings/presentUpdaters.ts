import { useCallback } from 'react';
import type {
  PresentLayout,
  PresentSettings,
  QaAsrEngine,
  SessionMode,
} from '../../types/present';
import { normalizePresentSettings } from '../../types/present';
import type { SetSettings } from './types';

export interface PresentSettingsUpdaterDeps {
  setSettings: SetSettings;
}

export function createPresentSettingsUpdaters(deps: PresentSettingsUpdaterDeps) {
  const { setSettings } = deps;

  const updatePresentSessionMode = useCallback(
    (sessionMode: SessionMode) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({ ...prev.present, sessionMode }),
      }));
    },
    [setSettings],
  );

  const updatePresentLayout = useCallback(
    (presentLayout: PresentLayout) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({ ...prev.present, presentLayout }),
      }));
    },
    [setSettings],
  );

  const updatePresentActiveDeckId = useCallback(
    (activeDeckId: string) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({ ...prev.present, activeDeckId }),
      }));
    },
    [setSettings],
  );

  const updatePresentPipCorner = useCallback(
    (pipCorner: PresentSettings['pipCorner']) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({ ...prev.present, pipCorner }),
      }));
    },
    [setSettings],
  );

  const updatePresentPipBorderless = useCallback(
    (pipBorderless: boolean) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({ ...prev.present, pipBorderless }),
      }));
    },
    [setSettings],
  );

  const updatePresentPipOffset = useCallback(
    (pipOffsetX: number, pipOffsetY: number) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({
          ...prev.present,
          pipOffsetX,
          pipOffsetY,
        }),
      }));
    },
    [setSettings],
  );

  const updatePresentPipSize = useCallback(
    (pipSize: number) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({ ...prev.present, pipSize }),
      }));
    },
    [setSettings],
  );

  const updatePresentResumeDeckAfterQaInterrupt = useCallback(
    (resumeDeckAfterQaInterrupt: boolean) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({
          ...prev.present,
          resumeDeckAfterQaInterrupt,
        }),
      }));
    },
    [setSettings],
  );

  const updatePresentQaAsrEngine = useCallback(
    (qaAsrEngine: QaAsrEngine) => {
      setSettings((prev) => ({
        ...prev,
        present: normalizePresentSettings({
          ...prev.present,
          qaAsrEngine,
        }),
      }));
    },
    [setSettings],
  );

  return {
    updatePresentSessionMode,
    updatePresentLayout,
    updatePresentActiveDeckId,
    updatePresentPipCorner,
    updatePresentPipBorderless,
    updatePresentPipOffset,
    updatePresentPipSize,
    updatePresentResumeDeckAfterQaInterrupt,
    updatePresentQaAsrEngine,
  };
}
