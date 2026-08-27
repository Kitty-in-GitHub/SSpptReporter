import {
  enqueueManyValidated,
  isPreemptiveAction,
  mergeQueueItems,
  resolveBeatPerformance,
  resolveVoiceDirective,
  type DirectorAction,
  type DirectorQueuePlaybackState,
  type ResolvedBeatPerformance,
  type SlideAction,
  type VoiceDirective,
} from '@ssreporter/director';
import { useCallback, useRef, useState } from 'react';
import {
  avatarReactionsFromDirectorResolved,
  type AvatarReactionDraft,
} from '../lib/avatar';
import {
  formatDirectorPlaybackError,
  isDirectorQueuePlaybackCompleted,
} from '../lib/directorPlaybackError';
import { mergePreemptiveDuringPlayback } from '../lib/directorQueueMerge';
import { sleepMs } from '../lib/sleepMs';

export interface UseDirectorQueueOptions {
  speak: (text: string, directive?: VoiceDirective) => Promise<void>;
  stopSpeech: () => void;
  onApplyReaction: (draft: AvatarReactionDraft) => void;
  onResetEmotion: () => void;
  onSlideAction?: (slideAction: SlideAction) => void | Promise<void>;
  resolvePerformance?: (action: DirectorAction) => ResolvedBeatPerformance;
  resumeDeckAfterQaInterrupt?: () => boolean;
}

export type DirectorQueueRunOutcome =
  | 'completed'
  | 'failed'
  | 'stopped'
  | 'empty'
  | 'already_playing';

export interface DirectorQueueRunResult {
  outcome: DirectorQueueRunOutcome;
  lastPlaybackError: string | null;
  currentIndex: number;
  queueLength: number;
  playbackState: DirectorQueuePlaybackState;
}

function buildRunResult(
  playbackState: DirectorQueuePlaybackState,
  queueLength: number,
  currentIndex: number,
  lastPlaybackError: string | null,
): DirectorQueueRunResult {
  const completed = isDirectorQueuePlaybackCompleted(
    playbackState,
    queueLength,
    currentIndex,
    lastPlaybackError,
  );
  const outcome: DirectorQueueRunOutcome = completed
    ? 'completed'
    : lastPlaybackError
      ? 'failed'
      : 'stopped';
  return {
    outcome,
    lastPlaybackError,
    currentIndex,
    queueLength,
    playbackState,
  };
}

