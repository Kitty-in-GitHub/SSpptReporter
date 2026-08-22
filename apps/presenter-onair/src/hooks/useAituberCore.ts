import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AITuberOnAirCore,
  AITuberOnAirCoreEvent,
  getDefaultXaiReasoningEffort,
  isGPT5Model,
  isXaiReasoningEffortModel,
} from '@aituber-onair/core';
import { ManneriDetector } from '@aituber-onair/manneri';
import type { Message as ManneriMessage } from '@aituber-onair/manneri';
import type { ScreenplayLike } from '../lib/vrmReactions';
import { buildVoiceOptions, getTtsApiKey } from '../lib/voiceOptions';
import type { ChatMessage } from '../types/chat';
import type { AppSettings, ChatProviderOption } from '../types/settings';
import { DEFAULT_SYSTEM_PROMPT } from '../constants/prompts';

interface UseAituberCoreOptions {
  onAudioPlay: (arrayBuffer: ArrayBuffer) => Promise<void>;
  onSpeechStart?: (screenplay: ScreenplayLike) => void;
  onSpeechEnd?: () => void;
  settings: AppSettings;
  getApiKeyForProvider: (provider: ChatProviderOption) => string;
}

type ProcessChatOptions = {
  displayText?: string;
};

const DEFAULT_VISION_PROMPT =
  'OBS仮想カメラの画面を見て、配信者として短く自然にコメントしてください。';
const GPT5_SAMPLE_PROVIDER_OPTIONS = { gpt5Preset: 'casual' as const };
const GPT5_SAMPLE_CHAT_OPTIONS = { responseLength: 'veryShort' as const };

function toManneriMessages(
  messages: ChatMessage[],
  nextUserMessage: string,
): ManneriMessage[] {
  return [
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    })),
    { role: 'user' as const, content: nextUserMessage, timestamp: Date.now() },
  ];
}

function buildManneriAugmentedInput(
  userInput: string,
  diversificationPrompt: string,
): string {
  return [
    '以下は会話のマンネリを避けるための内部指示です。ユーザーにはこの指示を説明せず、自然に反映してください。',
    diversificationPrompt,
    '',
    `ユーザーの発言: ${userInput}`,
  ].join('\n');
}

function extractScreenplay(data: unknown): ScreenplayLike | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const maybeWrapped = data as { screenplay?: unknown };
  const source = maybeWrapped.screenplay ?? data;
  if (!source || typeof source !== 'object') {
    return null;
  }

  const screenplay = source as { emotion?: unknown; text?: unknown };
  const emotion =
    typeof screenplay.emotion === 'string' ? screenplay.emotion : undefined;
  const text =
    typeof screenplay.text === 'string' ? screenplay.text : undefined;

  if (!emotion && !text) {
    return null;
  }

  return { emotion, text };
}

