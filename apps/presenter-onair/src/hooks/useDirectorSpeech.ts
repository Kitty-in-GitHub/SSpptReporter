import type { VoiceDirective } from '@ssreporter/director';
import { VoiceEngineAdapter } from '@aituber-onair/core';
import { useCallback, useEffect, useRef } from 'react';
import {
  prepareUtterance,
  resolveEdgeGatewayUrl,
  speakPreparedEdgeUtterance,
  type TtsEngineId,
} from '../lib/tts';
import {
  buildVoiceOptions,
  DEFAULT_EDGE_TTS_MODEL,
  DEFAULT_EDGE_TTS_VOICE,
  getDirectorSpeechConfigError,
  getTtsApiKey,
  resolveOpenAiCompatibleApiUrl,
  supportsDirectorLipSync,
} from '../lib/voiceOptions';
import type { AppSettings, ChatProviderOption } from '../types/settings';

interface UseDirectorSpeechOptions {
  settings: AppSettings;
  getApiKeyForProvider: (provider: ChatProviderOption) => string;
  onPlay: (audioBuffer: ArrayBuffer) => Promise<void>;
}

export function useDirectorSpeech({
  settings,
  getApiKeyForProvider,
  onPlay,
}: UseDirectorSpeechOptions) {
  const voiceServiceRef = useRef<VoiceEngineAdapter | null>(null);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;
  const getApiKeyRef = useRef(getApiKeyForProvider);
  getApiKeyRef.current = getApiKeyForProvider;
  const warnedRef = useRef<Set<string>>(new Set());

  const ttsApiKey = getTtsApiKey(settings, getApiKeyForProvider);
  const supportsLipSync = supportsDirectorLipSync(settings.tts.engine);

  useEffect(() => {
    if (settings.tts.engine === 'none') {
      voiceServiceRef.current = null;
      return;
    }

    const voiceService = new VoiceEngineAdapter(
      buildVoiceOptions(settings.tts, ttsApiKey, async (audioBuffer) => {
        await onPlayRef.current(audioBuffer);
      }),
    );
    voiceServiceRef.current = voiceService;

    return () => {
      if (voiceServiceRef.current === voiceService) {
        voiceServiceRef.current = null;
      }
    };
  }, [settings.tts, ttsApiKey]);

  const speak = useCallback(
    async (text: string, directive?: VoiceDirective) => {
      const configError = getDirectorSpeechConfigError(
        settings,
        getApiKeyRef.current,
      );
      if (configError) {
        throw new Error(configError);
      }

      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const engineId = settings.tts.engine as TtsEngineId;
      const prepared = prepareUtterance(
        engineId,
        trimmed,
        directive ?? {},
        {
          defaultSpeaker:
            settings.tts.speaker.trim() || DEFAULT_EDGE_TTS_VOICE,
          defaultModel:
            settings.tts.openAiCompatibleModel?.trim() ||
            DEFAULT_EDGE_TTS_MODEL,
          defaultRate: Number.parseFloat(settings.tts.openAiCompatibleSpeed || '') ||
            1,
        },
      );

      for (const warning of prepared.warnings) {
        if (!warnedRef.current.has(warning)) {
          console.info(`[TTS] ${warning}`);
          warnedRef.current.add(warning);
        }
      }

      if (engineId === 'openaiCompatible') {
        await speakPreparedEdgeUtterance(
          prepared.segments,
          async (audioBuffer) => {
            await onPlayRef.current(audioBuffer);
          },
          {
            apiUrl: resolveEdgeGatewayUrl(
              resolveOpenAiCompatibleApiUrl(settings.tts.openAiCompatibleApiUrl),
            ),
            apiKey: settings.tts.openAiCompatibleApiKey || ttsApiKey,
          },
        );
        return;
      }

      const voiceService = voiceServiceRef.current;
      if (!voiceService) {
        throw new Error('TTS 未初始化，请检查设置中的引擎配置');
      }

      const patch = prepared.legacyVoicePatch;
      const previousOptions = patch ? voiceService.getOptions() : null;
      const restoreEntries = patch
        ? Object.keys(patch).map((key) => [
            key,
            (previousOptions as unknown as Record<string, unknown>)[key],
          ])
        : [];

      if (patch && Object.keys(patch).length > 0) {
        voiceService.updateOptions(patch);
      }

      try {
        await voiceService.speakText(trimmed);
      } finally {
        if (patch && restoreEntries.length > 0) {
          voiceService.updateOptions(Object.fromEntries(restoreEntries));
        }
      }
    },
    [settings, ttsApiKey],
  );

  return {
    speak,
    supportsLipSync,
    engine: settings.tts.engine,
  };
}
