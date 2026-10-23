import type {
  DirectorAction,
  DirectorQueuePlaybackState,
} from '@ssreporter/director';
import { UI_PRESENT } from '../../constants/uiZh';

export interface ScriptCueSummaryInput {
  playbackState: DirectorQueuePlaybackState;
  currentAction: DirectorAction | null;
  currentIndex: number;
  error?: string | null;
  idleHint?: string;
}

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
