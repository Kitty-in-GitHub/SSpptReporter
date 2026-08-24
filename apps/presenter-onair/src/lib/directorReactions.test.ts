import { describe, expect, it } from 'vitest';
import type { DirectorAction } from '@ssreporter/director';
import {
  toDirectorEmotionDraft,
  toDirectorGestureDraft,
  toDirectorReactionDrafts,
} from './directorReactions';
import {
  gestureToVrmReactionDraft,
  gestureToVrmReactionSpec,
} from './gestureToVrmReaction';

const baseAction: DirectorAction = {
  schema_version: '1.0',
  mode: 'present',
  utterance: '测试讲稿',
};

describe('gestureToVrmReactionSpec', () => {
  it.each(['none', 'idle', undefined] as const)(
    'returns null for %s',
    (gesture) => {
      expect(gestureToVrmReactionSpec(gesture)).toBeNull();
    },
  );

  it('maps bow to gesture parts', () => {
    const spec = gestureToVrmReactionSpec('bow');
    expect(spec).not.toBeNull();
    expect(spec?.parts.length).toBeGreaterThan(0);
    expect(spec?.vrmaUrl).toContain('bow.vrma');
  });

  it('maps point_slide to gesture parts', () => {
    const draft = gestureToVrmReactionDraft('point_slide');
    expect(draft?.type).toBe('gesture');
    expect(draft?.parts.some((part) => part.name === 'browOuterUpLeft')).toBe(
      true,
    );
  });
});

describe('toDirectorReactionDrafts', () => {
  it('returns gesture and emotion independently', () => {
    const drafts = toDirectorReactionDrafts({
      ...baseAction,
      emotion: 'friendly',
      gesture: 'bow',
    });

    expect(drafts.gesture?.type).toBe('gesture');
    expect(drafts.emotion?.type).toBe('emote');
  });

  it('returns only gesture when emotion is neutral', () => {
    const drafts = toDirectorReactionDrafts({
      ...baseAction,
      emotion: 'neutral',
      gesture: 'explain',
    });

    expect(drafts.gesture?.type).toBe('gesture');
    expect(drafts.emotion).toBeNull();
  });

  it('returns only emotion when gesture is none', () => {
    const drafts = toDirectorReactionDrafts({
      ...baseAction,
      emotion: 'confident',
      gesture: 'none',
    });

    expect(drafts.gesture).toBeNull();
    expect(drafts.emotion?.type).toBe('emote');
  });
});

describe('toDirectorGestureDraft', () => {
  it('maps explain gesture from action', () => {
    const draft = toDirectorGestureDraft({
      ...baseAction,
      gesture: 'explain',
    });
    expect(draft?.type).toBe('gesture');
  });
});

describe('toDirectorEmotionDraft', () => {
  it('maps friendly to happy emote', () => {
    const draft = toDirectorEmotionDraft({
      ...baseAction,
      emotion: 'friendly',
    });
    expect(draft?.type).toBe('emote');
    if (draft?.type === 'emote') {
      expect(draft.name).toBe('happy');
    }
  });
});
