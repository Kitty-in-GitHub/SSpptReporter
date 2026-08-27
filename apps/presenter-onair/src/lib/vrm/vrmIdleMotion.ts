import {
  pickVrmIdleMotion,
  type VrmExpressionController,
} from '../vrmExpressionController';

export const IDLE_MOTION_MIN_DELAY_MS = 4500;
export const IDLE_MOTION_MAX_DELAY_MS = 9500;
export const IDLE_MOTION_AFTER_REACTION_DELAY_MS = 4200;
export const IDLE_MOTION_AFTER_SPEECH_DELAY_MS = 2600;

export interface IdleMotionState {
  nextAt: number;
  lockUntil: number;
}

export function createIdleMotionState(): IdleMotionState {
  return { nextAt: 0, lockUntil: 0 };
}

export function maybeRunIdleMotion(
  controller: VrmExpressionController,
  state: IdleMotionState,
  isSpeaking: boolean,
) {
  const now = window.performance.now();
  if (isSpeaking) {
    state.lockUntil = Math.max(
      state.lockUntil,
      now + IDLE_MOTION_AFTER_SPEECH_DELAY_MS,
    );
    return;
  }

  if (state.nextAt === 0) {
    scheduleNextIdleMotion(state);
    return;
  }

  if (now < state.lockUntil || now < state.nextAt) {
    return;
  }

  const motion = pickVrmIdleMotion(controller);
  if (motion) {
    controller.gesture(motion.parts, motion.fadeMs, motion.holdMs);
    state.lockUntil = now + motion.fadeMs + motion.holdMs + 900;
  }

  scheduleNextIdleMotion(state);
}

export function suppressIdleMotion(state: IdleMotionState, delayMs: number) {
  const now = window.performance.now();
  state.lockUntil = Math.max(state.lockUntil, now + delayMs);
  state.nextAt = Math.max(state.nextAt, state.lockUntil + 1200);
}

export function scheduleNextIdleMotion(
  state: IdleMotionState,
  minDelayMs = IDLE_MOTION_MIN_DELAY_MS,
  maxDelayMs = IDLE_MOTION_MAX_DELAY_MS,
) {
  const delayMs =
    minDelayMs + Math.random() * Math.max(0, maxDelayMs - minDelayMs);
  state.nextAt = window.performance.now() + delayMs;
}
