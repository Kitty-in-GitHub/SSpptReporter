import { VoiceEngineAdapter } from '@aituber-onair/core';
import { useCallback, useEffect, useRef } from 'react';
import {
  buildVoiceOptions,
  getDirectorSpeechConfigError,
  getTtsApiKey,
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
  }, [
    settings.tts,
    ttsApiKey,
  ]);

  const speak = useCallback(
    async (text: string) => {
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

      const voiceService = voiceServiceRef.current;
      if (!voiceService) {
        throw new Error('TTS 未初始化，请检查设置中的引擎配置');
      }

      await voiceService.speakText(trimmed);
    },
    [settings],
  );

  return {
    speak,
    supportsLipSync,
    engine: settings.tts.engine,
  };
}
