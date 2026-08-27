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
import { createLlmSettingsUpdaters } from './settings/llmUpdaters';
import { createTtsSettingsUpdaters } from './settings/ttsUpdaters';
import { createVisualSettingsUpdaters } from './settings/visualUpdaters';
import { createPresentSettingsUpdaters } from './settings/presentUpdaters';
import { createStreamSettingsUpdaters } from './settings/streamUpdaters';

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

  const llmUpdaters = createLlmSettingsUpdaters({
    setSettings,
    settings,
    openRouterDynamicModels,
    setOpenRouterRefreshError,
    setIsRefreshingOpenRouterFreeModels,
  });

  const ttsUpdaters = createTtsSettingsUpdaters({ setSettings });

  const visualUpdaters = createVisualSettingsUpdaters({
    setSettings,
    setImportedVrmModels,
  });

  const presentUpdaters = createPresentSettingsUpdaters({ setSettings });

  const streamUpdaters = createStreamSettingsUpdaters({ setSettings });

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
  };
}