export function useDirectorQueue({
  speak,
  stopSpeech,
  onApplyReaction,
  onResetEmotion,
  onSlideAction,
  resolvePerformance,
  resumeDeckAfterQaInterrupt,
}: UseDirectorQueueOptions) {
  const [playbackState, setPlaybackState] =
    useState<DirectorQueuePlaybackState>('idle');
  const [queue, setQueue] = useState<DirectorAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [lastRejections, setLastRejections] = useState<string[]>([]);
  const [lastPlaybackError, setLastPlaybackError] = useState<string | null>(
    null,
  );

  const queueRef = useRef<DirectorAction[]>([]);
  const playbackStateRef = useRef<DirectorQueuePlaybackState>('idle');
  const runIdRef = useRef(0);
  const pausedRef = useRef(false);
  const pauseResolversRef = useRef<(() => void)[]>([]);
  const currentIndexRef = useRef(-1);
  const lastPlaybackErrorRef = useRef<string | null>(null);
  const resumeDeckAfterQaRef = useRef(resumeDeckAfterQaInterrupt);
  const resolvePerformanceRef = useRef(resolvePerformance);
  resumeDeckAfterQaRef.current = resumeDeckAfterQaInterrupt;
  resolvePerformanceRef.current = resolvePerformance;

  const syncLastPlaybackError = useCallback((error: string | null) => {
    lastPlaybackErrorRef.current = error;
    setLastPlaybackError(error);
  }, []);

  const syncQueue = useCallback((items: DirectorAction[]) => {
    queueRef.current = items;
    setQueue(items);
  }, []);

  const setPlayback = useCallback((state: DirectorQueuePlaybackState) => {
    playbackStateRef.current = state;
    setPlaybackState(state);
  }, []);

  const getRunResult = useCallback((): DirectorQueueRunResult => {
    return buildRunResult(
      playbackStateRef.current,
      queueRef.current.length,
      currentIndexRef.current,
      lastPlaybackErrorRef.current,
    );
  }, []);

  const waitWhilePaused = useCallback(async () => {
    if (!pausedRef.current) {
      return;
    }

    await new Promise<void>((resolve) => {
      pauseResolversRef.current.push(resolve);
    });
  }, []);

  const resumePausedWaiters = useCallback(() => {
    const resolvers = pauseResolversRef.current.splice(0);
    for (const resolve of resolvers) {
      resolve();
    }
  }, []);

  const runFromIndex = useCallback(
    async (startIndex: number, runId: number) => {
      for (let index = startIndex; index < queueRef.current.length; index += 1) {
        if (runIdRef.current !== runId) {
          return;
        }

        await waitWhilePaused();

        if (runIdRef.current !== runId) {
          return;
        }

        const action = queueRef.current[index];
        currentIndexRef.current = index;
        setCurrentIndex(index);

        try {
          const resolved =
            resolvePerformanceRef.current?.(action) ??
            resolveBeatPerformance(action);
          const voiceDirective = resolveVoiceDirective(action, resolved);

          if (action.barge_in || action.priority === 'emergency') {
            stopSpeech();
          }

          if (resolved.timing.pause_before_ms) {
            await sleepMs(resolved.timing.pause_before_ms);
            if (runIdRef.current !== runId) {
              return;
            }
          }

          if (action.slide_action) {
            await onSlideAction?.(action.slide_action);
          }

          onResetEmotion();
          const { gesture, emotion } = avatarReactionsFromDirectorResolved(
            action,
            resolved,
          );

          if (gesture) {
            onApplyReaction(gesture);
          }
          if (emotion) {
            onApplyReaction(emotion);
          }

          const utterance = action.utterance.trim();
          if (utterance) {
            await speak(utterance, voiceDirective);
          }

          if (resolved.timing.pause_after_ms) {
            await sleepMs(resolved.timing.pause_after_ms);
          }
        } catch (error) {
          const message = formatDirectorPlaybackError(index, action, error);
          syncLastPlaybackError(message);
          setLastRejections((prev) => [...prev, message]);
          if (runIdRef.current === runId) {
            setPlayback('idle');
          }
          return;
        }
      }

      if (runIdRef.current !== runId) {
        return;
      }

      onResetEmotion();
      syncQueue([]);
      currentIndexRef.current = -1;
      setCurrentIndex(-1);
      syncLastPlaybackError(null);
      setPlayback('idle');
    },
    [
      onApplyReaction,
      onResetEmotion,
      onSlideAction,
      setPlayback,
      speak,
      stopSpeech,
      syncLastPlaybackError,
      syncQueue,
      waitWhilePaused,
    ],
  );

  const enqueueActions = useCallback(
    (inputs: unknown[]) => {
      const { accepted, rejected } = enqueueManyValidated(inputs);
      setLastRejections(
        rejected.flatMap((item) =>
          item.errors.map((error) => `#${item.index}: ${error}`),
        ),
      );

      if (accepted.length === 0) {
        return { acceptedCount: 0, rejectedCount: rejected.length };
      }

      const isPlaying = playbackStateRef.current === 'playing';
      const hasPreemptive = isPlaying && accepted.some(isPreemptiveAction);
      const merged = hasPreemptive
        ? mergePreemptiveDuringPlayback(
            queueRef.current,
            currentIndexRef.current,
            accepted,
            resumeDeckAfterQaRef.current?.() ?? false,
          )
        : mergeQueueItems(queueRef.current, accepted, { isPlaying });

      if (hasPreemptive) {
        runIdRef.current += 1;
        stopSpeech();
        const nextRunId = runIdRef.current;
        syncQueue(merged);
        syncLastPlaybackError(null);
        setPlayback('playing');
        void runFromIndex(0, nextRunId);
        return {
          acceptedCount: accepted.length,
          rejectedCount: rejected.length,
        };
      }

      syncQueue(merged);
      return { acceptedCount: accepted.length, rejectedCount: rejected.length };
    },
    [runFromIndex, setPlayback, stopSpeech, syncLastPlaybackError, syncQueue],
  );

  const playQueue = useCallback(
    async (inputs?: unknown[]): Promise<DirectorQueueRunResult> => {
      if (inputs?.length) {
        enqueueActions(inputs);
      }

      if (queueRef.current.length === 0) {
        return {
          outcome: 'empty',
          lastPlaybackError: lastPlaybackErrorRef.current,
          currentIndex: currentIndexRef.current,
          queueLength: 0,
          playbackState: playbackStateRef.current,
        };
      }

      if (playbackStateRef.current === 'playing') {
        return {
          ...getRunResult(),
          outcome: 'already_playing',
        };
      }

      pausedRef.current = false;
      resumePausedWaiters();
      syncLastPlaybackError(null);
      runIdRef.current += 1;
      const runId = runIdRef.current;
      setPlayback('playing');
      setCurrentIndex(0);
      await runFromIndex(0, runId);
      return getRunResult();
    },
    [
      enqueueActions,
      getRunResult,
      resumePausedWaiters,
      runFromIndex,
      setPlayback,
      syncLastPlaybackError,
    ],
  );

  const pause = useCallback(() => {
    if (playbackStateRef.current !== 'playing') {
      return;
    }
    pausedRef.current = true;
    stopSpeech();
    setPlayback('paused');
  }, [setPlayback, stopSpeech]);

  const resume = useCallback(() => {
    if (playbackStateRef.current !== 'paused') {
      return;
    }
    pausedRef.current = false;
    resumePausedWaiters();
    setPlayback('playing');
  }, [resumePausedWaiters, setPlayback]);

  const skip = useCallback(() => {
    if (playbackStateRef.current === 'idle') {
      return;
    }

    const nextIndex =
      currentIndex >= 0 ? currentIndex + 1 : queueRef.current.length > 0 ? 0 : -1;

    runIdRef.current += 1;
    stopSpeech();
    pausedRef.current = false;
    resumePausedWaiters();

    if (nextIndex < 0 || nextIndex >= queueRef.current.length) {
      onResetEmotion();
      syncQueue([]);
      currentIndexRef.current = -1;
      setCurrentIndex(-1);
      syncLastPlaybackError(null);
      setPlayback('idle');
      return;
    }

    const runId = runIdRef.current;
    setPlayback('playing');
    void runFromIndex(nextIndex, runId);
  }, [
    currentIndex,
    onResetEmotion,
    resumePausedWaiters,
    runFromIndex,
    setPlayback,
    stopSpeech,
    syncLastPlaybackError,
    syncQueue,
  ]);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    pausedRef.current = false;
    resumePausedWaiters();
    stopSpeech();
    onResetEmotion();
    syncQueue([]);
    currentIndexRef.current = -1;
    setCurrentIndex(-1);
    syncLastPlaybackError(null);
    setPlayback('idle');
  }, [
    onResetEmotion,
    resumePausedWaiters,
    setPlayback,
    stopSpeech,
    syncLastPlaybackError,
    syncQueue,
  ]);

  return {
    playbackState,
    queue,
    currentIndex,
    lastRejections,
    lastPlaybackError,
    enqueueActions,
    playQueue,
    pause,
    resume,
    skip,
    stop,
  };
}
