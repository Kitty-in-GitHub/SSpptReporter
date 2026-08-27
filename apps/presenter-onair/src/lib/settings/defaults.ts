import { AITuberOnAirCore } from '@aituber-onair/core';
import { DEFAULT_SCREEN_VISION_PROMPT, DEFAULT_SYSTEM_PROMPT } from '../../constants/prompts';
import {
  DEFAULT_PRESENT_SETTINGS,
  normalizePresentSettings,
} from '../../types/present';
import type {
  AppSettings,
  ChatProviderOption,
  TTSEngineOption,
  VrmCameraFraming,
} from '../../types/settings';
import {
  DEFAULT_VRM_CAMERA_FRAMING,
  normalizeVrmCameraFraming,
} from '../../types/settings';
import { normalizeEmotionEffectAnchors } from '../emotionEffectAnchor';
import { DEFAULT_VRM_MODEL_ID, normalizeVrmModelSelection } from '../vrm/vrmModelCatalog';
import {
  DEFAULT_VRM_EMOTION_EFFECT_MAP,
  isVrmReactionControlMode,
  normalizeVrmEmotionEffectMap,
} from '../vrmReactions';
import {
  DEFAULT_AIVIS_SPEECH_API_URL,
  DEFAULT_EDGE_TTS_API_URL,
  DEFAULT_EDGE_TTS_MODEL,
  DEFAULT_EDGE_TTS_VOICE,
  DEFAULT_VOICEVOX_API_URL,
  DEFAULT_VOICEPEAK_API_URL,
  resolveOpenAiCompatibleApiUrl,
} from '../voiceOptions';
import {
  DEFAULT_AIVIS_CLOUD_MODEL_UUID,
  DEFAULT_ELEVENLABS_MODEL,
  DEFAULT_ELEVENLABS_OUTPUT_FORMAT,
  DEFAULT_ELEVENLABS_TTS_ENDPOINT,
  DEFAULT_GEMINI_TTS_LANGUAGE_CODE,
  DEFAULT_GEMINI_TTS_MODEL,
  DEFAULT_GRADIUM_OUTPUT_FORMAT,
  DEFAULT_GRADIUM_TTS_ENDPOINT,
  DEFAULT_INWORLD_AUDIO_ENCODING,
  DEFAULT_INWORLD_LANGUAGE,
  DEFAULT_INWORLD_MODEL,
  DEFAULT_INWORLD_SAMPLE_RATE_HERTZ,
  DEFAULT_INWORLD_TTS_ENDPOINT,
  DEFAULT_OPENAI_COMPATIBLE_ENDPOINT,
  DEFAULT_OPENROUTER_MAX_CANDIDATES,
  DEFAULT_PIPER_PLUS_BASE_PATH,
  DEFAULT_PIPER_PLUS_MODEL_CONFIG_FILE,
  DEFAULT_PIPER_PLUS_MODEL_FILE,
  DEFAULT_PIPER_PLUS_VOICE_FILE,
  DEFAULT_UNREAL_SPEECH_TTS_ENDPOINT,
} from './constants';

export function getOrderedModels(provider: ChatProviderOption): string[] {
  const models = AITuberOnAirCore.getSupportedModels(provider);
  if (provider === 'claude') {
    return [...models].reverse();
  }
  return models;
}

export function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.floor(value));
}

