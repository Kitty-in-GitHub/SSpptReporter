import type { DirectorExecutorCallbacks } from './execute-types.js';
import type { DirectorAction } from './types.js';
import { validateDirectorAction } from './validate.js';

export interface DirectorEnqueueRejection {
  index: number;
  errors: string[];
}

export interface DirectorEnqueueResult {
  accepted: DirectorAction[];
  rejected: DirectorEnqueueRejection[];
}

export function isPreemptiveAction(action: DirectorAction): boolean {
  return action.barge_in === true || action.priority === 'emergency';
}

export function enqueueValidated(input: unknown): DirectorEnqueueResult {
  return enqueueManyValidated([input]);
}

export function enqueueManyValidated(inputs: unknown[]): DirectorEnqueueResult {
  const accepted: DirectorAction[] = [];
  const rejected: DirectorEnqueueRejection[] = [];

  inputs.forEach((input, index) => {
    const result = validateDirectorAction(input);
    if (result.ok) {
      accepted.push(result.action);
      return;
    }
    rejected.push({ index, errors: result.errors });
  });

  return { accepted, rejected };
}

/** Preemptive items are inserted at the front while playback is active. */
export function mergeQueueItems(
  currentQueue: DirectorAction[],
  incoming: DirectorAction[],
  options: { isPlaying: boolean },
): DirectorAction[] {
  if (incoming.length === 0) {
    return currentQueue;
  }

  const preemptive = incoming.filter(isPreemptiveAction);
  const normal = incoming.filter((action) => !isPreemptiveAction(action));

  if (options.isPlaying && preemptive.length > 0) {
    return [...preemptive, ...normal, ...currentQueue];
  }

  return [...currentQueue, ...preemptive, ...normal];
}

export async function runDirectorQueue(
  actions: DirectorAction[],
  callbacks: DirectorExecutorCallbacks,
  options?: {
    signal?: AbortSignal;
    shouldContinue?: () => boolean;
    waitWhilePaused?: () => Promise<void>;
  },
): Promise<void> {
  const shouldContinue = options?.shouldContinue ?? (() => true);
  const waitWhilePaused = options?.waitWhilePaused ?? (async () => {});

  for (const action of actions) {
    if (options?.signal?.aborted) {
      return;
    }

    await waitWhilePaused();

    if (!shouldContinue()) {
      return;
    }

    try {
      if (action.barge_in || action.priority === 'emergency') {
        await callbacks.onInterrupt?.();
      }

      if (action.slide_action) {
        await callbacks.onSlideAction?.(action.slide_action);
      }

      await callbacks.onEmotion?.(action);

      const utterance = action.utterance.trim();
      if (utterance) {
        await callbacks.onSpeak?.(utterance, action);
      }

      await callbacks.onActionComplete?.(action);
    } catch (error) {
      await callbacks.onActionError?.(action, error);
      throw error;
    }
  }
}
