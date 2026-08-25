import { UI_QA } from '../../constants/uiZh';
import type { useBrainQa } from '../../hooks/useBrainQa';
import type { useDirectorQueue } from '../../hooks/useDirectorQueue';
import { useQaVoiceInput } from '../../hooks/useQaVoiceInput';
import type { QaAsrEngine } from '../../types/present';

type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;
type BrainQaApi = ReturnType<typeof useBrainQa>;

interface StageQaVoiceProps {
  brainQa: BrainQaApi;
  directorQueue: DirectorQueueApi;
  disabled?: boolean;
  qaAsrEngine: QaAsrEngine;
  getCloudAsrApiKey: () => string;
}

export function StageQaVoice({
  brainQa,
  directorQueue,
  disabled,
  qaAsrEngine,
  getCloudAsrApiKey,
}: StageQaVoiceProps) {
  const qaInput = useQaVoiceInput({
    brainQa,
    directorQueue,
    disabled,
    asrEngine: qaAsrEngine,
    getCloudAsrApiKey,
  });
  const lastSummary = qaInput.lastResult?.action.qa?.question_summary;

  const micTitle = !qaInput.speech.supported
    ? UI_QA.micUnsupported
    : qaInput.speech.listening
      ? UI_QA.micStop
      : UI_QA.stageMicTitle;

  return (
    <div className="present-stage-qa-voice">
      <button
        type="button"
        className={`present-stage-qa-mic${qaInput.speech.listening ? ' is-active' : ''}`}
        onClick={qaInput.toggleMic}
        disabled={
          !qaInput.speech.supported ||
          disabled ||
          qaInput.loading ||
          qaInput.transcribing
        }
        title={micTitle}
      >
        {qaInput.transcribing || qaInput.speech.listening ? '●' : '🎤'}
      </button>
      {qaInput.transcribing ? (
        <span className="present-stage-qa-status">{UI_QA.asrTranscribing}</span>
      ) : null}
      {qaInput.speech.listening && !qaInput.transcribing ? (
        <span className="present-stage-qa-status">{UI_QA.listeningPlaceholder}</span>
      ) : null}
      {qaInput.speech.interimTranscript ? (
        <span className="present-stage-qa-interim">
          {qaInput.speech.interimTranscript}
        </span>
      ) : null}
      {!qaInput.speech.listening && !qaInput.transcribing && lastSummary ? (
        <span className="present-stage-qa-last">
          {UI_QA.summaryPrefix}
          {lastSummary}
        </span>
      ) : null}
      {qaInput.speech.error || qaInput.error ? (
        <span className="present-stage-qa-error">
          {qaInput.speech.error ?? qaInput.error}
        </span>
      ) : null}
    </div>
  );
}
