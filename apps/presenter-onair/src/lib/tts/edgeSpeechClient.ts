import type { EdgeSpeechRequest } from './prepareUtterance';
import {
  DEFAULT_EDGE_TTS_API_URL,
  DEFAULT_EDGE_TTS_API_URL_DIRECT,
} from '../voiceOptions';

export async function fetchEdgeSpeechAudio(
  request: EdgeSpeechRequest,
  options: {
    apiUrl?: string;
    apiKey?: string;
  } = {},
): Promise<ArrayBuffer> {
  const apiUrl = options.apiUrl?.trim() || DEFAULT_EDGE_TTS_API_URL;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey?.trim()) {
    headers.Authorization = `Bearer ${options.apiKey.trim()}`;
  }

  const body: Record<string, unknown> = {
    model: request.model,
    input: request.input,
    voice: request.voice,
    speed: request.speed,
  };
  if (request.pitch) {
    body.pitch = request.pitch;
  }
  if (request.volume) {
    body.volume = request.volume;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Edge TTS 网关失败（${response.status}）${detail ? `：${detail}` : ''}`,
    );
  }

  return response.arrayBuffer();
}

export async function speakPreparedEdgeUtterance(
  segments: Array<{ edge?: EdgeSpeechRequest }>,
  onPlay: (audioBuffer: ArrayBuffer) => Promise<void>,
  options: {
    apiUrl?: string;
    apiKey?: string;
  } = {},
): Promise<void> {
  for (const segment of segments) {
    if (!segment.edge?.input?.trim()) {
      continue;
    }
    const audio = await fetchEdgeSpeechAudio(segment.edge, options);
    await onPlay(audio);
  }
}

export function resolveEdgeGatewayUrl(settingsUrl?: string): string {
  const trimmed = settingsUrl?.trim();
  if (trimmed) {
    if (import.meta.env.DEV && trimmed.includes('127.0.0.1:5050')) {
      return DEFAULT_EDGE_TTS_API_URL;
    }
    return trimmed;
  }
  return DEFAULT_EDGE_TTS_API_URL;
}

export { DEFAULT_EDGE_TTS_API_URL_DIRECT };
