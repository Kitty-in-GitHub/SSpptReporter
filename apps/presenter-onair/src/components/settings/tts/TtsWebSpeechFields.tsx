import type { TtsWebSpeechFieldsProps } from './types';

export function TtsWebSpeechFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateTtsField,
  webSpeechVoices,
  isFetchingWebSpeechVoices,
  fetchError,
}: TtsWebSpeechFieldsProps) {
  return (
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
          onChange={(e) => updateTtsField('webSpeechLanguage', e.target.value)}
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
          onChange={(e) => updateTtsField('webSpeechRate', e.target.value)}
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
          onChange={(e) => updateTtsField('webSpeechPitch', e.target.value)}
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
          onChange={(e) => updateTtsField('webSpeechVolume', e.target.value)}
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
  );
}
