import { describe, expect, it } from 'vitest';
import type { DirectorAction } from '@ssreporter/director';
import {
  formatDirectorPlaybackError,
  isDirectorQueuePlaybackCompleted,
  resolveDeckPlaybackStatus,
} from './directorPlaybackError';

const sampleAction = (utterance: string, actionId?: string): DirectorAction => ({
  mode: 'present',
  utterance,
  action_id: actionId,
});

describe('formatDirectorPlaybackError', () => {
  it('includes index, action id, and error message', () => {
    const message = formatDirectorPlaybackError(
      1,
      sampleAction('第二句讲稿', 'beat-2'),
      new Error('TTS failed'),
    );
    expect(message).toContain('#2');
    expect(message).toContain('beat-2');
    expect(message).toContain('TTS failed');
  });
});

describe('isDirectorQueuePlaybackCompleted', () => {
  it('is true only when queue cleared without error', () => {
    expect(
      isDirectorQueuePlaybackCompleted('idle', 0, -1, null),
    ).toBe(true);
    expect(
      isDirectorQueuePlaybackCompleted('idle', 3, 1, 'failed'),
    ).toBe(false);
    expect(
      isDirectorQueuePlaybackCompleted('idle', 3, -1, null),
    ).toBe(false);
  });
});

describe('resolveDeckPlaybackStatus', () => {
  it('reports completion when queue finished cleanly', () => {
    expect(
      resolveDeckPlaybackStatus(5, 'idle', 0, -1, null),
    ).toBe('本场讲稿播放完成（5 条）');
  });

  it('does not report completion when playback failed mid-queue', () => {
    const status = resolveDeckPlaybackStatus(
      5,
      'idle',
      5,
      1,
      '#2 beat: TTS failed',
    );
    expect(status).toContain('播放中断');
    expect(status).not.toContain('播放完成');
    expect(status).toContain('TTS failed');
  });
});
