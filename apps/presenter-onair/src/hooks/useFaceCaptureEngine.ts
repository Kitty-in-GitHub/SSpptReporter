import { useEffect, useRef, useState, type RefObject } from 'react';
import type { FaceCaptureFrame } from '../lib/avatar/faceCaptureTypes';
import { landmarksToFaceCaptureFrame } from '../lib/vrm/faceCaptureMapper';
import { smoothFaceCaptureFrame } from '../lib/vrm/faceCaptureSmoothing';
import { cameraLog, cameraWarn } from '../lib/cameraLog';
import type {
  FaceCaptureWorkerRequest,
  FaceCaptureWorkerResponse,
} from '../workers/faceCapture.worker';

/**
 * 面捕引擎：**建在 `useVideoSource` 之上**，自己不开摄像头。
 *
 * 职责边界：吃采集模块给的帧源（探针 `<video>`），在 Worker 里跑 MediaPipe Face
 * Landmarker，把每帧的 478 个点换成与实现无关的 `FaceCaptureFrame` 写进 `frameRef`。
 * **不做** 渲染、不碰 VRM —— `AvatarPanel` 的渲染循环按需来读这个 ref。
 *
 * 为什么用 ref 而不是 state：面捕是 25~30fps 的数据流，走 React state 会把整棵树
 * 每秒重渲染几十次。`isRunning` / `error` 这种低频状态才走 state。
 */
export interface UseFaceCaptureEngineOptions {
  /** 帧源：`useVideoSource` 暴露的探针 `<video>`；null = 还没开流 */
  frameSource: HTMLVideoElement | null;
  enabled: boolean;
  /** 平滑系数 0~1（越大越稳、越迟钝） */
  smoothing: number;
}

export interface FaceCaptureEngineResult {
  /** 渲染循环按需读取的最新一帧（不触发 React 重渲染） */
  frameRef: RefObject<FaceCaptureFrame | null>;
  /** Worker 已就绪、正在出帧 */
  isRunning: boolean;
  error: string | null;
}

/** 心跳日志间隔 */
const HEARTBEAT_MS = 10000;
/** 取帧失败日志抽样：首次必报，之后每 N 次报一条 */
const GRAB_FAIL_LOG_EVERY = 30;

export function useFaceCaptureEngine(
  options: UseFaceCaptureEngineOptions,
): FaceCaptureEngineResult {
  const frameRef = useRef<FaceCaptureFrame | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 平滑度只参与帧处理，放 ref：否则拖一下滑块就会重建 Worker（重新加载模型）
  const smoothingRef = useRef(options.smoothing);
  smoothingRef.current = options.smoothing;
  // 帧源放 ref：自愈重开会换一个 `<video>`，而 Worker（与已加载的模型）不该跟着重建
  const frameSourceRef = useRef(options.frameSource);
  frameSourceRef.current = options.frameSource;
  const { enabled } = options;

  useEffect(() => {
    frameRef.current = null;
    setIsRunning(false);
    setError(null);

    if (!enabled) {
      return;
    }

    let disposed = false;
    let worker: Worker | null = null;
    let workerReady = false;
    /** 背压：Worker 没回消息前不再取下一帧，避免帧堆积 */
    let inFlight = false;
    let rafId = 0;
    let smoothed: FaceCaptureFrame | null = null;
    let processedFrames = 0;
    let failedGrabs = 0;
    let lastHeartbeatAt = performance.now();
    let lastHeartbeatFrames = 0;

    const pump = async () => {
      if (disposed) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        void pump();
      });
      if (!worker || !workerReady || inFlight) {
        return;
      }
      const frameSource = frameSourceRef.current;
      if (!frameSource) {
        return;
      }
      // 刚开流或自愈重开的空窗期：元素还没出帧，跳过即可
      if (frameSource.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }
      const width = frameSource.videoWidth;
      const height = frameSource.videoHeight;
      if (!width || !height) {
        return;
      }

      inFlight = true;
      try {
        const bitmap = await createImageBitmap(frameSource);
        if (disposed || !worker) {
          bitmap.close();
          inFlight = false;
          return;
        }
        // inFlight 保持到 Worker 回消息为止（见 handleMessage）
        worker.postMessage(
          {
            type: 'frame',
            image: bitmap,
            timestampMs: performance.now(),
            width,
            height,
          } satisfies FaceCaptureWorkerRequest,
          [bitmap],
        );
      } catch (caught) {
        inFlight = false;
        failedGrabs += 1;
        if (failedGrabs === 1 || failedGrabs % GRAB_FAIL_LOG_EVERY === 0) {
          cameraWarn('面捕取帧失败', { failedGrabs, caught });
        }
      }
    };

    const handleMessage = (event: MessageEvent<FaceCaptureWorkerResponse>) => {
      if (disposed) {
        return;
      }
      const data = event.data;
      if (data.type === 'ready') {
        workerReady = true;
        setIsRunning(true);
        cameraLog('面捕引擎就绪', {
          delegate: data.delegate,
          frameSource: frameSourceRef.current
            ? `${frameSourceRef.current.videoWidth}×${frameSourceRef.current.videoHeight}`
            : '帧源未就绪',
        });
        return;
      }
      if (data.type === 'error') {
        inFlight = false;
        setError(data.message);
        cameraWarn('面捕 Worker 报错', data.message);
        return;
      }

      // landmarks：没检测到脸时 landmarks 为空数组，此时保持上一帧姿态
      inFlight = false;
      processedFrames += 1;
      const frame = landmarksToFaceCaptureFrame(data.landmarks, {
        width: data.width,
        height: data.height,
      });
      if (frame) {
        smoothed = smoothFaceCaptureFrame(
          smoothed,
          frame,
          smoothingRef.current,
        );
        frameRef.current = smoothed;
      }

      const now = performance.now();
      if (now - lastHeartbeatAt >= HEARTBEAT_MS) {
        cameraLog('面捕引擎心跳', {
          fps: Math.round(
            ((processedFrames - lastHeartbeatFrames) * 1000) /
              (now - lastHeartbeatAt),
          ),
          processedFrames,
          failedGrabs,
          hasFace: data.landmarks.length > 0,
        });
        lastHeartbeatAt = now;
        lastHeartbeatFrames = processedFrames;
      }
    };

    try {
      // module worker 是 Vite dev 唯一可用形态（dev 下 worker 脚本始终按 ESM 提供）；
      // MediaPipe 的 wasm glue 需要在 classic script 下求值，Worker 里为此替换了
      // `self.import`，见 faceCapture.worker.ts 的说明。
      worker = new Worker(
        new URL('../workers/faceCapture.worker.ts', import.meta.url),
        { type: 'module' },
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '面捕 Worker 创建失败。',
      );
      return;
    }

    worker.onmessage = handleMessage;
    worker.onerror = () => {
      inFlight = false;
      setError('面捕 Worker 异常。');
    };
    worker.postMessage({ type: 'init' } satisfies FaceCaptureWorkerRequest);
    rafId = requestAnimationFrame(() => {
      void pump();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      frameRef.current = null;
      if (worker) {
        worker.postMessage({ type: 'stop' } satisfies FaceCaptureWorkerRequest);
        worker.terminate();
        worker = null;
      }
    };
  }, [enabled]);

  return { frameRef, isRunning, error };
}
