import type { Gesture } from '@ssreporter/director';
import { gestureToVrmReactionDraft } from '../gestureToVrmReaction';
import type { AvatarReactionDraft } from './types';

export function gestureToAvatarReactionDraft(
  gesture: Gesture | undefined,
): AvatarReactionDraft | null {
  const draft = gestureToVrmReactionDraft(gesture);
  return draft as AvatarReactionDraft | null;
}
