import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

// wasm 由 vite-mediapipe-plugin 从本地 @mediapipe/tasks-vision 同步到 public/，
// 避免 CDN 版本号与本地 npm 包不一致（历史上写死的 0.10.22 在 npm 上并不存在）；
// 模型文件已 vendored 入库，同样不走外网。
const WASM_BASE = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const MODEL_URL = `${import.meta.env.BASE_URL}mediapipe/models/face_landmarker.task`;

/**
 * MediaPipe 的 wasm glue 必须以 **classic script（sloppy mode）** 求值。
 *
 * MediaPipe 加载 glue 的顺序是 `importScripts(url)` → 失败则 `self.import(url)`
 * → 再退化为 `import(url)`。module worker 里 `importScripts` 一调用就抛 TypeError，
 * 于是落到后两条；而 glue 是经典脚本：
 *
 * - `custom_emscripten_dbgn` 在 `if` 块内用函数声明定义 `custom_dbg`，依赖 Annex B
 *   提升到函数作用域；ES module 一律严格模式，块级函数不外泄，运行时会报
 *   `custom_dbg is not defined`
 * - 顶层 `var ModuleFactory` 也必须落到全局，供 `self.ModuleFactory` 读取，
 *   否则报 `ModuleFactory not set.`
 *
 * 因此这里把 `self.import` 换成一个「按 classic script 求值」的加载器：间接 eval
 * 在全局作用域、非严格模式下执行，语义等同 `importScripts`。
 */
(
  self as unknown as { import?: (url: string) => Promise<void> }
).import = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`加载面捕 wasm glue 失败（HTTP ${response.status}）：${url}`);
  }
  // 间接 eval（(0, eval)）：作用域为全局且非严格模式，等价于 importScripts
  (0, eval)(await response.text());
};

export interface FaceCaptureLandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export type FaceCaptureWorkerRequest =
  | { type: 'init' }
  | {
      type: 'frame';
      image: ImageBitmap;
      timestampMs: number;
      width: number;
      height: number;
    }
  | { type: 'stop' };

export type FaceCaptureWorkerResponse =
  | { type: 'ready' }
  | {
      type: 'landmarks';
      landmarks: FaceCaptureLandmarkPoint[];
      width: number;
      height: number;
      timestampMs: number;
    }
  | { type: 'error'; message: string };

let faceLandmarker: FaceLandmarker | null = null;

async function initLandmarker(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

function toLandmarkPoints(
  result: FaceLandmarkerResult,
): FaceCaptureLandmarkPoint[] | null {
  const face = result.faceLandmarks?.[0];
  if (!face?.length) {
    return null;
  }
  return face.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z ?? 0,
  }));
}

self.onmessage = async (event: MessageEvent<FaceCaptureWorkerRequest>) => {
  const message = event.data;

  try {
    if (message.type === 'init') {
      await initLandmarker();
      self.postMessage({ type: 'ready' } satisfies FaceCaptureWorkerResponse);
      return;
    }

    if (message.type === 'stop') {
      faceLandmarker?.close();
      faceLandmarker = null;
      return;
    }

    if (message.type === 'frame') {
      if (!faceLandmarker) {
        await initLandmarker();
      }
      if (!faceLandmarker) {
        throw new Error('Face landmarker failed to initialize.');
      }

      const result = faceLandmarker.detectForVideo(
        message.image,
        message.timestampMs,
      );
      message.image.close();

      const landmarks = toLandmarkPoints(result);
      if (!landmarks) {
        return;
      }

      self.postMessage({
        type: 'landmarks',
        landmarks,
        width: message.width,
        height: message.height,
        timestampMs: message.timestampMs,
      } satisfies FaceCaptureWorkerResponse);
    }
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : 'Face capture worker failed.';
    self.postMessage({
      type: 'error',
      message: messageText,
    } satisfies FaceCaptureWorkerResponse);
  }
};
