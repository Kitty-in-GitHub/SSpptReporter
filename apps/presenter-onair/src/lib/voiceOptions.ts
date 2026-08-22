import type {
  VoiceServiceOptions,
  ElevenLabsApplyTextNormalization,
  GradiumOutputFormat,
  InworldAudioEncoding,
  InworldDeliveryMode,
  UnrealSpeechCodec,
  XaiBitRate,
  XaiCodec,
  XaiSampleRate,
} from '@aituber-onair/core';
import type { AppSettings, ChatProviderOption, TTSEngineOption } from '../types/settings';

export const DEFAULT_VOICEVOX_API_URL = 'http://localhost:50021';
export const DEFAULT_AIVIS_SPEECH_API_URL = 'http://localhost:10101';
export const DEFAULT_VOICEPEAK_API_URL = 'http://localhost:20202';

/** Edge-TTS + openai-edge-tts 等本地 OpenAI 兼容网关（见 docs/tts-selection.md） */
export const DEFAULT_EDGE_TTS_API_URL =
  'http://127.0.0.1:5050/v1/audio/speech';
export const DEFAULT_EDGE_TTS_MODEL = 'tts-1';
export const DEFAULT_EDGE_TTS_VOICE = 'zh-CN-XiaoxiaoNeural';

export function resolveVoicevoxApiUrl(url?: string): string {
  return url?.trim() || DEFAULT_VOICEVOX_API_URL;
}

export function resolveAivisSpeechApiUrl(url?: string): string {
  return url?.trim() || DEFAULT_AIVIS_SPEECH_API_URL;
}

export function resolveVoicepeakApiUrl(url?: string): string {
  return url?.trim() || DEFAULT_VOICEPEAK_API_URL;
}
export function getTtsApiKey(
  settings: AppSettings,
  getApiKeyForProvider: (provider: ChatProviderOption) => string,
): string {
  if (settings.tts.engine === 'openai') {
    return getApiKeyForProvider('openai');
  }
  if (settings.tts.engine === 'geminiTts') {
    return getApiKeyForProvider('gemini');
  }
  if (settings.tts.engine === 'openaiCompatible') {
    return settings.tts.openAiCompatibleApiKey || '';
  }
  if (settings.tts.engine === 'aivisCloud') {
    return settings.tts.aivisCloudApiKey || '';
  }
  if (settings.tts.engine === 'minimax') {
    return settings.tts.minimaxApiKey || '';
  }
  if (settings.tts.engine === 'xai') {
    return getApiKeyForProvider('xai');
  }
  if (settings.tts.engine === 'unrealSpeech') {
    return settings.tts.unrealSpeechApiKey || '';
  }
  if (settings.tts.engine === 'elevenLabs') {
    return settings.tts.elevenLabsApiKey || '';
  }
  if (settings.tts.engine === 'inworld') {
    return settings.tts.inworldApiKey || '';
  }
  if (settings.tts.engine === 'gradium') {
    return settings.tts.gradiumApiKey || '';
  }
  return getApiKeyForProvider(settings.llm.provider);
}

