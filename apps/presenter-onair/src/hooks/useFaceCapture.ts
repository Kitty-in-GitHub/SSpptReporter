import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceCaptureFrame } from '../lib/avatar/faceCaptureTypes';
import { landmarksToFaceCaptureFrame } from '../lib/vrm/faceCaptureMapper';
import { smoothFaceCaptureFrame } from '../lib/vrm/faceCaptureSmoothing';
import type {
  FaceCaptureWorkerRequest,
  FaceCaptureWorkerResponse,
} from '../workers/faceCapture.worker';

export interface UseFaceCaptureOptions {
  enabled: boolean;
  deviceId: string;
  smoothing: number;
}

export function useFaceCapture(options: UseFaceCaptureOptions) {
  const faceCaptureRef = useRef<FaceCaptureFrame | null>(null);
  const smoothedRef = useRef<FaceCaptureFrame | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const workerReadyRef = useRef(false);
  const inFlightRef = useRef(false);

  const stopCapture = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    inFlightRef.current = false;
    workerReadyRef.current = false;

    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' } satisfies FaceCaptureWorkerRequest);
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    faceCaptureRef.current = null;
    smoothedRef.current = null;
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!options.enabled) {
      stopCapture();
      setError(null);
      return;
    }

    let disposed = false;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('当前浏览器不支持摄像头访问。');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (disposed) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          return;
        }

        const video = document.createElement('video');
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        await video.play();

        streamRef.current = stream;
        videoRef.current = video;

        const worker = new Worker(
          new URL('../workers/faceCapture.worker.ts', import.meta.url),
          { type: 'module' },
        );
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<FaceCaptureWorkerResponse>) => {
          const data = event.data;
          if (data.type === 'ready') {
            workerReadyRef.current = true;
            setIsRunning(true);
            setError(null);
            return;
          }
          if (data.type === 'error') {
            setError(data.message);
            inFlightRef.current = false;
            return;
          }
          if (data.type === 'landmarks') {
            const frame = landmarksToFaceCaptureFrame(data.landmarks, {
              width: data.width,
              height: data.height,
            });
            if (frame) {
              const smoothed = smoothFaceCaptureFrame(
                smoothedRef.current,
                frame,
                options.smoothing,
              );
              smoothedRef.current = smoothed;
              faceCaptureRef.current = smoothed;
            }
            inFlightRef.current = false;
          }
        };

        worker.onerror = () => {
          setError('面捕 Worker 异常。');
          inFlightRef.current = false;
        };

        worker.postMessage({ type: 'init' } satisfies FaceCaptureWorkerRequest);

        const pump = async () => {
          if (disposed) return;
          rafRef.current = requestAnimationFrame(pump);

          const currentVideo = videoRef.current;
          const currentWorker = workerRef.current;
          if (
            !currentVideo ||
            !currentWorker ||
            !workerReadyRef.current ||
            inFlightRef.current ||
            currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
          ) {
            return;
          }

          inFlightRef.current = true;
          try {
            const bitmap = await createImageBitmap(currentVideo);
            currentWorker.postMessage(
              {
                type: 'frame',
                image: bitmap,
                timestampMs: performance.now(),
                width: currentVideo.videoWidth,
                height: currentVideo.videoHeight,
              } satisfies FaceCaptureWorkerRequest,
              [bitmap],
            );
          } catch {
            inFlightRef.current = false;
          }
        };

        rafRef.current = requestAnimationFrame(pump);
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : '无法启动摄像头面捕。';
        setError(message);
        stopCapture();
      }
    };

    void start();

    return () => {
      disposed = true;
      stopCapture();
    };
  }, [options.deviceId, options.enabled, options.smoothing, stopCapture]);

  return {
    faceCaptureRef,
    videoRef,
    isRunning,
    error,
    stopCapture,
  };
}
