import { GEMINI_TTS_MODELS, GEMINI_TTS_SPEAKERS } from '../settingsConstants';
import type { TtsGeminiFieldsProps } from './types';

export function TtsGeminiFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateLLMApiKey,
  getApiKeyForProvider,
  updateGeminiTtsModel,
  updateGeminiTtsLanguageCode,
  updateGeminiTtsPrompt,
}: TtsGeminiFieldsProps) {
  return (
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
          onChange={(e) => updateGeminiTtsLanguageCode(e.target.value)}
          placeholder="ja-JP"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-gemini-prompt">Style / Audio-tag Prompt</label>
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
  );
}
