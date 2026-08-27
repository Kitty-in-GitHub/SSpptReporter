import { useState } from 'react';
import {
  getDefaultXaiReasoningEffort,
  isGPT5Model,
  isXaiReasoningEffortModel,
  isXaiReasoningEffortNoneModel,
  normalizeXaiReasoningEffort,
  type XaiReasoningEffort,
} from '@aituber-onair/core';
import { DEFAULT_SYSTEM_PROMPT } from '../../constants/prompts';
import { useGeminiNanoStatus } from '../../hooks/useGeminiNanoStatus';
import type { ChatProviderOption } from '../../types/settings';
import type { SettingsHook } from './SettingsSectionShell';
import { SettingsSectionShell } from './SettingsSectionShell';
import { LLM_PROVIDERS } from './settingsConstants';

export interface LlmSettingsSectionProps
  extends Pick<
    SettingsHook,
    | 'settings'
    | 'availableModels'
    | 'updateLLMProvider'
    | 'updateLLMModel'
    | 'updateLLMSystemPrompt'
    | 'updateLLMApiKey'
    | 'updateLLMEndpoint'
    | 'updateXaiReasoningEffort'
    | 'refreshOpenRouterDynamicFreeModels'
    | 'isRefreshingOpenRouterFreeModels'
    | 'openRouterRefreshError'
    | 'updateOpenRouterMaxCandidates'
    | 'getApiKeyForProvider'
  > {
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LlmSettingsSection({
  disabled,
  isExpanded,
  onToggleExpand,
  settings,
  availableModels,
  updateLLMProvider,
  updateLLMModel,
  updateLLMSystemPrompt,
  updateLLMApiKey,
  updateLLMEndpoint,
  updateXaiReasoningEffort,
  refreshOpenRouterDynamicFreeModels,
  isRefreshingOpenRouterFreeModels,
  openRouterRefreshError,
  updateOpenRouterMaxCandidates,
  getApiKeyForProvider,
}: LlmSettingsSectionProps) {
  const [systemPromptDraft, setSystemPromptDraft] = useState(
    settings.llm.systemPrompt,
  );

  const commitSystemPrompt = () => {
    if (systemPromptDraft !== settings.llm.systemPrompt) {
      updateLLMSystemPrompt(systemPromptDraft);
    }
  };
  const isOpenAIGPT5Model =
    settings.llm.provider === 'openai' && isGPT5Model(settings.llm.model);
  const isXaiReasoningEffortModelSelected =
    settings.llm.provider === 'xai' &&
    isXaiReasoningEffortModel(settings.llm.model);
  const xaiReasoningEffortValue: XaiReasoningEffort =
    isXaiReasoningEffortModelSelected
      ? normalizeXaiReasoningEffort(
          settings.llm.model,
          settings.llm.xaiReasoningEffort ||
            getDefaultXaiReasoningEffort(settings.llm.model),
        ) || 'none'
      : 'none';
  const allowsXaiNoneReasoningEffort =
    settings.llm.provider === 'xai' &&
    isXaiReasoningEffortNoneModel(settings.llm.model);
  const openRouterApiKey = getApiKeyForProvider('openrouter').trim();
  const openRouterDynamicFreeModels =
    settings.llm.openRouterDynamicFreeModels?.models || [];
  const openRouterFetchedAt =
    settings.llm.openRouterDynamicFreeModels?.fetchedAt || 0;
  const openRouterMaxCandidates =
    settings.llm.openRouterDynamicFreeModels?.maxCandidates || 1;
  const geminiNano = useGeminiNanoStatus(
    settings.llm.provider === 'gemini-nano',
  );

  return (
    <SettingsSectionShell
      title="LLM"
      disabled={disabled}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <>
<div className="settings-field">
              <label htmlFor="llm-provider">提供商</label>
              <select
                id="llm-provider"
                value={settings.llm.provider}
                onChange={(e) =>
                  updateLLMProvider(e.target.value as ChatProviderOption)
                }
                disabled={disabled}
              >
                {LLM_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value} disabled={p.disabled}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {settings.llm.provider !== 'gemini-nano' && (
              <div className="settings-field">
                <label htmlFor="llm-apikey">
                  API 密钥 ({settings.llm.provider})
                  {settings.llm.provider === 'openai-compatible'
                    ? ' (任意)'
                    : ''}
                </label>
                <input
                  id="llm-apikey"
                  type="password"
                  value={getApiKeyForProvider(settings.llm.provider)}
                  onChange={(e) =>
                    updateLLMApiKey(settings.llm.provider, e.target.value)
                  }
                  placeholder={
                    settings.llm.provider === 'openai-compatible'
                      ? '仅在需要时填写'
                      : 'XXX-...'
                  }
                  disabled={disabled}
                />
              </div>
            )}

            {settings.llm.provider === 'openai-compatible' ? (
              <div className="settings-field">
                <label htmlFor="llm-model">模型</label>
                <input
                  id="llm-model"
                  type="text"
                  value={settings.llm.model}
                  onChange={(e) => updateLLMModel(e.target.value)}
                  placeholder="local-model"
                  disabled={disabled}
                />
              </div>
            ) : (
              <div className="settings-field">
                <label htmlFor="llm-model">模型</label>
                <select
                  id="llm-model"
                  value={settings.llm.model}
                  onChange={(e) => updateLLMModel(e.target.value)}
                  disabled={disabled}
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="settings-field">
              <label htmlFor="llm-system-prompt">系统提示词</label>
              <textarea
                id="llm-system-prompt"
                rows={6}
                value={systemPromptDraft}
                onChange={(event) => setSystemPromptDraft(event.target.value)}
                onBlur={commitSystemPrompt}
                placeholder={DEFAULT_SYSTEM_PROMPT}
                disabled={disabled}
              />
              <p className="settings-field-hint">
                失焦后保存。留空则使用默认值。若删除角色专属控制指令，可能影响表情特效联动。
              </p>
            </div>

            {isOpenAIGPT5Model && (
              <p className="settings-field-hint">
                本示例中 GPT-5 模型使用 Casual 预设与 Very Short 回复长度。
              </p>
            )}

            {settings.llm.provider === 'xai' && (
              <div className="settings-field">
                <label htmlFor="xai-reasoning-effort">
                  xAI Reasoning Effort
                </label>
                <select
                  id="xai-reasoning-effort"
                  value={xaiReasoningEffortValue}
                  onChange={(e) =>
                    updateXaiReasoningEffort(
                      e.target.value as XaiReasoningEffort,
                    )
                  }
                  disabled={disabled || !isXaiReasoningEffortModelSelected}
                >
                  {allowsXaiNoneReasoningEffort && (
                    <option value="none">无</option>
                  )}
                  <option value="low">Low</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
                <p className="settings-field-hint">
                  {isXaiReasoningEffortModelSelected
                    ? settings.llm.model === 'grok-4.5'
                      ? 'Grok 4.5 uses low by default; none is not supported.'
                      : 'Grok 4.3 uses none by default for lower latency.'
                    : 'This xAI model does not support reasoning_effort.'}
                </p>
              </div>
            )}

            {settings.llm.provider === 'openrouter' && (
              <>
                <div className="settings-field">
                  <label htmlFor="openrouter-max-candidates">
                    最大候选数
                  </label>
                  <input
                    id="openrouter-max-candidates"
                    type="number"
                    min={1}
                    value={openRouterMaxCandidates}
                    onChange={(e) => {
                      const parsed = Number.parseInt(e.target.value, 10);
                      updateOpenRouterMaxCandidates(
                        Number.isFinite(parsed) ? parsed : 1,
                      );
                    }}
                    disabled={disabled || isRefreshingOpenRouterFreeModels}
                  />
                </div>
                <div className="settings-field">
                  <button
                    type="button"
                    className="settings-action-button"
                    onClick={() => {
                      void refreshOpenRouterDynamicFreeModels();
                    }}
                    disabled={
                      disabled ||
                      isRefreshingOpenRouterFreeModels ||
                      !openRouterApiKey
                    }
                  >
                    {isRefreshingOpenRouterFreeModels
                      ? '获取中…'
                      : '获取免费模型'}
                  </button>
                  {!openRouterApiKey && (
                    <p className="settings-field-hint">
                      Set OpenRouter API key to fetch free models.
                    </p>
                  )}
                  {openRouterRefreshError && (
                    <p className="settings-field-error">
                      {openRouterRefreshError}
                    </p>
                  )}
                  <p className="settings-field-hint">
                    Dynamic free models: {openRouterDynamicFreeModels.length}
                  </p>
                  {openRouterFetchedAt > 0 && (
                    <p className="settings-field-hint">
                      Last fetched:{' '}
                      {new Date(openRouterFetchedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </>
            )}

            {settings.llm.provider === 'openai-compatible' && (
              <div className="settings-field">
                <label htmlFor="llm-endpoint">接口地址</label>
                <input
                  id="llm-endpoint"
                  type="text"
                  value={settings.llm.endpoint || ''}
                  onChange={(e) => updateLLMEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/v1/chat/completions"
                  disabled={disabled}
                />
              </div>
            )}

            {settings.llm.provider === 'gemini-nano' && (
              <>
                <div className="settings-field">
                  <small>
                    Gemini Nano 使用浏览器内置 AI，无需 API 密钥。
                  </small>
                </div>
                <div className="settings-field">
                  <small>{geminiNano.statusText}</small>
                  {geminiNano.downloadProgress != null && (
                    <small>{geminiNano.downloadProgress}%</small>
                  )}
                  {geminiNano.status === 'downloadable' && (
                    <button
                      type="button"
                      className="settings-action-button"
                      onClick={() => geminiNano.prepareModel()}
                      disabled={disabled || geminiNano.isPreparing}
                    >
                      {geminiNano.isPreparing
                        ? '准备中…'
                        : '准备模型'}
                    </button>
                  )}
                  <small>
                    需要 Chrome 138+。在 `chrome://flags` 中启用
                    `#optimization-guide-on-device-model` 与
                    `#prompt-api-for-gemini-nano` 后重启 Chrome。
                  </small>
                  <small>
                    启用标志后点击「准备模型」开始下载；首次可能需数分钟。
                  </small>
                </div>
              </>
            )}
      </>
    </SettingsSectionShell>
  );
}
