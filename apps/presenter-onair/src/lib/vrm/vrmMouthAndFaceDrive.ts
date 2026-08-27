import type { RefObject } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import type { FaceCaptureFrame } from '../avatar/faceCaptureTypes';
import type { FaceCaptureMouthDriver } from '../../types/settings';
import type { VrmExpressionController } from '../vrmExpressionController';
import { applyFaceCaptureToVrm } from './applyFaceCaptureToVrm';

export const MAX_MOUTH_LEVEL = 4;

export interface VrmMouthDriveState {
  mouthWeight: number;
  targetMouthWeight: number;
}

function applyTtsMouthLevel(
  vrm: VRM,
  mouthExpressionName: string | null,
  mouthLevelRef: RefObject<number> | undefined,
  isSpeaking: boolean,
  mouthState: VrmMouthDriveState,
): void {
  if (!mouthLevelRef) {
    return;
  }

  const level = isSpeaking
    ? mouthLevelRef.current / MAX_MOUTH_LEVEL
    : 0;
  mouthState.targetMouthWeight = Math.min(Math.max(level, 0), 1);

  const nextWeight =
    mouthState.mouthWeight +
    (mouthState.targetMouthWeight - mouthState.mouthWeight) * 0.35;
  mouthState.mouthWeight = nextWeight;

  if (mouthExpressionName) {
    vrm.expressionManager?.setValue(mouthExpressionName, nextWeight);
  }
}

export function applyVrmMouthAndFaceCapture(options: {
  vrm: VRM;
  expressionController: VrmExpressionController | null;
  faceCaptureActive: boolean;
  mouthDriver: FaceCaptureMouthDriver;
  frame: FaceCaptureFrame | null | undefined;
  mouthLevelRef: RefObject<number> | undefined;
  isSpeaking: boolean;
  mouthExpressionName: string | null;
  mouthState: VrmMouthDriveState;
}): void {
  const {
    vrm,
    expressionController,
    faceCaptureActive,
    mouthDriver,
    frame,
    mouthLevelRef,
    isSpeaking,
    mouthExpressionName,
    mouthState,
  } = options;

  const mouthFromFaceCapture =
    faceCaptureActive && mouthDriver === 'faceCapture' && frame;

  if (mouthFromFaceCapture && frame) {
    applyFaceCaptureToVrm(vrm, frame, expressionController, {
      applyMouth: true,
      applyHeadEyes: true,
    });
    mouthState.targetMouthWeight = 0;
    mouthState.mouthWeight = 0;
    return;
  }

  if (faceCaptureActive && frame) {
    applyFaceCaptureToVrm(vrm, frame, expressionController, {
      applyMouth: false,
      applyHeadEyes: true,
    });
    applyTtsMouthLevel(
      vrm,
      mouthExpressionName,
      mouthLevelRef,
      isSpeaking,
      mouthState,
    );
    return;
  }

  applyTtsMouthLevel(
    vrm,
    mouthExpressionName,
    mouthLevelRef,
    isSpeaking,
    mouthState,
  );
}
