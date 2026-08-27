import type { VRM } from '@pixiv/three-vrm';
import type { FaceCaptureFrame } from '../avatar/faceCaptureTypes';
import type { VrmExpressionController } from '../vrmExpressionController';
import {
  FACE_CAPTURE_BLINK_LEFT,
  FACE_CAPTURE_BLINK_RIGHT,
  FACE_CAPTURE_MOUTH_MAP,
  resolveFaceCaptureExpressionName,
} from './faceCaptureBlendshapeMap';

export interface ApplyFaceCaptureOptions {
  applyMouth: boolean;
  applyHeadEyes: boolean;
}

function setExpressionValue(
  vrm: VRM,
  available: ReadonlySet<string>,
  candidates: readonly string[],
  value: number,
): void {
  const name = resolveFaceCaptureExpressionName(available, candidates);
  if (!name || !vrm.expressionManager) {
    return;
  }
  vrm.expressionManager.setValue(name, Math.min(1, Math.max(0, value)));
}

export function applyFaceCaptureToVrm(
  vrm: VRM,
  frame: FaceCaptureFrame,
  expressionController: VrmExpressionController | null,
  options: ApplyFaceCaptureOptions,
): void {
  if (expressionController) {
    expressionController.autoBlink = false;
  }

  const available = new Set(
    vrm.expressionManager?.expressions.map((e) => e.expressionName) ?? [],
  );

  if (options.applyHeadEyes) {
    const head = vrm.humanoid?.getNormalizedBoneNode('head');
    const neck = vrm.humanoid?.getNormalizedBoneNode('neck');
    if (head) {
      head.rotation.x = frame.headRotation.x;
      head.rotation.y = frame.headRotation.y;
      head.rotation.z = frame.headRotation.z;
    }
    if (neck) {
      neck.rotation.x = frame.headRotation.x * 0.35;
      neck.rotation.y = frame.headRotation.y * 0.35;
    }

    const leftEye = vrm.humanoid?.getNormalizedBoneNode('leftEye');
    const rightEye = vrm.humanoid?.getNormalizedBoneNode('rightEye');
    if (leftEye) {
      leftEye.rotation.y = frame.pupil.x * 0.4;
      leftEye.rotation.x = frame.pupil.y * 0.35;
    }
    if (rightEye) {
      rightEye.rotation.y = frame.pupil.x * 0.4;
      rightEye.rotation.x = frame.pupil.y * 0.35;
    }

    setExpressionValue(
      vrm,
      available,
      FACE_CAPTURE_BLINK_LEFT,
      frame.eyeBlink.left,
    );
    setExpressionValue(
      vrm,
      available,
      FACE_CAPTURE_BLINK_RIGHT,
      frame.eyeBlink.right,
    );
  }

  if (options.applyMouth && vrm.expressionManager) {
    for (const [shapeKey, candidates] of Object.entries(FACE_CAPTURE_MOUTH_MAP)) {
      const value =
        frame.mouthShapes[shapeKey as keyof FaceCaptureFrame['mouthShapes']];
      setExpressionValue(vrm, available, candidates, value);
    }

    for (const [name, value] of Object.entries(frame.blendshapes)) {
      if (name.startsWith('eyeBlink')) {
        continue;
      }
      if (available.has(name)) {
        vrm.expressionManager.setValue(name, Math.min(1, Math.max(0, value)));
      }
    }
  }
}
