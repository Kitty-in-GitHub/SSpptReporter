import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEdgeSpeechAudio } from '../lib/tts/edgeSpeechClient';
import {
  DEFAULT_EDGE_TTS_API_URL,
  DEFAULT_EDGE_TTS_MODEL,
} from '../lib/voiceOptions';

/** 试听固定短句：便于不同音色横向对比，延迟稳定 */
export const VOICE_PREVIEW_TEXT = '你好，这是当前音色的试听示例。';

/**
 * 音色试听：按需请求本机 Edge 网关合成短句，同音色结果缓存于内存。
 * 返回的 activeVoice 同时表示「合成中」与「播放中」，便于按钮做 loading/停止态。
 */
export function useVoicePreview() {
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef(new Map<string, ArrayBuffer>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const runIdRef = useRef(0);

  const releaseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    releaseAudio();
    setActiveVoice(null);
  }, [releaseAudio]);

  useEffect(
    () => () => {
      runIdRef.current += 1;
      releaseAudio();
    },
    [releaseAudio],
  );

  const preview = useCallback(
    async (voice: string) => {
      if (activeVoice === voice) {
        stop();
        return;
      }

      runIdRef.current += 1;
      const runId = runIdRef.current;
      releaseAudio();
      setError(null);
      setActiveVoice(voice);

      try {
        let buffer = cacheRef.current.get(voice);
        if (!buffer) {
          buffer = await fetchEdgeSpeechAudio(
            {
              model: DEFAULT_EDGE_TTS_MODEL,
              input: VOICE_PREVIEW_TEXT,
              voice,
              speed: 1,
            },
            { apiUrl: DEFAULT_EDGE_TTS_API_URL },
          );
          cacheRef.current.set(voice, buffer);
        }
        if (runIdRef.current !== runId) {
          return;
        }

        const objectUrl = URL.createObjectURL(
          new Blob([buffer], { type: 'audio/mpeg' }),
        );
        objectUrlRef.current = objectUrl;
        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        const finish = () => {
          if (runIdRef.current !== runId) {
            return;
          }
          setActiveVoice(null);
          releaseAudio();
        };
        audio.onended = finish;
        audio.onerror = () => {
          if (runIdRef.current !== runId) {
            return;
          }
          setError('试听播放失败');
          finish();
        };

        await audio.play();
      } catch (previewError) {
        if (runIdRef.current !== runId) {
          return;
        }
        cacheRef.current.delete(voice);
        setActiveVoice(null);
        setError(
          previewError instanceof Error
            ? `试听失败：${previewError.message}`
            : '试听失败',
        );
      }
    },
    [activeVoice, releaseAudio, stop],
  );

  return { activeVoice, error, preview };
}
