import { UI_SETTINGS } from '../../constants/uiZh';
import type { AvatarPresenterController } from '../../hooks/useAvatarPresenter';
import type { CameraDeviceOption } from '../../hooks/useCameraDevices';
import type { FaceCaptureMouthDriver, VisualSettings } from '../../types/settings';
import type { FaceCaptureFrame } from '../../lib/avatar/faceCaptureTypes';
import { useEffect, useRef, type RefObject } from 'react';
import { AvatarShell } from '../AvatarShell';
import { AppToolbar } from '../present/AppToolbar';

interface CameraPreviewProps {
  stream: MediaStream | null;
  devices: CameraDeviceOption[];
  labelsHidden: boolean;
  deviceId: string;
  onDeviceChange?: (deviceId: string) => void;
}

/**
 * 面捕摄像头预览：直接复用 `useFaceCapture` 已拿到的流。
 * 不新开 getUserMedia —— 同一设备通常不允许被两个流同时独占。
 */
function CameraPreview({
  stream,
  devices,
  labelsHidden,
  deviceId,
  onDeviceChange,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.srcObject = stream;
    if (stream) {
      void video.play().catch(() => {
        // 自动播放被拒时忽略：用户可见预览为黑屏，可手动点开重试
      });
    }
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  const track = stream?.getVideoTracks()[0] ?? null;
  const trackSettings = track?.getSettings();
  const resolution =
    trackSettings?.width && trackSettings?.height
      ? `${trackSettings.width}×${trackSettings.height}`
      : '';

  return (
    <div className="mocap-camera-preview">
      <video
        ref={videoRef}
        className="mocap-camera-preview-video"
        autoPlay
        muted
        playsInline
      />
      <div className="mocap-camera-preview-meta">
        {onDeviceChange ? (
          <select
            value={deviceId}
            onChange={(event) => onDeviceChange(event.target.value)}
            aria-label="选择摄像头"
          >
            <option value="">系统默认</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        ) : null}
        <span>
          {stream
            ? [track?.label || '未知设备', resolution]
                .filter(Boolean)
                .join(' · ')
            : '尚未连接摄像头（检查 设置 → 面捕 的「摄像头」选项）'}
        </span>
        {labelsHidden ? (
          <em>设备名不可见：尚未授权摄像头</em>
        ) : null}
      </div>
    </div>
  );
}

interface MocapPanelProps {
  onToggleSettings: () => void;
  mouthLevelRef: RefObject<number>;
  isSpeaking: boolean;
  avatarPresenter: AvatarPresenterController;
  vrmUrl: string | null;
  vrmResolveError?: string | null;
  vrmResolving?: boolean;
  backgroundImageUrl?: string | null;
  visual: VisualSettings;
  faceCaptureRef: RefObject<FaceCaptureFrame | null>;
  mouthDriver: FaceCaptureMouthDriver;
  onMouthDriverChange: (driver: FaceCaptureMouthDriver) => void;
  faceCaptureError?: string | null;
  faceCaptureRunning?: boolean;
  /** 面捕已获取的摄像头流（供预览） */
  captureStream?: MediaStream | null;
  showCameraPreview?: boolean;
  onToggleCameraPreview?: () => void;
  /** 可选摄像头列表（预览窗里的切换下拉） */
  cameraDevices?: CameraDeviceOption[];
  cameraLabelsHidden?: boolean;
  faceCaptureDeviceId?: string;
  onFaceCaptureDeviceChange?: (deviceId: string) => void;
  partialCaption?: string;
}

export function MocapPanel({
  onToggleSettings,
  mouthLevelRef,
  isSpeaking,
  avatarPresenter,
  vrmUrl,
  vrmResolveError,
  vrmResolving,
  backgroundImageUrl,
  visual,
  faceCaptureRef,
  mouthDriver,
  onMouthDriverChange,
  faceCaptureError,
  faceCaptureRunning = false,
  captureStream = null,
  showCameraPreview = false,
  onToggleCameraPreview,
  cameraDevices = [],
  cameraLabelsHidden = false,
  faceCaptureDeviceId = '',
  onFaceCaptureDeviceChange,
  partialCaption = '',
}: MocapPanelProps) {
  const panelStyle =
    visual.backgroundMode === 'green'
      ? { backgroundColor: '#00ff00' }
      : visual.backgroundMode === 'transparent'
        ? { backgroundColor: 'transparent' }
        : backgroundImageUrl
          ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined;

  return (
    <div className="chat-panel chat-panel-broadcast mocap-panel" style={panelStyle}>
      {/* 放在工具条之前：底栏是 flex-end，预览正好贴在「摄像头」按钮上方 */}
      {showCameraPreview ? (
        <CameraPreview
          stream={captureStream}
          devices={cameraDevices}
          labelsHidden={cameraLabelsHidden}
          deviceId={faceCaptureDeviceId}
          onDeviceChange={onFaceCaptureDeviceChange}
        />
      ) : null}

      <AppToolbar
        onToggleSettings={onToggleSettings}
        settingsAriaLabel={UI_SETTINGS.ariaLabel}
        title="直播皮套"
      >
        <div className="mocap-toolbar-controls">
          {onToggleCameraPreview ? (
            <button
              type="button"
              className={`mocap-camera-toggle${showCameraPreview ? ' is-active' : ''}`}
              onClick={onToggleCameraPreview}
              aria-pressed={showCameraPreview}
            >
              摄像头
            </button>
          ) : null}
          <label className="mocap-mouth-driver">
            <span>口型</span>
            <select
              value={mouthDriver}
              onChange={(e) =>
                onMouthDriverChange(e.target.value as FaceCaptureMouthDriver)
              }
            >
              <option value="faceCapture">面捕</option>
              <option value="tts">TTS</option>
            </select>
          </label>
          <span
            className={`mocap-status${faceCaptureRunning ? ' is-active' : ''}${faceCaptureError ? ' is-error' : ''}`}
          >
            {faceCaptureError
              ? faceCaptureError
              : faceCaptureRunning
                ? '面捕运行中'
                : captureStream
                  ? '摄像头已连接，等待面捕引擎…'
                  : '正在连接摄像头…'}
          </span>
        </div>
      </AppToolbar>

      <AvatarShell
        presenter={avatarPresenter}
        mouthLevelRef={mouthLevelRef}
        isSpeaking={isSpeaking}
        vrmUrl={vrmUrl}
        vrmResolveError={vrmResolveError}
        vrmResolving={vrmResolving}
        backgroundImageUrl={backgroundImageUrl}
        backgroundMode={visual.backgroundMode}
        showExpressionControls={false}
        faceCaptureRef={faceCaptureRef}
        faceCaptureActive={true}
        mouthDriver={mouthDriver}
      />

      {partialCaption ? (
        <div className="broadcast-caption">{partialCaption}</div>
      ) : null}
    </div>
  );
}
