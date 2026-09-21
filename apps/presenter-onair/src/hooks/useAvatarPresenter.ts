import { useCallback, useRef, useState } from 'react';
import type { EmotionEffectAnchor } from '../lib/emotionEffectAnchor';
import type { VrmCameraFraming } from '../lib/vrmCameraFraming';
import {
  createLinkedVrmEmotionEffectReaction,
  withVrmEmotionEffectReactionId,
  type VrmEmotionEffectMap,
  type VrmEmotionEffectReaction,
  type VrmEmotionEffectReactionDraft,
  type VrmReactionControlMode,
} from '../lib/vrmReactions';
import type { AvatarReaction, AvatarReactionDraft, AvatarReactionPair, ScreenplayCue } from '../lib/avatar';
import {
  createReactionFromScreenplay,
  sustainReactionForSpeech,
  withAvatarReactionId,
} from '../lib/avatar';

export interface AvatarPresenterVisualConfig {
  reactionControlMode: VrmReactionControlMode;
  emotionEffectMap: VrmEmotionEffectMap;
  effectAnchor: EmotionEffectAnchor;
  vrmCameraFraming: VrmCameraFraming;
}

export interface AvatarPresenterCallbacks {
  onEffectAnchorChange: (anchor: EmotionEffectAnchor) => void;
  onEffectAnchorReset: () => void;
  onVrmCameraFramingChange?: (framing: VrmCameraFraming) => void;
}

export function useAvatarPresenter(
  visual: AvatarPresenterVisualConfig,
  callbacks: AvatarPresenterCallbacks,
) {
  const reactionIdRef = useRef(0);
  const expressionIdRef = useRef(0);
  const emotionEffectIdRef = useRef(0);

  /** 动作事件槽：肢体动作（VRMA 一次性），新指令打断旧动作 */
  const [reaction, setReaction] = useState<AvatarReaction | null>(null);
  /** 情绪状态槽：面部表情，新指令替换旧表情并按其 holdMs 持续 */
  const [expressionReaction, setExpressionReaction] =
    useState<AvatarReaction | null>(null);
  const [emotionEffectReaction, setEmotionEffectReaction] =
    useState<VrmEmotionEffectReaction | null>(null);

  const applyReaction = useCallback((draft: AvatarReactionDraft) => {
    reactionIdRef.current += 1;
    setReaction(withAvatarReactionId(draft, reactionIdRef.current));
  }, []);

  const applyExpression = useCallback((draft: AvatarReactionDraft) => {
    expressionIdRef.current += 1;
    setExpressionReaction(withAvatarReactionId(draft, expressionIdRef.current));
  }, []);

  /**
   * 一次提交「动作 + 表情」。
   * 两槽独立，避免此前单槽下先后 setState 导致手势被表情覆盖（ADR-013）。
   */
  const applyPerformance = useCallback(
    (pair: AvatarReactionPair) => {
      if (pair.gesture) {
        applyReaction(pair.gesture);
      }
      if (pair.emotion) {
        applyExpression(pair.emotion);
      }
    },
    [applyExpression, applyReaction],
  );

  const resetExpression = useCallback(
    (fadeMs = 280) => {
      applyExpression({ type: 'reset', fadeMs });
    },
    [applyExpression],
  );

  const reset = useCallback(
    (fadeMs = 280) => {
      applyReaction({ type: 'reset', fadeMs });
      applyExpression({ type: 'reset', fadeMs });
    },
    [applyExpression, applyReaction],
  );

  const applyEmotionEffect = useCallback(
    (draft: VrmEmotionEffectReactionDraft) => {
      emotionEffectIdRef.current += 1;
      setEmotionEffectReaction(
        withVrmEmotionEffectReactionId(draft, emotionEffectIdRef.current),
      );
    },
    [],
  );

  const clearEmotionEffect = useCallback(() => {
    setEmotionEffectReaction(null);
  }, []);

  const onSpeechStart = useCallback(
    (cue: ScreenplayCue) => {
      // 语音表情属于「情绪状态槽」，不动动作槽
      const nativeReaction = createReactionFromScreenplay(cue);
      if (nativeReaction) {
        applyExpression(sustainReactionForSpeech(nativeReaction));
      } else {
        applyExpression({ type: 'reset', fadeMs: 220 });
      }

      const effectDraft = createLinkedVrmEmotionEffectReaction(
        visual.reactionControlMode,
        cue,
        visual.emotionEffectMap,
      );
      if (effectDraft) {
        applyEmotionEffect(effectDraft);
      } else {
        clearEmotionEffect();
      }
    },
    [
      applyEmotionEffect,
      applyExpression,
      clearEmotionEffect,
      visual.emotionEffectMap,
      visual.reactionControlMode,
    ],
  );

  const onSpeechEnd = useCallback(() => {
    applyExpression({ type: 'reset', fadeMs: 360 });
    clearEmotionEffect();
  }, [applyExpression, clearEmotionEffect]);

  return {
    reaction,
    expressionReaction,
    emotionEffectReaction,
    applyReaction,
    applyExpression,
    applyPerformance,
    reset,
    resetExpression,
    onSpeechStart,
    onSpeechEnd,
    clearEmotionEffect,
    visual,
    callbacks,
  };
}

export type AvatarPresenterController = ReturnType<typeof useAvatarPresenter>;
