import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  validateDirectorAction,
  type SlideAction,
} from '@ssreporter/director';
import sampleAction from '../fixtures/sample-action.json';
import sampleQueue from '../fixtures/sample-queue.json';
import { toDirectorReactionDraft } from '../lib/directorReactions';
import type { useDirectorQueue } from '../hooks/useDirectorQueue';
import type { useDeckScriptPlayback } from '../hooks/useDeckScriptPlayback';
import type { VrmAvatarReactionDraft } from '../lib/vrmReactions';
import type { SessionMode } from '../types/present';
import type { TTSEngineOption } from '../types/settings';
import './directorPanel.css';

type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;
type DeckScriptPlaybackApi = ReturnType<typeof useDeckScriptPlayback>;

interface DirectorPanelProps {
  sessionMode: SessionMode;
  disabled?: boolean;
  supportsLipSync: boolean;
  ttsEngine: TTSEngineOption;
  queue: DirectorQueueApi;
  deckPlayback: DeckScriptPlaybackApi;
  onSpeak: (text: string) => Promise<void>;
  onApplyEmotion: (draft: VrmAvatarReactionDraft) => void;
  onResetEmotion: () => void;
}

const INVALID_FIXTURE = {
  schema_version: '9.9',
  mode: 'present',
  utterance: '这条应被拒绝',
  emotion: 'not-a-real-emotion',
};

function completionMessage(supportsLipSync: boolean, ttsEngine: TTSEngineOption) {
  if (ttsEngine === 'webSpeech') {
    return '播放完成（Web Speech 无口型；换 VOICEVOX / 云端 TTS 可测口型）';
  }
  if (supportsLipSync) {
    return '播放完成（TTS + 口型）';
  }
  return '播放完成';
}

function formatSlideAction(slideAction: SlideAction): string {
  if (slideAction.goto) {
    return `goto ${slideAction.goto}`;
  }
  if (slideAction.next) {
    return 'next';
  }
  if (slideAction.prev) {
    return 'prev';
  }
  if (slideAction.highlight) {
    return `highlight ${slideAction.highlight}`;
  }
  return 'slide';
}