export function buildVoiceOptions(
  tts: AppSettings['tts'],
  apiKey: string,
  onPlay: (audioBuffer: ArrayBuffer) => Promise<void>,
): VoiceServiceOptions {
  const parsedAivisCloudStyleId = Number.parseInt(
    tts.aivisCloudStyleId || '',
    10,
  );
  const parsedOpenAiCompatibleSpeed = Number.parseFloat(
    tts.openAiCompatibleSpeed || '',
  );
  const parsedXaiSampleRate = Number.parseInt(
    String(tts.xaiSampleRate || ''),
    10,
  );
  const parsedXaiBitRate = Number.parseInt(String(tts.xaiBitRate || ''), 10);
  const parsedUnrealSpeechSpeed = Number.parseFloat(
    tts.unrealSpeechSpeed || '',
  );
  const parsedUnrealSpeechPitch = Number.parseFloat(
    tts.unrealSpeechPitch || '',
  );
  const parsedUnrealSpeechTemperature = Number.parseFloat(
    tts.unrealSpeechTemperature || '',
  );
  const parsedElevenLabsStability = Number.parseFloat(
    tts.elevenLabsStability || '',
  );
  const parsedElevenLabsSimilarityBoost = Number.parseFloat(
    tts.elevenLabsSimilarityBoost || '',
  );
  const parsedElevenLabsStyle = Number.parseFloat(tts.elevenLabsStyle || '');
  const parsedElevenLabsSpeed = Number.parseFloat(tts.elevenLabsSpeed || '');
  const parsedElevenLabsSeed = Number.parseInt(tts.elevenLabsSeed || '', 10);
  const parsedInworldSampleRateHertz = Number.parseInt(
    tts.inworldSampleRateHertz || '',
    10,
  );
  const parsedInworldBitRate = Number.parseInt(tts.inworldBitRate || '', 10);
  const parsedInworldSpeakingRate = Number.parseFloat(
    tts.inworldSpeakingRate || '',
  );
  const parsedInworldTemperature = Number.parseFloat(
    tts.inworldTemperature || '',
  );
  const parsedGradiumTemperature = Number.parseFloat(
    tts.gradiumTemperature || '',
  );
  const parsedGradiumVoiceSimilarity = Number.parseFloat(
    tts.gradiumVoiceSimilarity || '',
  );
  const parsedGradiumPaddingBonus = Number.parseFloat(
    tts.gradiumPaddingBonus || '',
  );
  const parsedPiperPlusSpeed = Number.parseFloat(tts.piperPlusSpeed || '');
  const parsedPiperPlusNoiseScale = Number.parseFloat(
    tts.piperPlusNoiseScale || '',
  );
  const parsedWebSpeechRate = Number.parseFloat(tts.webSpeechRate || '');
  const parsedWebSpeechPitch = Number.parseFloat(tts.webSpeechPitch || '');
  const parsedWebSpeechVolume = Number.parseFloat(tts.webSpeechVolume || '');
  const trimmedSpeaker = tts.speaker.trim();

  return {
    engineType: tts.engine,
    speaker:
      tts.engine === 'openaiCompatible' && !trimmedSpeaker
        ? undefined
        : tts.speaker,
    apiKey,
    openAiCompatibleApiUrl: tts.openAiCompatibleApiUrl,
    openAiCompatibleModel: tts.openAiCompatibleModel,
    openAiCompatibleSpeed: Number.isNaN(parsedOpenAiCompatibleSpeed)
      ? undefined
      : parsedOpenAiCompatibleSpeed,
    geminiTtsModel: tts.geminiTtsModel,
    geminiTtsLanguageCode: tts.geminiTtsLanguageCode?.trim() || undefined,
    geminiTtsPrompt: tts.geminiTtsPrompt?.trim() || undefined,
    voicevoxApiUrl: resolveVoicevoxApiUrl(tts.voicevoxApiUrl),
    voicepeakApiUrl: resolveVoicepeakApiUrl(tts.voicepeakApiUrl),
    aivisSpeechApiUrl: resolveAivisSpeechApiUrl(tts.aivisSpeechApiUrl),
    groupId: tts.minimaxGroupId,
    endpoint: tts.engine === 'minimax' ? 'global' : undefined,
    aivisCloudModelUuid: tts.aivisCloudModelUuid,
    aivisCloudSpeakerUuid: tts.aivisCloudSpeakerUuid,
    aivisCloudStyleId: Number.isNaN(parsedAivisCloudStyleId)
      ? undefined
      : parsedAivisCloudStyleId,
    xaiLanguage: tts.xaiLanguage?.trim() || undefined,
    xaiCodec: tts.xaiCodec as XaiCodec | undefined,
    xaiSampleRate: Number.isNaN(parsedXaiSampleRate)
      ? undefined
      : (parsedXaiSampleRate as XaiSampleRate),
    xaiBitRate:
      tts.xaiCodec === 'mp3' && !Number.isNaN(parsedXaiBitRate)
        ? (parsedXaiBitRate as XaiBitRate)
        : undefined,
    unrealSpeechApiUrl: tts.unrealSpeechApiUrl?.trim() || undefined,
    unrealSpeechBitrate: tts.unrealSpeechBitrate?.trim() || undefined,
    unrealSpeechSpeed: Number.isNaN(parsedUnrealSpeechSpeed)
      ? undefined
      : parsedUnrealSpeechSpeed,
    unrealSpeechPitch: Number.isNaN(parsedUnrealSpeechPitch)
      ? undefined
      : parsedUnrealSpeechPitch,
    unrealSpeechCodec:
      (tts.unrealSpeechCodec as UnrealSpeechCodec | undefined) || undefined,
    unrealSpeechTemperature: Number.isNaN(parsedUnrealSpeechTemperature)
      ? undefined
      : parsedUnrealSpeechTemperature,
    elevenLabsApiUrl: tts.elevenLabsApiUrl?.trim() || undefined,
    elevenLabsModel: tts.elevenLabsModel?.trim() || undefined,
    elevenLabsOutputFormat: tts.elevenLabsOutputFormat?.trim() || undefined,
    elevenLabsLanguageCode: tts.elevenLabsLanguageCode?.trim() || undefined,
    elevenLabsStability: Number.isNaN(parsedElevenLabsStability)
      ? undefined
      : parsedElevenLabsStability,
    elevenLabsSimilarityBoost: Number.isNaN(parsedElevenLabsSimilarityBoost)
      ? undefined
      : parsedElevenLabsSimilarityBoost,
    elevenLabsStyle: Number.isNaN(parsedElevenLabsStyle)
      ? undefined
      : parsedElevenLabsStyle,
    elevenLabsUseSpeakerBoost:
      tts.elevenLabsUseSpeakerBoost &&
      tts.elevenLabsUseSpeakerBoost !== 'default'
        ? tts.elevenLabsUseSpeakerBoost === 'true'
        : undefined,
    elevenLabsSpeed: Number.isNaN(parsedElevenLabsSpeed)
      ? undefined
      : parsedElevenLabsSpeed,
    elevenLabsSeed: Number.isNaN(parsedElevenLabsSeed)
      ? undefined
      : parsedElevenLabsSeed,
    elevenLabsApplyTextNormalization:
      tts.elevenLabsApplyTextNormalization &&
      tts.elevenLabsApplyTextNormalization !== 'default'
        ? (tts.elevenLabsApplyTextNormalization as ElevenLabsApplyTextNormalization)
        : undefined,
    inworldApiUrl: tts.inworldApiUrl?.trim() || undefined,
    inworldModel: tts.inworldModel?.trim() || undefined,
    inworldAudioEncoding:
      (tts.inworldAudioEncoding as InworldAudioEncoding | undefined) ||
      undefined,
    inworldSampleRateHertz: Number.isNaN(parsedInworldSampleRateHertz)
      ? undefined
      : parsedInworldSampleRateHertz,
    inworldBitRate: Number.isNaN(parsedInworldBitRate)
      ? undefined
      : parsedInworldBitRate,
    inworldSpeakingRate: Number.isNaN(parsedInworldSpeakingRate)
      ? undefined
      : parsedInworldSpeakingRate,
    inworldLanguage: tts.inworldLanguage?.trim() || undefined,
    inworldDeliveryMode:
      tts.inworldDeliveryMode && tts.inworldDeliveryMode !== 'default'
        ? (tts.inworldDeliveryMode as InworldDeliveryMode)
        : undefined,
    inworldTemperature: Number.isNaN(parsedInworldTemperature)
      ? undefined
      : parsedInworldTemperature,
    gradiumApiUrl: tts.gradiumApiUrl?.trim() || undefined,
    gradiumOutputFormat:
      (tts.gradiumOutputFormat as GradiumOutputFormat | undefined) || undefined,
    gradiumTemperature: Number.isNaN(parsedGradiumTemperature)
      ? undefined
      : parsedGradiumTemperature,
    gradiumVoiceSimilarity: Number.isNaN(parsedGradiumVoiceSimilarity)
      ? undefined
      : parsedGradiumVoiceSimilarity,
    gradiumPaddingBonus: Number.isNaN(parsedGradiumPaddingBonus)
      ? undefined
      : parsedGradiumPaddingBonus,
    gradiumRewriteRules: tts.gradiumRewriteRules?.trim() || undefined,
    piperPlusBasePath: tts.piperPlusBasePath?.trim() || undefined,
    piperPlusModelConfigFile: tts.piperPlusModelConfigFile?.trim() || undefined,
    piperPlusModelFile: tts.piperPlusModelFile?.trim() || undefined,
    piperPlusVoiceFile: tts.piperPlusVoiceFile?.trim() || undefined,
    piperPlusSpeed: Number.isNaN(parsedPiperPlusSpeed)
      ? undefined
      : parsedPiperPlusSpeed,
    piperPlusNoiseScale: Number.isNaN(parsedPiperPlusNoiseScale)
      ? undefined
      : parsedPiperPlusNoiseScale,
    webSpeechRate: Number.isNaN(parsedWebSpeechRate)
      ? undefined
      : parsedWebSpeechRate,
    webSpeechPitch: Number.isNaN(parsedWebSpeechPitch)
      ? undefined
      : parsedWebSpeechPitch,
    webSpeechVolume: Number.isNaN(parsedWebSpeechVolume)
      ? undefined
      : parsedWebSpeechVolume,
    webSpeechLanguage: tts.webSpeechLanguage?.trim() || undefined,
    onPlay,
  } as VoiceServiceOptions;
}

