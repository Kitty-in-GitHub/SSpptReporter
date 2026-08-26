import type { Emotion, Gesture } from '@ssreporter/director';

export const PROFILE_LABELS: Record<Emotion, string> = {
  neutral: '中性',
  confident: '自信',
  friendly: '亲和',
  serious: '严肃',
  thinking: '思考',
  apologetic: '歉意',
  emphatic: '强调',
};

export const PROFILE_HINTS: Record<Emotion, string> = {
  neutral: '平稳开场、过渡',
  confident: '结论、亮点',
  friendly: '问候、互动',
  serious: '风险、限制',
  thinking: '分析、犹豫',
  apologetic: '致歉、不足',
  emphatic: '关键数字、强调',
};

/** 节拍时间轴 / 预设卡片用色 */
export const PROFILE_COLORS: Record<Emotion, string> = {
  neutral: '#94a3b8',
  confident: '#3b82f6',
  friendly: '#22c55e',
  serious: '#6366f1',
  thinking: '#f59e0b',
  apologetic: '#f472b6',
  emphatic: '#ef4444',
};

export const GESTURE_LABELS: Record<Gesture, string> = {
  none: '无',
  idle: '待机',
  bow: '鞠躬',
  nod: '点头',
  think: '思考',
  explain: '讲解',
  point_slide: '指幻灯',
  open_hands: '摊手',
  emphasize: '强调',
};

export const GESTURE_ICONS: Record<Gesture, string> = {
  none: '—',
  idle: '○',
  bow: '躬',
  nod: '点',
  think: '思',
  explain: '讲',
  point_slide: '指',
  open_hands: '摊',
  emphasize: '强',
};

export const EDGE_VOICE_OPTIONS = [
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓', hint: '女 · 亲和' },
  { id: 'zh-CN-YunxiNeural', label: '云希', hint: '男 · 讲解' },
  { id: 'zh-CN-YunjianNeural', label: '云健', hint: '男 · 严肃' },
  { id: 'zh-CN-XiaoyiNeural', label: '晓伊', hint: '女 · 温柔' },
] as const;

export function formatSpeedLabel(speed: number): string {
  if (speed < 0.9) return '偏慢';
  if (speed > 1.05) return '偏快';
  return '常速';
}

export function formatPauseLabel(ms: number): string {
  if (ms === 0) return '无';
  if (ms < 300) return '短';
  if (ms < 600) return '中';
  return '长';
}
