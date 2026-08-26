import { useCallback, useRef, useState } from 'react';
import type { EmotionEffectAnchor } from '../emotionEffectAnchor';
import type { VrmCameraFraming } from '../vrmCameraFraming';
import {
  createLinkedVrmEmotionEffectReaction,
  withVrmEmotionEffectReactionId,
  type VrmEmotionEffectMap,
  type VrmEmotionEffectReaction,
  type VrmEmotionEffectReactionDraft,
  type VrmReactionControlMode,
} from '../vrmReactions';
import type { AvatarReaction, AvatarReactionDraft, ScreenplayCue } from '../lib/avatar';
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
  const emotionEffectIdRef = useRef(0);

  const [reaction, setReaction] = useState<AvatarReaction | null>(null);
  const [emotionEffectReaction, setEmotionEffectReaction] =
    useState<VrmEmotionEffectReaction | null>(null);

  const applyReaction = useCallback((draft: AvatarReactionDraft) => {
    reactionIdRef.current += 1;
    setReaction(withAvatarReactionId(draft, reactionIdRef.current));
  }, []);

  const reset = useCallback((fadeMs = 280) => {
    applyReaction({ type: 'reset', fadeMs });
  }, [applyReaction]);

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
      const nativeReaction = createReactionFromScreenplay(cue);
      if (nativeReaction) {
        applyReaction(sustainReactionForSpeech(nativeReaction));
      } else {
        applyReaction({ type: 'reset', fadeMs: 220 });
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
      applyReaction,
      clearEmotionEffect,
      visual.emotionEffectMap,
      visual.reactionControlMode,
    ],
  );

  const onSpeechEnd = useCallback(() => {
    applyReaction({ type: 'reset', fadeMs: 360 });
    clearEmotionEffect();
  }, [applyReaction, clearEmotionEffect]);

  return {
    reaction,
    emotionEffectReaction,
    applyReaction,
    reset,
    onSpeechStart,
    onSpeechEnd,
    clearEmotionEffect,
    visual,
    callbacks,
  };
}

export type AvatarPresenterController = ReturnType<typeof useAvatarPresenter>;
