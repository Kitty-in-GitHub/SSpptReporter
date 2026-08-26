/**
 * @deprecated 请从 `lib/avatar` 导入。本文件保留以兼容现有测试与导入路径。
 */
import type { DirectorAction, ResolvedBeatPerformance } from '@ssreporter/director';
import {
  applyIntensityToReaction,
  avatarEmotionFromDirector,
  avatarGestureFromDirector,
  avatarReactionsFromDirector,
  avatarReactionsFromDirectorResolved,
  type AvatarReactionDraft,
  type AvatarReactionPair,
} from './avatar';

export type DirectorReactionDrafts = AvatarReactionPair;

export const applyVrmIntensity = applyIntensityToReaction;

export const toDirectorGestureDraft = avatarGestureFromDirector;

export const toDirectorEmotionDraft = avatarEmotionFromDirector;

export const toDirectorReactionDrafts = avatarReactionsFromDirector;

export const toDirectorReactionDraftsFromResolved = (
  action: DirectorAction,
  resolved: ResolvedBeatPerformance,
): AvatarReactionPair => avatarReactionsFromDirectorResolved(action, resolved);

/** @deprecated Prefer {@link toDirectorReactionDrafts} */
export function toDirectorReactionDraft(
  action: DirectorAction,
): AvatarReactionDraft | null {
  return avatarEmotionFromDirector(action);
}

export type { AvatarReactionDraft as VrmAvatarReactionDraft };
