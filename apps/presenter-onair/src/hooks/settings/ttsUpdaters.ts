import { useCallback } from 'react';
import {
  resolveAivisSpeechApiUrl,
  resolveVoicepeakApiUrl,
  resolveVoicevoxApiUrl,
} from '../../lib/voiceOptions';
import {
  DEFAULT_AIVIS_CLOUD_MODEL_UUID,
  DEFAULT_EDGE_TTS_VOICE,
  DEFAULT_GEMINI_TTS_LANGUAGE_CODE,
  DEFAULT_GEMINI_TTS_MODEL,
  DEFAULT_GRADIUM_OUTPUT_FORMAT,
  DEFAULT_GRADIUM_TTS_ENDPOINT,
  DEFAULT_INWORLD_AUDIO_ENCODING,
  DEFAULT_INWORLD_LANGUAGE,
  DEFAULT_INWORLD_MODEL,
  DEFAULT_INWORLD_SAMPLE_RATE_HERTZ,
  DEFAULT_INWORLD_TTS_ENDPOINT,
  DEFAULT_OPENAI_COMPATIBLE_MODEL,
  DEFAULT_OPENAI_COMPATIBLE_TTS_ENDPOINT,
  DEFAULT_PIPER_PLUS_BASE_PATH,
  DEFAULT_PIPER_PLUS_MODEL_CONFIG_FILE,
  DEFAULT_PIPER_PLUS_MODEL_FILE,
  DEFAULT_PIPER_PLUS_VOICE_FILE,
  DEFAULT_UNREAL_SPEECH_TTS_ENDPOINT,
  DEFAULT_ELEVENLABS_MODEL,
  DEFAULT_ELEVENLABS_OUTPUT_FORMAT,
  DEFAULT_ELEVENLABS_TTS_ENDPOINT,
} from '../../lib/settings/constants';
import type { AppSettings, TTSEngineOption } from '../../types/settings';
import type { SetSettings } from './types';

export interface TtsSettingsUpdaterDeps {
  setSettings: SetSettings;
}

