import { useCallback } from 'react';
import {
  getDefaultXaiReasoningEffort,
  refreshOpenRouterFreeModels,
  type RefreshOpenRouterFreeModelsResult,
  type XaiReasoningEffort,
} from '@aituber-onair/core';
import {
  DEFAULT_OPENAI_COMPATIBLE_ENDPOINT,
  DEFAULT_OPENAI_COMPATIBLE_MODEL,
  DEFAULT_OPENROUTER_MAX_CANDIDATES,
  DEFAULT_OPENROUTER_MAX_WORKING,
} from '../../lib/settings/constants';
import {
  getOrderedModels,
  mergeModelIds,
  normalizeModelIds,
  normalizeOpenRouterDynamicFreeModels,
  normalizePositiveInteger,
} from '../../lib/settings/defaults';
import type { AppSettings, ChatProviderOption } from '../../types/settings';
import type { ApiKeyProvider, SetSettings } from './types';

export interface LlmSettingsUpdaterDeps {
  setSettings: SetSettings;
  settings: AppSettings;
  openRouterDynamicModels: string[];
  setOpenRouterRefreshError: (error: string) => void;
  setIsRefreshingOpenRouterFreeModels: (value: boolean) => void;
}

export function createLlmSettingsUpdaters(deps: LlmSettingsUpdaterDeps) {
  const {
    setSettings,
    settings,
    openRouterDynamicModels,
    setOpenRouterRefreshError,
    setIsRefreshingOpenRouterFreeModels,
  } = deps;

  const updateLLMProvider = useCallback(
    (provider: ChatProviderOption) => {
      const baseModels = getOrderedModels(provider);
      const models =
        provider === 'openrouter'
          ? mergeModelIds(baseModels, openRouterDynamicModels)
          : baseModels;
      const nextModel =
        provider === 'openai-compatible'
          ? DEFAULT_OPENAI_COMPATIBLE_MODEL
          : models[0] || '';
      setSettings((prev) => ({
        ...prev,
        llm: {
          ...prev.llm,
          provider,
          model: nextModel,
          xaiReasoningEffort:
            provider === 'xai'
              ? getDefaultXaiReasoningEffort(nextModel) || 'none'
              : prev.llm.xaiReasoningEffort,
          endpoint:
            provider === 'openai-compatible'
              ? prev.llm.endpoint || DEFAULT_OPENAI_COMPATIBLE_ENDPOINT
              : prev.llm.endpoint,
        },
      }));
    },
    [openRouterDynamicModels, setSettings],
  );

  const updateLLMModel = useCallback(
    (model: string) => {
      setSettings((prev) => ({
        ...prev,
        llm: {
          ...prev.llm,
          model,
          xaiReasoningEffort:
            prev.llm.provider === 'xai'
              ? getDefaultXaiReasoningEffort(model) || 'none'
              : prev.llm.xaiReasoningEffort,
        },
      }));
    },
    [setSettings],
  );

  const updateLLMSystemPrompt = useCallback(
    (systemPrompt: string) => {
      setSettings((prev) => ({
        ...prev,
        llm: { ...prev.llm, systemPrompt },
      }));
    },
    [setSettings],
  );

  const updateXaiReasoningEffort = useCallback(
    (xaiReasoningEffort: XaiReasoningEffort) => {
      setSettings((prev) => ({
        ...prev,
        llm: { ...prev.llm, xaiReasoningEffort },
      }));
    },
    [setSettings],
  );

  const updateLLMApiKey = useCallback(
    (provider: ChatProviderOption, key: string) => {
      if (provider === 'gemini-nano') {
        return;
      }
      setSettings((prev) => ({
        ...prev,
        llm: {
          ...prev.llm,
          apiKeys: {
            ...prev.llm.apiKeys,
            [provider as ApiKeyProvider]: key,
          },
        },
      }));
    },
    [setSettings],
  );

  const updateLLMEndpoint = useCallback(
    (endpoint: string) => {
      setSettings((prev) => ({
        ...prev,
        llm: { ...prev.llm, endpoint },
      }));
    },
    [setSettings],
  );

  const refreshOpenRouterDynamicFreeModels = useCallback(async () => {
    const apiKey = settings.llm.apiKeys.openrouter?.trim() || '';
    if (!apiKey) {
      const message = 'OpenRouter API key is required.';
      setOpenRouterRefreshError(message);
      return null;
    }

    setIsRefreshingOpenRouterFreeModels(true);
    setOpenRouterRefreshError('');

    try {
      const maxCandidates = normalizePositiveInteger(
        settings.llm.openRouterDynamicFreeModels?.maxCandidates,
        DEFAULT_OPENROUTER_MAX_CANDIDATES,
      );
      const result: RefreshOpenRouterFreeModelsResult =
        await refreshOpenRouterFreeModels({
          apiKey,
          maxCandidates,
          maxWorking: DEFAULT_OPENROUTER_MAX_WORKING,
        });

      setSettings((prev) => ({
        ...prev,
        llm: {
          ...prev.llm,
          openRouterDynamicFreeModels: {
            ...normalizeOpenRouterDynamicFreeModels(
              prev.llm.openRouterDynamicFreeModels,
            ),
            models: normalizeModelIds(result.working),
            fetchedAt: result.fetchedAt,
          },
        },
      }));

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOpenRouterRefreshError(message);
      return null;
    } finally {
      setIsRefreshingOpenRouterFreeModels(false);
    }
  }, [
    setIsRefreshingOpenRouterFreeModels,
    setOpenRouterRefreshError,
    setSettings,
    settings.llm.apiKeys.openrouter,
    settings.llm.openRouterDynamicFreeModels?.maxCandidates,
  ]);

  const updateOpenRouterMaxCandidates = useCallback(
    (maxCandidates: number) => {
      const normalized = normalizePositiveInteger(
        maxCandidates,
        DEFAULT_OPENROUTER_MAX_CANDIDATES,
      );
      setSettings((prev) => ({
        ...prev,
        llm: {
          ...prev.llm,
          openRouterDynamicFreeModels: {
            ...normalizeOpenRouterDynamicFreeModels(
              prev.llm.openRouterDynamicFreeModels,
            ),
            maxCandidates: normalized,
          },
        },
      }));
    },
    [setSettings],
  );

  const getApiKeyForProvider = useCallback(
    (provider: ChatProviderOption): string => {
      if (provider === 'gemini-nano') {
        return '';
      }
      return settings.llm.apiKeys[provider as ApiKeyProvider] || '';
    },
    [settings.llm.apiKeys],
  );

  return {
    updateLLMProvider,
    updateLLMModel,
    updateLLMSystemPrompt,
    updateXaiReasoningEffort,
    updateLLMApiKey,
    updateLLMEndpoint,
    refreshOpenRouterDynamicFreeModels,
    updateOpenRouterMaxCandidates,
    getApiKeyForProvider,
  };
}
