export const STREAM_INTERVAL_OPTIONS = [5000, 10000, 20000, 30000, 60000] as const;
export const COMMENT_ANALYSIS_INTERVAL_OPTIONS = [
  1000, 2000, 5000, 10000,
] as const;
export const COMMENT_BATCH_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const;
export const COMMENT_LLM_MIN_COMMENTS_OPTIONS = [4, 8, 12, 20] as const;
export const MANNERI_SIMILARITY_THRESHOLD_OPTIONS = [
  0.6, 0.7, 0.75, 0.8, 0.9,
] as const;
export const MANNERI_LOOKBACK_WINDOW_OPTIONS = [4, 6, 8, 10, 15, 20] as const;
export const MANNERI_MIN_MESSAGE_LENGTH_OPTIONS = [4, 8, 10, 16, 24] as const;
export const VIEWER_BLOCK_DURATION_OPTIONS = [
  { label: '1 分钟', value: 60 * 1000 },
  { label: '5 分钟', value: 5 * 60 * 1000 },
  { label: '10 分钟', value: 10 * 60 * 1000 },
  { label: '30 分钟', value: 30 * 60 * 1000 },
] as const;
export const MANNERI_COOLDOWN_OPTIONS = [
  { label: '1 分钟', value: 60 * 1000 },
  { label: '3 分钟', value: 3 * 60 * 1000 },
  { label: '5 分钟', value: 5 * 60 * 1000 },
  { label: '10 分钟', value: 10 * 60 * 1000 },
] as const;

export function getTwitchRedirectUri(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URL(window.location.pathname, window.location.origin).toString();
}
