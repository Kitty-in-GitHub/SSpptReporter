import { GRADIUM_OUTPUT_FORMATS, GRADIUM_VOICES } from '../settingsConstants';
import type { TtsGradiumFieldsProps } from './types';

export function TtsGradiumFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateTtsField,
}: TtsGradiumFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-gradium-apikey">API 密钥</label>
        <input
          id="tts-gradium-apikey"
          type="password"
          value={settings.tts.gradiumApiKey || ''}
          onChange={(e) => updateTtsField('gradiumApiKey', e.target.value)}
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
          onChange={(e) => updateTtsField('gradiumApiUrl', e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-gradium-output">输出格式</label>
        <select
          id="tts-gradium-output"
          value={settings.tts.gradiumOutputFormat || 'wav'}
          onChange={(e) => updateTtsField('gradiumOutputFormat', e.target.value)}
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
          onChange={(e) => updateTtsField('gradiumTemperature', e.target.value)}
          placeholder="default"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-gradium-similarity">Voice Similarity</label>
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
          onChange={(e) => updateTtsField('gradiumPaddingBonus', e.target.value)}
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
          onChange={(e) => updateTtsField('gradiumRewriteRules', e.target.value)}
          placeholder="en"
          disabled={disabled}
        />
      </div>
    </>
  );
}
