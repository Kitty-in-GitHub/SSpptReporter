import type { DirectorAction, VoiceBeatOverrides } from "./types.js";
import type { ResolvedBeatPerformance } from "./performance-profile.js";

/** Engine-agnostic TTS performance intent for one beat. */
export interface VoiceDirective {
  speaker?: string;
  /** Speaking rate multiplier (0.25–4). Alias: `speed` in stored JSON. */
  rate?: number;
  /** Numeric semitones-ish offset or engine string (Edge: `+5Hz`). */
  pitch?: number | string;
  /** Numeric percent offset or engine string (Edge: `+10%`). */
  volume?: number | string;
  styleHint?: string;
  /** Character spans `[start, end)` for intra-utterance emphasis. */
  emphasis?: [number, number][];
}

export type IntraUtteranceEmphasisMode =
  | "none"
  | "segment-resynth"
  | "prosody"
  | "ssml";

export interface TtsEngineCapabilities {
  speaker: boolean;
  rate: boolean;
  pitch: boolean;
  volume: boolean;
  styleHint: boolean;
  intraUtteranceEmphasis: IntraUtteranceEmphasisMode;
}

export interface EmphasisTextSegment {
  text: string;
  emphasized: boolean;
}

export function voiceBeatOverridesToDirective(
  overrides?: VoiceBeatOverrides,
): VoiceDirective {
  if (!overrides) {
    return {};
  }
  return {
    speaker: overrides.speaker,
    rate: overrides.speed,
    pitch: overrides.pitch,
    volume: overrides.volume,
    styleHint: overrides.style_hint,
  };
}

export function resolveVoiceDirective(
  action: DirectorAction,
  resolved: ResolvedBeatPerformance,
): VoiceDirective {
  const fromVoice = voiceBeatOverridesToDirective(resolved.voice);
  const emphasis =
    action.emphasis && action.emphasis.length > 0
      ? action.emphasis
      : undefined;

  return {
    ...fromVoice,
    emphasis,
  };
}

export function normalizeEmphasisRanges(
  text: string,
  emphasis?: [number, number][],
): [number, number][] {
  if (!emphasis?.length || !text) {
    return [];
  }

  const length = text.length;
  const merged: [number, number][] = [];

  for (const range of emphasis
    .filter(
      (item) =>
        Array.isArray(item) &&
        item.length === 2 &&
        Number.isFinite(item[0]) &&
        Number.isFinite(item[1]),
    )
    .map(([start, end]) => {
      const safeStart = Math.max(0, Math.min(length, Math.floor(start)));
      const safeEnd = Math.max(0, Math.min(length, Math.floor(end)));
      return [safeStart, safeEnd] as [number, number];
    })
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(range);
      continue;
    }
    if (range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
      continue;
    }
    merged.push(range);
  }

  return merged;
}

export function splitUtteranceByEmphasis(
  text: string,
  emphasis?: [number, number][],
): EmphasisTextSegment[] {
  const ranges = normalizeEmphasisRanges(text, emphasis);
  if (ranges.length === 0) {
    return text ? [{ text, emphasized: false }] : [];
  }

  const segments: EmphasisTextSegment[] = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), emphasized: false });
    }
    segments.push({ text: text.slice(start, end), emphasized: true });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), emphasized: false });
  }

  return segments.filter((segment) => segment.text.length > 0);
}
