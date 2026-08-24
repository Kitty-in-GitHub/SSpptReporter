import { useCallback, useRef, useState } from 'react';
import type { useDirectorQueue } from '../../hooks/useDirectorQueue';
import type { useBrainQa } from '../../hooks/useBrainQa';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;
type BrainQaApi = ReturnType<typeof useBrainQa>;

interface QaPanelProps {
  brainQa: BrainQaApi;
  directorQueue: DirectorQueueApi;
  disabled?: boolean;
}

function formatConfidence(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export function QaPanel({ brainQa, directorQueue, disabled }: QaPanelProps) {
  const [text, setText] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const composingRef = useRef(false);

  const appendRecognizedText = useCallback((recognizedText: string) => {
    setText((prev) => `${prev}${recognizedText}`);
  }, []);

  const speech = useSpeechRecognition({
    lang: 'zh-CN',
    onFinalTranscript: appendRecognizedText,
  });

  const handleAsk = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || brainQa.loading) {
      return;
    }

    const action = await brainQa.askQuestion(trimmed);
    if (!action) {
      return;
    }

    setText('');
    if (speech.listening) {
      speech.stop();
    }

    const queued = {
      ...action,
      barge_in: action.barge_in ?? true,
      priority: action.priority ?? 'high',
    };

    directorQueue.enqueueActions([queued]);
    if (directorQueue.playbackState !== 'playing') {
      void directorQueue.playQueue();
    }
  }, [brainQa, directorQueue, disabled, speech, text]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !composingRef.current
    ) {
      event.preventDefault();
      void handleAsk();
    }
  };

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop();
    } else {
      speech.start();
    }
  };

  const lastQa = brainQa.lastResult?.action.qa;

  return (
    <section className={`present-qa-panel${collapsed ? ' is-collapsed' : ''}`}>
      <header className="present-qa-header">
        <button
          type="button"
          className="present-qa-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
        >
          评委提问
        </button>
        {!brainQa.knowledgeReady && !brainQa.knowledgeError ? (
          <span className="present-qa-status">加载知识库…</span>
        ) : null}
        {brainQa.knowledgeError ? (
          <span className="present-qa-status is-error">
            {brainQa.knowledgeError}
          </span>
        ) : null}
      </header>

      {!collapsed ? (
        <div className="present-qa-body">
          <div className="present-qa-input-row">
            <textarea
              className="present-qa-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onCompositionEnd={() => {
                composingRef.current = false;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                speech.listening
                  ? '正在听写…'
                  : '输入评委问题，Enter 提交'
              }
              rows={2}
              disabled={disabled || brainQa.loading}
            />
            {speech.supported ? (
              <button
                type="button"
                className={`present-qa-mic${speech.listening ? ' is-active' : ''}`}
                onClick={toggleMic}
                disabled={disabled || brainQa.loading}
                title="语音输入（Chrome / Edge）"
              >
                {speech.listening ? '停止' : '麦克风'}
              </button>
            ) : null}
            <button
              type="button"
              className="present-qa-submit"
              onClick={() => void handleAsk()}
              disabled={disabled || brainQa.loading || !text.trim()}
            >
              {brainQa.loading ? '思考中…' : '提问'}
            </button>
          </div>

          {speech.interimTranscript ? (
            <p className="present-qa-interim">{speech.interimTranscript}</p>
          ) : null}

          {brainQa.error ? (
            <p className="present-qa-error">{brainQa.error}</p>
          ) : null}

          {lastQa ? (
            <div className="present-qa-meta">
              <span>摘要：{lastQa.question_summary}</span>
              <span>置信度：{formatConfidence(lastQa.confidence)}</span>
              {lastQa.admit_unknown ? (
                <span className="present-qa-badge">未覆盖</span>
              ) : null}
              {lastQa.sources?.length ? (
                <span>
                  来源：
                  {lastQa.sources
                    .map((source) => `${source.kind}:${source.ref}`)
                    .join(' · ')}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
