import {
  XAI_BIT_RATES,
  XAI_CODECS,
  XAI_SAMPLE_RATES,
  XAI_SPEAKERS,
} from '../settingsConstants';
import type { TtsXaiFieldsProps } from './types';

export function TtsXaiFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateLLMApiKey,
  getApiKeyForProvider,
  updateXaiLanguage,
  updateXaiCodec,
  updateXaiSampleRate,
  updateXaiBitRate,
}: TtsXaiFieldsProps) {
  return (
    <>
      {settings.llm.provider !== 'xai' && (
        <div className="settings-field">
          <label htmlFor="tts-xai-apikey">API 密钥 (xAI)</label>
          <input
            id="tts-xai-apikey"
            type="password"
            value={getApiKeyForProvider('xai')}
            onChange={(e) => updateLLMApiKey('xai', e.target.value)}
            placeholder="xai-..."
            disabled={disabled}
          />
        </div>
      )}
      <div className="settings-field">
        <label htmlFor="tts-xai-speaker">发音人</label>
        <select
          id="tts-xai-speaker"
          value={settings.tts.speaker}
          onChange={(e) => updateTTSSpeaker(e.target.value)}
          disabled={disabled}
        >
          {XAI_SPEAKERS.map((speaker) => (
            <option key={speaker} value={speaker}>
              {speaker}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-xai-language">语言</label>
        <input
          id="tts-xai-language"
          type="text"
          value={settings.tts.xaiLanguage || ''}
          onChange={(e) => updateXaiLanguage(e.target.value)}
          placeholder="auto"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-xai-codec">编码</label>
        <select
          id="tts-xai-codec"
          value={settings.tts.xaiCodec || 'mp3'}
          onChange={(e) => updateXaiCodec(e.target.value)}
          disabled={disabled}
        >
          {XAI_CODECS.map((codec) => (
            <option key={codec} value={codec}>
              {codec}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-xai-sample-rate">采样率</label>
        <select
          id="tts-xai-sample-rate"
          value={String(settings.tts.xaiSampleRate || 24000)}
          onChange={(e) =>
            updateXaiSampleRate(Number.parseInt(e.target.value, 10))
          }
          disabled={disabled}
        >
          {XAI_SAMPLE_RATES.map((sampleRate) => (
            <option key={sampleRate} value={sampleRate}>
              {sampleRate}
            </option>
          ))}
        </select>
      </div>
      {(settings.tts.xaiCodec || 'mp3') === 'mp3' && (
        <div className="settings-field">
          <label htmlFor="tts-xai-bit-rate">比特率</label>
          <select
            id="tts-xai-bit-rate"
            value={String(settings.tts.xaiBitRate || 128000)}
            onChange={(e) =>
              updateXaiBitRate(Number.parseInt(e.target.value, 10))
            }
            disabled={disabled}
          >
            {XAI_BIT_RATES.map((bitRate) => (
              <option key={bitRate} value={bitRate}>
                {bitRate}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
