import {
  directorActionForPerformance,
  emotionToVrmExpression,
  type DirectorAction,
  type ResolvedBeatPerformance,
} from '@ssreporter/director';
import { gestureToVrmReactionDraft } from './gestureToVrmReaction';
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

export interface DirectorReactionDrafts {
  gesture: VrmAvatarReactionDraft | null;
  emotion: VrmAvatarReactionDraft | null;
}

export function applyVrmIntensity(
  draft: VrmAvatarReactionDraft,
  intensity?: number,
): VrmAvatarReactionDraft {
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

export function toDirectorGestureDraft(
  action: DirectorAction,
): VrmAvatarReactionDraft | null {
  return gestureToVrmReactionDraft(action.gesture);
}

export function toDirectorEmotionDraft(
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

export function toDirectorReactionDrafts(
  action: DirectorAction,
): DirectorReactionDrafts {
  return {
    gesture: toDirectorGestureDraft(action),
    emotion: toDirectorEmotionDraft(action),
  };
}

export function toDirectorReactionDraftsFromResolved(
  action: DirectorAction,
  resolved: ResolvedBeatPerformance,
): DirectorReactionDrafts {
  const merged = directorActionForPerformance(action, resolved);
  const gesture = toDirectorGestureDraft(merged);

  const expression = resolved.vrmExpression;
  let emotion: VrmAvatarReactionDraft | null = null;
  if (expression !== 'neutral' && VRM_EMOTION_SET.has(expression)) {
    const fromScreenplay = createVrmReactionFromScreenplay({
      emotion: expression,
      text: action.utterance,
    });
    emotion =
      fromScreenplay ??
      createVrmReactionFromEffect(expression as VrmEmotionEffect, action.utterance);
    emotion = applyVrmIntensity(emotion, resolved.vrmIntensity);
  }

  return { gesture, emotion };
}

/** @deprecated Prefer {@link toDirectorReactionDrafts} for gesture + emotion. */
export function toDirectorReactionDraft(
  action: DirectorAction,
): VrmAvatarReactionDraft | null {
  return toDirectorEmotionDraft(action);
}
