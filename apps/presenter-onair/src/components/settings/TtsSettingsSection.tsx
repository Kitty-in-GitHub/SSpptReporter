import { useEffect, useMemo, useRef, useState } from 'react';
import { getVoiceEngineVoiceList, type VoiceEngineVoice } from '@aituber-onair/core';
import {
  DEFAULT_AIVIS_SPEECH_API_URL,
  DEFAULT_EDGE_TTS_API_URL,
  DEFAULT_EDGE_TTS_API_URL_DIRECT,
  DEFAULT_EDGE_TTS_MODEL,
  DEFAULT_EDGE_TTS_VOICE,
  DEFAULT_VOICEVOX_API_URL,
  resolveAivisSpeechApiUrl,
  resolveVoicevoxApiUrl,
} from '../../lib/voiceOptions';
import type { TTSEngineOption } from '../../types/settings';
import type { SettingsHook } from './SettingsSectionShell';
import { SettingsSectionShell } from './SettingsSectionShell';
import {
  AIVIS_CLOUD_PRESETS,
  ELEVENLABS_MODELS,
  ELEVENLABS_OUTPUT_FORMATS,
  GEMINI_TTS_MODELS,
  GEMINI_TTS_SPEAKERS,
  GRADIUM_OUTPUT_FORMATS,
  GRADIUM_VOICES,
  INWORLD_AUDIO_ENCODINGS,
  INWORLD_DELIVERY_MODES,
  INWORLD_MODELS,
  OPENAI_SPEAKERS,
  TTS_ENGINES,
  UNREAL_SPEECH_CODECS,
  UNREAL_SPEECH_SPEAKERS,
  VOICEPEAK_SPEAKERS,
  XAI_BIT_RATES,
  XAI_CODECS,
  XAI_SAMPLE_RATES,
  XAI_SPEAKERS,
  type ElevenLabsVoice,
  type InworldVoice,
  type MinimaxVoice,
  type VoiceSpeaker,
} from './settingsConstants';