export function DirectorPanel({
  sessionMode,
  disabled = false,
  supportsLipSync,
  ttsEngine,
  queue,
  deckPlayback,
  onSpeak,
  onApplyEmotion,
  onResetEmotion,
}: DirectorPanelProps) {
  const isPresentMode = sessionMode === 'present';
  const [expanded, setExpanded] = useState(!isPresentMode);
  const [status, setStatus] = useState('就绪：可播放单条或本场讲稿');
  const [lastErrors, setLastErrors] = useState<string[]>([]);

  useEffect(() => {
    setExpanded(sessionMode !== 'present');
  }, [sessionMode]);

  const validation = useMemo(() => validateDirectorAction(sampleAction), []);
  const queueValidation = useMemo(
    () => sampleQueue.map((item) => validateDirectorAction(item)),
    [],
  );
  const queueIsValid = queueValidation.every((item) => item.ok);

  const runFixture = useCallback(async () => {
    setLastErrors([]);
    const result = validateDirectorAction(sampleAction);
    if (!result.ok) {
      setLastErrors(result.errors);
      setStatus('校验失败');
      return;
    }

    const action = result.action;
    queue.stop();
    onResetEmotion();
    const draft = toDirectorReactionDraft(action);
    if (draft) {
      onApplyEmotion(draft);
    }

    setStatus(`播放中：${action.action_id ?? 'fixture'} / ${action.mode}`);
    try {
      await onSpeak(action.utterance);
      setStatus(completionMessage(supportsLipSync, ttsEngine));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '播放失败');
    } finally {
      onResetEmotion();
    }
  }, [
    onApplyEmotion,
    onResetEmotion,
    onSpeak,
    queue,
    supportsLipSync,
    ttsEngine,
  ]);

  const runDeckScript = useCallback(async () => {
    setLastErrors([]);
    const result = await deckPlayback.playDeckScript();
    if (result) {
      setLastErrors(result.lastErrors);
      setStatus(result.status);
    }
  }, [deckPlayback]);

  const runQueueFixture = useCallback(async () => {
    setLastErrors([]);
    queue.stop();

    if (!queueIsValid) {
      const errors = queueValidation
        .filter((item) => !item.ok)
        .flatMap((item) => (item.ok ? [] : item.errors));
      setLastErrors(errors);
      setStatus('队列 fixture 校验失败');
      return;
    }

    setStatus(`队列播放中：0 / ${sampleQueue.length}`);
    try {
      await queue.playQueue(sampleQueue);
      if (queue.lastRejections.length > 0) {
        setLastErrors(queue.lastRejections);
      }
      setStatus(
        queue.playbackState === 'idle'
          ? `队列播放完成（${sampleQueue.length} 条）`
          : `队列状态：${queue.playbackState}`,
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '队列播放失败');
    }
  }, [queue, queueIsValid, queueValidation]);

  const runInvalidFixture = useCallback(() => {
    const result = validateDirectorAction(INVALID_FIXTURE);
    if (result.ok) {
      setLastErrors(['意外：非法 fixture 通过了校验']);
      setStatus('校验异常');
      return;
    }
    setLastErrors(result.errors);
    setStatus('非法 JSON 已被 schema 拒绝');
  }, []);

  const currentAction =
    queue.currentIndex >= 0 ? queue.queue[queue.currentIndex] : null;
  const isQueueBusy =
    queue.playbackState === 'playing' || queue.playbackState === 'paused';

  const displayStatus = isPresentMode ? deckPlayback.status : status;
  const displayErrors = isPresentMode
    ? [...lastErrors, ...deckPlayback.lastErrors, ...queue.lastRejections]
    : [...lastErrors, ...queue.lastRejections];

  if (isPresentMode && !expanded) {
    return (
      <div className="director-panel director-panel-present">
        <button
          type="button"
          className={`director-panel-fab${isQueueBusy ? ' is-busy' : ''}`}
          onClick={() => setExpanded(true)}
          title="展开导演台"
          aria-label="展开导演台"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className={`director-panel${isPresentMode ? ' director-panel-present' : ''}`}>
      <div className="director-panel-card">
        <div className="director-panel-header">
          <div className="director-panel-title">
            {isPresentMode ? '导演台' : '导演台 · Phase 1'}
          </div>
          {isPresentMode ? (
            <button
              type="button"
              className="director-panel-collapse"
              onClick={() => setExpanded(false)}
              title="收起"
              aria-label="收起导演台"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="director-panel-status">{displayStatus}</div>

        {isQueueBusy && (
          <div className="director-panel-queue-meta">
            队列：{queue.playbackState}
            {queue.queue.length > 0 && (
              <>
                {' '}
                · {queue.currentIndex + 1}/{queue.queue.length}
              </>
            )}
            {currentAction?.action_id && (
              <>
                {' '}
                · <code>{currentAction.action_id}</code>
              </>
            )}
            {currentAction?.slide_action && (
              <>
                {' '}
                · slide {formatSlideAction(currentAction.slide_action)}
              </>
            )}
          </div>
        )}

        {!isPresentMode && !validation.ok && (
          <div className="director-panel-error">
            fixture 无效：{validation.errors.join('; ')}
          </div>
        )}

        {displayErrors.length > 0 && (
          <div className="director-panel-error">
            {displayErrors.join('; ')}
          </div>
        )}

        {!isPresentMode && (
          <div className="director-panel-actions">
            <button
              type="button"
              className="director-panel-button is-primary"
              disabled={disabled || !validation.ok || isQueueBusy}
              onClick={() => void runFixture()}
            >
              播放单条
            </button>
            <button
              type="button"
              className="director-panel-button is-primary"
              disabled={disabled || isQueueBusy || deckPlayback.isLoading}
              onClick={() => void runDeckScript()}
            >
              播放本场讲稿
            </button>
            <button
              type="button"
              className="director-panel-button is-secondary"
              disabled={disabled || !queueIsValid || isQueueBusy}
              onClick={() => void runQueueFixture()}
            >
              fixture 队列
            </button>
            <button
              type="button"
              className="director-panel-button is-secondary"
              disabled={disabled}
              onClick={runInvalidFixture}
            >
              测试非法 JSON
            </button>
          </div>
        )}

        <div className="director-panel-actions">
          <button
            type="button"
            className="director-panel-button is-secondary"
            disabled={!isQueueBusy || queue.playbackState !== 'playing'}
            onClick={queue.pause}
          >
            暂停
          </button>
          <button
            type="button"
            className="director-panel-button is-secondary"
            disabled={queue.playbackState !== 'paused'}
            onClick={queue.resume}
          >
            继续
          </button>
          <button
            type="button"
            className="director-panel-button is-secondary"
            disabled={!isQueueBusy}
            onClick={queue.skip}
          >
            跳过
          </button>
          <button
            type="button"
            className="director-panel-button is-secondary"
            disabled={!isQueueBusy}
            onClick={queue.stop}
          >
            停止
          </button>
        </div>

        <div className="director-panel-footer">
          TTS：设置 → <code>{ttsEngine}</code>
          {supportsLipSync ? '（支持口型）' : '（当前引擎无口型）'}
        </div>
      </div>
    </div>
  );
}
