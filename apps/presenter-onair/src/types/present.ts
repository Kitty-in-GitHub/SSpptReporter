export type SessionMode = 'chat' | 'present' | 'edit' | 'mocap';

export type PresentLayout =
  | 'split_slide_left'
  | 'split_slide_right'
  | 'pip'
  | 'slide_full'
  | 'avatar_full';

export type PipCorner =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

/** Q&A 语音转文字引擎 */
export type QaAsrEngine =
  | 'webSpeech'
  | 'browserWhisper'
  | 'gateway'
  | 'cloud';

export interface PdfSlideSource {
  type: 'pdf';
  url: string;
}

export interface DeckManifest {
  id: string;
  title: string;
  slideSource: PdfSlideSource;
  pageCount?: number | null;
  scriptUrl?: string;
}

export interface PresentSettings {
  sessionMode: SessionMode;
  presentLayout: PresentLayout;
  activeDeckId: string;
  pipCorner: PipCorner;
  pipBorderless: boolean;
  pipOffsetX: number;
  pipOffsetY: number;
  /** 1 = 默认画中画窗口大小 */
  pipSize: number;
  /** 讲稿播放中被 Q&A 打断后，是否自动续播剩余讲稿（默认关：问答多在演讲结束后） */
  resumeDeckAfterQaInterrupt: boolean;
  /** 评委提问语音转文字引擎 */
  qaAsrEngine: QaAsrEngine;
}

export const DEFAULT_PRESENT_SETTINGS: PresentSettings = {
  sessionMode: 'chat',
  presentLayout: 'split_slide_left',
  activeDeckId: 'demo',
  pipCorner: 'bottom-right',
  pipBorderless: false,
  pipOffsetX: 0,
  pipOffsetY: 0,
  pipSize: 1,
  resumeDeckAfterQaInterrupt: false,
  qaAsrEngine: 'webSpeech',
};

const QA_ASR_ENGINES: QaAsrEngine[] = [
  'webSpeech',
  'browserWhisper',
  'gateway',
  'cloud',
];


export const MIN_PIP_SIZE = 0.6;
export const MAX_PIP_SIZE = 1.8;
export const DEFAULT_PIP_SIZE = 1;

const PIP_CORNERS: PipCorner[] = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];

const SESSION_MODES: SessionMode[] = ['chat', 'present', 'edit', 'mocap'];

export function normalizePresentSettings(
  partial?: Partial<PresentSettings> | null,
): PresentSettings {
  const activeDeckId = partial?.activeDeckId?.trim();
  return {
    ...DEFAULT_PRESENT_SETTINGS,
    ...partial,
    activeDeckId: activeDeckId || DEFAULT_PRESENT_SETTINGS.activeDeckId,
    sessionMode: SESSION_MODES.includes(partial?.sessionMode as SessionMode)
      ? (partial!.sessionMode as SessionMode)
      : DEFAULT_PRESENT_SETTINGS.sessionMode,
    presentLayout: partial?.presentLayout ?? DEFAULT_PRESENT_SETTINGS.presentLayout,
    pipCorner: PIP_CORNERS.includes(partial?.pipCorner as PipCorner)
      ? (partial!.pipCorner as PipCorner)
      : DEFAULT_PRESENT_SETTINGS.pipCorner,
    pipBorderless: partial?.pipBorderless ?? DEFAULT_PRESENT_SETTINGS.pipBorderless,
    pipOffsetX: clampNumber(partial?.pipOffsetX, -480, 480, 0),
    pipOffsetY: clampNumber(partial?.pipOffsetY, -480, 480, 0),
    pipSize: clampNumber(
      partial?.pipSize,
      MIN_PIP_SIZE,
      MAX_PIP_SIZE,
      DEFAULT_PIP_SIZE,
    ),
    resumeDeckAfterQaInterrupt:
      partial?.resumeDeckAfterQaInterrupt ??
      DEFAULT_PRESENT_SETTINGS.resumeDeckAfterQaInterrupt,
    qaAsrEngine: QA_ASR_ENGINES.includes(partial?.qaAsrEngine as QaAsrEngine)
      ? (partial!.qaAsrEngine as QaAsrEngine)
      : DEFAULT_PRESENT_SETTINGS.qaAsrEngine,
  };
}

export const QA_ASR_ENGINE_LABELS: Record<QaAsrEngine, string> = {
  webSpeech: '浏览器 Web Speech',
  browserWhisper: '浏览器内 Whisper（免安装）',
  gateway: '本机 Whisper（网关）',
  cloud: '云端 Whisper API',
};


function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

export const PRESENT_LAYOUT_LABELS: Record<PresentLayout, string> = {
  split_slide_left: '左幻灯 · 右主播',
  split_slide_right: '左主播 · 右幻灯',
  pip: '幻灯全屏 + 画中画',
  slide_full: '纯幻灯',
  avatar_full: '纯主播',
};

export const PIP_CORNER_LABELS: Record<PipCorner, string> = {
  'bottom-right': '右下',
  'bottom-left': '左下',
  'top-right': '右上',
  'top-left': '左上',
};