export interface TtsSettingsSectionProps
  extends Pick<
    SettingsHook,
    | 'settings'
    | 'updateTTSEngine'
    | 'updateTTSSpeaker'
    | 'updateLLMApiKey'
    | 'getApiKeyForProvider'
    | 'updateOpenAiCompatibleApiKey'
    | 'updateOpenAiCompatibleApiUrl'
    | 'updateOpenAiCompatibleModel'
    | 'updateOpenAiCompatibleSpeed'
    | 'updateGeminiTtsModel'
    | 'updateGeminiTtsLanguageCode'
    | 'updateGeminiTtsPrompt'
    | 'updateVoicevoxApiUrl'
    | 'updateVoicepeakApiUrl'
    | 'updateAivisSpeechApiUrl'
    | 'updateAivisCloudApiKey'
    | 'updateAivisCloudModelUuid'
    | 'updateAivisCloudSpeakerUuid'
    | 'updateAivisCloudStyleId'
    | 'updateMinimaxApiKey'
    | 'updateMinimaxGroupId'
    | 'updateXaiLanguage'
    | 'updateXaiCodec'
    | 'updateXaiSampleRate'
    | 'updateXaiBitRate'
    | 'updateTtsField'
    | 'updatePiperPlusBasePath'
    | 'updatePiperPlusModelConfigFile'
    | 'updatePiperPlusModelFile'
    | 'updatePiperPlusVoiceFile'
    | 'updatePiperPlusSpeed'
    | 'updatePiperPlusNoiseScale'
  > {
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function TtsSettingsSection({
  disabled,
  isExpanded,
  onToggleExpand,
  settings,
  updateTTSEngine,
  updateTTSSpeaker,
  updateLLMApiKey,
  getApiKeyForProvider,
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
}: TtsSettingsSectionProps) {
  const [voicevoxSpeakers, setVoicevoxSpeakers] = useState<VoiceSpeaker[]>([]);
  const [aivisSpeakers, setAivisSpeakers] = useState<VoiceSpeaker[]>([]);
  const [minimaxVoices, setMinimaxVoices] = useState<MinimaxVoice[]>([]);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>(
    [],
  );
  const [inworldVoices, setInworldVoices] = useState<InworldVoice[]>([]);
  const [webSpeechVoices, setWebSpeechVoices] = useState<VoiceEngineVoice[]>(
    [],
  );
  const [isFetchingWebSpeechVoices, setIsFetchingWebSpeechVoices] =
    useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isFetchingMinimaxVoices, setIsFetchingMinimaxVoices] = useState(false);
  const [isFetchingElevenLabsVoices, setIsFetchingElevenLabsVoices] =
    useState(false);
  const [isFetchingInworldVoices, setIsFetchingInworldVoices] = useState(false);
  const speakerRef = useRef(settings.tts.speaker);

  useEffect(() => {
    speakerRef.current = settings.tts.speaker;
  }, [settings.tts.speaker]);

  const selectedAivisCloudPresetId = useMemo(() => {
    const matched = AIVIS_CLOUD_PRESETS.find(
      (preset) =>
        preset.modelUuid === (settings.tts.aivisCloudModelUuid || '') &&
        preset.speakerUuid === (settings.tts.aivisCloudSpeakerUuid || '') &&
        preset.styleId === (settings.tts.aivisCloudStyleId || ''),
    );
    return matched?.id || AIVIS_CLOUD_PRESETS[0].id;
  }, [
    settings.tts.aivisCloudModelUuid,
    settings.tts.aivisCloudSpeakerUuid,
    settings.tts.aivisCloudStyleId,
  ]);

  // Fetch speaker list for VOICEVOX / AivisSpeech
  useEffect(() => {
    if (
      settings.tts.engine !== 'voicevox' &&
      settings.tts.engine !== 'aivisSpeech'
    ) {
      return;
    }

    const controller = new AbortController();

    const fetchSpeakers = async () => {
      const isVoicevox = settings.tts.engine === 'voicevox';
      const baseUrl = isVoicevox
        ? resolveVoicevoxApiUrl(settings.tts.voicevoxApiUrl)
        : resolveAivisSpeechApiUrl(settings.tts.aivisSpeechApiUrl);

      try {
        const response = await fetch(`${baseUrl}/speakers`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const speakers = (await response.json()) as VoiceSpeaker[];
        if (controller.signal.aborted) return;

        if (isVoicevox) {
          setVoicevoxSpeakers(speakers);
        } else {
          setAivisSpeakers(speakers);
        }
        setFetchError('');

        if (!speakerRef.current && speakers.length > 0) {
          const firstId = speakers[0]?.styles?.[0]?.id;
          if (firstId != null) updateTTSSpeaker(String(firstId));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        if (isVoicevox) {
          setVoicevoxSpeakers([]);
          setFetchError(`VOICEVOX 连接错误: ${message}`);
        } else {
          setAivisSpeakers([]);
          setFetchError(`AivisSpeech 连接错误: ${message}`);
        }
      }
    };

    void fetchSpeakers();

    return () => {
      controller.abort();
    };
  }, [
    settings.tts.engine,
    settings.tts.voicevoxApiUrl,
    settings.tts.aivisSpeechApiUrl,
    updateTTSSpeaker,
  ]);

  // Fetch MiniMax speaker list after API key is entered
  useEffect(() => {
    if (settings.tts.engine !== 'minimax') {
      return;
    }

    const apiKey = settings.tts.minimaxApiKey?.trim();
    if (!apiKey) {
      setMinimaxVoices([]);
      return;
    }

    const controller = new AbortController();

    const fetchMinimaxVoices = async () => {
      setIsFetchingMinimaxVoices(true);
      try {
        const response = await fetch(
          'https://api.minimax.io/v1/query/tts_speakers',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          base_resp?: { status_code?: number; status_msg?: string };
          data?: { speakers?: MinimaxVoice[] };
        };
        if (controller.signal.aborted) return;

        if (payload.base_resp && payload.base_resp.status_code !== 0) {
          throw new Error(payload.base_resp.status_msg || 'MiniMax API error');
        }

        const voices = payload.data?.speakers || [];
        setMinimaxVoices(voices);
        setFetchError('');

        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.voice_id === speakerRef.current)
        ) {
          updateTTSSpeaker(voices[0].voice_id);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setMinimaxVoices([]);
        setFetchError(`MiniMax 连接错误: ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingMinimaxVoices(false);
        }
      }
    };

    void fetchMinimaxVoices();

    return () => {
      controller.abort();
    };
  }, [settings.tts.engine, settings.tts.minimaxApiKey, updateTTSSpeaker]);

  // Fetch ElevenLabs voice list after API key is entered
  useEffect(() => {
    if (settings.tts.engine !== 'elevenLabs') {
      return;
    }

    const apiKey = settings.tts.elevenLabsApiKey?.trim();
    if (!apiKey) {
      queueMicrotask(() => {
        setElevenLabsVoices([]);
      });
      return;
    }

    const controller = new AbortController();

    const fetchElevenLabsVoices = async () => {
      setIsFetchingElevenLabsVoices(true);
      try {
        const response = await fetch(
          'https://api.elevenlabs.io/v2/voices?page_size=100',
          {
            method: 'GET',
            headers: {
              'xi-api-key': apiKey,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          voices?: ElevenLabsVoice[];
        };
        if (controller.signal.aborted) return;

        const voices = payload.voices || [];
        setElevenLabsVoices(voices);
        setFetchError('');

        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.voice_id === speakerRef.current)
        ) {
          updateTTSSpeaker(voices[0].voice_id);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setElevenLabsVoices([]);
        setFetchError(`ElevenLabs 连接错误: ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingElevenLabsVoices(false);
        }
      }
    };

    void fetchElevenLabsVoices();

    return () => {
      controller.abort();
    };
  }, [settings.tts.engine, settings.tts.elevenLabsApiKey, updateTTSSpeaker]);

  useEffect(() => {
    if (settings.tts.engine !== 'inworld') {
      return;
    }

    const apiKey = settings.tts.inworldApiKey?.trim();
    if (!apiKey) {
      queueMicrotask(() => {
        setInworldVoices([]);
      });
      return;
    }

    const controller = new AbortController();

    const fetchInworldVoices = async () => {
      setIsFetchingInworldVoices(true);
      try {
        const url = new URL('https://api.inworld.ai/voices/v1/voices');
        url.searchParams.set('orderBy', 'display_name asc');
        url.searchParams.set('pageSize', '2000');
        if (settings.tts.inworldLanguage?.trim()) {
          url.searchParams.set(
            'filter',
            `lang_code = "${settings.tts.inworldLanguage.trim()}"`,
          );
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { Authorization: `Basic ${apiKey}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          voices?: InworldVoice[];
        };
        if (controller.signal.aborted) return;

        const voices = payload.voices || [];
        setInworldVoices(voices);
        setFetchError('');

        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.voiceId === speakerRef.current)
        ) {
          updateTTSSpeaker(voices[0].voiceId);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setInworldVoices([]);
        setFetchError(`Inworld 连接错误: ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingInworldVoices(false);
        }
      }
    };

    void fetchInworldVoices();

    return () => {
      controller.abort();
    };
  }, [
    settings.tts.engine,
    settings.tts.inworldApiKey,
    settings.tts.inworldLanguage,
    updateTTSSpeaker,
  ]);

  useEffect(() => {
    if (settings.tts.engine !== 'webSpeech') {
      return;
    }

    let active = true;
    const fetchWebSpeechVoices = async () => {
      setIsFetchingWebSpeechVoices(true);
      try {
        const voices = await getVoiceEngineVoiceList('webSpeech');
        if (!active) return;
        setWebSpeechVoices(voices);
        setFetchError('');
        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.id === settings.tts.speaker)
        ) {
          updateTTSSpeaker(voices[0].id);
        }
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : String(error);
        setWebSpeechVoices([]);
        setFetchError(`Web Speech 音色列表错误: ${message}`);
      } finally {
        if (active) {
          setIsFetchingWebSpeechVoices(false);
        }
      }
    };

    void fetchWebSpeechVoices();
    return () => {
      active = false;
    };
  }, [settings.tts.engine, settings.tts.speaker, updateTTSSpeaker]);

  const handleAivisCloudPresetChange = (presetId: string) => {
    const preset = AIVIS_CLOUD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    updateAivisCloudModelUuid(preset.modelUuid);
    updateAivisCloudSpeakerUuid(preset.speakerUuid);
    updateAivisCloudStyleId(preset.styleId);
    updateTTSSpeaker(preset.modelUuid);
  };

  return (
    <SettingsSectionShell
      title="TTS"
      disabled={disabled}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <>
            <div className="settings-field">
              <label htmlFor="tts-engine">引擎</label>
              <select
                id="tts-engine"
                value={settings.tts.engine}
                onChange={(e) =>
                  updateTTSEngine(e.target.value as TTSEngineOption)
                }
                disabled={disabled}
              >
                {TTS_ENGINES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {settings.tts.engine === 'openai' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-openai-apikey">API 密钥 (OpenAI)</label>
                  <input
                    id="tts-openai-apikey"
                    type="password"
                    value={getApiKeyForProvider('openai')}
                    onChange={(e) => updateLLMApiKey('openai', e.target.value)}
                    placeholder="OpenAI API key"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-speaker">发音人</label>
                  <select
                    id="tts-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {OPENAI_SPEAKERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {settings.tts.engine === 'geminiTts' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-gemini-apikey">API 密钥 (Gemini)</label>
                  <input
                    id="tts-gemini-apikey"
                    type="password"
                    value={getApiKeyForProvider('gemini')}
                    onChange={(e) => updateLLMApiKey('gemini', e.target.value)}
                    placeholder="Google API key"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gemini-speaker">音色</label>
                  <select
                    id="tts-gemini-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {GEMINI_TTS_SPEAKERS.map((speaker) => (
                      <option key={speaker} value={speaker}>
                        {speaker}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gemini-model">模型</label>
                  <select
                    id="tts-gemini-model"
                    value={settings.tts.geminiTtsModel || GEMINI_TTS_MODELS[0]}
                    onChange={(e) => updateGeminiTtsModel(e.target.value)}
                    disabled={disabled}
                  >
                    {GEMINI_TTS_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gemini-language">语言代码</label>
                  <input
                    id="tts-gemini-language"
                    type="text"
                    value={settings.tts.geminiTtsLanguageCode || ''}
                    onChange={(e) =>
                      updateGeminiTtsLanguageCode(e.target.value)
                    }
                    placeholder="ja-JP"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gemini-prompt">
                    Style / Audio-tag Prompt
                  </label>
                  <input
                    id="tts-gemini-prompt"
                    type="text"
                    value={settings.tts.geminiTtsPrompt || ''}
                    onChange={(e) => updateGeminiTtsPrompt(e.target.value)}
                    placeholder="请用明亮有活力的声音说话"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'xai' && (
              <>
                {settings.llm.provider !== 'xai' && (
                  <div className="settings-field">
                    <label htmlFor="tts-xai-apikey">API 密钥 (xAI)</label>
                    <input
                      id="tts-xai-apikey"
                      type="password"
                      value={getApiKeyForProvider('xai')}
                      onChange={(e) => updateLLMApiKey('xai', e.target.value)}
                      placeholder="xai-..."
                      disabled={disabled}
                    />
                  </div>
                )}
                <div className="settings-field">
                  <label htmlFor="tts-xai-speaker">发音人</label>
                  <select
                    id="tts-xai-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {XAI_SPEAKERS.map((speaker) => (
                      <option key={speaker} value={speaker}>
                        {speaker}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-xai-language">语言</label>
                  <input
                    id="tts-xai-language"
                    type="text"
                    value={settings.tts.xaiLanguage || ''}
                    onChange={(e) => updateXaiLanguage(e.target.value)}
                    placeholder="auto"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-xai-codec">编码</label>
                  <select
                    id="tts-xai-codec"
                    value={settings.tts.xaiCodec || 'mp3'}
                    onChange={(e) => updateXaiCodec(e.target.value)}
                    disabled={disabled}
                  >
                    {XAI_CODECS.map((codec) => (
                      <option key={codec} value={codec}>
                        {codec}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-xai-sample-rate">采样率</label>
                  <select
                    id="tts-xai-sample-rate"
                    value={String(settings.tts.xaiSampleRate || 24000)}
                    onChange={(e) =>
                      updateXaiSampleRate(Number.parseInt(e.target.value, 10))
                    }
                    disabled={disabled}
                  >
                    {XAI_SAMPLE_RATES.map((sampleRate) => (
                      <option key={sampleRate} value={sampleRate}>
                        {sampleRate}
                      </option>
                    ))}
                  </select>
                </div>
                {(settings.tts.xaiCodec || 'mp3') === 'mp3' && (
                  <div className="settings-field">
                    <label htmlFor="tts-xai-bit-rate">比特率</label>
                    <select
                      id="tts-xai-bit-rate"
                      value={String(settings.tts.xaiBitRate || 128000)}
                      onChange={(e) =>
                        updateXaiBitRate(Number.parseInt(e.target.value, 10))
                      }
                      disabled={disabled}
                    >
                      {XAI_BIT_RATES.map((bitRate) => (
                        <option key={bitRate} value={bitRate}>
                          {bitRate}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {settings.tts.engine === 'unrealSpeech' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-apikey">API 密钥</label>
                  <input
                    id="tts-unreal-apikey"
                    type="password"
                    value={settings.tts.unrealSpeechApiKey || ''}
                    onChange={(e) =>
                      updateTtsField('unrealSpeechApiKey', e.target.value)
                    }
                    placeholder="Unreal Speech API key"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-speaker">发音人</label>
                  <select
                    id="tts-unreal-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {UNREAL_SPEECH_SPEAKERS.map((speaker) => (
                      <option key={speaker} value={speaker}>
                        {speaker}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-url">API 地址</label>
                  <input
                    id="tts-unreal-url"
                    type="text"
                    value={settings.tts.unrealSpeechApiUrl || ''}
                    onChange={(e) =>
                      updateTtsField('unrealSpeechApiUrl', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-codec">编码</label>
                  <select
                    id="tts-unreal-codec"
                    value={settings.tts.unrealSpeechCodec || 'libmp3lame'}
                    onChange={(e) =>
                      updateTtsField('unrealSpeechCodec', e.target.value)
                    }
                    disabled={disabled}
                  >
                    {UNREAL_SPEECH_CODECS.map((codec) => (
                      <option key={codec} value={codec}>
                        {codec}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-bitrate">Bitrate</label>
                  <input
                    id="tts-unreal-bitrate"
                    type="text"
                    value={settings.tts.unrealSpeechBitrate || ''}
                    onChange={(e) =>
                      updateTtsField('unrealSpeechBitrate', e.target.value)
                    }
                    placeholder="192k"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-speed">语速</label>
                  <input
                    id="tts-unreal-speed"
                    type="number"
                    step="0.05"
                    value={settings.tts.unrealSpeechSpeed || ''}
                    onChange={(e) =>
                      updateTtsField('unrealSpeechSpeed', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-pitch">音高</label>
                  <input
                    id="tts-unreal-pitch"
                    type="number"
                    step="0.05"
                    value={settings.tts.unrealSpeechPitch || ''}
                    onChange={(e) =>
                      updateTtsField('unrealSpeechPitch', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-unreal-temperature">温度</label>
                  <input
                    id="tts-unreal-temperature"
                    type="number"
                    step="0.05"
                    value={settings.tts.unrealSpeechTemperature || ''}
                    onChange={(e) =>
                      updateTtsField('unrealSpeechTemperature', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'elevenLabs' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-apikey">API 密钥</label>
                  <input
                    id="tts-eleven-apikey"
                    type="password"
                    value={settings.tts.elevenLabsApiKey || ''}
                    onChange={(e) =>
                      updateTtsField('elevenLabsApiKey', e.target.value)
                    }
                    placeholder="ElevenLabs API key"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-speaker">音色</label>
                  <select
                    id="tts-eleven-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={
                      disabled ||
                      !settings.tts.elevenLabsApiKey ||
                      isFetchingElevenLabsVoices ||
                      elevenLabsVoices.length === 0
                    }
                  >
                    {!settings.tts.elevenLabsApiKey && (
                      <option value="">请输入 API 密钥</option>
                    )}
                    {settings.tts.elevenLabsApiKey &&
                      isFetchingElevenLabsVoices && (
                        <option value="">取得中...</option>
                      )}
                    {settings.tts.elevenLabsApiKey &&
                      !isFetchingElevenLabsVoices &&
                      elevenLabsVoices.length === 0 && (
                        <option value="">无法获取音色列表</option>
                      )}
                    {elevenLabsVoices.map((voice) => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.category
                          ? `${voice.name} (${voice.category})`
                          : voice.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-url">API 地址</label>
                  <input
                    id="tts-eleven-url"
                    type="text"
                    value={settings.tts.elevenLabsApiUrl || ''}
                    onChange={(e) =>
                      updateTtsField('elevenLabsApiUrl', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-model">模型</label>
                  <select
                    id="tts-eleven-model"
                    value={settings.tts.elevenLabsModel || ELEVENLABS_MODELS[0]}
                    onChange={(e) =>
                      updateTtsField('elevenLabsModel', e.target.value)
                    }
                    disabled={disabled}
                  >
                    {ELEVENLABS_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-format">输出格式</label>
                  <select
                    id="tts-eleven-format"
                    value={
                      settings.tts.elevenLabsOutputFormat ||
                      ELEVENLABS_OUTPUT_FORMATS[0]
                    }
                    onChange={(e) =>
                      updateTtsField('elevenLabsOutputFormat', e.target.value)
                    }
                    disabled={disabled}
                  >
                    {ELEVENLABS_OUTPUT_FORMATS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-language">语言代码</label>
                  <input
                    id="tts-eleven-language"
                    type="text"
                    value={settings.tts.elevenLabsLanguageCode || ''}
                    onChange={(e) =>
                      updateTtsField('elevenLabsLanguageCode', e.target.value)
                    }
                    placeholder="ja"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-stability">稳定性</label>
                  <input
                    id="tts-eleven-stability"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.tts.elevenLabsStability || ''}
                    onChange={(e) =>
                      updateTtsField('elevenLabsStability', e.target.value)
                    }
                    placeholder="0.5"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-similarity">
                    Similarity Boost
                  </label>
                  <input
                    id="tts-eleven-similarity"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.tts.elevenLabsSimilarityBoost || ''}
                    onChange={(e) =>
                      updateTtsField(
                        'elevenLabsSimilarityBoost',
                        e.target.value,
                      )
                    }
                    placeholder="0.75"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-style">风格</label>
                  <input
                    id="tts-eleven-style"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.tts.elevenLabsStyle || ''}
                    onChange={(e) =>
                      updateTtsField('elevenLabsStyle', e.target.value)
                    }
                    placeholder="0"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-speed">语速</label>
                  <input
                    id="tts-eleven-speed"
                    type="number"
                    min="0.7"
                    max="1.2"
                    step="0.01"
                    value={settings.tts.elevenLabsSpeed || ''}
                    onChange={(e) =>
                      updateTtsField('elevenLabsSpeed', e.target.value)
                    }
                    placeholder="1.0"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-seed">随机种子</label>
                  <input
                    id="tts-eleven-seed"
                    type="number"
                    value={settings.tts.elevenLabsSeed || ''}
                    onChange={(e) =>
                      updateTtsField('elevenLabsSeed', e.target.value)
                    }
                    placeholder="optional"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-speaker-boost">
                    Speaker Boost
                  </label>
                  <select
                    id="tts-eleven-speaker-boost"
                    value={settings.tts.elevenLabsUseSpeakerBoost || 'default'}
                    onChange={(e) =>
                      updateTtsField(
                        'elevenLabsUseSpeakerBoost',
                        e.target.value as 'default' | 'true' | 'false',
                      )
                    }
                    disabled={disabled}
                  >
                    <option value="default">Default</option>
                    <option value="true">On</option>
                    <option value="false">Off</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-eleven-normalization">
                    Text Normalization
                  </label>
                  <select
                    id="tts-eleven-normalization"
                    value={
                      settings.tts.elevenLabsApplyTextNormalization || 'default'
                    }
                    onChange={(e) =>
                      updateTtsField(
                        'elevenLabsApplyTextNormalization',
                        e.target.value as 'default' | 'auto' | 'on' | 'off',
                      )
                    }
                    disabled={disabled}
                  >
                    <option value="default">Default</option>
                    <option value="auto">auto</option>
                    <option value="on">on</option>
                    <option value="off">off</option>
                  </select>
                </div>
              </>
            )}

            {settings.tts.engine === 'inworld' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-apikey">API 密钥</label>
                  <input
                    id="tts-inworld-apikey"
                    type="password"
                    value={settings.tts.inworldApiKey || ''}
                    onChange={(e) =>
                      updateTtsField('inworldApiKey', e.target.value)
                    }
                    placeholder="Inworld Basic Base64 credentials"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-speaker">音色</label>
                  <select
                    id="tts-inworld-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={
                      disabled ||
                      !settings.tts.inworldApiKey ||
                      isFetchingInworldVoices ||
                      inworldVoices.length === 0
                    }
                  >
                    {!settings.tts.inworldApiKey && (
                      <option value="">请输入 API 密钥</option>
                    )}
                    {settings.tts.inworldApiKey && isFetchingInworldVoices && (
                      <option value="">取得中...</option>
                    )}
                    {settings.tts.inworldApiKey &&
                      !isFetchingInworldVoices &&
                      inworldVoices.length === 0 && (
                        <option value="">无法获取音色列表</option>
                      )}
                    {inworldVoices.map((voice) => (
                      <option key={voice.voiceId} value={voice.voiceId}>
                        {voice.displayName || voice.voiceId}
                        {voice.langCode ? ` (${voice.langCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-url">API 地址</label>
                  <input
                    id="tts-inworld-url"
                    type="text"
                    value={settings.tts.inworldApiUrl || ''}
                    onChange={(e) =>
                      updateTtsField('inworldApiUrl', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-model">模型</label>
                  <select
                    id="tts-inworld-model"
                    value={settings.tts.inworldModel || INWORLD_MODELS[0]}
                    onChange={(e) =>
                      updateTtsField('inworldModel', e.target.value)
                    }
                    disabled={disabled}
                  >
                    {INWORLD_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-encoding">音频编码</label>
                  <select
                    id="tts-inworld-encoding"
                    value={
                      settings.tts.inworldAudioEncoding ||
                      INWORLD_AUDIO_ENCODINGS[0]
                    }
                    onChange={(e) =>
                      updateTtsField('inworldAudioEncoding', e.target.value)
                    }
                    disabled={disabled}
                  >
                    {INWORLD_AUDIO_ENCODINGS.map((encoding) => (
                      <option key={encoding} value={encoding}>
                        {encoding}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-language">语言</label>
                  <input
                    id="tts-inworld-language"
                    type="text"
                    value={settings.tts.inworldLanguage || ''}
                    onChange={(e) =>
                      updateTtsField('inworldLanguage', e.target.value)
                    }
                    placeholder="ja-JP"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-sample-rate">采样率</label>
                  <input
                    id="tts-inworld-sample-rate"
                    type="number"
                    value={settings.tts.inworldSampleRateHertz || ''}
                    onChange={(e) =>
                      updateTtsField('inworldSampleRateHertz', e.target.value)
                    }
                    placeholder="48000"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-bitrate">比特率</label>
                  <input
                    id="tts-inworld-bitrate"
                    type="number"
                    value={settings.tts.inworldBitRate || ''}
                    onChange={(e) =>
                      updateTtsField('inworldBitRate', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-speaking-rate">
                    Speaking Rate
                  </label>
                  <input
                    id="tts-inworld-speaking-rate"
                    type="number"
                    step="0.05"
                    value={settings.tts.inworldSpeakingRate || ''}
                    onChange={(e) =>
                      updateTtsField('inworldSpeakingRate', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-delivery">传输模式</label>
                  <select
                    id="tts-inworld-delivery"
                    value={settings.tts.inworldDeliveryMode || 'default'}
                    onChange={(e) =>
                      updateTtsField(
                        'inworldDeliveryMode',
                        e.target.value as
                          | 'default'
                          | 'STABLE'
                          | 'BALANCED'
                          | 'CREATIVE',
                      )
                    }
                    disabled={disabled}
                  >
                    <option value="default">Default</option>
                    {INWORLD_DELIVERY_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-inworld-temperature">温度</label>
                  <input
                    id="tts-inworld-temperature"
                    type="number"
                    step="0.05"
                    value={settings.tts.inworldTemperature || ''}
                    onChange={(e) =>
                      updateTtsField('inworldTemperature', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'gradium' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-apikey">API 密钥</label>
                  <input
                    id="tts-gradium-apikey"
                    type="password"
                    value={settings.tts.gradiumApiKey || ''}
                    onChange={(e) =>
                      updateTtsField('gradiumApiKey', e.target.value)
                    }
                    placeholder="Gradium API key"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-speaker">音色</label>
                  <select
                    id="tts-gradium-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {Object.entries(GRADIUM_VOICES).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-url">API 地址</label>
                  <input
                    id="tts-gradium-url"
                    type="text"
                    value={settings.tts.gradiumApiUrl || ''}
                    onChange={(e) =>
                      updateTtsField('gradiumApiUrl', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-output">输出格式</label>
                  <select
                    id="tts-gradium-output"
                    value={settings.tts.gradiumOutputFormat || 'wav'}
                    onChange={(e) =>
                      updateTtsField('gradiumOutputFormat', e.target.value)
                    }
                    disabled={disabled}
                  >
                    {GRADIUM_OUTPUT_FORMATS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-temperature">温度</label>
                  <input
                    id="tts-gradium-temperature"
                    type="number"
                    min="0"
                    max="1.4"
                    step="0.05"
                    value={settings.tts.gradiumTemperature || ''}
                    onChange={(e) =>
                      updateTtsField('gradiumTemperature', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-similarity">
                    Voice Similarity
                  </label>
                  <input
                    id="tts-gradium-similarity"
                    type="number"
                    min="1"
                    max="4"
                    step="0.05"
                    value={settings.tts.gradiumVoiceSimilarity || ''}
                    onChange={(e) =>
                      updateTtsField('gradiumVoiceSimilarity', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-padding">Padding Bonus</label>
                  <input
                    id="tts-gradium-padding"
                    type="number"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={settings.tts.gradiumPaddingBonus || ''}
                    onChange={(e) =>
                      updateTtsField('gradiumPaddingBonus', e.target.value)
                    }
                    placeholder="default"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-gradium-rewrite">Rewrite Rules</label>
                  <input
                    id="tts-gradium-rewrite"
                    type="text"
                    value={settings.tts.gradiumRewriteRules || ''}
                    onChange={(e) =>
                      updateTtsField('gradiumRewriteRules', e.target.value)
                    }
                    placeholder="en"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'piperPlus' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-piper-base-path">Assets Base Path</label>
                  <input
                    id="tts-piper-base-path"
                    type="text"
                    value={settings.tts.piperPlusBasePath || ''}
                    onChange={(e) => updatePiperPlusBasePath(e.target.value)}
                    placeholder="/piper/"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-piper-config">Model Config File</label>
                  <input
                    id="tts-piper-config"
                    type="text"
                    value={settings.tts.piperPlusModelConfigFile || ''}
                    onChange={(e) =>
                      updatePiperPlusModelConfigFile(e.target.value)
                    }
                    placeholder="tsukuyomi-config.json"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-piper-model">Model File</label>
                  <input
                    id="tts-piper-model"
                    type="text"
                    value={settings.tts.piperPlusModelFile || ''}
                    onChange={(e) => updatePiperPlusModelFile(e.target.value)}
                    placeholder="tsukuyomi-wavlm-300epoch.onnx"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-piper-voice">HTS Voice File</label>
                  <input
                    id="tts-piper-voice"
                    type="text"
                    value={settings.tts.piperPlusVoiceFile || ''}
                    onChange={(e) => updatePiperPlusVoiceFile(e.target.value)}
                    placeholder="mei_normal.htsvoice"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-piper-speed">语速</label>
                  <input
                    id="tts-piper-speed"
                    type="number"
                    step="0.05"
                    value={settings.tts.piperPlusSpeed || ''}
                    onChange={(e) => updatePiperPlusSpeed(e.target.value)}
                    placeholder="1.0"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-piper-noise-scale">Noise Scale</label>
                  <input
                    id="tts-piper-noise-scale"
                    type="number"
                    step="0.05"
                    value={settings.tts.piperPlusNoiseScale || ''}
                    onChange={(e) => updatePiperPlusNoiseScale(e.target.value)}
                    placeholder="0.667"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <small>
                    运行时资源因体积与许可未随仓库分发。请参阅 README 的 Piper Plus 说明，将 `dist/`、`src/`、`assets/`、`models/` 放到 `public/piper/`。
                  </small>
                </div>
              </>
            )}

            {settings.tts.engine === 'webSpeech' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-web-speech-voice">Browser Voice</label>
                  <select
                    id="tts-web-speech-voice"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled || isFetchingWebSpeechVoices}
                  >
                    {webSpeechVoices.length > 0 ? (
                      webSpeechVoices.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.label}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        {isFetchingWebSpeechVoices
                          ? '正在加载浏览器音色…'
                          : '浏览器默认音色'}
                      </option>
                    )}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-web-speech-language">语言</label>
                  <input
                    id="tts-web-speech-language"
                    type="text"
                    value={settings.tts.webSpeechLanguage || ''}
                    onChange={(e) =>
                      updateTtsField('webSpeechLanguage', e.target.value)
                    }
                    placeholder="ja-JP"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-web-speech-rate">Rate (0.1 - 10)</label>
                  <input
                    id="tts-web-speech-rate"
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.tts.webSpeechRate || ''}
                    onChange={(e) =>
                      updateTtsField('webSpeechRate', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-web-speech-pitch">Pitch (0 - 2)</label>
                  <input
                    id="tts-web-speech-pitch"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.tts.webSpeechPitch || ''}
                    onChange={(e) =>
                      updateTtsField('webSpeechPitch', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-web-speech-volume">Volume (0 - 1)</label>
                  <input
                    id="tts-web-speech-volume"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.tts.webSpeechVolume || ''}
                    onChange={(e) =>
                      updateTtsField('webSpeechVolume', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <small>
                    Web Speech API 由浏览器直接播放，无法获取音频缓冲，本示例不支持口型同步。
                  </small>
                  {fetchError.startsWith('Web Speech') && (
                    <small className="settings-field-error">{fetchError}</small>
                  )}
                </div>
              </>
            )}

            {settings.tts.engine === 'openaiCompatible' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-openai-compatible-apikey">
                    API 密钥 (optional)
                  </label>
                  <input
                    id="tts-openai-compatible-apikey"
                    type="password"
                    value={settings.tts.openAiCompatibleApiKey || ''}
                    onChange={(e) =>
                      updateOpenAiCompatibleApiKey(e.target.value)
                    }
                    placeholder="留空则不发送 Authorization 头（Edge-TTS 本地网关通常可留空）"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-openai-compatible-url">
                    接口地址
                  </label>
                  <input
                    id="tts-openai-compatible-url"
                    type="text"
                    value={
                      settings.tts.openAiCompatibleApiUrl ||
                      DEFAULT_EDGE_TTS_API_URL
                    }
                    onChange={(e) =>
                      updateOpenAiCompatibleApiUrl(e.target.value)
                    }
                    placeholder={DEFAULT_EDGE_TTS_API_URL}
                    disabled={disabled}
                  />
                  <p className="settings-field-hint">
                    开发默认走同源代理 {DEFAULT_EDGE_TTS_API_URL}（需{' '}
                    <code>npm run dev</code> 同时起 TTS 网关）。直连网关可用{' '}
                    {DEFAULT_EDGE_TTS_API_URL_DIRECT}。
                  </p>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-openai-compatible-model">模型</label>
                  <input
                    id="tts-openai-compatible-model"
                    type="text"
                    value={settings.tts.openAiCompatibleModel || DEFAULT_EDGE_TTS_MODEL}
                    onChange={(e) =>
                      updateOpenAiCompatibleModel(e.target.value)
                    }
                    placeholder={DEFAULT_EDGE_TTS_MODEL}
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-openai-compatible-speaker">
                    发音人（Voice）
                  </label>
                  <input
                    id="tts-openai-compatible-speaker"
                    type="text"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    placeholder={DEFAULT_EDGE_TTS_VOICE}
                    disabled={disabled}
                  />
                  <p className="settings-field-hint">
                    Edge-TTS 示例：{DEFAULT_EDGE_TTS_VOICE}（晓晓）、
                    zh-CN-YunxiNeural（云希）。运行根目录{' '}
                    <code>npm run dev</code> 即可，无需单独装 openai-edge-tts。
                  </p>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-openai-compatible-speed">
                    Speed (0.25 - 4.0)
                  </label>
                  <input
                    id="tts-openai-compatible-speed"
                    type="number"
                    min="0.25"
                    max="4"
                    step="0.05"
                    value={settings.tts.openAiCompatibleSpeed || ''}
                    onChange={(e) =>
                      updateOpenAiCompatibleSpeed(e.target.value)
                    }
                    placeholder="1.0"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'voicevox' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-voicevox-speaker">发音人</label>
                  <select
                    id="tts-voicevox-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {voicevoxSpeakers.length > 0 ? (
                      voicevoxSpeakers.flatMap((sp) =>
                        (sp.styles || []).map((style) => (
                          <option
                            key={`${sp.speaker_uuid}-${style.id}`}
                            value={String(style.id)}
                          >
                            {sp.name} - {style.name}
                          </option>
                        )),
                      )
                    ) : (
                      <option value="">正在从服务器获取…</option>
                    )}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-voicevox-url">API 地址</label>
                  <input
                    id="tts-voicevox-url"
                    type="text"
                    value={settings.tts.voicevoxApiUrl || DEFAULT_VOICEVOX_API_URL}
                    onChange={(e) => updateVoicevoxApiUrl(e.target.value)}
                    placeholder="http://localhost:50021"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'voicepeak' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-voicepeak-speaker">发音人</label>
                  <select
                    id="tts-voicepeak-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {VOICEPEAK_SPEAKERS.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-voicepeak-url">API 地址</label>
                  <input
                    id="tts-voicepeak-url"
                    type="text"
                    value={settings.tts.voicepeakApiUrl || ''}
                    onChange={(e) => updateVoicepeakApiUrl(e.target.value)}
                    placeholder="http://localhost:20202"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'aivisSpeech' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-aivis-speaker">发音人</label>
                  <select
                    id="tts-aivis-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={disabled}
                  >
                    {aivisSpeakers.length > 0 ? (
                      aivisSpeakers.flatMap((sp) =>
                        (sp.styles || []).map((style) => (
                          <option
                            key={`${sp.speaker_uuid}-${style.id}`}
                            value={String(style.id)}
                          >
                            {sp.name} - {style.name}
                          </option>
                        )),
                      )
                    ) : (
                      <option value="">正在从服务器获取…</option>
                    )}
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-aivis-url">API 地址</label>
                  <input
                    id="tts-aivis-url"
                    type="text"
                    value={settings.tts.aivisSpeechApiUrl || DEFAULT_AIVIS_SPEECH_API_URL}
                    onChange={(e) => updateAivisSpeechApiUrl(e.target.value)}
                    placeholder="http://localhost:10101"
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {settings.tts.engine === 'minimax' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-minimax-apikey">API 密钥</label>
                  <input
                    id="tts-minimax-apikey"
                    type="password"
                    value={settings.tts.minimaxApiKey || ''}
                    onChange={(e) => updateMinimaxApiKey(e.target.value)}
                    placeholder="MiniMax API 密钥"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-minimax-groupid">Group ID</label>
                  <input
                    id="tts-minimax-groupid"
                    type="text"
                    value={settings.tts.minimaxGroupId || ''}
                    onChange={(e) => updateMinimaxGroupId(e.target.value)}
                    placeholder="MiniMax Group ID"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-minimax-speaker">
                    Speaker (Endpoint: global 固定)
                  </label>
                  <select
                    id="tts-minimax-speaker"
                    value={settings.tts.speaker}
                    onChange={(e) => updateTTSSpeaker(e.target.value)}
                    disabled={
                      disabled ||
                      !settings.tts.minimaxApiKey ||
                      minimaxVoices.length === 0
                    }
                  >
                    {!settings.tts.minimaxApiKey && (
                      <option value="">
                        输入 API 密钥后可获取列表
                      </option>
                    )}
                    {settings.tts.minimaxApiKey && isFetchingMinimaxVoices && (
                      <option value="">正在获取发音人列表…</option>
                    )}
                    {settings.tts.minimaxApiKey &&
                      !isFetchingMinimaxVoices &&
                      minimaxVoices.length === 0 && (
                        <option value="">无法获取列表</option>
                      )}
                    {minimaxVoices.map((voice) => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.voice_name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {settings.tts.engine === 'aivisCloud' && (
              <>
                <div className="settings-field">
                  <label htmlFor="tts-aiviscloud-apikey">API 密钥</label>
                  <input
                    id="tts-aiviscloud-apikey"
                    type="password"
                    value={settings.tts.aivisCloudApiKey || ''}
                    onChange={(e) => updateAivisCloudApiKey(e.target.value)}
                    placeholder="Aivis Cloud API 密钥"
                    disabled={disabled}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="tts-aiviscloud-preset">音色</label>
                  <select
                    id="tts-aiviscloud-preset"
                    value={selectedAivisCloudPresetId}
                    onChange={(e) =>
                      handleAivisCloudPresetChange(e.target.value)
                    }
                    disabled={disabled}
                  >
                    {AIVIS_CLOUD_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {fetchError &&
              (settings.tts.engine === 'voicevox' ||
                settings.tts.engine === 'aivisSpeech' ||
                settings.tts.engine === 'minimax') && (
                <div
                  style={{
                    color: '#e94560',
                    fontSize: '0.75rem',
                    marginTop: 4,
                  }}
                >
                  {fetchError}
                </div>
              )}
      </>
    </SettingsSectionShell>
  );
}
