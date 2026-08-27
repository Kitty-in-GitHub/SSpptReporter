import {
  DEFAULT_EDGE_TTS_API_URL,
  DEFAULT_EDGE_TTS_API_URL_DIRECT,
  DEFAULT_EDGE_TTS_MODEL,
  DEFAULT_EDGE_TTS_VOICE,
} from '../../../lib/voiceOptions';
import type { TtsOpenAiCompatibleFieldsProps } from './types';

export function TtsOpenAiCompatibleFields({
  disabled,
  settings,
  updateTTSSpeaker,
  updateOpenAiCompatibleApiKey,
  updateOpenAiCompatibleApiUrl,
  updateOpenAiCompatibleModel,
  updateOpenAiCompatibleSpeed,
}: TtsOpenAiCompatibleFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-openai-compatible-apikey">API 密钥 (optional)</label>
        <input
          id="tts-openai-compatible-apikey"
          type="password"
          value={settings.tts.openAiCompatibleApiKey || ''}
          onChange={(e) => updateOpenAiCompatibleApiKey(e.target.value)}
          placeholder="留空则不发送 Authorization 头（Edge-TTS 本地网关通常可留空）"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-openai-compatible-url">接口地址</label>
        <input
          id="tts-openai-compatible-url"
          type="text"
          value={settings.tts.openAiCompatibleApiUrl || DEFAULT_EDGE_TTS_API_URL}
          onChange={(e) => updateOpenAiCompatibleApiUrl(e.target.value)}
          placeholder={DEFAULT_EDGE_TTS_API_URL}
          disabled={disabled}
        />
        <p className="settings-field-hint">
          开发默认走同源代理 {DEFAULT_EDGE_TTS_API_URL}（需{' '}
          <code>npm run dev</code> 同时起 TTS 网关）。直连网关可用{' '}
          {DEFAULT_EDGE_TTS_API_URL_DIRECT}。
        </p>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-openai-compatible-model">模型</label>
        <input
          id="tts-openai-compatible-model"
          type="text"
          value={settings.tts.openAiCompatibleModel || DEFAULT_EDGE_TTS_MODEL}
          onChange={(e) => updateOpenAiCompatibleModel(e.target.value)}
          placeholder={DEFAULT_EDGE_TTS_MODEL}
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-openai-compatible-speaker">发音人（Voice）</label>
        <input
          id="tts-openai-compatible-speaker"
          type="text"
          value={settings.tts.speaker}
          onChange={(e) => updateTTSSpeaker(e.target.value)}
          placeholder={DEFAULT_EDGE_TTS_VOICE}
          disabled={disabled}
        />
        <p className="settings-field-hint">
          Edge-TTS 示例：{DEFAULT_EDGE_TTS_VOICE}（晓晓）、
          zh-CN-YunxiNeural（云希）。运行根目录 <code>npm run dev</code>{' '}
          即可，无需单独装 openai-edge-tts。
        </p>
      </div>
      <div className="settings-field">
        <label htmlFor="tts-openai-compatible-speed">Speed (0.25 - 4.0)</label>
        <input
          id="tts-openai-compatible-speed"
          type="number"
          min="0.25"
          max="4"
          step="0.05"
          value={settings.tts.openAiCompatibleSpeed || ''}
          onChange={(e) => updateOpenAiCompatibleSpeed(e.target.value)}
          placeholder="1.0"
          disabled={disabled}
        />
      </div>
    </>
  );
}
