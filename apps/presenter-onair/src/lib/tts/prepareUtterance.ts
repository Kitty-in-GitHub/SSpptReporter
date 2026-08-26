import type {
  EmphasisTextSegment,
  TtsEngineCapabilities,
  VoiceDirective,
} from '@ssreporter/director';
import { splitUtteranceByEmphasis } from '@ssreporter/director';

export type TtsEngineId =
  | 'openaiCompatible'
  | 'geminiTts'
  | 'openai'
  | 'voicevox'
  | 'elevenLabs'
  | 'webSpeech'
  | 'none';

export interface EdgeSpeechRequest {
  model: string;
  input: string;
  voice: string;
  speed: number;
  pitch?: string;
  volume?: string;
}

export interface PreparedTtsSegment {
  text: string;
  emphasized: boolean;
  /** Engine-specific request body (Edge → gateway JSON). */
  edge?: EdgeSpeechRequest;
}

export interface PreparedUtterance {
  engineId: TtsEngineId;
  segments: PreparedTtsSegment[];
  /** Fallback OnAir voice patch when not using custom gateway fetch. */
  legacyVoicePatch?: Record<string, unknown>;
  warnings: string[];
}

export interface PrepareUtteranceContext {
  defaultSpeaker: string;
  defaultModel: string;
  defaultRate: number;
}

const EMPHASIS_VOLUME_BOOST = '+12%';
const EMPHASIS_RATE_BOOST = 1.06;

export const EDGE_TTS_CAPABILITIES: TtsEngineCapabilities = {
  speaker: true,
  rate: true,
  pitch: true,
  volume: true,
  styleHint: false,
  intraUtteranceEmphasis: 'segment-resynth',
};

export function stripEngineSpeakerPrefix(
  speaker: string | undefined,
  enginePrefix = 'edge:',
): string | undefined {
  if (!speaker?.trim()) {
    return undefined;
  }
  const trimmed = speaker.trim();
  if (trimmed.toLowerCase().startsWith(enginePrefix)) {
    return trimmed.slice(enginePrefix.length).trim() || undefined;
  }
  return trimmed;
}

export function formatEdgeProsodyValue(
  value: number | string | undefined,
  unit: 'Hz' | '%',
): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (Number.isNaN(value)) {
    return undefined;
  }
  const rounded = unit === 'Hz' ? Math.round(value) : Math.round(value);
  const sign = rounded >= 0 ? '+' : '';
  return `${sign}${rounded}${unit}`;
}

function mergeEdgeProsodyStrings(
  base: string | undefined,
  boost: string,
): string {
  if (!base) {
    return boost;
  }
  return boost;
}

export function prepareEdgeSegmentRequest(
  segment: EmphasisTextSegment,
  directive: VoiceDirective,
  context: PrepareUtteranceContext,
): EdgeSpeechRequest {
  const voice =
    stripEngineSpeakerPrefix(directive.speaker) ??
    stripEngineSpeakerPrefix(context.defaultSpeaker) ??
    'zh-CN-XiaoxiaoNeural';

  const speed = directive.rate ?? context.defaultRate;
  let pitch = formatEdgeProsodyValue(directive.pitch, 'Hz');
  let volume = formatEdgeProsodyValue(directive.volume, '%');

  if (segment.emphasized) {
    volume = mergeEdgeProsodyStrings(volume, EMPHASIS_VOLUME_BOOST);
    const boostedRate = Math.min(4, speed * EMPHASIS_RATE_BOOST);
    return {
      model: context.defaultModel,
      input: segment.text,
      voice,
      speed: boostedRate,
      pitch: pitch ?? '+2Hz',
      volume,
    };
  }

  return {
    model: context.defaultModel,
    input: segment.text,
    voice,
    speed,
    pitch,
    volume,
  };
}

export function prepareEdgeUtterance(
  text: string,
  directive: VoiceDirective,
  context: PrepareUtteranceContext,
): PreparedUtterance {
  const segments = splitUtteranceByEmphasis(text, directive.emphasis);
  const warnings: string[] = [];

  if (directive.styleHint?.trim()) {
    warnings.push('Edge TTS 忽略 styleHint；请换 Gemini 等引擎或改用音色/prosody');
  }

  if (segments.length > 1) {
    warnings.push(
      `句内重读拆分为 ${segments.length} 段顺序合成（Edge segment-resynth）`,
    );
  }

  return {
    engineId: 'openaiCompatible',
    segments: segments.map((segment) => ({
      text: segment.text,
      emphasized: segment.emphasized,
      edge: prepareEdgeSegmentRequest(segment, directive, context),
    })),
    warnings,
  };
}

export function prepareLegacyVoicePatch(
  engineId: TtsEngineId,
  directive: VoiceDirective,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (directive.rate != null && !Number.isNaN(directive.rate)) {
    if (engineId === 'openaiCompatible') {
      patch.openAiCompatibleSpeed = directive.rate;
    }
    if (engineId === 'elevenLabs') {
      patch.elevenLabsSpeed = directive.rate;
    }
    if (engineId === 'geminiTts' && directive.styleHint?.trim()) {
      patch.geminiTtsPrompt = directive.styleHint.trim();
    }
    if (engineId === 'webSpeech') {
      patch.webSpeechRate = directive.rate;
    }
  }

  if (typeof directive.pitch === 'number' && engineId === 'webSpeech') {
    patch.webSpeechPitch = directive.pitch;
  }

  if (directive.speaker?.trim()) {
    patch.speaker = stripEngineSpeakerPrefix(directive.speaker) ?? directive.speaker;
  }

  return patch;
}

export function prepareUtterance(
  engineId: TtsEngineId,
  text: string,
  directive: VoiceDirective,
  context: PrepareUtteranceContext,
): PreparedUtterance {
  if (engineId === 'openaiCompatible') {
    return prepareEdgeUtterance(text, directive, context);
  }

  const warnings: string[] = [];
  if (directive.emphasis?.length) {
    warnings.push(
      `${engineId} 暂不支持句内重读，emphasis 已忽略（待适配器实现）`,
    );
  }
  if (directive.styleHint?.trim() && engineId !== 'geminiTts') {
    warnings.push(`${engineId} 忽略 styleHint`);
  }

  return {
    engineId,
    segments: [{ text, emphasized: false }],
    legacyVoicePatch: prepareLegacyVoicePatch(engineId, directive),
    warnings,
  };
}
