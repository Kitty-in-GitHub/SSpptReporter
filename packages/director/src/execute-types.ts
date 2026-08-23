import type { DirectorAction, SlideAction } from './types.js';

export interface DirectorExecutorCallbacks {
  onInterrupt?: () => void | Promise<void>;
  onSlideAction?: (slideAction: SlideAction) => void | Promise<void>;
  onEmotion?: (action: DirectorAction) => void | Promise<void>;
  onSpeak?: (utterance: string, action: DirectorAction) => void | Promise<void>;
  onActionComplete?: (action: DirectorAction) => void | Promise<void>;
  onActionError?: (action: DirectorAction, error: unknown) => void | Promise<void>;
}

export type DirectorQueuePlaybackState = 'idle' | 'playing' | 'paused';
