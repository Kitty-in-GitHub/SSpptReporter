import {
  INWORLD_AUDIO_ENCODINGS,
  INWORLD_DELIVERY_MODES,
  INWORLD_MODELS,
} from '../settingsConstants';
import type { TtsInworldFieldsProps } from './types';

export function TtsInworldFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateTtsField,
  inworldVoices,
  isFetchingInworldVoices,
}: TtsInworldFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-inworld-apikey">API 密钥</label>
        <input
          id="tts-inworld-apikey"
          type="password"
          value={settings.tts.inworldApiKey || ''}
          onChange={(e) => updateTtsField('inworldApiKey', e.target.value)}
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
          onChange={(e) => updateTtsField('inworldApiUrl', e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-inworld-model">模型</label>
        <select
          id="tts-inworld-model"
          value={settings.tts.inworldModel || INWORLD_MODELS[0]}
          onChange={(e) => updateTtsField('inworldModel', e.target.value)}
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
            settings.tts.inworldAudioEncoding || INWORLD_AUDIO_ENCODINGS[0]
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
          onChange={(e) => updateTtsField('inworldLanguage', e.target.value)}
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
          onChange={(e) => updateTtsField('inworldBitRate', e.target.value)}
          placeholder="default"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-inworld-speaking-rate">Speaking Rate</label>
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
              e.target.value as 'default' | 'STABLE' | 'BALANCED' | 'CREATIVE',
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
          onChange={(e) => updateTtsField('inworldTemperature', e.target.value)}
          placeholder="default"
          disabled={disabled}
        />
      </div>
    </>
  );
}
