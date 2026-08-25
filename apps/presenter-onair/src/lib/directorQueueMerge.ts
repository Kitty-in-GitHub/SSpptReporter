import {
  isPreemptiveAction,
  mergeQueueItems,
  type DirectorAction,
} from '@ssreporter/director';

export function mergePreemptiveDuringPlayback(
  currentQueue: DirectorAction[],
  currentIndex: number,
  incoming: DirectorAction[],
  resumeDeckAfterQa: boolean,
): DirectorAction[] {
  const preemptive = incoming.filter(isPreemptiveAction);
  if (preemptive.length === 0) {
    return mergeQueueItems(currentQueue, incoming, { isPlaying: true });
  }

  const normal = incoming.filter((action) => !isPreemptiveAction(action));
  if (resumeDeckAfterQa) {
    const remaining = currentQueue.slice(Math.max(0, currentIndex));
    return [...preemptive, ...normal, ...remaining];
  }

  return [...preemptive, ...normal];
}
