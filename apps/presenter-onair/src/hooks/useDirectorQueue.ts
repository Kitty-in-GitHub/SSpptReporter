import {
  enqueueManyValidated,
  isPreemptiveAction,
  mergeQueueItems,
  type DirectorAction,
  type DirectorQueuePlaybackState,
  type SlideAction,
} from '@ssreporter/director';
import { useCallback, useRef, useState } from 'react';
import { toDirectorReactionDrafts } from '../lib/directorReactions';
import type { VrmAvatarReactionDraft } from '../lib/vrmReactions';

export interface UseDirectorQueueOptions {
  speak: (text: string) => Promise<void>;
  stopSpeech: () => void;
  onApplyEmotion: (draft: VrmAvatarReactionDraft) => void;
  onResetEmotion: () => void;
  onSlideAction?: (slideAction: SlideAction) => void | Promise<void>;
}

export function useDirectorQueue({
  speak,
  stopSpeech,
  onApplyEmotion,
  onResetEmotion,
  onSlideAction,
}: UseDirectorQueueOptions) {
  const [playbackState, setPlaybackState] =
    useState<DirectorQueuePlaybackState>('idle');
  const [queue, setQueue] = useState<DirectorAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [lastRejections, setLastRejections] = useState<string[]>([]);

  const queueRef = useRef<DirectorAction[]>([]);
  const playbackStateRef = useRef<DirectorQueuePlaybackState>('idle');
  const runIdRef = useRef(0);
  const pausedRef = useRef(false);
  const pauseResolversRef = useRef<(() => void)[]>([]);

  const syncQueue = useCallback((items: DirectorAction[]) => {
    queueRef.current = items;
    setQueue(items);
  }, []);

  const setPlayback = useCallback((state: DirectorQueuePlaybackState) => {
    playbackStateRef.current = state;
    setPlaybackState(state);
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
        setCurrentIndex(index);

        try {
          if (action.barge_in || action.priority === 'emergency') {
            stopSpeech();
          }

          if (action.slide_action) {
            await onSlideAction?.(action.slide_action);
          }

          onResetEmotion();
          const { gesture, emotion } = toDirectorReactionDrafts(action);
          if (gesture) {
            onApplyEmotion(gesture);
          }
          if (emotion) {
            onApplyEmotion(emotion);
          }

          const utterance = action.utterance.trim();
          if (utterance) {
            await speak(utterance);
          }
        } catch {
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
      setCurrentIndex(-1);
      setPlayback('idle');
    },
    [
      onApplyEmotion,
      onResetEmotion,
      onSlideAction,
      setPlayback,
      speak,
      stopSpeech,
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
      const merged = mergeQueueItems(queueRef.current, accepted, {
        isPlaying,
      });

      if (isPlaying && accepted.some(isPreemptiveAction)) {
        runIdRef.current += 1;
        stopSpeech();
        const nextRunId = runIdRef.current;
        syncQueue(merged);
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
    [runFromIndex, setPlayback, stopSpeech, syncQueue],
  );

  const playQueue = useCallback(
    async (inputs?: unknown[]) => {
      if (inputs?.length) {
        enqueueActions(inputs);
      }

      if (queueRef.current.length === 0) {
        return;
      }

      if (playbackStateRef.current === 'playing') {
        return;
      }

      pausedRef.current = false;
      resumePausedWaiters();
      runIdRef.current += 1;
      const runId = runIdRef.current;
      setPlayback('playing');
      setCurrentIndex(0);
      await runFromIndex(0, runId);
    },
    [enqueueActions, resumePausedWaiters, runFromIndex, setPlayback],
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
      setCurrentIndex(-1);
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
    syncQueue,
  ]);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    pausedRef.current = false;
    resumePausedWaiters();
    stopSpeech();
    onResetEmotion();
    syncQueue([]);
    setCurrentIndex(-1);
    setPlayback('idle');
  }, [onResetEmotion, resumePausedWaiters, setPlayback, stopSpeech, syncQueue]);

  return {
    playbackState,
    queue,
    currentIndex,
    lastRejections,
    enqueueActions,
    playQueue,
    pause,
    resume,
    skip,
    stop,
  };
}
