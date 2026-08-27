import { DEFAULT_AIVIS_SPEECH_API_URL } from '../../../lib/voiceOptions';
import type { TtsAivisSpeechFieldsProps } from './types';

export function TtsAivisSpeechFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateAivisSpeechApiUrl,
  aivisSpeakers,
}: TtsAivisSpeechFieldsProps) {
  return (
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
  );
}
