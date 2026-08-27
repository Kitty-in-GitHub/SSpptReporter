import type { DirectorAction } from '@ssreporter/director';
import type { DirectorQueuePlaybackState } from '@ssreporter/director';

export function formatDirectorPlaybackError(
  index: number,
  action: DirectorAction,
  error: unknown,
): string {
  const actionId = action.action_id?.trim() || `index-${index}`;
  const utterancePreview = action.utterance.trim().slice(0, 48);
  const utteranceSuffix =
    action.utterance.trim().length > 48 ? '…' : '';
  const detail =
    error instanceof Error ? error.message : String(error);
  const utterancePart = utterancePreview
    ? `「${utterancePreview}${utteranceSuffix}」`
    : '';
  return `#${index + 1} ${actionId}${utterancePart ? ` ${utterancePart}` : ''}: ${detail}`;
}

export function isDirectorQueuePlaybackCompleted(
  playbackState: DirectorQueuePlaybackState,
  queueLength: number,
  currentIndex: number,
  lastPlaybackError: string | null,
): boolean {
  return (
    playbackState === 'idle' &&
    queueLength === 0 &&
    currentIndex === -1 &&
    !lastPlaybackError
  );
}

export function resolveDeckPlaybackStatus(
  actionsLength: number,
  playbackState: DirectorQueuePlaybackState,
  queueLength: number,
  currentIndex: number,
  lastPlaybackError: string | null,
): string {
  if (isDirectorQueuePlaybackCompleted(
    playbackState,
    queueLength,
    currentIndex,
    lastPlaybackError,
  )) {
    return `本场讲稿播放完成（${actionsLength} 条）`;
  }
  if (lastPlaybackError) {
    const progress =
      currentIndex >= 0
        ? `第 ${currentIndex + 1} / ${actionsLength} 条`
        : `共 ${actionsLength} 条`;
    return `播放中断（${progress}）：${lastPlaybackError}`;
  }
  if (playbackState === 'idle' && queueLength === 0 && currentIndex === -1) {
    return '播放已停止';
  }
  return `队列状态：${playbackState}`;
}
