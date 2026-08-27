import { useTtsSpeakerLists } from '../../hooks/settings/useTtsSpeakerLists';
import type { TTSEngineOption } from '../../types/settings';
import type { SettingsHook } from './SettingsSectionShell';
import { SettingsSectionShell } from './SettingsSectionShell';
import { TTS_ENGINES } from './settingsConstants';
import { TtsAivisCloudFields } from './tts/TtsAivisCloudFields';
import { TtsAivisSpeechFields } from './tts/TtsAivisSpeechFields';
import { TtsElevenLabsFields } from './tts/TtsElevenLabsFields';
import { TtsGeminiFields } from './tts/TtsGeminiFields';
import { TtsGradiumFields } from './tts/TtsGradiumFields';
import { TtsInworldFields } from './tts/TtsInworldFields';
import { TtsMinimaxFields } from './tts/TtsMinimaxFields';
import { TtsOpenAiCompatibleFields } from './tts/TtsOpenAiCompatibleFields';
import { TtsOpenAiFields } from './tts/TtsOpenAiFields';
import { TtsPiperPlusFields } from './tts/TtsPiperPlusFields';
import { TtsUnrealSpeechFields } from './tts/TtsUnrealSpeechFields';
import { TtsVoicepeakFields } from './tts/TtsVoicepeakFields';
import { TtsVoicevoxFields } from './tts/TtsVoicevoxFields';
import { TtsWebSpeechFields } from './tts/TtsWebSpeechFields';
import { TtsXaiFields } from './tts/TtsXaiFields';

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

export function TtsSettingsSection(props: TtsSettingsSectionProps) {
  const {
    disabled,
    isExpanded,
    onToggleExpand,
    settings,
    updateTTSEngine,
    updateTTSSpeaker,
    updateAivisCloudModelUuid,
    updateAivisCloudSpeakerUuid,
    updateAivisCloudStyleId,
  } = props;

  const speakerLists = useTtsSpeakerLists({
    tts: settings.tts,
    updateTTSSpeaker,
    updateAivisCloudModelUuid,
    updateAivisCloudSpeakerUuid,
    updateAivisCloudStyleId,
  });

  const { fetchError } = speakerLists;
  const engine = settings.tts.engine;
  const fieldProps = { disabled, settings };

  const renderEngineFields = () => {
    switch (engine) {
      case 'openai':
        return <TtsOpenAiFields {...fieldProps} {...props} />;
      case 'geminiTts':
        return <TtsGeminiFields {...fieldProps} {...props} />;
      case 'xai':
        return <TtsXaiFields {...fieldProps} {...props} />;
      case 'unrealSpeech':
        return <TtsUnrealSpeechFields {...fieldProps} {...props} />;
      case 'elevenLabs':
        return <TtsElevenLabsFields {...fieldProps} {...props} {...speakerLists} />;
      case 'inworld':
        return <TtsInworldFields {...fieldProps} {...props} {...speakerLists} />;
      case 'gradium':
        return <TtsGradiumFields {...fieldProps} {...props} />;
      case 'piperPlus':
        return <TtsPiperPlusFields {...fieldProps} {...props} />;
      case 'webSpeech':
        return <TtsWebSpeechFields {...fieldProps} {...props} {...speakerLists} />;
      case 'openaiCompatible':
        return <TtsOpenAiCompatibleFields {...fieldProps} {...props} />;
      case 'voicevox':
        return <TtsVoicevoxFields {...fieldProps} {...props} {...speakerLists} />;
      case 'voicepeak':
        return <TtsVoicepeakFields {...fieldProps} {...props} />;
      case 'aivisSpeech':
        return <TtsAivisSpeechFields {...fieldProps} {...props} {...speakerLists} />;
      case 'minimax':
        return <TtsMinimaxFields {...fieldProps} {...props} {...speakerLists} />;
      case 'aivisCloud':
        return <TtsAivisCloudFields {...fieldProps} {...props} {...speakerLists} />;
      default:
        return null;
    }
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
            value={engine}
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

        {renderEngineFields()}

        {fetchError &&
          (engine === 'voicevox' ||
            engine === 'aivisSpeech' ||
            engine === 'minimax') && (
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
