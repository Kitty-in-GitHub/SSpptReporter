import {
  directorActionForPerformance,
  emotionToVrmExpression,
  type DirectorAction,
  type ResolvedBeatPerformance,
} from '@ssreporter/director';
import { gestureToAvatarReactionDraft } from './gestureCatalog';
import type { AvatarReactionDraft, AvatarReactionPair } from './types';
import {
  applyIntensityToReaction,
  createReactionFromEffect,
  createReactionFromScreenplay,
} from './vrmReactionBridge';

const EXPRESSION_NAMES = new Set<string>([
  'happy',
  'surprised',
  'sad',
  'angry',
  'relaxed',
  'thinking',
  'neutral',
]);

export function avatarGestureFromDirector(
  action: DirectorAction,
): AvatarReactionDraft | null {
  return gestureToAvatarReactionDraft(action.gesture);
}

export function avatarEmotionFromDirector(
  action: DirectorAction,
): AvatarReactionDraft | null {
  const mapped =
    emotionToVrmExpression[action.emotion ?? 'neutral'] ?? 'neutral';
  if (mapped === 'neutral' || !EXPRESSION_NAMES.has(mapped)) {
    return null;
  }

  const fromScreenplay = createReactionFromScreenplay({
    emotion: mapped,
    text: action.utterance,
  });
  if (fromScreenplay) {
    return fromScreenplay;
  }

  return createReactionFromEffect(mapped, action.utterance);
}

export function avatarReactionsFromDirector(
  action: DirectorAction,
): AvatarReactionPair {
  return {
    gesture: avatarGestureFromDirector(action),
    emotion: avatarEmotionFromDirector(action),
  };
}

export function avatarReactionsFromDirectorResolved(
  action: DirectorAction,
  resolved: ResolvedBeatPerformance,
): AvatarReactionPair {
  const merged = directorActionForPerformance(action, resolved);
  const gesture = avatarGestureFromDirector(merged);

  const expression = resolved.vrmExpression;
  let emotion: AvatarReactionDraft | null = null;
  if (expression !== 'neutral' && EXPRESSION_NAMES.has(expression)) {
    const fromScreenplay = createReactionFromScreenplay({
      emotion: expression,
      text: action.utterance,
    });
    emotion =
      fromScreenplay ?? createReactionFromEffect(expression, action.utterance);
    emotion = applyIntensityToReaction(emotion, resolved.vrmIntensity);
  }

  return { gesture, emotion };
}
