import { UI_SETTINGS } from '../../constants/uiZh';
import type { AvatarPresenterController } from '../../hooks/useAvatarPresenter';
import type { FaceCaptureMouthDriver, VisualSettings } from '../../types/settings';
import type { FaceCaptureFrame } from '../../lib/avatar/faceCaptureTypes';
import type { RefObject } from 'react';
import { AvatarShell } from '../AvatarShell';
import { SessionModeToolbar } from '../present/SessionModeToolbar';

interface MocapPanelProps {
  onToggleSettings: () => void;
  onSessionModeChange: (mode: 'chat' | 'present' | 'edit' | 'mocap') => void;
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
  showCameraPreview?: boolean;
  partialCaption?: string;
}

export function MocapPanel({
  onToggleSettings,
  onSessionModeChange,
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
  showCameraPreview = false,
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
      <SessionModeToolbar
        sessionMode="mocap"
        onSessionModeChange={onSessionModeChange}
        onToggleSettings={onToggleSettings}
        settingsAriaLabel={UI_SETTINGS.ariaLabel}
        title="直播皮套"
      >
        <div className="mocap-toolbar-controls">
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
                : '面捕准备中…'}
          </span>
        </div>
      </SessionModeToolbar>

      {showCameraPreview && (
        <div className="mocap-camera-preview-hint">
          摄像头预览请在设置 → 面捕 中配置设备。
        </div>
      )}

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
