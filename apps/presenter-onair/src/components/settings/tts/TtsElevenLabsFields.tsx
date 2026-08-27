import {
  ELEVENLABS_MODELS,
  ELEVENLABS_OUTPUT_FORMATS,
} from '../settingsConstants';
import type { TtsElevenLabsFieldsProps } from './types';

export function TtsElevenLabsFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateTtsField,
  elevenLabsVoices,
  isFetchingElevenLabsVoices,
}: TtsElevenLabsFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-eleven-apikey">API 密钥</label>
        <input
          id="tts-eleven-apikey"
          type="password"
          value={settings.tts.elevenLabsApiKey || ''}
          onChange={(e) => updateTtsField('elevenLabsApiKey', e.target.value)}
          placeholder="ElevenLabs API key"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-speaker">音色</label>
        <select
          id="tts-eleven-speaker"
          value={settings.tts.speaker}
          onChange={(e) => updateTTSSpeaker(e.target.value)}
          disabled={
            disabled ||
            !settings.tts.elevenLabsApiKey ||
            isFetchingElevenLabsVoices ||
            elevenLabsVoices.length === 0
          }
        >
          {!settings.tts.elevenLabsApiKey && (
            <option value="">请输入 API 密钥</option>
          )}
          {settings.tts.elevenLabsApiKey && isFetchingElevenLabsVoices && (
            <option value="">取得中...</option>
          )}
          {settings.tts.elevenLabsApiKey &&
            !isFetchingElevenLabsVoices &&
            elevenLabsVoices.length === 0 && (
              <option value="">无法获取音色列表</option>
            )}
          {elevenLabsVoices.map((voice) => (
            <option key={voice.voice_id} value={voice.voice_id}>
              {voice.category ? `${voice.name} (${voice.category})` : voice.name}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-url">API 地址</label>
        <input
          id="tts-eleven-url"
          type="text"
          value={settings.tts.elevenLabsApiUrl || ''}
          onChange={(e) => updateTtsField('elevenLabsApiUrl', e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-model">模型</label>
        <select
          id="tts-eleven-model"
          value={settings.tts.elevenLabsModel || ELEVENLABS_MODELS[0]}
          onChange={(e) => updateTtsField('elevenLabsModel', e.target.value)}
          disabled={disabled}
        >
          {ELEVENLABS_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-format">输出格式</label>
        <select
          id="tts-eleven-format"
          value={
            settings.tts.elevenLabsOutputFormat || ELEVENLABS_OUTPUT_FORMATS[0]
          }
          onChange={(e) =>
            updateTtsField('elevenLabsOutputFormat', e.target.value)
          }
          disabled={disabled}
        >
          {ELEVENLABS_OUTPUT_FORMATS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-language">语言代码</label>
        <input
          id="tts-eleven-language"
          type="text"
          value={settings.tts.elevenLabsLanguageCode || ''}
          onChange={(e) =>
            updateTtsField('elevenLabsLanguageCode', e.target.value)
          }
          placeholder="ja"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-stability">稳定性</label>
        <input
          id="tts-eleven-stability"
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={settings.tts.elevenLabsStability || ''}
          onChange={(e) => updateTtsField('elevenLabsStability', e.target.value)}
          placeholder="0.5"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-similarity">Similarity Boost</label>
        <input
          id="tts-eleven-similarity"
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={settings.tts.elevenLabsSimilarityBoost || ''}
          onChange={(e) =>
            updateTtsField('elevenLabsSimilarityBoost', e.target.value)
          }
          placeholder="0.75"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-style">风格</label>
        <input
          id="tts-eleven-style"
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={settings.tts.elevenLabsStyle || ''}
          onChange={(e) => updateTtsField('elevenLabsStyle', e.target.value)}
          placeholder="0"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-speed">语速</label>
        <input
          id="tts-eleven-speed"
          type="number"
          min="0.7"
          max="1.2"
          step="0.01"
          value={settings.tts.elevenLabsSpeed || ''}
          onChange={(e) => updateTtsField('elevenLabsSpeed', e.target.value)}
          placeholder="1.0"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-seed">随机种子</label>
        <input
          id="tts-eleven-seed"
          type="number"
          value={settings.tts.elevenLabsSeed || ''}
          onChange={(e) => updateTtsField('elevenLabsSeed', e.target.value)}
          placeholder="optional"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-speaker-boost">Speaker Boost</label>
        <select
          id="tts-eleven-speaker-boost"
          value={settings.tts.elevenLabsUseSpeakerBoost || 'default'}
          onChange={(e) =>
            updateTtsField(
              'elevenLabsUseSpeakerBoost',
              e.target.value as 'default' | 'true' | 'false',
            )
          }
          disabled={disabled}
        >
          <option value="default">Default</option>
          <option value="true">On</option>
          <option value="false">Off</option>
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-eleven-normalization">Text Normalization</label>
        <select
          id="tts-eleven-normalization"
          value={settings.tts.elevenLabsApplyTextNormalization || 'default'}
          onChange={(e) =>
            updateTtsField(
              'elevenLabsApplyTextNormalization',
              e.target.value as 'default' | 'auto' | 'on' | 'off',
            )
          }
          disabled={disabled}
        >
          <option value="default">Default</option>
          <option value="auto">auto</option>
          <option value="on">on</option>
          <option value="off">off</option>
        </select>
      </div>
    </>
  );
}
