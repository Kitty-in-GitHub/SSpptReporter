import { VOICEPEAK_SPEAKERS } from '../settingsConstants';
import type { TtsVoicepeakFieldsProps } from './types';

export function TtsVoicepeakFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateVoicepeakApiUrl,
}: TtsVoicepeakFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-voicepeak-speaker">发音人</label>
        <select
          id="tts-voicepeak-speaker"
          value={settings.tts.speaker}
          onChange={(e) => updateTTSSpeaker(e.target.value)}
          disabled={disabled}
        >
          {VOICEPEAK_SPEAKERS.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-voicepeak-url">API 地址</label>
        <input
          id="tts-voicepeak-url"
          type="text"
          value={settings.tts.voicepeakApiUrl || ''}
          onChange={(e) => updateVoicepeakApiUrl(e.target.value)}
          placeholder="http://localhost:20202"
          disabled={disabled}
        />
      </div>
    </>
  );
}
