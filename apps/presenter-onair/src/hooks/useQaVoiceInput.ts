import type { DirectorAction } from '@ssreporter/director';
import { useCallback, useRef, useState } from 'react';
import {
  createRepeatRequestAction,
  isRepeatRequest,
} from '../lib/brain/qaRepeatAction';
import type { QaAsrEngine } from '../types/present';
import type { useBrainQa } from './useBrainQa';
import type { useDirectorQueue } from './useDirectorQueue';
import { useMediaRecorderAsr } from './useMediaRecorderAsr';
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
  asrEngine?: QaAsrEngine;
  getCloudAsrApiKey?: () => string;
  onGatewayAsrUnavailable?: (message: string) => void;
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

function isRecorderEngine(
  engine: QaAsrEngine,
): engine is Exclude<QaAsrEngine, 'webSpeech'> {
  return engine !== 'webSpeech';
}

export function useQaVoiceInput({
  brainQa,
  directorQueue,
  disabled = false,
  asrEngine = 'webSpeech',
  getCloudAsrApiKey,
  onGatewayAsrUnavailable,
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

  const useRecorder = isRecorderEngine(asrEngine);
  const recorderEngine: Exclude<QaAsrEngine, 'webSpeech'> = useRecorder
    ? asrEngine
    : 'gateway';

  const webSpeech = useSpeechRecognition({
    lang: 'zh-CN',
    continuous: false,
    onFinalTranscript: appendFinalTranscript,
    onListeningEnd: handleListeningEnd,
  });

  const recorderAsr = useMediaRecorderAsr({
    engine: recorderEngine,
    getApiKey: getCloudAsrApiKey,
    onFinalTranscript: appendFinalTranscript,
    onListeningEnd: handleListeningEnd,
    onGatewayAsrUnavailable,
  });

  const speech = useRecorder
    ? {
        supported: recorderAsr.supported,
        listening: recorderAsr.listening,
        interimTranscript: recorderAsr.interimTranscript,
        finalTranscript: recorderAsr.finalTranscript,
        error: recorderAsr.error,
        start: () => {
          void recorderAsr.start();
        },
        stop: recorderAsr.stop,
        reset: recorderAsr.reset,
      }
    : webSpeech;

  const busy = useRecorder
    ? recorderAsr.listening || recorderAsr.transcribing
    : webSpeech.listening;

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
      if (busy) {
        stopListeningRef.current?.();
      }
      enqueueQaAction(directorQueue, action);
      return true;
    },
    [brainQa, busy, clearText, directorQueue, disabled],
  );

  submitRef.current = submit;

  const setAutoSubmit = useCallback((value: boolean) => {
    autoSubmitRef.current = value;
    setAutoSubmitState(value);
    writeQaAutoSubmitPreference(value);
  }, []);

  const toggleMic = useCallback(() => {
    if (busy) {
      speech.stop();
      return;
    }

    clearText();
    speech.reset();
    speech.start();
  }, [busy, clearText, speech]);

  const canSubmit =
    !disabled && !brainQa.loading && text.trim().length > 0;

  return {
    text,
    setText: syncText,
    speech: {
      ...speech,
      listening: busy,
    },
    submit,
    toggleMic,
    autoSubmit,
    setAutoSubmit,
    canSubmit,
    loading: brainQa.loading,
    error: brainQa.error,
    lastResult: brainQa.lastResult,
    asrEngine,
    transcribing: useRecorder ? recorderAsr.transcribing : false,
  };
}