export function normalizeModelIds(modelIds: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const modelId of modelIds) {
    const trimmed = modelId.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function mergeModelIds(base: string[], extras: string[]): string[] {
  const merged = [...base];
  const seen = new Set(base);

  for (const modelId of extras) {
    const trimmed = modelId.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    merged.push(trimmed);
  }

  return merged;
}

export function normalizeOpenRouterDynamicFreeModels(
  value: AppSettings['llm']['openRouterDynamicFreeModels'] | undefined,
): NonNullable<AppSettings['llm']['openRouterDynamicFreeModels']> {
  return {
    models: normalizeModelIds(value?.models || []),
    fetchedAt:
      typeof value?.fetchedAt === 'number' && Number.isFinite(value.fetchedAt)
        ? value.fetchedAt
        : 0,
    maxCandidates: normalizePositiveInteger(
      value?.maxCandidates,
      DEFAULT_OPENROUTER_MAX_CANDIDATES,
    ),
  };
}

export function getDefaultSettings(): AppSettings {
  return {
    llm: {
      provider: 'openai',
      model: 'gpt-4.1-nano',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      endpoint: DEFAULT_OPENAI_COMPATIBLE_ENDPOINT,
      xaiReasoningEffort: 'none',
      apiKeys: {
        openai: '',
        'openai-compatible': '',
        openrouter: '',
        gemini: '',
        claude: '',
        zai: '',
        kimi: '',
        xai: '',
        deepseek: '',
        mistral: '',
        sakana: '',
        plamo: '',
      },
      openRouterDynamicFreeModels: {
        models: [],
        fetchedAt: 0,
        maxCandidates: DEFAULT_OPENROUTER_MAX_CANDIDATES,
      },
    },
    tts: {
      engine: 'openaiCompatible' as TTSEngineOption,
      speaker: DEFAULT_EDGE_TTS_VOICE,
      openAiCompatibleApiKey: '',
      openAiCompatibleApiUrl: DEFAULT_EDGE_TTS_API_URL,
      openAiCompatibleModel: DEFAULT_EDGE_TTS_MODEL,
      openAiCompatibleSpeed: '',
      geminiTtsModel: DEFAULT_GEMINI_TTS_MODEL,
      geminiTtsLanguageCode: DEFAULT_GEMINI_TTS_LANGUAGE_CODE,
      geminiTtsPrompt: '',
      aivisCloudApiKey: '',
      aivisCloudModelUuid: DEFAULT_AIVIS_CLOUD_MODEL_UUID,
      aivisCloudSpeakerUuid: '',
      aivisCloudStyleId: '',
      minimaxApiKey: '',
      minimaxGroupId: '',
      xaiLanguage: 'auto',
      xaiCodec: 'mp3',
      xaiSampleRate: 24000,
      xaiBitRate: 128000,
      unrealSpeechApiKey: '',
      unrealSpeechApiUrl: DEFAULT_UNREAL_SPEECH_TTS_ENDPOINT,
      unrealSpeechBitrate: '192k',
      unrealSpeechSpeed: '',
      unrealSpeechPitch: '',
      unrealSpeechCodec: 'libmp3lame',
      unrealSpeechTemperature: '',
      elevenLabsApiKey: '',
      elevenLabsApiUrl: DEFAULT_ELEVENLABS_TTS_ENDPOINT,
      elevenLabsModel: DEFAULT_ELEVENLABS_MODEL,
      elevenLabsOutputFormat: DEFAULT_ELEVENLABS_OUTPUT_FORMAT,
      elevenLabsLanguageCode: '',
      elevenLabsStability: '',
      elevenLabsSimilarityBoost: '',
      elevenLabsStyle: '',
      elevenLabsUseSpeakerBoost: 'default',
      elevenLabsSpeed: '',
      elevenLabsSeed: '',
      elevenLabsApplyTextNormalization: 'default',
      inworldApiKey: '',
      inworldApiUrl: DEFAULT_INWORLD_TTS_ENDPOINT,
      inworldModel: DEFAULT_INWORLD_MODEL,
      inworldAudioEncoding: DEFAULT_INWORLD_AUDIO_ENCODING,
      inworldSampleRateHertz: DEFAULT_INWORLD_SAMPLE_RATE_HERTZ,
      inworldBitRate: '',
      inworldSpeakingRate: '',
      inworldLanguage: DEFAULT_INWORLD_LANGUAGE,
      inworldDeliveryMode: 'default',
      inworldTemperature: '',
      gradiumApiKey: '',
      gradiumApiUrl: DEFAULT_GRADIUM_TTS_ENDPOINT,
      gradiumOutputFormat: DEFAULT_GRADIUM_OUTPUT_FORMAT,
      gradiumTemperature: '',
      gradiumVoiceSimilarity: '',
      gradiumPaddingBonus: '',
      gradiumRewriteRules: '',
      piperPlusBasePath: DEFAULT_PIPER_PLUS_BASE_PATH,
      piperPlusModelConfigFile: DEFAULT_PIPER_PLUS_MODEL_CONFIG_FILE,
      piperPlusModelFile: DEFAULT_PIPER_PLUS_MODEL_FILE,
      piperPlusVoiceFile: DEFAULT_PIPER_PLUS_VOICE_FILE,
      piperPlusSpeed: '',
      piperPlusNoiseScale: '',
      voicevoxApiUrl: DEFAULT_VOICEVOX_API_URL,
      aivisSpeechApiUrl: DEFAULT_AIVIS_SPEECH_API_URL,
      voicepeakApiUrl: DEFAULT_VOICEPEAK_API_URL,
      webSpeechRate: '1',
      webSpeechPitch: '1',
      webSpeechVolume: '1',
      webSpeechLanguage: 'ja-JP',
    },
    visual: {
      backgroundMode: 'default',
      layoutMode: 'chat',
      showInputInBroadcast: false,
      vrmModelSource: 'builtin',
      vrmModelId: DEFAULT_VRM_MODEL_ID,
      vrmCameraFraming: { ...DEFAULT_VRM_CAMERA_FRAMING },
      vrmEmotionEffectAnchors: {},
      vrmReactionControlMode: 'none',
      vrmEmotionEffectMap: { ...DEFAULT_VRM_EMOTION_EFFECT_MAP },
    },
    present: { ...DEFAULT_PRESENT_SETTINGS },
    screenVision: {
      deviceId: '',
      prompt: DEFAULT_SCREEN_VISION_PROMPT,
      autoIntervalMs: 0,
      enabled: false,
    },
    stream: {
      platform: 'none',
      youtubeApiKey: '',
      youtubeLiveId: '',
      youtubeEnabled: false,
      youtubeCommentIntervalMs: 20_000,
      twitchClientId: '',
      twitchAccessToken: '',
      twitchChannel: '',
      twitchEnabled: false,
      twitchCommentIntervalMs: 20_000,
    },
    commentIntelligence: {
      enabled: true,
      mode: 'rules',
      useSameLLMSettings: true,
      streamTopic: '',
      streamTitle: '',
      topicFilter: 'prefer',
      maxCommentsPerBatch: 50,
      analysisIntervalMs: 1000,
      minCommentsForLLMAnalysis: 8,
      blockHighRiskViewers: true,
      viewerBlockDurationMs: 10 * 60 * 1000,
    },
    manneri: {
      enabled: true,
      similarityThreshold: 0.75,
      lookbackWindow: 10,
      interventionCooldownMs: 5 * 60 * 1000,
      minMessageLength: 10,
    },
  };
}

export function normalizeTtsSettings(
  saved: Partial<AppSettings['tts']> | undefined,
  defaults: AppSettings['tts'],
): AppSettings['tts'] {
  const merged = { ...defaults, ...saved };
  if (merged.engine === 'openaiCompatible') {
    merged.openAiCompatibleApiUrl = resolveOpenAiCompatibleApiUrl(
      merged.openAiCompatibleApiUrl,
    );
    if (!merged.openAiCompatibleModel?.trim()) {
      merged.openAiCompatibleModel = DEFAULT_EDGE_TTS_MODEL;
    }
    if (!merged.speaker?.trim()) {
      merged.speaker = DEFAULT_EDGE_TTS_VOICE;
    }
  }
  return merged;
}

export function normalizeSavedVrmCameraFraming(
  savedVisual: Partial<AppSettings['visual']> | undefined,
): VrmCameraFraming {
  const legacyZoom = (savedVisual as { vrmFramingZoom?: number } | undefined)
    ?.vrmFramingZoom;
  return normalizeVrmCameraFraming({
    ...savedVisual?.vrmCameraFraming,
    zoom: savedVisual?.vrmCameraFraming?.zoom ?? legacyZoom,
  });
}

export function mergeLoadedSettings(saved: Partial<AppSettings>): AppSettings {
  const defaults = getDefaultSettings();
  return {
    llm: {
      ...defaults.llm,
      ...saved.llm,
      apiKeys: { ...defaults.llm.apiKeys, ...saved.llm?.apiKeys },
      openRouterDynamicFreeModels: normalizeOpenRouterDynamicFreeModels(
        saved.llm?.openRouterDynamicFreeModels,
      ),
    },
    tts: normalizeTtsSettings(saved.tts, defaults.tts),
    visual: {
      ...defaults.visual,
      ...saved.visual,
      backgroundMode:
        saved.visual?.backgroundMode === 'green' ||
        saved.visual?.backgroundMode === 'transparent'
          ? saved.visual.backgroundMode
          : defaults.visual.backgroundMode,
      ...normalizeVrmModelSelection(
        saved.visual?.vrmModelSource,
        saved.visual?.vrmModelId,
      ),
      vrmCameraFraming: normalizeSavedVrmCameraFraming(saved.visual),
      vrmEmotionEffectAnchors: normalizeEmotionEffectAnchors(
        saved.visual?.vrmEmotionEffectAnchors,
      ),
      vrmReactionControlMode: isVrmReactionControlMode(
        saved.visual?.vrmReactionControlMode,
      )
        ? saved.visual.vrmReactionControlMode
        : defaults.visual.vrmReactionControlMode,
      vrmEmotionEffectMap: normalizeVrmEmotionEffectMap(
        saved.visual?.vrmEmotionEffectMap,
      ),
    },
    present: normalizePresentSettings(saved.present),
    screenVision: { ...defaults.screenVision, ...saved.screenVision },
    stream: { ...defaults.stream, ...saved.stream },
    commentIntelligence: {
      ...defaults.commentIntelligence,
      ...saved.commentIntelligence,
    },
    manneri: { ...defaults.manneri, ...saved.manneri },
  };
}
