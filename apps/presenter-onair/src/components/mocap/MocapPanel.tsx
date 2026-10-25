import type { AvatarPresenterController } from '../../hooks/useAvatarPresenter';
import type { CameraDeviceOption } from '../../hooks/useCameraDevices';
import type { VideoSourceState } from '../../hooks/useVideoSource';
import type { FaceCaptureFrame } from '../../lib/avatar/faceCaptureTypes';
import { readCameraLog } from '../../lib/cameraLog';
import type {
  CameraVideoBackend,
  FaceCaptureMouthDriver,
  VisualSettings,
} from '../../types/settings';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { AvatarShell } from '../AvatarShell';
import { AppToolbar } from '../present/AppToolbar';

/** 采集状态的人话描述：工具条胶囊与预览窗共用 */
function describeVideoStatus(video: VideoSourceState): string {
  switch (video.status) {
    case 'idle':
      return '尚未开始采集';
    case 'opening':
      return '正在打开摄像头…';
    case 'error':
      return video.error ? `打开失败：${video.error}` : '打开失败';
    case 'stalled':
      // 流死了但后端还在取帧 —— 这正是「抓帧能不能救我们」的关键信号
      return video.backendAlive
        ? `流已断 ${(video.idleMs / 1000).toFixed(1)}s：抓帧后端仍在工作`
        : `流已断 ${(video.idleMs / 1000).toFixed(1)}s`;
    case 'streaming':
    default:
      return `画面流动中 · 约 ${video.streamFps} fps`;
  }
}

interface CameraPreviewProps {
  video: VideoSourceState;
  devices: CameraDeviceOption[];
  labelsHidden: boolean;
  deviceId: string;
  onDeviceChange?: (deviceId: string) => void;
  backend: CameraVideoBackend;
  onBackendChange?: (backend: CameraVideoBackend) => void;
  vrmRenderPaused: boolean;
  faceCaptureActive: boolean;
  faceCaptureError: string | null;
}

/**
 * 摄像头预览：把采集模块拿到的流显示出来，并把它量化出的帧状态摊开给人看。
 * **不自己做任何测量** —— 帧数/帧率/空闲时长都来自 `useVideoSource`。
 */
function CameraPreview({
  video,
  devices,
  labelsHidden,
  deviceId,
  onDeviceChange,
  backend,
  onBackendChange,
  vrmRenderPaused,
  faceCaptureActive,
  faceCaptureError,
}: CameraPreviewProps) {
  const displayRef = useRef<HTMLVideoElement | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const element = displayRef.current;
    if (!element) {
      return;
    }
    element.srcObject = video.stream;
    if (video.stream) {
      void element.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setPlayError(
          error instanceof Error ? error.message : '预览播放被浏览器拒绝',
        );
      });
    }
  }, [video.stream]);

  const deviceLine = video.label
    ? [video.label, video.resolution].filter(Boolean).join(' · ')
    : '';
  const statsLine = [
    `后端=${video.activeBackend ?? '—'}`,
    // 呈现帧来自 rVFC；解码帧在 Firefox 下对 MediaStream 恒为 0，故两个都列出来
    `呈现帧=${video.presentedFrames}(${video.streamFps}fps)`,
    `解码帧=${video.videoDecodedFrames}`,
    `后端帧=${video.backendFrames}(${video.backendFps}fps)`,
    `空闲=${video.idleMs}ms`,
    `后端活着=${video.backendAlive}`,
    `重开=${video.restarts}${video.gaveUp ? '(已放弃)' : ''}`,
  ].join(' ');

  const copyDiagnostics = async () => {
    const text = [
      `设备：${deviceLine || '未连接'}`,
      `采集：${describeVideoStatus(video)}`,
      `后端：${backend}`,
      `读数：${statsLine}`,
      // 引擎与采集分开报，卡住时才分得清是哪一段
      `面捕引擎：${
        faceCaptureError
          ? `错误：${faceCaptureError}`
          : faceCaptureActive
            ? '就绪'
            : '加载中'
      }`,
      `VRM 渲染：${vrmRenderPaused ? '已暂停' : '运行中'}`,
      '--- 采集日志 ---',
      readCameraLog(),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用（非安全上下文 / 权限被拒）时整段打到控制台，手动复制
      console.log(text);
    }
  };

  return (
    <div className="mocap-camera-preview">
      <video
        ref={displayRef}
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
        {onBackendChange ? (
          <select
            value={backend}
            onChange={(event) =>
              onBackendChange(event.target.value as CameraVideoBackend)
            }
            aria-label="选择采集后端"
          >
            <option value="videoFrameCallback">requestVideoFrameCallback</option>
            <option value="grabFrame">ImageCapture.grabFrame</option>
          </select>
        ) : null}
        {deviceLine ? <span>{deviceLine}</span> : null}
        <span>{describeVideoStatus(video)}</span>
        <span className="mocap-camera-preview-stats">{statsLine}</span>
        {playError ? <em>预览播放失败：{playError}</em> : null}
        {labelsHidden ? <em>设备名不可见：尚未授权摄像头</em> : null}
        <button
          type="button"
          className="mocap-camera-preview-copy"
          onClick={() => {
            void copyDiagnostics();
          }}
        >
          {copied ? '已复制到剪贴板' : '复制诊断日志'}
        </button>
      </div>
    </div>
  );
}

