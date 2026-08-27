import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  normalizeEmotionEffectAnchor,
  type EmotionEffectAnchor,
} from '../../lib/emotionEffectAnchor';
import {
  DEFAULT_VRM_EMOTION_EFFECT_MAP,
  type VrmEmotionEffect,
  type VrmReactionControlMode,
  type VrmReactionEmotion,
} from '../../lib/vrmReactions';
import {
  DEFAULT_VRM_CAMERA_FRAMING,
  normalizeVrmCameraFraming,
  type VrmCameraFraming,
} from '../../types/settings';
import {
  DEFAULT_VRM_MODEL_ID,
  normalizeVrmModelSelection,
} from '../../lib/vrm/vrmModelCatalog';
import {
  deleteImportedVrmModel,
  saveImportedVrmModel,
  type ImportedVrmModelMeta,
} from '../../lib/vrm/vrmModelStore';
import type { AppSettings, VrmModelSource } from '../../types/settings';
import type { SetSettings } from './types';

export interface VisualSettingsUpdaterDeps {
  setSettings: SetSettings;
  setImportedVrmModels: Dispatch<SetStateAction<ImportedVrmModelMeta[]>>;
}

export function createVisualSettingsUpdaters(deps: VisualSettingsUpdaterDeps) {
  const { setSettings, setImportedVrmModels } = deps;

  const updateVisualBackgroundMode = useCallback(
    (backgroundMode: AppSettings['visual']['backgroundMode']) => {
      setSettings((prev) => ({
        ...prev,
        visual: { ...prev.visual, backgroundMode },
      }));
    },
    [setSettings],
  );

  const updateVisualVrmModel = useCallback(
    (vrmModelSource: VrmModelSource, vrmModelId: string) => {
      const normalized = normalizeVrmModelSelection(vrmModelSource, vrmModelId);
      setSettings((prev) => ({
        ...prev,
        visual: {
          ...prev.visual,
          ...normalized,
        },
      }));
    },
    [setSettings],
  );

  const importVrmModelFile = useCallback(
    async (file: File) => {
      const meta = await saveImportedVrmModel(file);
      setSettings((prev) => ({
        ...prev,
        visual: {
          ...prev.visual,
          vrmModelSource: 'imported',
          vrmModelId: meta.id,
        },
      }));
      setImportedVrmModels((prev) => [
        meta,
        ...prev.filter((entry) => entry.id !== meta.id),
      ]);
      return meta;
    },
    [setImportedVrmModels, setSettings],
  );

  const removeImportedVrmModel = useCallback(
    async (modelId: string) => {
      await deleteImportedVrmModel(modelId);
      setImportedVrmModels((prev) =>
        prev.filter((entry) => entry.id !== modelId),
      );
      setSettings((prev) => {
        if (
          prev.visual.vrmModelSource !== 'imported' ||
          prev.visual.vrmModelId !== modelId
        ) {
          return prev;
        }
        return {
          ...prev,
          visual: {
            ...prev.visual,
            vrmModelSource: 'builtin',
            vrmModelId: DEFAULT_VRM_MODEL_ID,
          },
        };
      });
    },
    [setImportedVrmModels, setSettings],
  );

  const updateVisualLayoutMode = useCallback(
    (layoutMode: AppSettings['visual']['layoutMode']) => {
      setSettings((prev) => ({
        ...prev,
        visual: { ...prev.visual, layoutMode },
      }));
    },
    [setSettings],
  );

  const updateVisualVrmCameraFraming = useCallback(
    (partial: Partial<VrmCameraFraming>) => {
      setSettings((prev) => ({
        ...prev,
        visual: {
          ...prev.visual,
          vrmCameraFraming: normalizeVrmCameraFraming({
            ...prev.visual.vrmCameraFraming,
            ...partial,
          }),
        },
      }));
    },
    [setSettings],
  );

  const resetVisualVrmCameraFraming = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      visual: {
        ...prev.visual,
        vrmCameraFraming: { ...DEFAULT_VRM_CAMERA_FRAMING },
      },
    }));
  }, [setSettings]);

  const updateVisualShowInputInBroadcast = useCallback(
    (showInputInBroadcast: boolean) => {
      setSettings((prev) => ({
        ...prev,
        visual: { ...prev.visual, showInputInBroadcast },
      }));
    },
    [setSettings],
  );

  const updateVisualVrmReactionControlMode = useCallback(
    (vrmReactionControlMode: VrmReactionControlMode) => {
      setSettings((prev) => ({
        ...prev,
        visual: { ...prev.visual, vrmReactionControlMode },
      }));
    },
    [setSettings],
  );

  const updateVisualVrmEmotionEffect = useCallback(
    (emotion: VrmReactionEmotion, effect: VrmEmotionEffect | null) => {
      setSettings((prev) => ({
        ...prev,
        visual: {
          ...prev.visual,
          vrmEmotionEffectMap: {
            ...prev.visual.vrmEmotionEffectMap,
            [emotion]: effect,
          },
        },
      }));
    },
    [setSettings],
  );

  const resetVisualVrmEmotionEffectMap = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      visual: {
        ...prev.visual,
        vrmEmotionEffectMap: { ...DEFAULT_VRM_EMOTION_EFFECT_MAP },
      },
    }));
  }, [setSettings]);

  const updateVisualVrmEmotionEffectAnchor = useCallback(
    (profileId: string, anchor: EmotionEffectAnchor) => {
      if (!profileId) return;
      const normalized = normalizeEmotionEffectAnchor(anchor);
      setSettings((prev) => ({
        ...prev,
        visual: {
          ...prev.visual,
          vrmEmotionEffectAnchors: Object.fromEntries(
            Object.entries({
              ...prev.visual.vrmEmotionEffectAnchors,
              [profileId]: normalized,
            }).slice(-24),
          ),
        },
      }));
    },
    [setSettings],
  );

  const resetVisualVrmEmotionEffectAnchor = useCallback(
    (profileId: string) => {
      if (!profileId) return;
      setSettings((prev) => {
        const remaining = { ...prev.visual.vrmEmotionEffectAnchors };
        delete remaining[profileId];
        return {
          ...prev,
          visual: { ...prev.visual, vrmEmotionEffectAnchors: remaining },
        };
      });
    },
    [setSettings],
  );

  return {
    updateVisualBackgroundMode,
    updateVisualVrmModel,
    importVrmModelFile,
    removeImportedVrmModel,
    updateVisualLayoutMode,
    updateVisualVrmCameraFraming,
    resetVisualVrmCameraFraming,
    updateVisualShowInputInBroadcast,
    updateVisualVrmReactionControlMode,
    updateVisualVrmEmotionEffect,
    resetVisualVrmEmotionEffectMap,
    updateVisualVrmEmotionEffectAnchor,
    resetVisualVrmEmotionEffectAnchor,
  };
}
