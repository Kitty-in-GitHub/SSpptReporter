import type { DirectorAction } from '@ssreporter/director';
import { useCallback, useRef, useState } from 'react';
import {
  createRepeatRequestAction,
  isRepeatRequest,
} from '../lib/brain/qaRepeatAction';
import type { useBrainQa } from './useBrainQa';
import type { useDirectorQueue } from './useDirectorQueue';
import {
  readQaAutoSubmitPreference,
  shouldSubmitOnListeningEnd,
  writeQaAutoSubmitPreference,
} from './qaVoicePreferences';
import { useSpeechRecognition } from './useSpeechRecognition';

type BrainQaApi = ReturnType<typeof useBrainQa>;
type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;

export interface UseQaVoiceInputOptions {
  brainQa: BrainQaApi;
  directorQueue: DirectorQueueApi;
  disabled?: boolean;
}

function enqueueQaAction(
  directorQueue: DirectorQueueApi,
  action: DirectorAction,
): void {
  const queued = {
    ...action,
    barge_in: action.barge_in ?? true,
    priority: action.priority ?? 'high',
  };

  directorQueue.enqueueActions([queued]);
  if (directorQueue.playbackState !== 'playing') {
    void directorQueue.playQueue();
  }
}

export function useQaVoiceInput({
  brainQa,
  directorQueue,
  disabled = false,
}: UseQaVoiceInputOptions) {
  const [text, setText] = useState('');
  const textRef = useRef('');
  const [autoSubmit, setAutoSubmitState] = useState(readQaAutoSubmitPreference);
  const autoSubmitRef = useRef(autoSubmit);
  autoSubmitRef.current = autoSubmit;
  const stopListeningRef = useRef<(() => void) | null>(null);

  const syncText = useCallback((next: string) => {
    textRef.current = next;
    setText(next);
  }, []);

  const clearText = useCallback(() => {
    syncText('');
  }, [syncText]);

  const submitRef = useRef<(questionText?: string) => Promise<boolean>>(
    async () => false,
  );

  const appendFinalTranscript = useCallback(
    (recognizedText: string) => {
      syncText(`${textRef.current}${recognizedText}`);
    },
    [syncText],
  );

  const handleListeningEnd = useCallback(() => {
    if (
      shouldSubmitOnListeningEnd(autoSubmitRef.current, textRef.current)
    ) {
      void submitRef.current(textRef.current);
    }
  }, []);

  const speech = useSpeechRecognition({
    lang: 'zh-CN',
    continuous: false,
    onFinalTranscript: appendFinalTranscript,
    onListeningEnd: handleListeningEnd,
  });

  stopListeningRef.current = speech.stop;

  const submit = useCallback(
    async (questionText?: string): Promise<boolean> => {
      const trimmed = (questionText ?? textRef.current).trim();
      if (!trimmed || disabled || brainQa.loading) {
        return false;
      }

      let action: DirectorAction | null = null;
      if (isRepeatRequest(trimmed)) {
        action = createRepeatRequestAction(brainQa.lastResult?.action);
      } else {
        action = await brainQa.askQuestion(trimmed);
      }

      if (!action) {
        return false;
      }

      clearText();
      if (speech.listening) {
        stopListeningRef.current?.();
      }
      enqueueQaAction(directorQueue, action);
      return true;
    },
    [brainQa, clearText, directorQueue, disabled, speech.listening],
  );

  submitRef.current = submit;

  const setAutoSubmit = useCallback((value: boolean) => {
    autoSubmitRef.current = value;
    setAutoSubmitState(value);
    writeQaAutoSubmitPreference(value);
  }, []);

  const toggleMic = useCallback(() => {
    if (speech.listening) {
      speech.stop();
      return;
    }

    clearText();
    speech.reset();
    speech.start();
  }, [clearText, speech]);

  const canSubmit =
    !disabled && !brainQa.loading && text.trim().length > 0;

  return {
    text,
    setText: syncText,
    speech,
    submit,
    toggleMic,
    autoSubmit,
    setAutoSubmit,
    canSubmit,
    loading: brainQa.loading,
    error: brainQa.error,
    lastResult: brainQa.lastResult,
  };
}
