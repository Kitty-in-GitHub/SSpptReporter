import type { DirectorAction } from '@ssreporter/director';
import {
  answerQuestion,
  type AnswerQuestionResult,
  type BrainEmbedder,
  type BrainKnowledge,
  type BrainVectorIndex,
} from '@ssreporter/brain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveBrainEmbedder } from '../lib/brain/createBrainEmbedder';
import { createBrainLlmClient } from '../lib/brain/createBrainLlmClient';
import { loadBrainKnowledgeForDeck } from '../lib/content/loadBrainKnowledge';
import type { AppSettings, ChatProviderOption } from '../types/settings';

export interface UseBrainQaOptions {
  deckId: string;
  currentSlidePage: number;
  llmSettings: AppSettings['llm'];
  getApiKeyForProvider: (provider: ChatProviderOption) => string;
}

export function useBrainQa({
  deckId,
  currentSlidePage,
  llmSettings,
  getApiKeyForProvider,
}: UseBrainQaOptions) {
  const [knowledgeReady, setKnowledgeReady] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnswerQuestionResult | null>(
    null,
  );

  const knowledgeRef = useRef<BrainKnowledge | null>(null);
  const vectorIndexRef = useRef<BrainVectorIndex | null>(null);
  const embedderRef = useRef<BrainEmbedder | null>(null);

  useEffect(() => {
    let cancelled = false;
    setKnowledgeReady(false);
    setKnowledgeError(null);
    knowledgeRef.current = null;
    vectorIndexRef.current = null;
    embedderRef.current = null;

    void Promise.all([
      loadBrainKnowledgeForDeck(deckId),
      resolveBrainEmbedder(llmSettings, getApiKeyForProvider),
    ])
      .then(([{ knowledge, vectorIndex }, embedder]) => {
        if (!cancelled) {
          knowledgeRef.current = knowledge;
          vectorIndexRef.current = vectorIndex;
          embedderRef.current = embedder;
          setKnowledgeReady(true);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setKnowledgeError(
            loadError instanceof Error
              ? loadError.message
              : '知识库加载失败',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deckId, getApiKeyForProvider, llmSettings]);

  const askQuestion = useCallback(
    async (question: string): Promise<DirectorAction | null> => {
      const trimmed = question.trim();
      if (!trimmed) {
        return null;
      }

      if (!knowledgeRef.current) {
        setError(knowledgeError ?? '知识库尚未加载');
        return null;
      }

      const llm = createBrainLlmClient(llmSettings, getApiKeyForProvider);
      if (!llm) {
        setError('请先在设置中配置 LLM API Key（gemini-nano 除外）');
        return null;
      }

      let embedder = embedderRef.current;
      if (!embedder) {
        embedder = await resolveBrainEmbedder(llmSettings, getApiKeyForProvider);
        embedderRef.current = embedder;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await answerQuestion({
          question: trimmed,
          currentSlidePage,
          deckId,
          knowledge: knowledgeRef.current,
          llm,
          embedder: embedder ?? undefined,
          vectorIndex: vectorIndexRef.current,
        });
        if (result.vectorIndex) {
          vectorIndexRef.current = result.vectorIndex;
        }
        setLastResult(result);
        return result.action;
      } catch (askError) {
        setError(
          askError instanceof Error ? askError.message : '提问失败',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      currentSlidePage,
      deckId,
      getApiKeyForProvider,
      knowledgeError,
      knowledgeReady,
      llmSettings,
    ],
  );

  return {
    askQuestion,
    loading,
    knowledgeError,
    knowledgeReady,
    error,
    lastResult,
  };
}
