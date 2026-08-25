import {
  DEFAULT_EMBEDDING_MODEL,
  type BrainEmbedder,
} from "./embedTypes.js";

export interface OpenAiCompatibleEmbedderOptions {
  apiKey: string;
  /** e.g. https://api.openai.com/v1 */
  baseUrl: string;
  model?: string;
  /** Optional fetch override (tests) */
  fetchImpl?: typeof fetch;
}

/**
 * OpenAI-compatible embeddings client (official /v1/embeddings shape).
 * Uses fetch only — no LangChain.
 */
export function createOpenAiCompatibleEmbedder(
  options: OpenAiCompatibleEmbedderOptions,
): BrainEmbedder {
  const model = options.model?.trim() || DEFAULT_EMBEDDING_MODEL;
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const apiKey = options.apiKey.trim();
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!apiKey) {
    throw new Error("Embedding API Key 不能为空");
  }
  if (!baseUrl) {
    throw new Error("Embedding baseUrl 不能为空");
  }

  return {
    model,
    async embedTexts(texts: string[]): Promise<number[][]> {
      const cleaned = texts.map((text) => text.trim()).filter(Boolean);
      if (cleaned.length === 0) {
        return [];
      }

      const response = await fetchImpl(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: cleaned,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: Array<{ embedding?: number[]; index?: number }>;
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ||
            `Embedding 请求失败（HTTP ${response.status}）`,
        );
      }

      const rows = payload?.data;
      if (!Array.isArray(rows) || rows.length !== cleaned.length) {
        throw new Error("Embedding 响应格式无效");
      }

      const sorted = [...rows].sort(
        (a, b) => (a.index ?? 0) - (b.index ?? 0),
      );
      return sorted.map((row) => {
        if (!Array.isArray(row.embedding) || row.embedding.length === 0) {
          throw new Error("Embedding 向量为空");
        }
        return row.embedding;
      });
    },
  };
}
