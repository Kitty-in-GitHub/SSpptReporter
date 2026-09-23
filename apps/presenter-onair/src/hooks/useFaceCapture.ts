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
  /** 已获取的摄像头流：供界面挂预览用，避免再开一次 getUserMedia 抢占设备 */
  const [stream, setStream] = useState<MediaStream | null>(null);
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
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.remove();
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

        // 先让出一次微任务：React 严格模式在开发下会「挂载 → 卸载 → 再挂载」，
        // 而 getUserMedia 不可取消。若不让路，两次挂载会各发一次请求，
        // 摄像头被同时打开两路、第一路随即被关 —— Windows 上这种时序容易让
        // 后一路采集中途卡死（现象是出十几帧后停在某个时间点）。
        // 让出微任务后，第一次挂载会在请求前就发现自己已 disposed，直接放弃。
        await Promise.resolve();
        if (disposed) {
          return;
        }

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
        // 必须挂进 DOM（不可见即可）：Chromium 对「不在文档里」的媒体元素出帧并不可靠，
        // 而它是我们唯一的帧源；官方 MediaPipe 示例同样是先入文档再取帧。
        // 注意不要用 display:none —— 那会让元素完全不渲染。
        video.style.cssText =
          'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(video);
        // 先记下引用：play() 一旦抛错，外层 catch 走 stopCapture() 也能把它摘掉
        videoRef.current = video;
        video.srcObject = stream;
        await video.play();

        streamRef.current = stream;
        setStream(stream);

        // module worker 是 Vite dev 唯一可用形态（dev 下 worker 脚本始终按 ESM 提供）。
        // MediaPipe 的 wasm glue 需要在 classic script / 非严格模式下求值，
        // Worker 里为此替换了 `self.import`，见 faceCapture.worker.ts 的说明。
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
    stream,
    isRunning,
    error,
    stopCapture,
  };
}
