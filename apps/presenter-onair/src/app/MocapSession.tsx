import { useEffect, type RefObject } from 'react';
import { MocapPanel } from '../components/mocap/MocapPanel';
import { useAvatarPresenter } from '../hooks/useAvatarPresenter';
import { useCameraDevices } from '../hooks/useCameraDevices';
import { useVideoSource } from '../hooks/useVideoSource';
import { useFaceCaptureEngine } from '../hooks/useFaceCaptureEngine';
import { useResolvedVrmModel } from '../hooks/useResolvedVrmModel';
import type { AvatarPresenterController } from '../hooks/useAvatarPresenter';
import type { useSettings } from '../hooks/useSettings';
import { getEmotionEffectAnchor } from '../lib/emotionEffectAnchor';

type SettingsHook = ReturnType<typeof useSettings>;

interface MocapSessionProps {
  settingsHook: SettingsHook;
  onToggleSettings: () => void;
  avatarPresenterRef: RefObject<AvatarPresenterController | null>;
  mouthLevelRef: RefObject<number>;
  isSpeaking: boolean;
  backgroundImageUrl: string | null;
  partialCaption?: string;
}

export function MocapSession({
  settingsHook,
  onToggleSettings,
  avatarPresenterRef,
  mouthLevelRef,
  isSpeaking,
  backgroundImageUrl,
  partialCaption = '',
}: MocapSessionProps) {
  const faceCaptureSettings = settingsHook.settings.faceCapture;

  const {
    vrmUrl,
    isResolving: isVrmResolving,
    resolveError: vrmResolveError,
    effectAnchorProfileId,
  } = useResolvedVrmModel(settingsHook.settings.visual);

  const avatarPresenter = useAvatarPresenter(
    {
      reactionControlMode: 'none',
      emotionEffectMap: settingsHook.settings.visual.vrmEmotionEffectMap,
      effectAnchor: getEmotionEffectAnchor(
        settingsHook.settings.visual.vrmEmotionEffectAnchors,
        effectAnchorProfileId,
      ),
      vrmCameraFraming: settingsHook.settings.visual.vrmCameraFraming,
    },
    {
      onEffectAnchorChange: (anchor) =>
        settingsHook.updateVisualVrmEmotionEffectAnchor(
          effectAnchorProfileId,
          anchor,
        ),
      onEffectAnchorReset: () =>
        settingsHook.resetVisualVrmEmotionEffectAnchor(effectAnchorProfileId),
      onVrmCameraFramingChange: settingsHook.updateVisualVrmCameraFraming,
    },
  );

  // 视频获取模块（独立）：只负责拿到活的帧并量化「帧还活着吗」。
  const { state: video } = useVideoSource({
    enabled: faceCaptureSettings.source === 'webcam',
    deviceId: faceCaptureSettings.deviceId,
    backend: faceCaptureSettings.videoBackend,
  });

  // 面捕引擎（独立）：建在采集模块之上，吃它暴露的帧源，产出与 VRM 无关的面捕帧。
  // 采集没起来时 frameSource 为 null，引擎自己会退到「未运行」。
  const faceCapture = useFaceCaptureEngine({
    frameSource: video.frameSource,
    enabled: faceCaptureSettings.source === 'webcam',
    smoothing: faceCaptureSettings.smoothing,
  });

  // 面捕页里直接换摄像头：改 deviceId 会让采集模块重开流，预览随之刷新
  const { devices: cameraDevices, labelsHidden: cameraLabelsHidden } =
    useCameraDevices(true);

  useEffect(() => {
    avatarPresenterRef.current = avatarPresenter;
    return () => {
      avatarPresenterRef.current = null;
    };
  }, [avatarPresenter, avatarPresenterRef]);

  return (
    <MocapPanel
      onToggleSettings={onToggleSettings}
      mouthLevelRef={mouthLevelRef}
      isSpeaking={isSpeaking}
      avatarPresenter={avatarPresenter}
      vrmUrl={vrmUrl}
      vrmResolveError={vrmResolveError}
      vrmResolving={isVrmResolving}
      backgroundImageUrl={backgroundImageUrl}
      visual={settingsHook.settings.visual}
      mouthDriver={faceCaptureSettings.mouthDriver}
      onMouthDriverChange={settingsHook.updateFaceCaptureMouthDriver}
      video={video}
      faceCaptureRef={faceCapture.frameRef}
      faceCaptureActive={faceCapture.isRunning}
      faceCaptureError={faceCapture.error}
      vrmRenderPaused={settingsHook.settings.visual.vrmRenderPaused}
      onToggleVrmRenderPaused={() =>
        settingsHook.updateVisualVrmRenderPaused(
          !settingsHook.settings.visual.vrmRenderPaused,
        )
      }
      showCameraPreview={faceCaptureSettings.showCameraPreview}
      onToggleCameraPreview={() =>
        settingsHook.updateFaceCaptureShowCameraPreview(
          !faceCaptureSettings.showCameraPreview,
        )
      }
      cameraDevices={cameraDevices}
      cameraLabelsHidden={cameraLabelsHidden}
      videoBackend={faceCaptureSettings.videoBackend}
      onVideoBackendChange={settingsHook.updateFaceCaptureVideoBackend}
      faceCaptureDeviceId={faceCaptureSettings.deviceId}
      onFaceCaptureDeviceChange={settingsHook.updateFaceCaptureDeviceId}
      partialCaption={partialCaption}
    />
  );
}
