import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRESENT_SETTINGS,
  normalizePresentSettings,
  type SessionMode,
} from './present';

const ALL_MODES: SessionMode[] = ['chat', 'present', 'edit', 'decks', 'mocap'];

describe('normalizePresentSettings · sessionMode', () => {
  it('keeps every supported mode (including decks)', () => {
    for (const mode of ALL_MODES) {
      expect(normalizePresentSettings({ sessionMode: mode }).sessionMode).toBe(
        mode,
      );
    }
  });

  it('falls back to the default mode for unknown values', () => {
    const normalized = normalizePresentSettings({
      sessionMode: 'unknown' as SessionMode,
    });
    expect(normalized.sessionMode).toBe(
      DEFAULT_PRESENT_SETTINGS.sessionMode,
    );
  });
});
