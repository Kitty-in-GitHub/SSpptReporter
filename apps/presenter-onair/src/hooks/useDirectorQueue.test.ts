import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DirectorAction } from '@ssreporter/director';
import { useDirectorQueue } from './useDirectorQueue';

function makeAction(utterance: string, id?: string): DirectorAction {
  return { schema_version: '1.0', mode: 'present', utterance, action_id: id };
}

describe('useDirectorQueue', () => {
  it('records lastPlaybackError when speak fails mid-queue', async () => {
    const speak = vi.fn(async (text: string) => {
      if (text === 'second') {
        throw new Error('TTS failed');
      }
    });
    const stopSpeech = vi.fn();
    const onApplyReaction = vi.fn();
    const onResetEmotion = vi.fn();

    const { result } = renderHook(() =>
      useDirectorQueue({
        speak,
        stopSpeech,
        onApplyReaction,
        onResetEmotion,
      }),
    );

    const actions = [
      makeAction('first', 'a1'),
      makeAction('second', 'a2'),
      makeAction('third', 'a3'),
    ];

    let runResult: Awaited<ReturnType<typeof result.current.playQueue>>;
    await act(async () => {
      runResult = await result.current.playQueue(actions);
    });

    expect(runResult!.outcome).toBe('failed');
    expect(runResult!.lastPlaybackError).toContain('TTS failed');
    expect(result.current.lastPlaybackError).toContain('TTS failed');
    expect(result.current.queue.length).toBe(3);
    expect(result.current.currentIndex).toBe(1);
    expect(speak).toHaveBeenCalledTimes(2);
  });
});
