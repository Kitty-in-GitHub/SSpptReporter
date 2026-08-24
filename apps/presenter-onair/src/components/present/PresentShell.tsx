import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { UI_SETTINGS } from '../../constants/uiZh';
import type { useDirectorQueue } from '../../hooks/useDirectorQueue';
import {
  PRESENT_LAYOUT_LABELS,
  type PipCorner,
  type PresentLayout,
  type SessionMode,
} from '../../types/present';
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
import { PresentPipControls } from './PresentPipControls';
import { PresentPlaybackControls } from './PresentPlaybackControls';
import { PresentScriptCue } from './PresentScriptCue';
import { SessionModeToolbar } from './SessionModeToolbar';
import './presentLayouts.css';

type DirectorQueueApi = ReturnType<typeof useDirectorQueue>;

interface PresentShellProps {
  presentLayout: PresentLayout;
  pipCorner: PipCorner;
  pipBorderless: boolean;
  pipOffsetX: number;
  pipOffsetY: number;
  pipSize: number;
  slideDeck: SlideDeckController;
  directorQueue: DirectorQueueApi;
  playbackDisabled?: boolean;
  isDeckScriptLoading?: boolean;
  onPlayDeckScript: () => void;
  onPresentLayoutChange: (layout: PresentLayout) => void;
  onPipCornerChange: (corner: PipCorner) => void;
  onPipBorderlessChange: (borderless: boolean) => void;
  onPipSizeChange: (size: number) => void;
  onPipOffsetChange: (offsetX: number, offsetY: number) => void;
  onSessionModeChange: (mode: SessionMode) => void;
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
  backgroundMode: 'default' | 'green' | 'transparent';
  vrmFramingZoom: number;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function resolveAvatarStageStyle(
  backgroundMode: PresentShellProps['backgroundMode'],
  backgroundImageUrl?: string | null,
): CSSProperties | undefined {
  if (backgroundMode === 'green') {
    return { backgroundColor: '#00ff00' };
  }
  if (backgroundMode === 'transparent') {
    return { backgroundColor: 'transparent' };
  }
  if (backgroundImageUrl) {
    return {
      backgroundImage: `url(${backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return undefined;
}

export function PresentShell({
  presentLayout,
  pipCorner,
  pipBorderless,
  pipOffsetX,
  pipOffsetY,
  pipSize,
  slideDeck,
  directorQueue,
  playbackDisabled = false,
  isDeckScriptLoading = false,
  onPlayDeckScript,
  onPresentLayoutChange,
  onPipCornerChange,
  onPipBorderlessChange,
  onPipSizeChange,
  onPipOffsetChange,
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
  vrmFramingZoom,
}: PresentShellProps) {
  const pipDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const showSlide = presentLayout !== 'avatar_full';
  const showAvatar = presentLayout !== 'slide_full';
  const isPipLayout = presentLayout === 'pip';
  const deckTitle =
    slideDeck.deck?.title ??
    (slideDeck.isLoading
      ? '加载 deck…'
      : slideDeck.loadError
        ? 'deck 加载失败'
        : '未加载 deck');

  const currentAction =
    directorQueue.currentIndex >= 0
      ? directorQueue.queue[directorQueue.currentIndex]
      : null;

  const slideControlsDisabled =
    !slideDeck.pdfUrl ||
    slideDeck.isLoading ||
    Boolean(slideDeck.loadError);

  const finishPipDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = pipDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      pipDragRef.current = null;
    },
    [],
  );

  const handlePipDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPipLayout || event.button !== 0) {
        return;
      }
      pipDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: pipOffsetX,
        originY: pipOffsetY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [isPipLayout, pipOffsetX, pipOffsetY],
  );

  const handlePipDragMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = pipDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      onPipOffsetChange(
        drag.originX + (event.clientX - drag.startX),
        drag.originY + (event.clientY - drag.startY),
      );
    },
    [onPipOffsetChange],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === ' ' || event.code === 'Space') {
        const { playbackState } = directorQueue;
        if (playbackState === 'playing') {
          event.preventDefault();
          directorQueue.pause();
        } else if (playbackState === 'paused') {
          event.preventDefault();
          directorQueue.resume();
        }
        return;
      }

      if (slideControlsDisabled) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        slideDeck.prevPage();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        slideDeck.nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [directorQueue, slideControlsDisabled, slideDeck]);

  const avatarStageClassName = [
    'present-avatar-stage',
    backgroundMode === 'transparent' ? 'is-transparent-bg' : '',
    isPipLayout ? 'is-pip-window' : '',
    isPipLayout && pipBorderless ? 'is-pip-borderless' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const avatarStageStyle: CSSProperties = {
    ...resolveAvatarStageStyle(backgroundMode, backgroundImageUrl),
    ...(isPipLayout
      ? {
          transform: `translate(${pipOffsetX}px, ${pipOffsetY}px)`,
          width: `min(${32 * pipSize}vw, ${360 * pipSize}px)`,
          height: `min(${48 * pipSize}vh, ${520 * pipSize}px)`,
        }
      : {}),
  };

  const avatarStage = showAvatar ? (
    <div className={avatarStageClassName} style={avatarStageStyle}>
      {isPipLayout ? (
        <div
          className="present-pip-drag-handle"
          onPointerDown={handlePipDragStart}
          onPointerMove={handlePipDragMove}
          onPointerUp={finishPipDrag}
          onPointerCancel={finishPipDrag}
          onLostPointerCapture={finishPipDrag}
          title="拖动调整画中画位置"
        >
          ⠿ 拖动
        </div>
      ) : null}
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
        vrmFramingZoom={vrmFramingZoom}
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
      <SessionModeToolbar
        sessionMode="present"
        onSessionModeChange={onSessionModeChange}
        onToggleSettings={onToggleSettings}
        settingsAriaLabel={UI_SETTINGS.ariaLabel}
        title={deckTitle}
      >
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
        {isPipLayout ? (
          <PresentPipControls
            pipCorner={pipCorner}
            pipBorderless={pipBorderless}
            pipSize={pipSize}
            onPipCornerChange={onPipCornerChange}
            onPipBorderlessChange={onPipBorderlessChange}
            onPipSizeChange={onPipSizeChange}
            onResetPipOffset={() => onPipOffsetChange(0, 0)}
          />
        ) : null}
        <PresentControls
          currentPage={slideDeck.currentPage}
          pageCount={slideDeck.pageCount}
          disabled={slideControlsDisabled}
          onPrev={slideDeck.prevPage}
          onNext={slideDeck.nextPage}
        />
        <PresentPlaybackControls
          playbackState={directorQueue.playbackState}
          playDisabled={playbackDisabled}
          isLoading={isDeckScriptLoading}
          onPlayDeckScript={onPlayDeckScript}
          onPause={directorQueue.pause}
          onResume={directorQueue.resume}
          onSkip={directorQueue.skip}
          onStop={directorQueue.stop}
        />
      </SessionModeToolbar>

      <div className="present-body">
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

        <PresentScriptCue
          playbackState={directorQueue.playbackState}
          currentAction={currentAction ?? null}
          currentIndex={directorQueue.currentIndex}
          queueLength={directorQueue.queue.length}
        />
      </div>
    </div>
  );
}
