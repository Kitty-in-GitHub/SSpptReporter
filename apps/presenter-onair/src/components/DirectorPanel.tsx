import { useCallback, useMemo, useState } from 'react';
import {
  validateDirectorAction,
  type SlideAction,
} from '@ssreporter/director';
import sampleAction from '../fixtures/sample-action.json';
import sampleQueue from '../fixtures/sample-queue.json';
import { loadDeckScript } from '../lib/content/loadDeckScript';
import { toDirectorReactionDraft } from '../lib/directorReactions';
import type { useDirectorQueue } from '../hooks/useDirectorQueue';
import type { VrmAvatarReactionDraft } from '../lib/vrmReactions';
import type { TTSEngineOption } from '../types/settings';

type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;

interface DirectorPanelProps {
  disabled?: boolean;
  supportsLipSync: boolean;
  ttsEngine: TTSEngineOption;
  activeDeckId: string;
  deckScriptUrl?: string | null;
  queue: DirectorQueueApi;
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
  disabled = false,
  supportsLipSync,
  ttsEngine,
  activeDeckId,
  deckScriptUrl,
  queue,
  onSpeak,
  onApplyEmotion,
  onResetEmotion,
}: DirectorPanelProps) {
  const [status, setStatus] = useState('就绪：可播放单条或本场讲稿');
  const [lastErrors, setLastErrors] = useState<string[]>([]);

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
    queue.stop();

    setStatus(`加载讲稿：${activeDeckId}…`);
    try {
      const actions = await loadDeckScript(activeDeckId, deckScriptUrl);
      setStatus(`队列播放中：0 / ${actions.length}`);
      await queue.playQueue(actions);
      if (queue.lastRejections.length > 0) {
        setLastErrors(queue.lastRejections);
      }
      setStatus(
        queue.playbackState === 'idle'
          ? `本场讲稿播放完成（${actions.length} 条）`
          : `队列状态：${queue.playbackState}`,
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '本场讲稿播放失败');
    }
  }, [activeDeckId, deckScriptUrl, queue]);

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

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 40,
        maxWidth: 380,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'rgba(20, 24, 32, 0.92)',
        color: '#e8eef8',
        fontSize: 13,
        lineHeight: 1.45,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>导演台 · Phase 1</div>
      <div style={{ opacity: 0.85, marginBottom: 8 }}>{status}</div>
      {isQueueBusy && (
        <div style={{ opacity: 0.85, marginBottom: 8 }}>
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
      {!validation.ok && (
        <div style={{ color: '#ff8f8f', marginBottom: 8 }}>
          fixture 无效：{validation.errors.join('; ')}
        </div>
      )}
      {(lastErrors.length > 0 || queue.lastRejections.length > 0) && (
        <div style={{ color: '#ff8f8f', marginBottom: 8 }}>
          {[...lastErrors, ...queue.lastRejections].join('; ')}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={disabled || !validation.ok || isQueueBusy}
          onClick={() => void runFixture()}
          style={buttonStyle(disabled || !validation.ok || isQueueBusy, true)}
        >
          播放单条
        </button>
        <button
          type="button"
          disabled={disabled || isQueueBusy}
          onClick={() => void runDeckScript()}
          style={buttonStyle(disabled || isQueueBusy, true)}
        >
          播放本场讲稿
        </button>
        <button
          type="button"
          disabled={disabled || !queueIsValid || isQueueBusy}
          onClick={() => void runQueueFixture()}
          style={buttonStyle(disabled || !queueIsValid || isQueueBusy, false)}
        >
          fixture 队列
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={runInvalidFixture}
          style={buttonStyle(disabled, false)}
        >
          测试非法 JSON
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button
          type="button"
          disabled={!isQueueBusy || queue.playbackState !== 'playing'}
          onClick={queue.pause}
          style={buttonStyle(
            !isQueueBusy || queue.playbackState !== 'playing',
            false,
          )}
        >
          暂停
        </button>
        <button
          type="button"
          disabled={queue.playbackState !== 'paused'}
          onClick={queue.resume}
          style={buttonStyle(queue.playbackState !== 'paused', false)}
        >
          继续
        </button>
        <button
          type="button"
          disabled={!isQueueBusy}
          onClick={queue.skip}
          style={buttonStyle(!isQueueBusy, false)}
        >
          跳过
        </button>
        <button
          type="button"
          disabled={!isQueueBusy}
          onClick={queue.stop}
          style={buttonStyle(!isQueueBusy, false)}
        >
          停止
        </button>
      </div>
      <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
        TTS：设置 → <code>{ttsEngine}</code>
        {supportsLipSync ? '（支持口型）' : '（当前引擎无口型）'}
      </div>
    </div>
  );
}

function buttonStyle(disabled: boolean, primary: boolean) {
  return {
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: primary ? 0 : '1px solid #64748b',
    borderRadius: 8,
    padding: '8px 12px',
    background: primary ? '#3b82f6' : 'transparent',
    color: '#e8eef8',
    fontWeight: primary ? 600 : 400,
  } as const;
}
