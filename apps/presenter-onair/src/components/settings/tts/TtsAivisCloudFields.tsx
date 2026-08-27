import { AIVIS_CLOUD_PRESETS } from '../settingsConstants';
import type { TtsAivisCloudFieldsProps } from './types';

export function TtsAivisCloudFields({
  disabled,
  settings,
  updateAivisCloudApiKey,
  selectedAivisCloudPresetId,
  handleAivisCloudPresetChange,
}: TtsAivisCloudFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-aiviscloud-apikey">API 密钥</label>
        <input
          id="tts-aiviscloud-apikey"
          type="password"
          value={settings.tts.aivisCloudApiKey || ''}
          onChange={(e) => updateAivisCloudApiKey(e.target.value)}
          placeholder="Aivis Cloud API 密钥"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-aiviscloud-preset">音色</label>
        <select
          id="tts-aiviscloud-preset"
          value={selectedAivisCloudPresetId}
          onChange={(e) => handleAivisCloudPresetChange(e.target.value)}
          disabled={disabled}
        >
          {AIVIS_CLOUD_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
