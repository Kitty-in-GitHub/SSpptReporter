import { describe, expect, it } from 'vitest';
import type { SlidePageDraft } from '@ssreporter/director';
import { removeBeatAt } from './useDeckScriptEditor';

function draftWith(beats: SlidePageDraft['beats']): SlidePageDraft {
  return { page: 3, beats };
}

const VOICE = { speaker: 'zh-CN-XiaoxiaoNeural' };

describe('removeBeatAt', () => {
  it('删除选中的节拍，保留其余节拍', () => {
    const result = removeBeatAt(
      draftWith([
        { utterance: '第一拍', emotion: 'friendly', gesture: 'none', camera: 'bust' },
        { utterance: '第二拍', emotion: 'confident', gesture: 'none', camera: 'bust' },
        { utterance: '第三拍', emotion: 'serious', gesture: 'none', camera: 'bust' },
      ]),
      1,
    );

    expect(result.clearedLastBeat).toBe(false);
    expect(result.draft.beats.map((beat) => beat.utterance)).toEqual([
      '第一拍',
      '第三拍',
    ]);
  });

  it('只剩一拍时清空内容，但保留 voice 等呈现设置', () => {
    const result = removeBeatAt(
      draftWith([
        {
          utterance: '唯一一拍',
          emotion: 'emphatic',
          gesture: 'none',
          camera: 'medium',
          voice: VOICE,
        },
      ]),
      0,
    );

    expect(result.clearedLastBeat).toBe(true);
    expect(result.draft.beats).toHaveLength(1);
    expect(result.draft.beats[0].utterance).toBe('');
    expect(result.draft.beats[0].voice).toEqual(VOICE);
    expect(result.draft.beats[0].emotion).toBe('emphatic');
    expect(result.draft.beats[0].camera).toBe('medium');
  });
});
