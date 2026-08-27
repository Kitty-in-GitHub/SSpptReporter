import type { VoiceEngineVoice } from '@aituber-onair/core';
import type { AppSettings } from '../../../types/settings';
import type { SettingsHook } from '../SettingsSectionShell';
import type {
  ElevenLabsVoice,
  InworldVoice,
  MinimaxVoice,
  VoiceSpeaker,
} from '../settingsConstants';

export type TtsEngineFieldsBaseProps = {
  disabled: boolean;
  settings: SettingsHook['settings'];
};

export type TtsSettings = AppSettings['tts'];

export type TtsSpeakerUpdaterProps = Pick<SettingsHook, 'updateTTSSpeaker'>;

export type TtsFieldUpdaterProps = Pick<SettingsHook, 'updateTtsField'>;

export type TtsApiKeyProps = Pick<
  SettingsHook,
  'updateLLMApiKey' | 'getApiKeyForProvider'
>;

export type TtsSpeakerListProps = {
  voicevoxSpeakers: VoiceSpeaker[];
  aivisSpeakers: VoiceSpeaker[];
  minimaxVoices: MinimaxVoice[];
  elevenLabsVoices: ElevenLabsVoice[];
  inworldVoices: InworldVoice[];
  webSpeechVoices: VoiceEngineVoice[];
  isFetchingMinimaxVoices: boolean;
  isFetchingElevenLabsVoices: boolean;
  isFetchingInworldVoices: boolean;
  isFetchingWebSpeechVoices: boolean;
  selectedAivisCloudPresetId: string;
  handleAivisCloudPresetChange: (presetId: string) => void;
  fetchError: string;
};

export type TtsOpenAiFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsApiKeyProps;

export type TtsGeminiFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsApiKeyProps &
  Pick<
    SettingsHook,
    'updateGeminiTtsModel' | 'updateGeminiTtsLanguageCode' | 'updateGeminiTtsPrompt'
  >;

export type TtsXaiFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsApiKeyProps &
  Pick<
    SettingsHook,
    | 'updateXaiLanguage'
    | 'updateXaiCodec'
    | 'updateXaiSampleRate'
    | 'updateXaiBitRate'
  >;

export type TtsUnrealSpeechFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsFieldUpdaterProps;

export type TtsElevenLabsFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsFieldUpdaterProps &
  Pick<
    TtsSpeakerListProps,
    | 'elevenLabsVoices'
    | 'isFetchingElevenLabsVoices'
  >;

export type TtsInworldFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsFieldUpdaterProps &
  Pick<TtsSpeakerListProps, 'inworldVoices' | 'isFetchingInworldVoices'>;

export type TtsGradiumFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsFieldUpdaterProps;

export type TtsPiperPlusFieldsProps = TtsEngineFieldsBaseProps &
  Pick<
    SettingsHook,
    | 'updatePiperPlusBasePath'
    | 'updatePiperPlusModelConfigFile'
    | 'updatePiperPlusModelFile'
    | 'updatePiperPlusVoiceFile'
    | 'updatePiperPlusSpeed'
    | 'updatePiperPlusNoiseScale'
  >;

export type TtsWebSpeechFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  TtsFieldUpdaterProps &
  Pick<
    TtsSpeakerListProps,
    'webSpeechVoices' | 'isFetchingWebSpeechVoices' | 'fetchError'
  >;

export type TtsOpenAiCompatibleFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  Pick<
    SettingsHook,
    | 'updateOpenAiCompatibleApiKey'
    | 'updateOpenAiCompatibleApiUrl'
    | 'updateOpenAiCompatibleModel'
    | 'updateOpenAiCompatibleSpeed'
  >;

export type TtsVoicevoxFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  Pick<SettingsHook, 'updateVoicevoxApiUrl'> &
  Pick<TtsSpeakerListProps, 'voicevoxSpeakers'>;

export type TtsVoicepeakFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  Pick<SettingsHook, 'updateVoicepeakApiUrl'>;

export type TtsAivisSpeechFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  Pick<SettingsHook, 'updateAivisSpeechApiUrl'> &
  Pick<TtsSpeakerListProps, 'aivisSpeakers'>;

export type TtsMinimaxFieldsProps = TtsEngineFieldsBaseProps &
  TtsSpeakerUpdaterProps &
  Pick<SettingsHook, 'updateMinimaxApiKey' | 'updateMinimaxGroupId'> &
  Pick<TtsSpeakerListProps, 'minimaxVoices' | 'isFetchingMinimaxVoices'>;

export type TtsAivisCloudFieldsProps = TtsEngineFieldsBaseProps &
  Pick<SettingsHook, 'updateAivisCloudApiKey'> &
  Pick<
    TtsSpeakerListProps,
    'selectedAivisCloudPresetId' | 'handleAivisCloudPresetChange'
  >;
