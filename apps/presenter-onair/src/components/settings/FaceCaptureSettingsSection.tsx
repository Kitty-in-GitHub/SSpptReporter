import { useEffect, useState } from 'react';
import type { AppSettings } from '../../types/settings';
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
  const [cameraOptions, setCameraOptions] = useState<
    Array<{ deviceId: string; label: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    const loadDevices = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const videoInputs = devices
          .filter((device) => device.kind === 'videoinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `摄像头 ${index + 1}`,
          }));
        setCameraOptions(videoInputs);
      } catch {
        if (!cancelled) {
          setCameraOptions([]);
        }
      }
    };

    void loadDevices();
    navigator.mediaDevices?.addEventListener('devicechange', loadDevices);

    return () => {
      cancelled = true;
      navigator.mediaDevices?.removeEventListener('devicechange', loadDevices);
    };
  }, []);

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
        <span>显示摄像头预览提示</span>
      </label>
    </SettingsSectionShell>
  );
}