export function createTtsSettingsUpdaters(deps: TtsSettingsUpdaterDeps) {
  const { setSettings } = deps;

  const updateTTSEngine = useCallback(
    (engine: TTSEngineOption) => {
      const defaultSpeaker: Record<string, string> = {
        openai: 'alloy',
        geminiTts: 'Zephyr',
        openaiCompatible: DEFAULT_EDGE_TTS_VOICE,
        voicepeak: 'f1',
        voicevox: '',
        aivisSpeech: '',
        aivisCloud: DEFAULT_AIVIS_CLOUD_MODEL_UUID,
        minimax: 'male-qn-qingse',
        xai: 'eve',
        unrealSpeech: 'af_bella',
        elevenLabs: '',
        inworld: '',
        gradium: 'YTpq7expH9539ERJ',
        piperPlus: 'default',
        webSpeech: '',
        none: '',
      };
      setSettings((prev) => ({
        ...prev,
        tts: {
          ...prev.tts,
          engine,
          speaker: defaultSpeaker[engine] ?? '',
          openAiCompatibleApiUrl:
            engine === 'openaiCompatible'
              ? prev.tts.openAiCompatibleApiUrl ||
                DEFAULT_OPENAI_COMPATIBLE_TTS_ENDPOINT
              : prev.tts.openAiCompatibleApiUrl,
          openAiCompatibleModel:
            engine === 'openaiCompatible'
              ? prev.tts.openAiCompatibleModel || DEFAULT_OPENAI_COMPATIBLE_MODEL
              : prev.tts.openAiCompatibleModel,
          openAiCompatibleSpeed:
            engine === 'openaiCompatible'
              ? prev.tts.openAiCompatibleSpeed || ''
              : prev.tts.openAiCompatibleSpeed,
          geminiTtsModel:
            engine === 'geminiTts'
              ? prev.tts.geminiTtsModel || DEFAULT_GEMINI_TTS_MODEL
              : prev.tts.geminiTtsModel,
          geminiTtsLanguageCode:
            engine === 'geminiTts'
              ? prev.tts.geminiTtsLanguageCode || DEFAULT_GEMINI_TTS_LANGUAGE_CODE
              : prev.tts.geminiTtsLanguageCode,
          geminiTtsPrompt:
            engine === 'geminiTts'
              ? prev.tts.geminiTtsPrompt || ''
              : prev.tts.geminiTtsPrompt,
          aivisCloudModelUuid:
            engine === 'aivisCloud'
              ? prev.tts.aivisCloudModelUuid || DEFAULT_AIVIS_CLOUD_MODEL_UUID
              : prev.tts.aivisCloudModelUuid,
          aivisCloudSpeakerUuid:
            engine === 'aivisCloud'
              ? prev.tts.aivisCloudSpeakerUuid || ''
              : prev.tts.aivisCloudSpeakerUuid,
          aivisCloudStyleId:
            engine === 'aivisCloud'
              ? prev.tts.aivisCloudStyleId || ''
              : prev.tts.aivisCloudStyleId,
          xaiLanguage:
            engine === 'xai'
              ? prev.tts.xaiLanguage || 'auto'
              : prev.tts.xaiLanguage,
          xaiCodec:
            engine === 'xai' ? prev.tts.xaiCodec || 'mp3' : prev.tts.xaiCodec,
          xaiSampleRate:
            engine === 'xai'
              ? prev.tts.xaiSampleRate || 24000
              : prev.tts.xaiSampleRate,
          xaiBitRate:
            engine === 'xai'
              ? prev.tts.xaiBitRate || 128000
              : prev.tts.xaiBitRate,
          unrealSpeechApiUrl:
            engine === 'unrealSpeech'
              ? prev.tts.unrealSpeechApiUrl || DEFAULT_UNREAL_SPEECH_TTS_ENDPOINT
              : prev.tts.unrealSpeechApiUrl,
          unrealSpeechBitrate:
            engine === 'unrealSpeech'
              ? prev.tts.unrealSpeechBitrate || '192k'
              : prev.tts.unrealSpeechBitrate,
          unrealSpeechCodec:
            engine === 'unrealSpeech'
              ? prev.tts.unrealSpeechCodec || 'libmp3lame'
              : prev.tts.unrealSpeechCodec,
          elevenLabsApiUrl:
            engine === 'elevenLabs'
              ? prev.tts.elevenLabsApiUrl || DEFAULT_ELEVENLABS_TTS_ENDPOINT
              : prev.tts.elevenLabsApiUrl,
          elevenLabsModel:
            engine === 'elevenLabs'
              ? prev.tts.elevenLabsModel || DEFAULT_ELEVENLABS_MODEL
              : prev.tts.elevenLabsModel,
          elevenLabsOutputFormat:
            engine === 'elevenLabs'
              ? prev.tts.elevenLabsOutputFormat ||
                DEFAULT_ELEVENLABS_OUTPUT_FORMAT
              : prev.tts.elevenLabsOutputFormat,
          elevenLabsUseSpeakerBoost:
            engine === 'elevenLabs'
              ? prev.tts.elevenLabsUseSpeakerBoost || 'default'
              : prev.tts.elevenLabsUseSpeakerBoost,
          elevenLabsApplyTextNormalization:
            engine === 'elevenLabs'
              ? prev.tts.elevenLabsApplyTextNormalization || 'default'
              : prev.tts.elevenLabsApplyTextNormalization,
          inworldApiUrl:
            engine === 'inworld'
              ? prev.tts.inworldApiUrl || DEFAULT_INWORLD_TTS_ENDPOINT
              : prev.tts.inworldApiUrl,
          inworldModel:
            engine === 'inworld'
              ? prev.tts.inworldModel || DEFAULT_INWORLD_MODEL
              : prev.tts.inworldModel,
          inworldAudioEncoding:
            engine === 'inworld'
              ? prev.tts.inworldAudioEncoding || DEFAULT_INWORLD_AUDIO_ENCODING
              : prev.tts.inworldAudioEncoding,
          inworldSampleRateHertz:
            engine === 'inworld'
              ? prev.tts.inworldSampleRateHertz ||
                DEFAULT_INWORLD_SAMPLE_RATE_HERTZ
              : prev.tts.inworldSampleRateHertz,
          inworldLanguage:
            engine === 'inworld'
              ? prev.tts.inworldLanguage || DEFAULT_INWORLD_LANGUAGE
              : prev.tts.inworldLanguage,
          inworldDeliveryMode:
            engine === 'inworld'
              ? prev.tts.inworldDeliveryMode || 'default'
              : prev.tts.inworldDeliveryMode,
          gradiumApiUrl:
            engine === 'gradium'
              ? prev.tts.gradiumApiUrl || DEFAULT_GRADIUM_TTS_ENDPOINT
              : prev.tts.gradiumApiUrl,
          gradiumOutputFormat:
            engine === 'gradium'
              ? prev.tts.gradiumOutputFormat || DEFAULT_GRADIUM_OUTPUT_FORMAT
              : prev.tts.gradiumOutputFormat,
          gradiumTemperature:
            engine === 'gradium'
              ? prev.tts.gradiumTemperature || ''
              : prev.tts.gradiumTemperature,
          gradiumVoiceSimilarity:
            engine === 'gradium'
              ? prev.tts.gradiumVoiceSimilarity || ''
              : prev.tts.gradiumVoiceSimilarity,
          gradiumPaddingBonus:
            engine === 'gradium'
              ? prev.tts.gradiumPaddingBonus || ''
              : prev.tts.gradiumPaddingBonus,
          gradiumRewriteRules:
            engine === 'gradium'
              ? prev.tts.gradiumRewriteRules || ''
              : prev.tts.gradiumRewriteRules,
          piperPlusBasePath:
            engine === 'piperPlus'
              ? prev.tts.piperPlusBasePath || DEFAULT_PIPER_PLUS_BASE_PATH
              : prev.tts.piperPlusBasePath,
          piperPlusModelConfigFile:
            engine === 'piperPlus'
              ? prev.tts.piperPlusModelConfigFile ||
                DEFAULT_PIPER_PLUS_MODEL_CONFIG_FILE
              : prev.tts.piperPlusModelConfigFile,
          piperPlusModelFile:
            engine === 'piperPlus'
              ? prev.tts.piperPlusModelFile || DEFAULT_PIPER_PLUS_MODEL_FILE
              : prev.tts.piperPlusModelFile,
          piperPlusVoiceFile:
            engine === 'piperPlus'
              ? prev.tts.piperPlusVoiceFile || DEFAULT_PIPER_PLUS_VOICE_FILE
              : prev.tts.piperPlusVoiceFile,
          piperPlusSpeed:
            engine === 'piperPlus'
              ? prev.tts.piperPlusSpeed || ''
              : prev.tts.piperPlusSpeed,
          piperPlusNoiseScale:
            engine === 'piperPlus'
              ? prev.tts.piperPlusNoiseScale || ''
              : prev.tts.piperPlusNoiseScale,
          voicevoxApiUrl:
            engine === 'voicevox'
              ? resolveVoicevoxApiUrl(prev.tts.voicevoxApiUrl)
              : prev.tts.voicevoxApiUrl,
          aivisSpeechApiUrl:
            engine === 'aivisSpeech'
              ? resolveAivisSpeechApiUrl(prev.tts.aivisSpeechApiUrl)
              : prev.tts.aivisSpeechApiUrl,
          voicepeakApiUrl:
            engine === 'voicepeak'
              ? resolveVoicepeakApiUrl(prev.tts.voicepeakApiUrl)
              : prev.tts.voicepeakApiUrl,
        },
      }));
    },
    [setSettings],
  );

  const updateTTSSpeaker = useCallback(
    (speaker: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, speaker },
      }));
    },
    [setSettings],
  );

  const updateOpenAiCompatibleApiKey = useCallback(
    (key: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleApiKey: key },
      }));
    },
    [setSettings],
  );

  const updateOpenAiCompatibleApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updateOpenAiCompatibleModel = useCallback(
    (model: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleModel: model },
      }));
    },
    [setSettings],
  );

  const updateOpenAiCompatibleSpeed = useCallback(
    (speed: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleSpeed: speed },
      }));
    },
    [setSettings],
  );

  const updateGeminiTtsModel = useCallback(
    (model: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, geminiTtsModel: model },
      }));
    },
    [setSettings],
  );

  const updateGeminiTtsLanguageCode = useCallback(
    (languageCode: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, geminiTtsLanguageCode: languageCode },
      }));
    },
    [setSettings],
  );

  const updateGeminiTtsPrompt = useCallback(
    (prompt: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, geminiTtsPrompt: prompt },
      }));
    },
    [setSettings],
  );

  const updateVoicevoxApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, voicevoxApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updateVoicepeakApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, voicepeakApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updateAivisSpeechApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisSpeechApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudApiKey = useCallback(
    (key: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudApiKey: key },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudModelUuid = useCallback(
    (modelUuid: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudModelUuid: modelUuid },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudSpeakerUuid = useCallback(
    (speakerUuid: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudSpeakerUuid: speakerUuid },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudStyleId = useCallback(
    (styleId: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudStyleId: styleId },
      }));
    },
    [setSettings],
  );

  const updateMinimaxApiKey = useCallback(
    (key: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, minimaxApiKey: key },
      }));
    },
    [setSettings],
  );

  const updateMinimaxGroupId = useCallback(
    (groupId: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, minimaxGroupId: groupId },
      }));
    },
    [setSettings],
  );

  const updateXaiLanguage = useCallback(
    (language: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiLanguage: language },
      }));
    },
    [setSettings],
  );

  const updateXaiCodec = useCallback(
    (codec: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiCodec: codec },
      }));
    },
    [setSettings],
  );

  const updateXaiSampleRate = useCallback(
    (sampleRate: number) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiSampleRate: sampleRate },
      }));
    },
    [setSettings],
  );

  const updateXaiBitRate = useCallback(
    (bitRate: number) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiBitRate: bitRate },
      }));
    },
    [setSettings],
  );

  const updateTtsField = useCallback(
    <TKey extends keyof AppSettings['tts']>(
      key: TKey,
      value: AppSettings['tts'][TKey],
    ) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, [key]: value },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusBasePath = useCallback(
    (basePath: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusBasePath: basePath },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusModelConfigFile = useCallback(
    (modelConfigFile: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusModelConfigFile: modelConfigFile },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusModelFile = useCallback(
    (modelFile: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusModelFile: modelFile },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusVoiceFile = useCallback(
    (voiceFile: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusVoiceFile: voiceFile },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusSpeed = useCallback(
    (speed: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusSpeed: speed },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusNoiseScale = useCallback(
    (noiseScale: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusNoiseScale: noiseScale },
      }));
    },
    [setSettings],
  );

  return {
    updateTTSEngine,
    updateTTSSpeaker,
    updateOpenAiCompatibleApiKey,
    updateOpenAiCompatibleApiUrl,
    updateOpenAiCompatibleModel,
    updateOpenAiCompatibleSpeed,
    updateGeminiTtsModel,
    updateGeminiTtsLanguageCode,
    updateGeminiTtsPrompt,
    updateVoicevoxApiUrl,
    updateVoicepeakApiUrl,
    updateAivisSpeechApiUrl,
    updateAivisCloudApiKey,
    updateAivisCloudModelUuid,
    updateAivisCloudSpeakerUuid,
    updateAivisCloudStyleId,
    updateMinimaxApiKey,
    updateMinimaxGroupId,
    updateXaiLanguage,
    updateXaiCodec,
    updateXaiSampleRate,
    updateXaiBitRate,
    updateTtsField,
    updatePiperPlusBasePath,
    updatePiperPlusModelConfigFile,
    updatePiperPlusModelFile,
    updatePiperPlusVoiceFile,
    updatePiperPlusSpeed,
    updatePiperPlusNoiseScale,
  };
}
