import { describe, expect, it, vi } from 'vitest';
import type { DirectorAction } from './types.js';
import {
  enqueueManyValidated,
  isPreemptiveAction,
  mergeQueueItems,
  runDirectorQueue,
} from './queue.js';

const BASE_ACTION: DirectorAction = {
  schema_version: '1.0',
  action_id: 'a1',
  mode: 'present',
  utterance: '第一段',
  emotion: 'friendly',
};

describe('enqueueManyValidated', () => {
  it('accepts valid actions and rejects invalid ones', () => {
    const result = enqueueManyValidated([
      BASE_ACTION,
      { ...BASE_ACTION, emotion: 'not-real' },
    ]);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.index).toBe(1);
  });
});

describe('isPreemptiveAction', () => {
  it('detects barge_in and emergency priority', () => {
    expect(isPreemptiveAction({ ...BASE_ACTION, barge_in: true })).toBe(true);
    expect(
      isPreemptiveAction({ ...BASE_ACTION, priority: 'emergency' }),
    ).toBe(true);
    expect(isPreemptiveAction(BASE_ACTION)).toBe(false);
  });
});

describe('mergeQueueItems', () => {
  it('appends normal items when idle', () => {
    const merged = mergeQueueItems(
      [{ ...BASE_ACTION, action_id: 'q1' }],
      [{ ...BASE_ACTION, action_id: 'q2' }],
      { isPlaying: false },
    );
    expect(merged.map((item) => item.action_id)).toEqual(['q1', 'q2']);
  });

  it('prepends preemptive items when playing', () => {
    const merged = mergeQueueItems(
      [{ ...BASE_ACTION, action_id: 'tail' }],
      [
        { ...BASE_ACTION, action_id: 'normal' },
        { ...BASE_ACTION, action_id: 'urgent', barge_in: true },
      ],
      { isPlaying: true },
    );
    expect(merged.map((item) => item.action_id)).toEqual([
      'urgent',
      'normal',
      'tail',
    ]);
  });
});

describe('runDirectorQueue', () => {
  it('runs actions in order with speak and slide callbacks', async () => {
    const onSpeak = vi.fn(async (_text: string) => {});
    const onSlideAction = vi.fn(async () => {});
    const onEmotion = vi.fn(async () => {});

    await runDirectorQueue(
      [
        {
          ...BASE_ACTION,
          action_id: 's1',
          utterance: '你好',
          slide_action: { goto: 1 },
        },
        {
          ...BASE_ACTION,
          action_id: 's2',
          utterance: '下一页',
          slide_action: { next: true },
        },
      ],
      { onSpeak, onSlideAction, onEmotion },
    );

    expect(onSlideAction).toHaveBeenCalledTimes(2);
    expect(onEmotion).toHaveBeenCalledTimes(2);
    expect(onSpeak).toHaveBeenCalledTimes(2);
    expect(onSpeak.mock.calls[0]?.[0]).toBe('你好');
  });

  it('calls onInterrupt when barge_in is set', async () => {
    const onInterrupt = vi.fn(async () => {});
    const onSpeak = vi.fn(async (_text: string) => {});

    await runDirectorQueue(
      [{ ...BASE_ACTION, barge_in: true, utterance: '打断后播放' }],
      { onInterrupt, onSpeak },
    );

    expect(onInterrupt).toHaveBeenCalledTimes(1);
    expect(onSpeak).toHaveBeenCalledTimes(1);
  });

  it('skips speak for empty utterance', async () => {
    const onSpeak = vi.fn(async (_text: string) => {});

    await runDirectorQueue(
      [{ ...BASE_ACTION, utterance: '   ' }],
      { onSpeak },
    );

    expect(onSpeak).not.toHaveBeenCalled();
  });

  it('stops when signal is aborted', async () => {
    const onSpeak = vi.fn(async (_text: string) => {});
    const controller = new AbortController();
    controller.abort();

    await runDirectorQueue(
      [
        { ...BASE_ACTION, action_id: 'one', utterance: '一' },
        { ...BASE_ACTION, action_id: 'two', utterance: '二' },
      ],
      { onSpeak },
      { signal: controller.signal },
    );

    expect(onSpeak).not.toHaveBeenCalled();
  });
});