export function supportsDirectorLipSync(engine: TTSEngineOption): boolean {
  return engine !== 'webSpeech' && engine !== 'none';
}

export function getDirectorSpeechConfigError(
  settings: AppSettings,
  getApiKeyForProvider: (provider: ChatProviderOption) => string,
): string | null {
  const { engine, speaker } = settings.tts;
  if (engine === 'none') {
    return '请在设置中将 TTS 引擎设为 VOICEVOX、Gemini TTS 等（勿选 none）';
  }
  if (engine === 'webSpeech') {
    return null;
  }
  const apiKey = getTtsApiKey(settings, getApiKeyForProvider);
  const needsApiKey = [
    'openai',
    'geminiTts',
    'aivisCloud',
    'minimax',
    'xai',
    'unrealSpeech',
    'elevenLabs',
    'inworld',
    'gradium',
  ].includes(engine);
  if (needsApiKey && !apiKey.trim()) {
    return `请在设置中配置 ${engine} 的 API Key`;
  }
  if (
    engine === 'openaiCompatible' &&
    !settings.tts.openAiCompatibleApiUrl?.trim()
  ) {
    return `请配置 OpenAI-Compatible TTS 地址（Edge-TTS 默认 ${DEFAULT_EDGE_TTS_API_URL}）`;
  }
  if (engine === 'voicevox' && !resolveVoicevoxApiUrl(settings.tts.voicevoxApiUrl)) {
    return '请配置 VOICEVOX 地址（如 http://127.0.0.1:50021）';
  }
  if (
    engine === 'aivisSpeech' &&
    !resolveAivisSpeechApiUrl(settings.tts.aivisSpeechApiUrl)
  ) {
    return '请配置 AivisSpeech API 地址（默认 http://localhost:10101）';
  }
  if (
    engine === 'voicepeak' &&
    !resolveVoicepeakApiUrl(settings.tts.voicepeakApiUrl)
  ) {
    return '请配置 VoicePeak API 地址';
  }
  if (!speaker.trim() && engine !== 'openaiCompatible' && engine !== 'piperPlus') {
    return '请在设置中选择 TTS 发音人';
  }
  return null;
}
