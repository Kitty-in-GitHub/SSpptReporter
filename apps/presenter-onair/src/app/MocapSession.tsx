import { useEffect, type RefObject } from 'react';
import { MocapPanel } from '../components/mocap/MocapPanel';
import { useAvatarPresenter } from '../hooks/useAvatarPresenter';
import { useFaceCapture } from '../hooks/useFaceCapture';
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

  const { faceCaptureRef, isRunning, error } = useFaceCapture({
    enabled: faceCaptureSettings.source === 'webcam',
    deviceId: faceCaptureSettings.deviceId,
    smoothing: faceCaptureSettings.smoothing,
  });

  useEffect(() => {
    avatarPresenterRef.current = avatarPresenter;
    return () => {
      avatarPresenterRef.current = null;
    };
  }, [avatarPresenter, avatarPresenterRef]);

  return (
    <MocapPanel
      onToggleSettings={onToggleSettings}
      onSessionModeChange={settingsHook.updatePresentSessionMode}
      mouthLevelRef={mouthLevelRef}
      isSpeaking={isSpeaking}
      avatarPresenter={avatarPresenter}
      vrmUrl={vrmUrl}
      vrmResolveError={vrmResolveError}
      vrmResolving={isVrmResolving}
      backgroundImageUrl={backgroundImageUrl}
      visual={settingsHook.settings.visual}
      faceCaptureRef={faceCaptureRef}
      mouthDriver={faceCaptureSettings.mouthDriver}
      onMouthDriverChange={settingsHook.updateFaceCaptureMouthDriver}
      faceCaptureError={error}
      faceCaptureRunning={isRunning}
      showCameraPreview={faceCaptureSettings.showCameraPreview}
      partialCaption={partialCaption}
    />
  );
}
