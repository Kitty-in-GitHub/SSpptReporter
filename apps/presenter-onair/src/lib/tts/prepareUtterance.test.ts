import { describe, expect, it } from 'vitest';
import { prepareEdgeUtterance } from './prepareUtterance';

describe('prepareEdgeUtterance', () => {
  it('builds gateway request with speaker and prosody', () => {
    const prepared = prepareEdgeUtterance(
      '答辩助手演示。',
      {
        speaker: 'edge:zh-CN-YunjianNeural',
        rate: 0.92,
        pitch: '-3Hz',
        volume: '+5%',
      },
      {
        defaultSpeaker: 'zh-CN-XiaoxiaoNeural',
        defaultModel: 'tts-1',
        defaultRate: 1,
      },
    );

    expect(prepared.segments).toHaveLength(1);
    expect(prepared.segments[0]?.edge).toMatchObject({
      voice: 'zh-CN-YunjianNeural',
      speed: 0.92,
      pitch: '-3Hz',
      volume: '+5%',
    });
  });

  it('splits emphasis into boosted segments', () => {
    const prepared = prepareEdgeUtterance(
      '本页介绍系统架构。',
      {
        rate: 1,
        emphasis: [[2, 6]],
      },
      {
        defaultSpeaker: 'zh-CN-XiaoxiaoNeural',
        defaultModel: 'tts-1',
        defaultRate: 1,
      },
    );

    expect(prepared.segments.length).toBeGreaterThan(1);
    expect(prepared.segments.some((segment) => segment.emphasized)).toBe(true);
    expect(prepared.warnings.some((item) => item.includes('句内重读'))).toBe(
      true,
    );
  });
});
