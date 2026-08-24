import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionInstance = InstanceType<typeof SpeechRecognition>;

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  onFinalTranscript?: (text: string) => void;
  onListeningEnd?: () => void;
}

function speechErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风权限被拒绝';
    case 'network':
      return '语音识别网络错误';
    case 'audio-capture':
      return '未检测到麦克风';
    case 'aborted':
      return '';
    case 'no-speech':
      return '';
    default:
      return `语音识别错误（${error}）`;
  }
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions) {
  const lang = options?.lang ?? 'ja-JP';
  const continuous = options?.continuous ?? true;
  const onFinalTranscriptRef = useRef(options?.onFinalTranscript);
  const onListeningEndRef = useRef(options?.onListeningEnd);
  onFinalTranscriptRef.current = options?.onFinalTranscript;
  onListeningEndRef.current = options?.onListeningEnd;

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (!supported) return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = continuous;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(final);
        onFinalTranscriptRef.current?.(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('SpeechRecognition error:', event.error);
      const message = speechErrorMessage(event.error);
      if (message) {
        setError(message);
      }
      if (event.error !== 'no-speech') {
        setListening(false);
      }
    };

    recognition.onend = () => {
      setListening(false);
      onListeningEndRef.current?.();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [supported, lang, continuous]);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setError(null);
    setFinalTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // already started
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || !listening) return;
    recognitionRef.current.stop();
    setListening(false);
  }, [listening]);

  const reset = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  };
}
