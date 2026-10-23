import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings } from '../types/settings';
import {
  DEFAULT_OPENAI_COMPATIBLE_MODEL,
  EMPTY_MODEL_IDS,
} from '../lib/settings/constants';
import {
  getOrderedModels,
  mergeModelIds,
} from '../lib/settings/defaults';
import { loadSettings, saveSettings } from '../lib/settings/storage';
import {
  listImportedVrmModels,
  type ImportedVrmModelMeta,
} from '../lib/vrm/vrmModelStore';
import { DEFAULT_VRM_MODEL_ID } from '../lib/vrm/vrmModelCatalog';
import { useLlmSettingsUpdaters } from './settings/llmUpdaters';
import { useTtsSettingsUpdaters } from './settings/tts';
import { useVisualSettingsUpdaters } from './settings/visualUpdaters';
import { usePresentSettingsUpdaters } from './settings/presentUpdaters';
import { useStreamSettingsUpdaters } from './settings/streamUpdaters';
import { useFaceCaptureUpdaters } from './settings/faceCaptureUpdaters';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [importedVrmModels, setImportedVrmModels] = useState<
    ImportedVrmModelMeta[]
  >([]);
  const [openRouterRefreshError, setOpenRouterRefreshError] = useState('');
  const [
    isRefreshingOpenRouterFreeModels,
    setIsRefreshingOpenRouterFreeModels,
  ] = useState(false);
  const openRouterDynamicModels = useMemo(
    () => settings.llm.openRouterDynamicFreeModels?.models || EMPTY_MODEL_IDS,
    [settings.llm.openRouterDynamicFreeModels?.models],
  );

  const availableModels = useMemo(() => {
    const models = getOrderedModels(settings.llm.provider);
    if (settings.llm.provider === 'openrouter') {
      return mergeModelIds(models, openRouterDynamicModels);
    }
    if (settings.llm.provider !== 'openai-compatible') {
      return models;
    }
    if (settings.llm.model) {
      return [settings.llm.model];
    }
    return [DEFAULT_OPENAI_COMPATIBLE_MODEL];
  }, [settings.llm.provider, settings.llm.model, openRouterDynamicModels]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const refreshImportedVrmModels = useCallback(async () => {
    try {
      const models = await listImportedVrmModels();
      setImportedVrmModels(models);
      setSettings((prev) => {
        if (
          prev.visual.vrmModelSource === 'imported' &&
          !models.some((entry) => entry.id === prev.visual.vrmModelId)
        ) {
          return {
            ...prev,
            visual: {
              ...prev.visual,
              vrmModelSource: 'builtin',
              vrmModelId: DEFAULT_VRM_MODEL_ID,
            },
          };
        }
        return prev;
      });
      return models;
    } catch {
      setImportedVrmModels([]);
      return [];
    }
  }, []);

  useEffect(() => {
    void refreshImportedVrmModels();
  }, [refreshImportedVrmModels]);

  const llmUpdaters = useLlmSettingsUpdaters({
    setSettings,
    settings,
    openRouterDynamicModels,
    setOpenRouterRefreshError,
    setIsRefreshingOpenRouterFreeModels,
  });

  const ttsUpdaters = useTtsSettingsUpdaters({ setSettings });

  const visualUpdaters = useVisualSettingsUpdaters({
    setSettings,
    setImportedVrmModels,
  });

  const presentUpdaters = usePresentSettingsUpdaters({ setSettings });

  const streamUpdaters = useStreamSettingsUpdaters({ setSettings });

  const faceCaptureUpdaters = useFaceCaptureUpdaters({ setSettings });

  return {
    settings,
    availableModels,
    importedVrmModels,
    refreshImportedVrmModels,
    isRefreshingOpenRouterFreeModels,
    openRouterRefreshError,
    ...llmUpdaters,
    ...ttsUpdaters,
    ...visualUpdaters,
    ...presentUpdaters,
    ...streamUpdaters,
    ...faceCaptureUpdaters,
  };
}
