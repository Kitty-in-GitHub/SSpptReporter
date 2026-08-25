/** Compact Whisper for browser WASM (first download ~75MB quantized). */
export const BROWSER_WHISPER_MODEL = 'Xenova/whisper-base';

export type BrowserWhisperProgress = {
  status: string;
  progress?: number;
  file?: string;
};

type ProgressCallback = (info: BrowserWhisperProgress) => void;

type WhisperPipeline = (
  audio: Float32Array,
  options?: Record<string, unknown>,
) => Promise<unknown>;

let pipelinePromise: Promise<WhisperPipeline> | null = null;

function formatProgress(data: Record<string, unknown>): BrowserWhisperProgress {
  const status = String(data.status ?? 'progress');
  const progress =
    typeof data.progress === 'number' ? Math.round(data.progress) : undefined;
  const file = typeof data.file === 'string' ? data.file : undefined;
  return { status, progress, file };
}

export async function ensureBrowserWhisperPipeline(
  onProgress?: ProgressCallback,
): Promise<WhisperPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const transformers = await import('@huggingface/transformers');
      transformers.env.allowLocalModels = false;
      transformers.env.useBrowserCache = true;

      const created = await transformers.pipeline(
        'automatic-speech-recognition',
        BROWSER_WHISPER_MODEL,
        {
          dtype: 'q8',
          device: 'wasm',
          progress_callback: (data: Record<string, unknown>) => {
            onProgress?.(formatProgress(data));
          },
        } as never,
      );

      return created as unknown as WhisperPipeline;
    })();
  }

  try {
    return await pipelinePromise;
  } catch (error) {
    pipelinePromise = null;
    throw error;
  }
}

async function blobToMonoFloat32At16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const channel = decoded.getChannelData(0);
    const targetRate = 16_000;
    if (decoded.sampleRate === targetRate) {
      return channel;
    }

    const ratio = decoded.sampleRate / targetRate;
    const length = Math.max(1, Math.floor(channel.length / ratio));
    const resampled = new Float32Array(length);
    for (let i = 0; i < length; i += 1) {
      resampled[i] = channel[Math.floor(i * ratio)] ?? 0;
    }
    return resampled;
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

export async function transcribeWithBrowserWhisper(
  blob: Blob,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.({ status: 'loading', progress: 0 });
  const transcriber = await ensureBrowserWhisperPipeline(onProgress);
  onProgress?.({ status: 'transcribing' });

  const audio = await blobToMonoFloat32At16k(blob);
  const result = await transcriber(audio, {
    language: 'chinese',
    task: 'transcribe',
    return_timestamps: false,
  });

  if (Array.isArray(result)) {
    return result
      .map((item) =>
        item &&
        typeof item === 'object' &&
        'text' in item &&
        typeof (item as { text: unknown }).text === 'string'
          ? (item as { text: string }).text
          : '',
      )
      .join('')
      .trim();
  }

  if (result && typeof result === 'object' && 'text' in result) {
    return String((result as { text: unknown }).text ?? '').trim();
  }

  return '';
}
