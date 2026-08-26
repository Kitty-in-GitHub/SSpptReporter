import type { RefObject } from 'react';
import { AvatarBackground } from './AvatarPanel';
import type { AvatarPresenterController } from '../hooks/useAvatarPresenter';
import { toVrmReactionDraft } from '../lib/avatar';
import type { VrmAvatarReaction } from '../lib/vrmReactions';

export interface AvatarShellProps {
  presenter: AvatarPresenterController;
  mouthLevelRef: RefObject<number>;
  isSpeaking: boolean;
  backgroundImageUrl?: string | null;
  backgroundMode: 'default' | 'green' | 'transparent';
  showExpressionControls?: boolean;
}

export function AvatarShell({
  presenter,
  mouthLevelRef,
  isSpeaking,
  backgroundImageUrl,
  backgroundMode,
  showExpressionControls = true,
}: AvatarShellProps) {
  const { reaction, emotionEffectReaction, visual, callbacks } = presenter;

  const vrmReaction: VrmAvatarReaction | null = reaction
    ? ({ ...toVrmReactionDraft(reaction), id: reaction.id } as VrmAvatarReaction)
    : null;

  return (
    <AvatarBackground
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
    />
  );
}
