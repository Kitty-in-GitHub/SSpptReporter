/**
 * 摄像头采集链路日志。
 *
 * 默认开启，浏览器控制台用 `[camera]` 过滤即可看到整条时间线。
 * 关掉：控制台执行 `window.__ssreporterCameraLog = false`
 */
const PREFIX = '[camera]';
/** 环形缓冲：供界面「复制诊断日志」一键导出，免去在控制台里翻找 */
const MAX_BUFFERED_LINES = 400;
const bufferedLines: string[] = [];

function isEnabled(): boolean {
  return (
    (globalThis as { __ssreporterCameraLog?: boolean }).__ssreporterCameraLog !==
    false
  );
}

function stamp(): string {
  return `+${performance.now().toFixed(0)}ms`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function record(line: string): void {
  bufferedLines.push(line);
  if (bufferedLines.length > MAX_BUFFERED_LINES) {
    bufferedLines.splice(0, bufferedLines.length - MAX_BUFFERED_LINES);
  }
}

/** 导出缓冲的日志文本（最近 400 条） */
export function readCameraLog(): string {
  return bufferedLines.join('\n');
}

export function cameraLog(message: string, detail?: unknown): void {
  if (!isEnabled()) {
    return;
  }
  const head = `${PREFIX} ${stamp()} ${message}`;
  if (detail === undefined) {
    record(head);
    console.log(head);
    return;
  }
  record(`${head} ${safeStringify(detail)}`);
  console.log(head, detail);
}

export function cameraWarn(message: string, detail?: unknown): void {
  if (!isEnabled()) {
    return;
  }
  const head = `${PREFIX} ${stamp()} ⚠ ${message}`;
  if (detail === undefined) {
    record(head);
    console.warn(head);
    return;
  }
  record(`${head} ${safeStringify(detail)}`);
  console.warn(head, detail);
}

/** 采集 video 的快照：卡帧排查时这几个字段最有价值 */
export function describeVideo(video: HTMLVideoElement): Record<string, unknown> {
  const frames = video.getVideoPlaybackQuality?.().totalVideoFrames;
  return {
    paused: video.paused,
    readyState: video.readyState,
    currentTime: Number(video.currentTime.toFixed(2)),
    decodedFrames: frames ?? 'n/a',
    size: `${video.videoWidth}×${video.videoHeight}`,
  };
}

export function describeStream(stream: MediaStream): Record<string, unknown> {
  const track = stream.getVideoTracks()[0];
  if (!track) {
    return { track: 'none' };
  }
  return {
    label: track.label,
    readyState: track.readyState,
    muted: track.muted,
    enabled: track.enabled,
    settings: track.getSettings(),
  };
}
