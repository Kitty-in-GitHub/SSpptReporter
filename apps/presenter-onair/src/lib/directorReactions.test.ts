import { describe, expect, it } from 'vitest';
import type { DirectorAction } from '@ssreporter/director';
import { resolveBeatPerformance } from '@ssreporter/director';
import {
  applyVrmIntensity,
  toDirectorEmotionDraft,
  toDirectorGestureDraft,
  toDirectorReactionDrafts,
  toDirectorReactionDraftsFromResolved,
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

  it.each(['bow', 'nod', 'think', 'explain', 'point_slide', 'open_hands', 'emphasize'] as const)(
    'returns null for pending gesture %s',
    (gesture) => {
      expect(gestureToVrmReactionSpec(gesture)).toBeNull();
    },
  );

  it('maps wave_both to gesture parts', () => {
    const spec = gestureToVrmReactionSpec('wave_both');
    expect(spec).not.toBeNull();
    expect(spec?.parts.length).toBeGreaterThan(0);
    expect(spec?.vrmaUrl).toContain('wave_both.vrma');
  });

  it('maps idle_shoot to gesture parts', () => {
    const draft = gestureToVrmReactionDraft('idle_shoot');
    expect(draft?.type).toBe('gesture');
    if (draft?.type === 'gesture') {
      expect(draft.parts.some((part) => part.name === 'browOuterUpLeft')).toBe(
        true,
      );
    }
  });
});

describe('toDirectorReactionDrafts', () => {
  it('returns gesture and emotion independently', () => {
    const drafts = toDirectorReactionDrafts({
      ...baseAction,
      emotion: 'friendly',
      gesture: 'wave_both',
    });

    expect(drafts.gesture?.type).toBe('gesture');
    expect(drafts.emotion?.type).toBe('emote');
  });

  it('returns only gesture when emotion is neutral', () => {
    const drafts = toDirectorReactionDrafts({
      ...baseAction,
      emotion: 'neutral',
      gesture: 'wave_right',
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
  it('maps implemented gesture from action', () => {
    const draft = toDirectorGestureDraft({
      ...baseAction,
      gesture: 'wave_right',
    });
    expect(draft?.type).toBe('gesture');
  });

  it('returns null for pending semantic gesture', () => {
    const draft = toDirectorGestureDraft({
      ...baseAction,
      gesture: 'explain',
    });
    expect(draft).toBeNull();
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

describe('applyVrmIntensity', () => {
  it('overrides emote intensity from profile', () => {
    const draft = applyVrmIntensity(
      { type: 'emote', name: 'happy', intensity: 0.8 },
      0.35,
    );
    expect(draft.type).toBe('emote');
    if (draft.type === 'emote') {
      expect(draft.intensity).toBe(0.35);
    }
  });

  it('applies profile intensity in resolved reaction path', () => {
    const action: DirectorAction = {
      ...baseAction,
      profile: 'confident',
    };
    const resolved = resolveBeatPerformance(action);
    const drafts = toDirectorReactionDraftsFromResolved(action, resolved);
    expect(drafts.emotion?.type).toBe('emote');
    if (drafts.emotion?.type === 'emote') {
      expect(drafts.emotion.intensity).toBe(0.35);
    }
  });
});
