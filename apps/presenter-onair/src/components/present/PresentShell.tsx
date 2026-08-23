import { UI_SETTINGS } from '../../constants/uiZh';
import { PRESENT_LAYOUT_LABELS, type PresentLayout } from '../../types/present';
import type { SlideDeckController } from '../../hooks/useSlideDeck';
import type { EmotionEffectAnchor } from '../../lib/emotionEffectAnchor';
import type {
  VrmAvatarReaction,
  VrmEmotionEffectReaction,
  VrmEmotionEffectMap,
  VrmReactionControlMode,
} from '../../lib/vrmReactions';
import { AvatarBackground } from '../AvatarPanel';
import { PdfSlideViewer } from './PdfSlideViewer';
import { PresentControls } from './PresentControls';
import './presentLayouts.css';

interface PresentShellProps {
  presentLayout: PresentLayout;
  pipCorner: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  slideDeck: SlideDeckController;
  onPresentLayoutChange: (layout: PresentLayout) => void;
  onSessionModeChange: (mode: 'chat' | 'present') => void;
  onToggleSettings: () => void;
  mouthLevel: number;
  isSpeaking: boolean;
  avatarReaction?: VrmAvatarReaction | null;
  emotionEffectReaction?: VrmEmotionEffectReaction | null;
  reactionControlMode: VrmReactionControlMode;
  emotionEffectMap: VrmEmotionEffectMap;
  effectAnchor: EmotionEffectAnchor;
  onEffectAnchorChange: (anchor: EmotionEffectAnchor) => void;
  onEffectAnchorReset: () => void;
  backgroundImageUrl?: string | null;
  backgroundMode: 'default' | 'green';
}

export function PresentShell({
  presentLayout,
  pipCorner,
  slideDeck,
  onPresentLayoutChange,
  onSessionModeChange,
  onToggleSettings,
  mouthLevel,
  isSpeaking,
  avatarReaction,
  emotionEffectReaction,
  reactionControlMode,
  emotionEffectMap,
  effectAnchor,
  onEffectAnchorChange,
  onEffectAnchorReset,
  backgroundImageUrl,
  backgroundMode,
}: PresentShellProps) {
  const showSlide = presentLayout !== 'avatar_full';
  const showAvatar = presentLayout !== 'slide_full';
  const deckTitle =
    slideDeck.deck?.title ??
    (slideDeck.isLoading
      ? '加载 deck…'
      : slideDeck.loadError
        ? 'deck 加载失败'
        : '未加载 deck');

  const avatarStage = showAvatar ? (
    <div
      className="present-avatar-stage"
      style={
        backgroundMode === 'green'
          ? { backgroundColor: '#00ff00' }
          : backgroundImageUrl
            ? {
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
      }
    >
      <AvatarBackground
        mouthLevel={mouthLevel}
        isSpeaking={isSpeaking}
        reaction={avatarReaction}
        emotionEffectReaction={emotionEffectReaction}
        reactionControlMode={reactionControlMode}
        emotionEffectMap={emotionEffectMap}
        effectAnchor={effectAnchor}
        onEffectAnchorChange={onEffectAnchorChange}
        onEffectAnchorReset={onEffectAnchorReset}
      />
    </div>
  ) : null;

  const slideStage = showSlide ? (
    <div className="present-slide-stage">
      {slideDeck.loadError ? (
        <div className="present-slide-error">{slideDeck.loadError}</div>
      ) : slideDeck.isLoading || !slideDeck.pdfUrl ? (
        <div className="present-slide-loading">正在加载幻灯…</div>
      ) : (
        <PdfSlideViewer
          pdfUrl={slideDeck.pdfUrl}
          pageNumber={slideDeck.currentPage}
          onDocumentLoad={slideDeck.syncPageCount}
        />
      )}
    </div>
  ) : null;

  return (
    <div
      className={`present-shell present-layout-${presentLayout} present-pip-${pipCorner}`}
    >
      <header className="present-toolbar">
        <div className="present-toolbar-group">
          <button type="button" onClick={() => onSessionModeChange('chat')}>
            聊天
          </button>
          <button type="button" className="is-active" disabled>
            汇报
          </button>
        </div>
        <label className="present-toolbar-layout">
          布局
          <select
            value={presentLayout}
            onChange={(event) =>
              onPresentLayoutChange(event.target.value as PresentLayout)
            }
          >
            {Object.entries(PRESENT_LAYOUT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <PresentControls
          currentPage={slideDeck.currentPage}
          pageCount={slideDeck.pageCount}
          disabled={
            !slideDeck.pdfUrl ||
            slideDeck.isLoading ||
            Boolean(slideDeck.loadError)
          }
          onPrev={slideDeck.prevPage}
          onNext={slideDeck.nextPage}
        />
        <div className="present-toolbar-title">{deckTitle}</div>
        <button
          type="button"
          className="present-settings-button"
          onClick={onToggleSettings}
          aria-label={UI_SETTINGS.ariaLabel}
        >
          ⚙
        </button>
      </header>

      <div className="present-stage">
        {presentLayout === 'slide_full' && slideStage}
        {presentLayout === 'avatar_full' && avatarStage}
        {presentLayout === 'split_slide_left' && (
          <>
            {slideStage}
            {avatarStage}
          </>
        )}
        {presentLayout === 'split_slide_right' && (
          <>
            {avatarStage}
            {slideStage}
          </>
        )}
        {presentLayout === 'pip' && (
          <>
            {slideStage}
            {avatarStage}
          </>
        )}
      </div>
    </div>
  );
}
