import type { AvatarReaction, AvatarReactionDraft } from './types';

export function withAvatarReactionId(
  draft: AvatarReactionDraft,
  id: number,
): AvatarReaction {
  return { ...draft, id };
}
