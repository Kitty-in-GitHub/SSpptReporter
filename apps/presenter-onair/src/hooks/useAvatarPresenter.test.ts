import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_EMOTION_EFFECT_ANCHOR } from '../lib/emotionEffectAnchor';
import { DEFAULT_VRM_CAMERA_FRAMING } from '../lib/vrmCameraFraming';
import { DEFAULT_VRM_EMOTION_EFFECT_MAP } from '../lib/vrmReactions';
import type { AvatarReactionPair } from '../lib/avatar';
import { useAvatarPresenter } from './useAvatarPresenter';

function renderPresenter() {
  return renderHook(() =>
    useAvatarPresenter(
      {
        reactionControlMode: 'none',
        emotionEffectMap: DEFAULT_VRM_EMOTION_EFFECT_MAP,
        effectAnchor: DEFAULT_EMOTION_EFFECT_ANCHOR,
        vrmCameraFraming: DEFAULT_VRM_CAMERA_FRAMING,
      },
      {
        onEffectAnchorChange: vi.fn(),
        onEffectAnchorReset: vi.fn(),
      },
    ),
  );
}

const pair: AvatarReactionPair = {
  gesture: { type: 'gesture', parts: [{ name: 'happy', intensity: 0.5 }] },
  emotion: { type: 'emote', name: 'happy', intensity: 0.35 },
};

describe('useAvatarPresenter 双槽（ADR-013）', () => {
  it('applyPerformance 同时写入动作槽与情绪槽', () => {
    const { result } = renderPresenter();

    act(() => {
      result.current.applyPerformance(pair);
    });

    expect(result.current.reaction?.type).toBe('gesture');
    expect(result.current.expressionReaction?.type).toBe('emote');
  });

  it('resetExpression 只清情绪槽，不动动作槽', () => {
    const { result } = renderPresenter();

    act(() => {
      result.current.applyPerformance(pair);
    });
    act(() => {
      result.current.resetExpression(280);
    });

    expect(result.current.reaction?.type).toBe('gesture');
    expect(result.current.expressionReaction?.type).toBe('reset');
  });

  it('reset 同时清两槽', () => {
    const { result } = renderPresenter();

    act(() => {
      result.current.applyPerformance(pair);
    });
    act(() => {
      result.current.reset(280);
    });

    expect(result.current.reaction?.type).toBe('reset');
    expect(result.current.expressionReaction?.type).toBe('reset');
  });

  it('只有动作时不动情绪槽', () => {
    const { result } = renderPresenter();

    act(() => {
      result.current.applyPerformance({ gesture: pair.gesture, emotion: null });
    });

    expect(result.current.reaction?.type).toBe('gesture');
    expect(result.current.expressionReaction).toBeNull();
  });
});
