import {
  ChatServiceFactory,
  getDefaultXaiReasoningEffort,
  isGPT5Model,
  isXaiReasoningEffortModel,
  type ChatService,
  type ChatServiceOptionsByProvider,
  type Message,
} from '@aituber-onair/core';
import type { BrainLlmClient } from '@ssreporter/brain';
import type { AppSettings, ChatProviderOption } from '../../types/settings';

const GPT5_SAMPLE_PROVIDER_OPTIONS = { gpt5Preset: 'casual' as const };

function createChatServiceFromSettings(
  llmSettings: AppSettings['llm'],
  getApiKeyForProvider: (provider: ChatProviderOption) => string,
): ChatService | null {
  if (llmSettings.provider === 'gemini-nano') {
    return ChatServiceFactory.createChatService('gemini-nano', {
      ...(llmSettings.model ? { model: llmSettings.model } : {}),
    });
  }

  if (llmSettings.provider === 'openai-compatible') {
    const endpoint = llmSettings.endpoint?.trim();
    const model = llmSettings.model.trim() || 'local-model';
    if (!endpoint) {
      return null;
    }
    return ChatServiceFactory.createChatService('openai-compatible', {
      apiKey: getApiKeyForProvider('openai-compatible').trim(),
      model,
      endpoint,
    });
  }

  const apiKey = getApiKeyForProvider(llmSettings.provider).trim();
  if (!apiKey) {
    return null;
  }

  const provider = llmSettings.provider;
  return ChatServiceFactory.createChatService(
    provider,
    {
      apiKey,
      model: llmSettings.model,
      ...(provider === 'openai' && isGPT5Model(llmSettings.model)
        ? GPT5_SAMPLE_PROVIDER_OPTIONS
        : {}),
      ...(provider === 'xai' && isXaiReasoningEffortModel(llmSettings.model)
        ? {
            reasoning_effort:
              llmSettings.xaiReasoningEffort ||
              getDefaultXaiReasoningEffort(llmSettings.model) ||
              'none',
          }
        : {}),
    } as ChatServiceOptionsByProvider[typeof provider],
  );
}

export function createBrainLlmClient(
  llmSettings: AppSettings['llm'],
  getApiKeyForProvider: (provider: ChatProviderOption) => string,
): BrainLlmClient | null {
  try {
    const chatService = createChatServiceFromSettings(
      llmSettings,
      getApiKeyForProvider,
    );
    if (!chatService) {
      return null;
    }

    return {
      async complete(systemPrompt, userPrompt) {
        const messages: Message[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];
        const response = await chatService.chatOnce(messages, false);
        return typeof response === 'string' ? response.trim() : String(response);
      },
    };
  } catch {
    return null;
  }
}