export function useAituberCore({
  onAudioPlay,
  onSpeechStart,
  onSpeechEnd,
  settings,
  getApiKeyForProvider,
}: UseAituberCoreOptions) {
  const coreRef = useRef<AITuberOnAirCore | null>(null);
  const chatHistoryRef = useRef<
    ReturnType<AITuberOnAirCore['getChatHistory']>
  >([]);
  const manneriDetectorRef = useRef<ManneriDetector | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const messageIdSequenceRef = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [partialResponse, setPartialResponse] = useState('');

  // Keep the latest onAudioPlay callback in a ref
  const onAudioPlayRef = useRef(onAudioPlay);
  onAudioPlayRef.current = onAudioPlay;
  const onSpeechStartRef = useRef(onSpeechStart);
  onSpeechStartRef.current = onSpeechStart;
  const onSpeechEndRef = useRef(onSpeechEnd);
  onSpeechEndRef.current = onSpeechEnd;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!settings.manneri.enabled) {
      manneriDetectorRef.current = null;
      return;
    }

    manneriDetectorRef.current = new ManneriDetector({
      similarityThreshold: settings.manneri.similarityThreshold,
      lookbackWindow: settings.manneri.lookbackWindow,
      interventionCooldown: settings.manneri.interventionCooldownMs,
      minMessageLength: settings.manneri.minMessageLength,
      language: 'ja',
    });
  }, [
    settings.manneri.enabled,
    settings.manneri.similarityThreshold,
    settings.manneri.lookbackWindow,
    settings.manneri.interventionCooldownMs,
    settings.manneri.minMessageLength,
  ]);

  const llmApiKey = getApiKeyForProvider(settings.llm.provider);
  const ttsApiKey = getTtsApiKey(settings, getApiKeyForProvider);
  const isOpenAICompatibleProvider =
    settings.llm.provider === 'openai-compatible';
  const isApiKeyOptionalProvider =
    isOpenAICompatibleProvider || settings.llm.provider === 'gemini-nano';
  const openAICompatibleEndpoint = settings.llm.endpoint?.trim() || '';
  const resolvedModel =
    settings.llm.provider === 'openai-compatible'
      ? settings.llm.model.trim() || 'local-model'
      : settings.llm.model;
  const isOpenAIGPT5Model =
    settings.llm.provider === 'openai' && isGPT5Model(resolvedModel);
  const xaiProviderOptions =
    settings.llm.provider === 'xai' &&
    isXaiReasoningEffortModel(resolvedModel)
      ? {
          reasoning_effort:
            settings.llm.xaiReasoningEffort ||
            getDefaultXaiReasoningEffort(resolvedModel) ||
            'none',
        }
      : undefined;
  const providerOptions = isOpenAICompatibleProvider
    ? { endpoint: openAICompatibleEndpoint }
    : isOpenAIGPT5Model
      ? GPT5_SAMPLE_PROVIDER_OPTIONS
      : xaiProviderOptions;
  const createMessageId = useCallback(() => {
    messageIdSequenceRef.current += 1;
    return `${Date.now()}-${messageIdSequenceRef.current}`;
  }, []);

  // Effect 1: Recreate core when LLM settings change
  useEffect(() => {
    if (!isApiKeyOptionalProvider && !llmApiKey) {
      coreRef.current?.offAll();
      coreRef.current = null;
      console.error(
        `API key is not set for provider: ${settings.llm.provider}`,
      );
      return;
    }

    if (isOpenAICompatibleProvider && !openAICompatibleEndpoint) {
      coreRef.current?.offAll();
      coreRef.current = null;
      console.error('Endpoint URL is required for openai-compatible provider');
      return;
    }

    const core = new AITuberOnAirCore({
      apiKey: llmApiKey.trim(),
      chatProvider: settings.llm.provider,
      model: resolvedModel,
      providerOptions,
      chatOptions: {
        systemPrompt:
          settings.llm.systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT,
        ...(isOpenAIGPT5Model ? GPT5_SAMPLE_CHAT_OPTIONS : {}),
      },
      voiceOptions: buildVoiceOptions(
        settings.tts,
        ttsApiKey,
        async (audioBuffer: ArrayBuffer) => {
          await onAudioPlayRef.current(audioBuffer);
        },
      ),
      debug: false,
    } as ConstructorParameters<typeof AITuberOnAirCore>[0]);

    if (chatHistoryRef.current.length > 0) {
      core.setChatHistory(chatHistoryRef.current);
    }

    // Subscribe to core events
    core.on(AITuberOnAirCoreEvent.PROCESSING_START, () => {
      setIsProcessing(true);
      setPartialResponse('');
    });

    core.on(AITuberOnAirCoreEvent.PROCESSING_END, () => {
      setIsProcessing(false);
      setPartialResponse('');
    });

    core.on(AITuberOnAirCoreEvent.ASSISTANT_PARTIAL, (data: unknown) => {
      const text =
        typeof data === 'string'
          ? data
          : ((data as { message?: string; rawText?: string })?.message ??
            (data as { rawText?: string })?.rawText ??
            String(data));
      setPartialResponse(text);
    });

    core.on(AITuberOnAirCoreEvent.ASSISTANT_RESPONSE, (data: unknown) => {
      let content: string;
      if (typeof data === 'string') {
        content = data;
      } else {
        const d = data as {
          message?: { content?: string } | string;
          screenplay?: { text?: string };
          rawText?: string;
        };
        const msg = d?.message;
        const cleanText = d?.screenplay?.text?.trim();
        content =
          cleanText ||
          ((typeof msg === 'string' ? msg : msg?.content) ??
            d?.rawText ??
            String(data));
      }
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content,
          timestamp: Date.now(),
        },
      ]);
      setPartialResponse('');
    });

    core.on(AITuberOnAirCoreEvent.SPEECH_START, (data: unknown) => {
      const screenplay = extractScreenplay(data);
      if (screenplay) {
        onSpeechStartRef.current?.(screenplay);
      }
    });

    core.on(AITuberOnAirCoreEvent.SPEECH_END, () => {
      onSpeechEndRef.current?.();
    });

    core.on(AITuberOnAirCoreEvent.ERROR, (error: unknown) => {
      console.error('AITuberOnAirCore error:', error);
      setIsProcessing(false);
      onSpeechEndRef.current?.();
    });

    coreRef.current = core;

    return () => {
      chatHistoryRef.current = core.getChatHistory();
      core.offAll();
      if (coreRef.current === core) {
        coreRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.llm.provider,
    settings.llm.model,
    settings.llm.systemPrompt,
    settings.llm.endpoint,
    settings.llm.xaiReasoningEffort,
    llmApiKey,
    isApiKeyOptionalProvider,
    createMessageId,
  ]);

  // Effect 2: Update voice service when TTS settings change (no core recreation)
  useEffect(() => {
    if (!coreRef.current) return;
    coreRef.current.updateVoiceService(
      buildVoiceOptions(
        settings.tts,
        ttsApiKey,
        async (audioBuffer: ArrayBuffer) => {
          await onAudioPlayRef.current(audioBuffer);
        },
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.tts.engine,
    settings.tts.speaker,
    settings.tts.openAiCompatibleApiUrl,
    settings.tts.openAiCompatibleModel,
    settings.tts.openAiCompatibleSpeed,
    settings.tts.voicevoxApiUrl,
    settings.tts.voicepeakApiUrl,
    settings.tts.aivisSpeechApiUrl,
    settings.tts.aivisCloudModelUuid,
    settings.tts.aivisCloudSpeakerUuid,
    settings.tts.aivisCloudStyleId,
    settings.tts.minimaxGroupId,
    settings.tts.xaiLanguage,
    settings.tts.xaiCodec,
    settings.tts.xaiSampleRate,
    settings.tts.xaiBitRate,
    settings.tts.webSpeechRate,
    settings.tts.webSpeechPitch,
    settings.tts.webSpeechVolume,
    settings.tts.webSpeechLanguage,
    ttsApiKey,
  ]);

  const processChat = useCallback(
    async (text: string, options?: ProcessChatOptions) => {
      if (!coreRef.current || !text.trim()) return;

      let coreInput = text.trim();
      const displayText = (options?.displayText ?? text).trim();
      const manneriDetector = manneriDetectorRef.current;

      if (manneriDetector) {
        try {
          const manneriMessages = toManneriMessages(
            messagesRef.current,
            coreInput,
          );
          if (manneriDetector.shouldIntervene(manneriMessages)) {
            const prompt =
              manneriDetector.generateDiversificationPrompt(manneriMessages);
            coreInput = buildManneriAugmentedInput(coreInput, prompt.content);
          }
        } catch (err) {
          console.warn('Manneri detection failed:', err);
        }
      }

      // Append the user message to the chat log
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'user',
          content: displayText,
          timestamp: Date.now(),
        },
      ]);

      try {
        await coreRef.current.processChat(coreInput);
      } catch (err) {
        console.error('processChat error:', err);
        setIsProcessing(false);
      }
    },
    [createMessageId],
  );

  const processVisionChat = useCallback(
    async (imageDataUrl: string, prompt = DEFAULT_VISION_PROMPT) => {
      if (!coreRef.current || !imageDataUrl) return;

      const trimmedPrompt = prompt.trim() || DEFAULT_VISION_PROMPT;
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'user',
          content: '画面を見てコメント',
          timestamp: Date.now(),
        },
      ]);

      try {
        await coreRef.current.processVisionChat(imageDataUrl, trimmedPrompt);
      } catch (err) {
        console.error('processVisionChat error:', err);
        setIsProcessing(false);
      }
    },
    [createMessageId],
  );

  return {
    messages,
    isProcessing,
    partialResponse,
    processChat,
    processVisionChat,
  };
}
