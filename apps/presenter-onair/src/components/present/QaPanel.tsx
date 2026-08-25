import { useRef, useState } from 'react';
import { UI_PRESENT, UI_QA } from '../../constants/uiZh';
import type { useBrainQa } from '../../hooks/useBrainQa';
import type { useDirectorQueue } from '../../hooks/useDirectorQueue';
import { useQaVoiceInput } from '../../hooks/useQaVoiceInput';

type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;
type BrainQaApi = ReturnType<typeof useBrainQa>;

interface QaPanelProps {
  brainQa: BrainQaApi;
  directorQueue: DirectorQueueApi;
  disabled?: boolean;
  resumeDeckAfterQaInterrupt: boolean;
  onResumeDeckAfterQaInterruptChange: (value: boolean) => void;
}

function formatConfidence(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export function QaPanel({
  brainQa,
  directorQueue,
  disabled,
  resumeDeckAfterQaInterrupt,
  onResumeDeckAfterQaInterruptChange,
}: QaPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const composingRef = useRef(false);

  const qaInput = useQaVoiceInput({ brainQa, directorQueue, disabled });
  const lastQa = qaInput.lastResult?.action.qa;

  const micTitle = !qaInput.speech.supported
    ? UI_QA.micUnsupported
    : qaInput.speech.listening
      ? UI_QA.micStop
      : UI_QA.micTitle;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !composingRef.current
    ) {
      event.preventDefault();
      void qaInput.submit();
    }
  };

  return (
    <section className={`present-qa-panel${collapsed ? ' is-collapsed' : ''}`}>
      <header className="present-qa-header">
        <button
          type="button"
          className="present-qa-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
        >
          {UI_QA.panelTitle}
        </button>
        {!brainQa.knowledgeReady && !brainQa.knowledgeError ? (
          <span className="present-qa-status">{UI_QA.knowledgeLoading}</span>
        ) : null}
        {brainQa.knowledgeError ? (
          <span className="present-qa-status is-error">
            {brainQa.knowledgeError}
          </span>
        ) : null}
      </header>

      {!collapsed ? (
        <div className="present-qa-body">
          <div className="present-qa-options">
            <label className="present-qa-auto-submit">
              <input
                type="checkbox"
                checked={qaInput.autoSubmit}
                onChange={(event) => qaInput.setAutoSubmit(event.target.checked)}
              />
              {UI_QA.autoSubmitLabel}
            </label>
            <label className="present-qa-auto-submit">
              <input
                type="checkbox"
                checked={resumeDeckAfterQaInterrupt}
                onChange={(event) =>
                  onResumeDeckAfterQaInterruptChange(event.target.checked)
                }
              />
              {UI_PRESENT.resumeDeckAfterQa}
            </label>
          </div>

          <div className="present-qa-input-row">
            <textarea
              className="present-qa-input"
              value={qaInput.text}
              onChange={(event) => qaInput.setText(event.target.value)}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onCompositionEnd={() => {
                composingRef.current = false;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                qaInput.speech.listening
                  ? UI_QA.listeningPlaceholder
                  : UI_QA.inputPlaceholder
              }
              rows={2}
              disabled={disabled || qaInput.loading}
            />
            <button
              type="button"
              className={`present-qa-mic${qaInput.speech.listening ? ' is-active' : ''}`}
              onClick={qaInput.toggleMic}
              disabled={!qaInput.speech.supported || disabled || qaInput.loading}
              title={micTitle}
            >
              {qaInput.speech.listening ? UI_QA.micStop : UI_QA.micLabel}
            </button>
            <button
              type="button"
              className="present-qa-submit"
              onClick={() => void qaInput.submit()}
              disabled={disabled || qaInput.loading || !qaInput.canSubmit}
            >
              {qaInput.loading ? UI_QA.submitting : UI_QA.submit}
            </button>
          </div>

          {qaInput.speech.interimTranscript ? (
            <p className="present-qa-interim">
              {qaInput.speech.interimTranscript}
            </p>
          ) : null}

          {qaInput.speech.error ? (
            <p className="present-qa-error">{qaInput.speech.error}</p>
          ) : null}

          {qaInput.error ? (
            <p className="present-qa-error">{qaInput.error}</p>
          ) : null}

          {lastQa ? (
            <div className="present-qa-meta">
              <span>
                {UI_QA.summaryPrefix}
                {lastQa.question_summary}
              </span>
              <span>
                {UI_QA.confidencePrefix}
                {formatConfidence(lastQa.confidence)}
              </span>
              {lastQa.admit_unknown ? (
                <span className="present-qa-badge">{UI_QA.admitUnknownBadge}</span>
              ) : null}
              {lastQa.sources?.length ? (
                <span>
                  {UI_QA.sourcesPrefix}
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
