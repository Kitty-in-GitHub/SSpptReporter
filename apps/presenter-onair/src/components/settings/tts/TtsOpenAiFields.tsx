import { OPENAI_SPEAKERS } from '../settingsConstants';
import type { TtsOpenAiFieldsProps } from './types';

export function TtsOpenAiFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateLLMApiKey,
  getApiKeyForProvider,
}: TtsOpenAiFieldsProps) {
  return (
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
  );
}
