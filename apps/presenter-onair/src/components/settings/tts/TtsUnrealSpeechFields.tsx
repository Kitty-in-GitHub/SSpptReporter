import {
  UNREAL_SPEECH_CODECS,
  UNREAL_SPEECH_SPEAKERS,
} from '../settingsConstants';
import type { TtsUnrealSpeechFieldsProps } from './types';

export function TtsUnrealSpeechFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateTtsField,
}: TtsUnrealSpeechFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-unreal-apikey">API 密钥</label>
        <input
          id="tts-unreal-apikey"
          type="password"
          value={settings.tts.unrealSpeechApiKey || ''}
          onChange={(e) => updateTtsField('unrealSpeechApiKey', e.target.value)}
          placeholder="Unreal Speech API key"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-unreal-speaker">发音人</label>
        <select
          id="tts-unreal-speaker"
          value={settings.tts.speaker}
          onChange={(e) => updateTTSSpeaker(e.target.value)}
          disabled={disabled}
        >
          {UNREAL_SPEECH_SPEAKERS.map((speaker) => (
            <option key={speaker} value={speaker}>
              {speaker}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-unreal-url">API 地址</label>
        <input
          id="tts-unreal-url"
          type="text"
          value={settings.tts.unrealSpeechApiUrl || ''}
          onChange={(e) => updateTtsField('unrealSpeechApiUrl', e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-unreal-codec">编码</label>
        <select
          id="tts-unreal-codec"
          value={settings.tts.unrealSpeechCodec || 'libmp3lame'}
          onChange={(e) => updateTtsField('unrealSpeechCodec', e.target.value)}
          disabled={disabled}
        >
          {UNREAL_SPEECH_CODECS.map((codec) => (
            <option key={codec} value={codec}>
              {codec}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-unreal-bitrate">Bitrate</label>
        <input
          id="tts-unreal-bitrate"
          type="text"
          value={settings.tts.unrealSpeechBitrate || ''}
          onChange={(e) => updateTtsField('unrealSpeechBitrate', e.target.value)}
          placeholder="192k"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-unreal-speed">语速</label>
        <input
          id="tts-unreal-speed"
          type="number"
          step="0.05"
          value={settings.tts.unrealSpeechSpeed || ''}
          onChange={(e) => updateTtsField('unrealSpeechSpeed', e.target.value)}
          placeholder="default"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-unreal-pitch">音高</label>
        <input
          id="tts-unreal-pitch"
          type="number"
          step="0.05"
          value={settings.tts.unrealSpeechPitch || ''}
          onChange={(e) => updateTtsField('unrealSpeechPitch', e.target.value)}
          placeholder="default"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-unreal-temperature">温度</label>
        <input
          id="tts-unreal-temperature"
          type="number"
          step="0.05"
          value={settings.tts.unrealSpeechTemperature || ''}
          onChange={(e) =>
            updateTtsField('unrealSpeechTemperature', e.target.value)
          }
          placeholder="default"
          disabled={disabled}
        />
      </div>
    </>
  );
}
