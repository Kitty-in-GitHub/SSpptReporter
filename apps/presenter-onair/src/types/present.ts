export type SessionMode = 'chat' | 'present' | 'edit';

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
}

export const DEFAULT_PRESENT_SETTINGS: PresentSettings = {
  sessionMode: 'chat',
  presentLayout: 'split_slide_left',
  activeDeckId: 'demo',
  pipCorner: 'bottom-right',
};

export function normalizePresentSettings(
  partial?: Partial<PresentSettings> | null,
): PresentSettings {
  const activeDeckId = partial?.activeDeckId?.trim();
  return {
    ...DEFAULT_PRESENT_SETTINGS,
    ...partial,
    activeDeckId: activeDeckId || DEFAULT_PRESENT_SETTINGS.activeDeckId,
    sessionMode:
      partial?.sessionMode === 'present' || partial?.sessionMode === 'edit'
        ? partial.sessionMode
        : DEFAULT_PRESENT_SETTINGS.sessionMode,
    presentLayout: partial?.presentLayout ?? DEFAULT_PRESENT_SETTINGS.presentLayout,
    pipCorner: partial?.pipCorner ?? DEFAULT_PRESENT_SETTINGS.pipCorner,
  };
}

export const PRESENT_LAYOUT_LABELS: Record<PresentLayout, string> = {
  split_slide_left: '左幻灯 · 右主播',
  split_slide_right: '左主播 · 右幻灯',
  pip: '幻灯全屏 + 画中画',
  slide_full: '纯幻灯',
  avatar_full: '纯主播',
};
