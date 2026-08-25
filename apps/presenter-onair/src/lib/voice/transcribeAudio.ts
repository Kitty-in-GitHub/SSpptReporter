import type { QaAsrEngine } from '../../types/present';
import { transcribeWithBrowserWhisper } from './browserWhisperAsr';

export type { QaAsrEngine };

export interface TranscribeAudioOptions {
  engine: Exclude<QaAsrEngine, 'webSpeech'>;
  blob: Blob;
  filename?: string;
  language?: string;
  /** Required when engine === 'cloud' */
  apiKey?: string;
  cloudEndpoint?: string;
  onProgress?: (message: string) => void;
}

export async function transcribeAudio(
  options: TranscribeAudioOptions,
): Promise<string> {
  if (options.engine === 'browserWhisper') {
    return transcribeWithBrowserWhisper(options.blob, (info) => {
      if (info.status === 'transcribing') {
        options.onProgress?.('识别中…');
        return;
      }
      if (typeof info.progress === 'number') {
        options.onProgress?.(
          `下载模型 ${info.progress}%${info.file ? `（${info.file}）` : ''}`,
        );
        return;
      }
      options.onProgress?.(`准备模型：${info.status}`);
    });
  }

  const form = new FormData();
  const filename = options.filename ?? 'recording.webm';
  form.append('file', options.blob, filename);
  form.append('model', 'whisper-1');
  form.append('language', options.language ?? 'zh');

  if (options.engine === 'gateway') {
    options.onProgress?.('本机识别中…');
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

  options.onProgress?.('云端识别中…');
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
    | { text?: string; error?: { message?: string; type?: string } }
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
