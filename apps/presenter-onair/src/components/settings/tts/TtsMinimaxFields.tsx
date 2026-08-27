import type { TtsMinimaxFieldsProps } from './types';

export function TtsMinimaxFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateMinimaxApiKey,
  updateMinimaxGroupId,
  minimaxVoices,
  isFetchingMinimaxVoices,
}: TtsMinimaxFieldsProps) {
  return (
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
            <option value="">输入 API 密钥后可获取列表</option>
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
  );
}
