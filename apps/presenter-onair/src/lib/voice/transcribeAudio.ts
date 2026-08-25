import type { QaAsrEngine } from '../../types/present';

export type { QaAsrEngine };

export interface TranscribeAudioOptions {
  engine: Exclude<QaAsrEngine, 'webSpeech'>;
  blob: Blob;
  filename?: string;
  language?: string;
  /** Required when engine === 'cloud' */
  apiKey?: string;
  cloudEndpoint?: string;
}

export async function transcribeAudio(
  options: TranscribeAudioOptions,
): Promise<string> {
  const form = new FormData();
  const filename = options.filename ?? 'recording.webm';
  form.append('file', options.blob, filename);
  form.append('model', 'whisper-1');
  form.append('language', options.language ?? 'zh');

  if (options.engine === 'gateway') {
    const response = await fetch('/api/asr/v1/audio/transcriptions', {
      method: 'POST',
      body: form,
    });
    return parseTranscriptionResponse(response, '本机 ASR');
  }

  const apiKey = options.apiKey?.trim();
  if (!apiKey) {
    throw new Error('云端 ASR 需要 OpenAI API Key（设置 → LLM / OpenAI）');
  }

  const endpoint =
    options.cloudEndpoint?.trim() ||
    'https://api.openai.com/v1/audio/transcriptions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });
  return parseTranscriptionResponse(response, '云端 ASR');
}

async function parseTranscriptionResponse(
  response: Response,
  label: string,
): Promise<string> {
  const payload = (await response.json().catch(() => null)) as
    | { text?: string; error?: { message?: string } }
    | null;

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `${label} 失败（HTTP ${response.status}）`;
    throw new Error(message);
  }

  const text = payload?.text?.trim() ?? '';
  return text;
}
