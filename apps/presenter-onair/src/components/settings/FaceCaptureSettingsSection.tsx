import type { AppSettings } from '../../types/settings';
import { useCameraDevices } from '../../hooks/useCameraDevices';
import type { SettingsHook } from './SettingsSectionShell';
import { SettingsSectionShell } from './SettingsSectionShell';

export interface FaceCaptureSettingsSectionProps extends SettingsHook {
  settings: AppSettings;
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function FaceCaptureSettingsSection({
  settings,
  disabled,
  isExpanded,
  onToggleExpand,
  updateFaceCaptureMouthDriver,
  updateFaceCaptureDeviceId,
  updateFaceCaptureShowCameraPreview,
  updateFaceCaptureSmoothing,
}: FaceCaptureSettingsSectionProps) {
  const { devices: cameraOptions, labelsHidden } = useCameraDevices(isExpanded);

  return (
    <SettingsSectionShell
      title="面捕（仅面捕模式）"
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      disabled={disabled}
    >
      <p className="settings-field-hint">
        面捕仅在「面捕」会话模式生效；汇报模式不会启用摄像头跟踪。
      </p>

      <div className="settings-field">
        <label htmlFor="face-capture-mouth-driver">口型驱动</label>
        <select
          id="face-capture-mouth-driver"
          value={settings.faceCapture.mouthDriver}
          onChange={(e) =>
            updateFaceCaptureMouthDriver(
              e.target.value as AppSettings['faceCapture']['mouthDriver'],
            )
          }
          disabled={disabled}
        >
          <option value="faceCapture">面捕（真人说话）</option>
          <option value="tts">TTS（AI 播报口型）</option>
        </select>
      </div>

      <div className="settings-field">
        <label htmlFor="face-capture-device">摄像头</label>
        <select
          id="face-capture-device"
          value={settings.faceCapture.deviceId}
          onChange={(e) => updateFaceCaptureDeviceId(e.target.value)}
          disabled={disabled}
        >
          <option value="">系统默认</option>
          {cameraOptions.map((device) => (
            <option key={device.deviceId || device.label} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
      {labelsHidden ? (
        <p className="settings-field-hint">
          现在只显示「摄像头 1 / 2 / 3」这类占位名：浏览器在授权前不返回设备名称。
          先切到「面捕」页面走一次授权，再回来展开本分区，就能看到真实设备名。
        </p>
      ) : null}

      <div className="settings-field">
        <label htmlFor="face-capture-smoothing">
          平滑度 ({settings.faceCapture.smoothing.toFixed(2)})
        </label>
        <input
          id="face-capture-smoothing"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.faceCapture.smoothing}
          onChange={(e) =>
            updateFaceCaptureSmoothing(Number.parseFloat(e.target.value))
          }
          disabled={disabled}
        />
      </div>

      <label className="settings-checkbox-field">
        <input
          type="checkbox"
          checked={settings.faceCapture.showCameraPreview}
          onChange={(e) => updateFaceCaptureShowCameraPreview(e.target.checked)}
          disabled={disabled}
        />
        <span>显示摄像头预览</span>
      </label>
      <p className="settings-field-hint">
        预览画面出现在「面捕」页面上、「摄像头」按钮的正上方（该按钮也可随时开关）。
        画面下方会标出实际使用的设备名与分辨率，用来确认选中的是不是想要的摄像头。
      </p>
    </SettingsSectionShell>
  );
}
