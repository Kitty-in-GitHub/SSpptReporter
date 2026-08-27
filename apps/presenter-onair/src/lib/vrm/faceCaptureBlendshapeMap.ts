/** Kalidokit / ARKit 名 → VRM expression 候选（按优先级） */

export const FACE_CAPTURE_MOUTH_MAP: Record<
  string,
  readonly string[]
> = {
  a: ['aa', 'a', 'A', 'mouthOpen'],
  e: ['ee', 'E', 'mouthSmileLeft'],
  i: ['ih', 'I', 'mouthSmileRight'],
  o: ['oh', 'O', 'mouthFunnel'],
  u: ['ou', 'U', 'mouthPucker'],
};

export const FACE_CAPTURE_BLINK_LEFT = [
  'eyeBlinkLeft',
  'blinkLeft',
  'blink',
  'eyeBlink',
] as const;

export const FACE_CAPTURE_BLINK_RIGHT = [
  'eyeBlinkRight',
  'blinkRight',
  'blink',
  'eyeBlink',
] as const;

export function resolveFaceCaptureExpressionName(
  available: ReadonlySet<string>,
  candidates: readonly string[],
): string | null {
  for (const name of candidates) {
    if (available.has(name)) {
      return name;
    }
  }
  return null;
}
