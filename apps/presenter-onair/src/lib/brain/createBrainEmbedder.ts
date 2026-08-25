import {
  createOpenAiCompatibleEmbedder,
  DEFAULT_EMBEDDING_MODEL,
  type BrainEmbedder,
} from '@ssreporter/brain';
import type { AppSettings, ChatProviderOption } from '../../types/settings';

/**
 * Build an embedding client from Settings LLM provider when OpenAI-compatible
 * embeddings are available. Returns null → Q&A falls back to TF retrieval.
 */
export function createBrainEmbedder(
  llmSettings: AppSettings['llm'],
  getApiKeyForProvider: (provider: ChatProviderOption) => string,
): BrainEmbedder | null {
  try {
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

    // Other chat providers may share an OpenAI key for embeddings.
    const openaiKey = getApiKeyForProvider('openai').trim();
    if (openaiKey) {
      return createOpenAiCompatibleEmbedder({
        apiKey: openaiKey,
        baseUrl: 'https://api.openai.com/v1',
        model: DEFAULT_EMBEDDING_MODEL,
      });
    }

    return null;
  } catch {
    return null;
  }
}
