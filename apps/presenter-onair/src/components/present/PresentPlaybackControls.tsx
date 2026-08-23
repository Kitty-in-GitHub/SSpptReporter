import type { DirectorQueuePlaybackState } from '@ssreporter/director';

interface PresentPlaybackControlsProps {
  playbackState: DirectorQueuePlaybackState;
  playDisabled?: boolean;
  isLoading?: boolean;
  onPlayDeckScript: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
}

export function PresentPlaybackControls({
  playbackState,
  playDisabled = false,
  isLoading = false,
  onPlayDeckScript,
  onPause,
  onResume,
  onSkip,
  onStop,
}: PresentPlaybackControlsProps) {
  const isBusy = playbackState === 'playing' || playbackState === 'paused';

  return (
    <div className="present-playback-controls">
      <button
        type="button"
        className="present-playback-primary"
        disabled={playDisabled || isBusy || isLoading}
        onClick={onPlayDeckScript}
        title="播放本场讲稿"
      >
        {isLoading ? '加载中…' : '▶ 播放讲稿'}
      </button>
      {isBusy ? (
        <>
          <button
            type="button"
            disabled={playbackState !== 'playing'}
            onClick={onPause}
            title="暂停（Space）"
          >
            ⏸
          </button>
          <button
            type="button"
            disabled={playbackState !== 'paused'}
            onClick={onResume}
            title="继续（Space）"
          >
            ⏵
          </button>
          <button type="button" onClick={onSkip} title="跳过当前条">
            ⏭
          </button>
          <button type="button" onClick={onStop} title="停止">
            ⏹
          </button>
        </>
      ) : null}
    </div>
  );
}
