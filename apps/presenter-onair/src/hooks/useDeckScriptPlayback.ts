import { useCallback, useState } from 'react';
import { resolveDeckPlaybackStatus } from '../lib/directorPlaybackError';
import { loadDeckScript } from '../lib/content/loadDeckScript';
import type { useDirectorQueue } from './useDirectorQueue';

type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;

export function useDeckScriptPlayback({
  activeDeckId,
  deckScriptUrl,
  queue,
}: {
  activeDeckId: string;
  deckScriptUrl?: string | null;
  queue: DirectorQueueApi;
}) {
  const [status, setStatus] = useState('就绪：可播放本场讲稿');
  const [lastErrors, setLastErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const playDeckScript = useCallback(async () => {
    setLastErrors([]);
    queue.stop();
    setIsLoading(true);
    setStatus(`加载讲稿：${activeDeckId}…`);

    try {
      const actions = await loadDeckScript(activeDeckId, deckScriptUrl);
      const playingStatus = `队列播放中：0 / ${actions.length}`;
      setStatus(playingStatus);
      const runResult = await queue.playQueue(actions);
      const rejections = [...queue.lastRejections];
      if (runResult.lastPlaybackError) {
        rejections.push(runResult.lastPlaybackError);
      }
      if (rejections.length > 0) {
        setLastErrors(rejections);
      }
      const doneStatus = resolveDeckPlaybackStatus(
        actions.length,
        runResult.playbackState,
        runResult.queueLength,
        runResult.currentIndex,
        runResult.lastPlaybackError,
      );
      setStatus(doneStatus);
      return {
        status: doneStatus,
        lastErrors: rejections,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '本场讲稿播放失败';
      setStatus(message);
      return { status: message, lastErrors: [] as string[] };
    } finally {
      setIsLoading(false);
    }
  }, [activeDeckId, deckScriptUrl, queue]);

  return {
    status,
    lastErrors,
    isLoading,
    playDeckScript,
    setStatus,
    setLastErrors,
  };
}
