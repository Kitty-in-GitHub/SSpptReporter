import type { DirectorAction, DirectorQueuePlaybackState } from '@ssreporter/director';
import { UI_PRESENT } from '../../constants/uiZh';

interface PresentScriptCueProps {
  playbackState: DirectorQueuePlaybackState;
  currentAction: DirectorAction | null;
  currentIndex: number;
  queueLength: number;
  error?: string | null;
  idleHint?: string;
}

type ScriptCueSummaryInput = Pick<
  PresentScriptCueProps,
  'playbackState' | 'currentAction' | 'currentIndex' | 'error' | 'idleHint'
>;

/** 底栏收起时标题行显示的一行摘要 */
export function resolveScriptCueSummary({
  playbackState,
  currentAction,
  currentIndex,
  error = null,
  idleHint = UI_PRESENT.scriptCueIdle,
}: ScriptCueSummaryInput): { text: string; isError: boolean } {
  if (error) {
    return { text: error, isError: true };
  }

  const isActive = playbackState === 'playing' || playbackState === 'paused';
  if (isActive && currentAction && currentIndex >= 0) {
    return {
      text: currentAction.utterance.trim() || UI_PRESENT.scriptCueNoUtterance,
      isError: false,
    };
  }

  return { text: idleHint, isError: false };
}

export function PresentScriptCue({
  playbackState,
  currentAction,
  currentIndex,
  queueLength,
  error = null,
  idleHint = UI_PRESENT.scriptCueIdle,
}: PresentScriptCueProps) {
  const isActive =
    playbackState === 'playing' || playbackState === 'paused';
  const hasCue = isActive && currentAction && currentIndex >= 0;

  const progress =
    queueLength > 0 && currentIndex >= 0
      ? `第 ${currentIndex + 1} / ${queueLength} 条`
      : null;

  return (
    <div className="present-script-cue-inner">
      {error ? (
        <p className="present-script-cue-error">{error}</p>
      ) : hasCue ? (
        <>
          <span className="present-script-cue-progress">{progress}</span>
          <p className="present-script-cue-text">{currentAction.utterance}</p>
          {playbackState === 'paused' ? (
            <span className="present-script-cue-badge">已暂停</span>
          ) : null}
        </>
      ) : (
        <p className="present-script-cue-idle">{idleHint}</p>
      )}
    </div>
  );
}
