import {
  createOpenAiCompatibleEmbedder,
  DEFAULT_EMBEDDING_MODEL,
  type BrainEmbedder,
} from '@ssreporter/brain';
import type { AppSettings, ChatProviderOption } from '../../types/settings';
import { fetchGatewayEmbedHealth } from './gatewayEmbedHealth';

const LOCAL_EMBED_API_KEY = 'local';

function createCloudBrainEmbedder(
  llmSettings: AppSettings['llm'],
  getApiKeyForProvider: (provider: ChatProviderOption) => string,
): BrainEmbedder | null {
  if (llmSettings.provider === 'openai') {
    const apiKey = getApiKeyForProvider('openai').trim();
    if (!apiKey) {
      return null;
    }
    return createOpenAiCompatibleEmbedder({
      apiKey,
      baseUrl: 'https://api.openai.com/v1',
      model: DEFAULT_EMBEDDING_MODEL,
    });
  }

  if (llmSettings.provider === 'openai-compatible') {
    const endpoint = llmSettings.endpoint?.trim();
    const apiKey = getApiKeyForProvider('openai-compatible').trim();
    if (!endpoint || !apiKey) {
      return null;
    }
    const baseUrl = endpoint.replace(/\/+$/, '');
    return createOpenAiCompatibleEmbedder({
      apiKey,
      baseUrl,
      model: DEFAULT_EMBEDDING_MODEL,
    });
  }

  const openaiKey = getApiKeyForProvider('openai').trim();
  if (openaiKey) {
    return createOpenAiCompatibleEmbedder({
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1',
      model: DEFAULT_EMBEDDING_MODEL,
    });
  }

  return null;
}

/**
 * Resolve embedder: local CPU gateway first, then cloud OpenAI-compatible.
 * Returns null → Q&A falls back to TF retrieval.
 */
export async function resolveBrainEmbedder(
  llmSettings: AppSettings['llm'],
  getApiKeyForProvider: (provider: ChatProviderOption) => string,
): Promise<BrainEmbedder | null> {
  try {
    const localHealth = await fetchGatewayEmbedHealth();
    if (localHealth.ok && localHealth.embedding && localHealth.model) {
      return createOpenAiCompatibleEmbedder({
        apiKey: LOCAL_EMBED_API_KEY,
        baseUrl: '/api/embed/v1',
        model: localHealth.model,
      });
    }

    return createCloudBrainEmbedder(llmSettings, getApiKeyForProvider);
  } catch {
    return createCloudBrainEmbedder(llmSettings, getApiKeyForProvider);
  }
}
