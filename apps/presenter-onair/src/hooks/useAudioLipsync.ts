import { useCallback, useEffect, useRef, useState } from 'react';

/** Number of mouth animation levels (0-4) */
const MOUTH_LEVELS = 5;
/** Smoothing factor (higher means smoother) */
const SMOOTH_FACTOR = 0.5;
/** RMS normalization ceiling (this value maps to 1.0) */
const RMS_CEILING = 0.12;

interface PlayAudioOptions {
  onStart?: () => void;
}

export function useAudioLipsync() {
  const mouthLevelRef = useRef(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef(0);
  const playbackGenerationRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const clearPlayback = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // already stopped
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    smoothedRef.current = 0;
    mouthLevelRef.current = 0;
    setIsSpeaking(false);
  }, []);

  const stopCurrent = useCallback(() => {
    playbackGenerationRef.current += 1;
    clearPlayback();
  }, [clearPlayback]);

  const play = useCallback(
    async (
      arrayBuffer: ArrayBuffer,
      options?: PlayAudioOptions,
    ): Promise<void> => {
      const generation = playbackGenerationRef.current + 1;
      playbackGenerationRef.current = generation;
      clearPlayback();

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      if (generation !== playbackGenerationRef.current) {
        return;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;

      source.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      sourceRef.current = source;
      analyserRef.current = analyser;
      setIsSpeaking(true);

      const dataArray = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (generation !== playbackGenerationRef.current) return;
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(dataArray);

        let sumSq = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumSq += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSq / dataArray.length);

        smoothedRef.current =
          smoothedRef.current * SMOOTH_FACTOR + rms * (1 - SMOOTH_FACTOR);

        const normalized = Math.min(smoothedRef.current / RMS_CEILING, 1);
        const level = Math.min(
          Math.round(normalized * (MOUTH_LEVELS - 1)),
          MOUTH_LEVELS - 1,
        );

        mouthLevelRef.current = level;

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      return new Promise<void>((resolve) => {
        source.onended = () => {
          if (generation !== playbackGenerationRef.current) {
            resolve();
            return;
          }
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
          }
          analyserRef.current = null;
          smoothedRef.current = 0;
          mouthLevelRef.current = 0;
          setIsSpeaking(false);
          sourceRef.current = null;
          resolve();
        };
        source.start(0);
        options?.onStart?.();
      });
    },
    [clearPlayback, getAudioContext],
  );

  useEffect(() => {
    return () => {
      stopCurrent();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        void ctxRef.current.close();
      }
    };
  }, [stopCurrent]);

  return {
    mouthLevelRef,
    isSpeaking,
    play,
    stop: stopCurrent,
  };
}