interface MocapPanelProps {
  mouthLevelRef: RefObject<number>;
  isSpeaking: boolean;
  avatarPresenter: AvatarPresenterController;
  vrmUrl: string | null;
  vrmResolveError?: string | null;
  vrmResolving?: boolean;
  backgroundImageUrl?: string | null;
  visual: VisualSettings;
  mouthDriver: FaceCaptureMouthDriver;
  onMouthDriverChange: (driver: FaceCaptureMouthDriver) => void;
  /** 视频采集模块状态（帧活性的事实来源） */
  video: VideoSourceState;
  /** 面捕引擎产出的最新帧：渲染循环按需读取，不触发重渲染 */
  faceCaptureRef?: RefObject<FaceCaptureFrame | null>;
  /** 面捕引擎是否已就绪出帧 */
  faceCaptureActive?: boolean;
  faceCaptureError?: string | null;
  vrmRenderPaused?: boolean;
  onToggleVrmRenderPaused?: () => void;
  showCameraPreview?: boolean;
  onToggleCameraPreview?: () => void;
  cameraDevices?: CameraDeviceOption[];
  cameraLabelsHidden?: boolean;
  videoBackend: CameraVideoBackend;
  onVideoBackendChange?: (backend: CameraVideoBackend) => void;
  faceCaptureDeviceId?: string;
  onFaceCaptureDeviceChange?: (deviceId: string) => void;
  partialCaption?: string;
}

export function MocapPanel({
  mouthLevelRef,
  isSpeaking,
  avatarPresenter,
  vrmUrl,
  vrmResolveError,
  vrmResolving,
  backgroundImageUrl,
  visual,
  mouthDriver,
  onMouthDriverChange,
  video,
  faceCaptureRef,
  faceCaptureActive = false,
  faceCaptureError = null,
  vrmRenderPaused = false,
  onToggleVrmRenderPaused,
  showCameraPreview = false,
  onToggleCameraPreview,
  cameraDevices = [],
  cameraLabelsHidden = false,
  videoBackend,
  onVideoBackendChange,
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

  const statusText = describeVideoStatus(video);

  return (
    <div className="chat-panel chat-panel-broadcast mocap-panel" style={panelStyle}>
      {/* 放在工具条之前：底栏是 flex-end，预览正好贴在「摄像头」按钮上方 */}
      {showCameraPreview ? (
        <CameraPreview
          video={video}
          devices={cameraDevices}
          labelsHidden={cameraLabelsHidden}
          deviceId={faceCaptureDeviceId}
          onDeviceChange={onFaceCaptureDeviceChange}
          backend={videoBackend}
          onBackendChange={onVideoBackendChange}
          vrmRenderPaused={vrmRenderPaused}
          faceCaptureActive={faceCaptureActive}
          faceCaptureError={faceCaptureError}
        />
      ) : null}

      <AppToolbar title="直播皮套">
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
          {onToggleVrmRenderPaused ? (
            <button
              type="button"
              className={`mocap-vrm-pause-toggle${vrmRenderPaused ? ' is-active' : ''}`}
              onClick={onToggleVrmRenderPaused}
              aria-pressed={vrmRenderPaused}
              title="暂停 / 恢复 VRM 渲染"
            >
              {vrmRenderPaused ? '恢复渲染' : '暂停渲染'}
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
            className={`mocap-status${video.status === 'streaming' ? ' is-active' : ''}${video.status === 'error' || video.status === 'stalled' ? ' is-error' : ''}`}
          >
            {statusText}
          </span>
          {/* 引擎状态与采集状态分开：卡住时一眼看出是哪一段 */}
          <span
            className={`mocap-status${faceCaptureActive ? ' is-active' : ''}${faceCaptureError ? ' is-error' : ''}`}
          >
            {faceCaptureError
              ? `面捕：${faceCaptureError}`
              : faceCaptureActive
                ? '面捕：就绪'
                : '面捕：加载中…'}
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
        renderPaused={vrmRenderPaused}
        showExpressionControls={false}
        faceCaptureRef={faceCaptureRef}
        faceCaptureActive={faceCaptureActive}
        mouthDriver={mouthDriver}
      />

      {partialCaption ? (
        <div className="broadcast-caption">{partialCaption}</div>
      ) : null}
    </div>
  );
}
