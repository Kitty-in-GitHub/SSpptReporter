import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

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
