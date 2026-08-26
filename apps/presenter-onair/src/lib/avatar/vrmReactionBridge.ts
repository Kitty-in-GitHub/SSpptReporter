import type { ScreenplayCue, AvatarReactionDraft } from './types';
import {
  createVrmReactionFromEffect,
  createVrmReactionFromScreenplay,
  sustainVrmReactionForSpeech,
  type VrmAvatarReactionDraft,
  type VrmEmotionEffect,
} from '../vrmReactions';

export function createReactionFromScreenplay(
  screenplay: ScreenplayCue,
): AvatarReactionDraft | null {
  return createVrmReactionFromScreenplay(screenplay) as AvatarReactionDraft | null;
}

export function createReactionFromEffect(
  effect: string,
  text = '',
): AvatarReactionDraft {
  return createVrmReactionFromEffect(
    effect as VrmEmotionEffect,
    text,
  ) as AvatarReactionDraft;
}

export function sustainReactionForSpeech(
  draft: AvatarReactionDraft,
): AvatarReactionDraft {
  return sustainVrmReactionForSpeech(
    draft as VrmAvatarReactionDraft,
  ) as AvatarReactionDraft;
}

export function applyIntensityToReaction(
  draft: AvatarReactionDraft,
  intensity?: number,
): AvatarReactionDraft {
  if (intensity == null || Number.isNaN(intensity)) {
    return draft;
  }

  const value = Math.min(1, Math.max(0, intensity));

  if (draft.type === 'emote') {
    return { ...draft, intensity: value };
  }

  if (draft.type === 'gesture' && draft.parts.length > 0) {
    const peak = Math.max(...draft.parts.map((part) => part.intensity ?? 0), 0.01);
    return {
      ...draft,
      parts: draft.parts.map((part) => ({
        ...part,
        intensity: Math.min(1, value * ((part.intensity ?? peak) / peak)),
      })),
    };
  }

  return draft;
}

export function toVrmReactionDraft(
  draft: AvatarReactionDraft,
): VrmAvatarReactionDraft {
  return draft as VrmAvatarReactionDraft;
}
