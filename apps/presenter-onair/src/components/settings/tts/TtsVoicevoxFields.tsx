import { DEFAULT_VOICEVOX_API_URL } from '../../../lib/voiceOptions';
import type { TtsVoicevoxFieldsProps } from './types';

export function TtsVoicevoxFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateVoicevoxApiUrl,
  voicevoxSpeakers,
}: TtsVoicevoxFieldsProps) {
  return (
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
  );
}
