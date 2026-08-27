import type { TtsPiperPlusFieldsProps } from './types';

export function TtsPiperPlusFields({
  disabled,
  settings,
  updatePiperPlusBasePath,
  updatePiperPlusModelConfigFile,
  updatePiperPlusModelFile,
  updatePiperPlusVoiceFile,
  updatePiperPlusSpeed,
  updatePiperPlusNoiseScale,
}: TtsPiperPlusFieldsProps) {
  return (
    <>
      <div className="settings-field">
        <label htmlFor="tts-piper-base-path">Assets Base Path</label>
        <input
          id="tts-piper-base-path"
          type="text"
          value={settings.tts.piperPlusBasePath || ''}
          onChange={(e) => updatePiperPlusBasePath(e.target.value)}
          placeholder="/piper/"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-piper-config">Model Config File</label>
        <input
          id="tts-piper-config"
          type="text"
          value={settings.tts.piperPlusModelConfigFile || ''}
          onChange={(e) => updatePiperPlusModelConfigFile(e.target.value)}
          placeholder="tsukuyomi-config.json"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-piper-model">Model File</label>
        <input
          id="tts-piper-model"
          type="text"
          value={settings.tts.piperPlusModelFile || ''}
          onChange={(e) => updatePiperPlusModelFile(e.target.value)}
          placeholder="tsukuyomi-wavlm-300epoch.onnx"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-piper-voice">HTS Voice File</label>
        <input
          id="tts-piper-voice"
          type="text"
          value={settings.tts.piperPlusVoiceFile || ''}
          onChange={(e) => updatePiperPlusVoiceFile(e.target.value)}
          placeholder="mei_normal.htsvoice"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-piper-speed">语速</label>
        <input
          id="tts-piper-speed"
          type="number"
          step="0.05"
          value={settings.tts.piperPlusSpeed || ''}
          onChange={(e) => updatePiperPlusSpeed(e.target.value)}
          placeholder="1.0"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <label htmlFor="tts-piper-noise-scale">Noise Scale</label>
        <input
          id="tts-piper-noise-scale"
          type="number"
          step="0.05"
          value={settings.tts.piperPlusNoiseScale || ''}
          onChange={(e) => updatePiperPlusNoiseScale(e.target.value)}
          placeholder="0.667"
          disabled={disabled}
        />
      </div>
      <div className="settings-field">
        <small>
          运行时资源因体积与许可未随仓库分发。请参阅 README 的 Piper Plus 说明，将 `dist/`、`src/`、`assets/`、`models/` 放到 `public/piper/`。
        </small>
      </div>
    </>
  );
}
