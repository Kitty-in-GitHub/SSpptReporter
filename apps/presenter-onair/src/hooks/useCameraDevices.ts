import { useEffect, useState } from 'react';

export interface CameraDeviceOption {
  deviceId: string;
  label: string;
}

interface CameraDeviceState {
  devices: CameraDeviceOption[];
  /** 有设备但全都没有名称 —— 通常是尚未授权摄像头 */
  labelsHidden: boolean;
}

const EMPTY: CameraDeviceState = { devices: [], labelsHidden: false };

/**
 * 列出可用摄像头。
 *
 * 关键陷阱：**未授权前浏览器会把 `label` 与 `deviceId` 都返回空串**（防指纹），
 * 此时下拉里只剩「摄像头 1 / 2 / 3」这种占位名，选中的其实是空 deviceId（回到系统默认）。
 * 所以这里把「标签是否可见」一并交给界面，用于提示用户先进面捕模式授权。
 *
 * `enabled` 变化时会重新枚举：在面捕页授权后回到设置页展开面捕分区，即可看到真实设备名。
 */
export function useCameraDevices(enabled: boolean): CameraDeviceState {
  const [state, setState] = useState<CameraDeviceState>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) {
          return;
        }
        const inputs = all.filter(
          (device) => device.kind === 'videoinput' && device.deviceId,
        );
        setState({
          devices: inputs.map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `摄像头 ${index + 1}`,
          })),
          labelsHidden: inputs.length > 0 && inputs.every((d) => !d.label),
        });
      } catch {
        if (!cancelled) {
          setState(EMPTY);
        }
      }
    };

    void load();
    navigator.mediaDevices?.addEventListener('devicechange', load);

    return () => {
      cancelled = true;
      navigator.mediaDevices?.removeEventListener('devicechange', load);
    };
  }, [enabled]);

  return state;
}
