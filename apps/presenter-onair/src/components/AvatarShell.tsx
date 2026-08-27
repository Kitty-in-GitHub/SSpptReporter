import type { RefObject } from 'react';
import { AvatarBackground } from './AvatarPanel';
import type { AvatarPresenterController } from '../hooks/useAvatarPresenter';
import { toVrmReactionDraft } from '../lib/avatar';
import type { FaceCaptureFrame } from '../lib/avatar/faceCaptureTypes';
import type { FaceCaptureMouthDriver } from '../types/settings';
import type { VrmAvatarReaction } from '../lib/vrmReactions';

export interface AvatarShellProps {
  presenter: AvatarPresenterController;
  mouthLevelRef: RefObject<number>;
  isSpeaking: boolean;
  vrmUrl: string | null;
  vrmResolveError?: string | null;
  vrmResolving?: boolean;
  backgroundImageUrl?: string | null;
  backgroundMode: 'default' | 'green' | 'transparent';
  showExpressionControls?: boolean;
  faceCaptureRef?: RefObject<FaceCaptureFrame | null>;
  faceCaptureActive?: boolean;
  mouthDriver?: FaceCaptureMouthDriver;
}

export function AvatarShell({
  presenter,
  mouthLevelRef,
  isSpeaking,
  vrmUrl,
  vrmResolveError = null,
  vrmResolving = false,
  backgroundImageUrl,
  backgroundMode,
  showExpressionControls = true,
  faceCaptureRef,
  faceCaptureActive = false,
  mouthDriver = 'faceCapture',
}: AvatarShellProps) {
  const { reaction, emotionEffectReaction, visual, callbacks } = presenter;

  const vrmReaction: VrmAvatarReaction | null = reaction
    ? ({ ...toVrmReactionDraft(reaction), id: reaction.id } as VrmAvatarReaction)
    : null;

  if (vrmResolveError && !vrmUrl) {
    return (
      <div className="avatar-background">
        <div className="vrm-stage">
          <div className="avatar-error">{vrmResolveError}</div>
        </div>
      </div>
    );
  }

  if (!vrmUrl) {
    return (
      <div className="avatar-background">
        <div className="vrm-stage">
          <div className="avatar-status">
            {vrmResolving ? '正在准备 VRM 模型…' : '未选择 VRM 模型。'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AvatarBackground
      vrmUrl={vrmUrl}
      mouthLevelRef={mouthLevelRef}
      isSpeaking={isSpeaking}
      reaction={vrmReaction}
      emotionEffectReaction={emotionEffectReaction}
      reactionControlMode={visual.reactionControlMode}
      emotionEffectMap={visual.emotionEffectMap}
      effectAnchor={visual.effectAnchor}
      onEffectAnchorChange={callbacks.onEffectAnchorChange}
      onEffectAnchorReset={callbacks.onEffectAnchorReset}
      vrmCameraFraming={visual.vrmCameraFraming}
      onVrmCameraFramingChange={callbacks.onVrmCameraFramingChange}
      backgroundImageUrl={backgroundImageUrl}
      backgroundMode={backgroundMode}
      showExpressionControls={showExpressionControls}
      faceCaptureRef={faceCaptureRef}
      faceCaptureActive={faceCaptureActive}
      mouthDriver={mouthDriver}
    />
  );
}
