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
  updateFaceCaptureVideoBackend,
  updateFaceCaptureSmoothing,
}: FaceCaptureSettingsSectionProps) {
  const { devices: cameraOptions, labelsHidden } = useCameraDevices(isExpanded);

  return (
    <SettingsSectionShell
      title="摄像头（仅面捕模式）"
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      disabled={disabled}
    >
      <p className="settings-field-hint">
        采集与面捕引擎都只在「面捕」会话模式里跑。引擎的取帧源就是采集模块的探针，
        所以「画面流动中」是引擎能出帧的前提。
      </p>

      <div className="settings-field">
        <label htmlFor="face-capture-video-backend">采集后端</label>
        <select
          id="face-capture-video-backend"
          value={settings.faceCapture.videoBackend}
          onChange={(e) =>
            updateFaceCaptureVideoBackend(
              e.target.value as AppSettings['faceCapture']['videoBackend'],
            )
          }
          disabled={disabled}
        >
          <option value="videoFrameCallback">
            requestVideoFrameCallback（默认）
          </option>
          <option value="grabFrame">ImageCapture.grabFrame（对照用）</option>
        </select>
      </div>
      <p className="settings-field-hint">
        两条是 Chromium 里不同的取帧路径。若默认那条一直卡，切到 grabFrame
        对照：它走静态抓帧实现，可能绕开视频流路径的问题。切换会重开摄像头。
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
      <p className="settings-field-hint">
        越大越稳、越迟钝（抖动小但跟手差）。两种口型驱动下头眼跟踪都吃这个值。
      </p>

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
        画面下方会标出实际设备名、分辨率与实测帧率。
      </p>
    </SettingsSectionShell>
  );
}
