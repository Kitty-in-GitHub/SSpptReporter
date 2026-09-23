import { UI_SETTINGS } from '../../constants/uiZh';
import type { AvatarPresenterController } from '../../hooks/useAvatarPresenter';
import type { CameraDeviceOption } from '../../hooks/useCameraDevices';
import type { FaceCaptureMouthDriver, VisualSettings } from '../../types/settings';
import type { FaceCaptureFrame } from '../../lib/avatar/faceCaptureTypes';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { AvatarShell } from '../AvatarShell';
import { AppToolbar } from '../present/AppToolbar';

interface PreviewStats {
  paused: boolean;
  readyState: number;
  /** requestVideoFrameCallback 计数：真正被呈现（画到屏幕上）的帧 */
  presented: number;
  /** getVideoPlaybackQuality().totalVideoFrames：被解码的帧 */
  decoded: number;
  currentTime: number;
  trackState: MediaStreamTrackState | 'none';
}

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
  const [playError, setPlayError] = useState<string | null>(null);
  /** 已呈现的帧数（由 requestVideoFrameCallback 累加） */
  const presentedFramesRef = useRef(0);
  /**
   * 判断「摄像头有没有在输出新帧」。
   * 不能只看画面内容变不变（人不动也像卡住），这里同时看三个与场景无关的信号：
   * 呈现帧计数 / `getVideoPlaybackQuality().totalVideoFrames` / `currentTime`，
   * 任一在推进即视为在出帧 —— 避免某个 API 在 MediaStream 源上不更新导致误报。
   */
  const [isFlowing, setIsFlowing] = useState(false);
  /** 原始读数：出帧异常时用来区分「没解码」「解码后停住」「被暂停」 */
  const [stats, setStats] = useState<PreviewStats | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.srcObject = stream;
    setPlayError(null);
    if (stream) {
      void video.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setPlayError(
          error instanceof Error ? error.message : '预览播放被浏览器拒绝',
        );
      });
    }
    // 不做 srcObject = null 的清理：严格模式在开发下会把该 effect 跑两遍，
    // 中间那次置空会让同一个 video 反复脱离/接回流；元素卸载时 React 会移除它，
    // 引用随元素一起被回收，无需手动摘流。
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof video.requestVideoFrameCallback !== 'function') {
      return;
    }
    let callbackId = video.requestVideoFrameCallback(function onFrame() {
      presentedFramesRef.current += 1;
      callbackId = video.requestVideoFrameCallback(onFrame);
    });
    return () => {
      video.cancelVideoFrameCallback(callbackId);
    };
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    presentedFramesRef.current = 0;
    let lastPresented = 0;
    let lastDecoded = 0;
    let lastTime = 0;
    let flowing = false;
    setIsFlowing(false);

    const timer = window.setInterval(() => {
      const presented = presentedFramesRef.current;
      const decoded = video.getVideoPlaybackQuality?.().totalVideoFrames ?? 0;
      const time = video.currentTime;
      const advanced =
        presented !== lastPresented ||
        decoded !== lastDecoded ||
        time !== lastTime;
      lastPresented = presented;
      lastDecoded = decoded;
      lastTime = time;
      if (advanced !== flowing) {
        flowing = advanced;
        setIsFlowing(advanced);
      }
      setStats({
        paused: video.paused,
        readyState: video.readyState,
        presented,
        decoded,
        currentTime: time,
        trackState: stream?.getVideoTracks()[0]?.readyState ?? 'none',
      });
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, [stream]);

  const track = stream?.getVideoTracks()[0] ?? null;
  const trackSettings = track?.getSettings();
  const resolution =
    trackSettings?.width && trackSettings?.height
      ? `${trackSettings.width}×${trackSettings.height}`
      : '';
  const deviceLine =
    stream && track
      ? [track.label || '未知设备', resolution].filter(Boolean).join(' · ')
      : '';
  const flowStatus = !stream
    ? '尚未连接摄像头（检查 设置 → 面捕 的「摄像头」选项）'
    : isFlowing
      ? '画面流动中'
      : '画面静止：摄像头没有输出新帧';

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
        {deviceLine ? <span>{deviceLine}</span> : null}
        <span>{flowStatus}</span>
        {/* 只在出帧异常时显示原始读数，正常情况下保持干净 */}
        {stats && !isFlowing ? (
          <span className="mocap-camera-preview-stats">
            {[
              `paused=${stats.paused}`,
              `readyState=${stats.readyState}`,
              `呈现帧=${stats.presented}`,
              `解码帧=${stats.decoded}`,
              `t=${stats.currentTime.toFixed(1)}s`,
              `轨道=${stats.trackState}`,
            ].join(' ')}
          </span>
        ) : null}
        {playError ? <em>预览播放失败：{playError}</em> : null}
        {track?.muted ? (
          <em>摄像头轨道已静音：设备可能被其他程序占用</em>
        ) : null}
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
