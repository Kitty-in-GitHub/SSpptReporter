import { useCallback, useEffect, useRef, useState } from 'react';
import {
  transcribeAudio,
  type QaAsrEngine,
} from '../lib/voice/transcribeAudio';

type RecorderEngine = Exclude<QaAsrEngine, 'webSpeech'>;

interface UseMediaRecorderAsrOptions {
  engine: RecorderEngine;
  getApiKey?: () => string;
  onFinalTranscript?: (text: string) => void;
  onListeningEnd?: () => void;
  /** Called when gateway reports ASR not installed */
  onGatewayAsrUnavailable?: (message: string) => void;
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useMediaRecorderAsr(options: UseMediaRecorderAsrOptions) {
  const engine = options.engine;
  const getApiKeyRef = useRef(options.getApiKey);
  getApiKeyRef.current = options.getApiKey;
  const onFinalTranscriptRef = useRef(options.onFinalTranscript);
  onFinalTranscriptRef.current = options.onFinalTranscript;
  const onListeningEndRef = useRef(options.onListeningEnd);
  onListeningEndRef.current = options.onListeningEnd;
  const onGatewayAsrUnavailableRef = useRef(options.onGatewayAsrUnavailable);
  onGatewayAsrUnavailableRef.current = options.onGatewayAsrUnavailable;

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stoppingRef = useRef(false);

  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  const start = useCallback(async () => {
    if (!supported || listening || transcribing) {
      return;
    }

    setError(null);
    setFinalTranscript('');
    setInterimTranscript('');
    chunksRef.current = [];
    stoppingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void (async () => {
          setListening(false);
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          chunksRef.current = [];
          cleanupStream();

          if (!stoppingRef.current || blob.size === 0) {
            onListeningEndRef.current?.();
            return;
          }

          setTranscribing(true);
          setInterimTranscript('识别中…');
          try {
            const text = await transcribeAudio({
              engine,
              blob,
              filename: 'recording.webm',
              language: 'zh',
              apiKey: getApiKeyRef.current?.(),
              onProgress: (message) => setInterimTranscript(message),
            });
            setFinalTranscript(text);
            setInterimTranscript('');
            if (text) {
              onFinalTranscriptRef.current?.(text);
            } else {
              setError('未识别到有效语音，请重试');
            }
          } catch (asrError) {
            setInterimTranscript('');
            const message =
              asrError instanceof Error
                ? asrError.message
                : '语音转写失败';
            setError(message);
            if (
              engine === 'gateway' &&
              (message.includes('setup:asr') ||
                message.includes('ASR 未安装') ||
                message.includes('asr_not_installed'))
            ) {
              onGatewayAsrUnavailableRef.current?.(message);
            }
          } finally {
            setTranscribing(false);
            onListeningEndRef.current?.();
          }
        })();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setListening(true);
    } catch {
      cleanupStream();
      setError('无法使用麦克风（请检查权限）');
      setListening(false);
    }
  }, [cleanupStream, engine, listening, supported, transcribing]);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }
    stoppingRef.current = true;
    recorder.stop();
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    supported,
    listening,
    transcribing,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  };
}
