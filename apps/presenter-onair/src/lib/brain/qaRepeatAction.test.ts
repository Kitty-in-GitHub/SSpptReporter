import { describe, expect, it } from 'vitest';
import type { DirectorAction } from '@ssreporter/director';
import { mergePreemptiveDuringPlayback } from '../directorQueueMerge';
import { createRepeatRequestAction, isRepeatRequest } from './qaRepeatAction';

const DECK_ACTION: DirectorAction = {
  schema_version: '1.0',
  mode: 'present',
  utterance: '讲稿句',
};

const QA_ACTION: DirectorAction = {
  schema_version: '1.0',
  mode: 'qa',
  utterance: '回答',
  barge_in: true,
};

describe('mergePreemptiveDuringPlayback', () => {
  const queue = [
    { ...DECK_ACTION, utterance: 'A' },
    { ...DECK_ACTION, utterance: 'B' },
    { ...DECK_ACTION, utterance: 'C' },
  ];

  it('drops remaining deck when resume is off', () => {
    const merged = mergePreemptiveDuringPlayback(queue, 1, [QA_ACTION], false);
    expect(merged).toEqual([QA_ACTION]);
  });

  it('keeps remaining deck from current index when resume is on', () => {
    const merged = mergePreemptiveDuringPlayback(queue, 1, [QA_ACTION], true);
    expect(merged.map((item) => item.utterance)).toEqual([
      '回答',
      'B',
      'C',
    ]);
  });
});

describe('qaRepeatAction', () => {
  it('detects repeat phrases', () => {
    expect(isRepeatRequest('请重复一下')).toBe(true);
    expect(isRepeatRequest('Phase 1 验收了什么')).toBe(false);
  });

  it('repeats last utterance when available', () => {
    const action = createRepeatRequestAction({
      schema_version: '1.0',
      mode: 'qa',
      utterance: '上一轮回答。',
      qa: {
        question_summary: 'test',
        confidence: 0.8,
        admit_unknown: false,
        sources: [],
      },
    });
    expect(action.utterance).toBe('上一轮回答。');
  });

  it('asks to rephrase when no prior answer', () => {
    const action = createRepeatRequestAction(null);
    expect(action.utterance).toContain('再提问');
  });
});
