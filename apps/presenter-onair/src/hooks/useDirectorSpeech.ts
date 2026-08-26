import type { VoiceBeatOverrides } from '@ssreporter/director';
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

function voiceOverridesToOptions(
  settings: AppSettings,
  overrides?: VoiceBeatOverrides,
): Record<string, unknown> | null {
  if (!overrides) {
    return null;
  }

  const patch: Record<string, unknown> = {};

  if (overrides.speed != null && !Number.isNaN(overrides.speed)) {
    if (settings.tts.engine === 'openaiCompatible') {
      patch.openAiCompatibleSpeed = overrides.speed;
    }
    if (settings.tts.engine === 'elevenLabs') {
      patch.elevenLabsSpeed = overrides.speed;
    }
    if (settings.tts.engine === 'unrealSpeech') {
      patch.unrealSpeechSpeed = overrides.speed;
    }
    if (settings.tts.engine === 'inworld') {
      patch.inworldSpeakingRate = overrides.speed;
    }
    if (settings.tts.engine === 'piperPlus') {
      patch.piperPlusSpeed = overrides.speed;
    }
    if (settings.tts.engine === 'webSpeech') {
      patch.webSpeechRate = overrides.speed;
    }
  }

  if (overrides.pitch != null && !Number.isNaN(overrides.pitch)) {
    if (settings.tts.engine === 'webSpeech') {
      patch.webSpeechPitch = overrides.pitch;
    }
    if (settings.tts.engine === 'unrealSpeech') {
      patch.unrealSpeechPitch = overrides.pitch;
    }
  }

  if (overrides.style_hint?.trim() && settings.tts.engine === 'geminiTts') {
    patch.geminiTtsPrompt = overrides.style_hint.trim();
  }

  return Object.keys(patch).length > 0 ? patch : null;
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
  }, [settings.tts, ttsApiKey]);

  const speak = useCallback(
    async (text: string, voiceOverrides?: VoiceBeatOverrides) => {
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

      const patch = voiceOverridesToOptions(settings, voiceOverrides);
      const previousOptions = patch ? voiceService.getOptions() : null;
      const restoreEntries = patch
        ? Object.keys(patch).map((key) => [
            key,
            (previousOptions as Record<string, unknown>)[key],
          ])
        : [];

      if (patch) {
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
    [settings],
  );

  return {
    speak,
    supportsLipSync,
    engine: settings.tts.engine,
  };
}
