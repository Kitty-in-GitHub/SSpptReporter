import {
  emotionToVrmExpression,
  type DirectorAction,
} from '@ssreporter/director';
import {
  createVrmReactionFromEffect,
  createVrmReactionFromScreenplay,
  type VrmAvatarReactionDraft,
  type VrmEmotionEffect,
} from './vrmReactions';

const VRM_EMOTION_SET = new Set<string>([
  'happy',
  'surprised',
  'sad',
  'angry',
  'relaxed',
  'thinking',
  'neutral',
]);

export function toDirectorReactionDraft(
  action: DirectorAction,
): VrmAvatarReactionDraft | null {
  const mapped =
    emotionToVrmExpression[action.emotion ?? 'neutral'] ?? 'neutral';
  if (mapped === 'neutral' || !VRM_EMOTION_SET.has(mapped)) {
    return null;
  }

  const fromScreenplay = createVrmReactionFromScreenplay({
    emotion: mapped,
    text: action.utterance,
  });
  if (fromScreenplay) {
    return fromScreenplay;
  }

  return createVrmReactionFromEffect(mapped as VrmEmotionEffect, action.utterance);
}
