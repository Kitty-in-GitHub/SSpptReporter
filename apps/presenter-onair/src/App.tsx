import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ChatPanel } from './components/ChatPanel';
import { DirectorPanel } from './components/DirectorPanel';
import { PresentShell } from './components/present/PresentShell';
import { ScriptEditorShell } from './components/present/ScriptEditorShell';
import { SettingsPanel } from './components/SettingsPanel';
import { useAudioLipsync } from './hooks/useAudioLipsync';
import { useDeckScriptEditor } from './hooks/useDeckScriptEditor';
import { useDirectorSpeech } from './hooks/useDirectorSpeech';
import { useDeckScriptPlayback } from './hooks/useDeckScriptPlayback';
import { useDirectorQueue } from './hooks/useDirectorQueue';
import { useSlideDeck } from './hooks/useSlideDeck';
import { useAituberCore } from './hooks/useAituberCore';
import { useLiveCommentIntelligence } from './hooks/useLiveCommentIntelligence';
import { useScreenVisionController } from './hooks/useScreenVisionController';
import { useSettings } from './hooks/useSettings';
import { useTwitchComments } from './hooks/useTwitchComments';
import { useYoutubeComments } from './hooks/useYoutubeComments';
import { clampDialogDragDelta, type DialogDragPoint } from './lib/dialogDrag';
import { getEmotionEffectAnchor } from './lib/emotionEffectAnchor';
import {
  createLinkedVrmEmotionEffectReaction,
  createVrmReactionFromScreenplay,
  sustainVrmReactionForSpeech,
  withReactionId,
  withVrmEmotionEffectReactionId,
} from './lib/vrmReactions';
import type {
  ScreenplayLike,
  VrmAvatarReaction,
  VrmAvatarReactionDraft,
  VrmEmotionEffectReaction,
  VrmEmotionEffectReactionDraft,
} from './lib/vrmReactions';
import type { TwitchChatMessage } from './services/twitch/twitchService';
import type { YouTubeChatMessage } from './services/youtube/youtubeService';
import './styles/app.css';
import { UI_SETTINGS } from './constants/uiZh';

const DEFAULT_SETTINGS_DIALOG_OFFSET: DialogDragPoint = { x: 0, y: 0 };
const VRM_EFFECT_ANCHOR_PROFILE_ID = 'avatar/StarString1.0.vrm';

interface SettingsDialogDragState {
  pointerId: number;
  pointerStart: DialogDragPoint;
  offsetStart: DialogDragPoint;
  rect: DOMRect;
}

export default function App() {
  const { play, stop, mouthLevel, isSpeaking } = useAudioLipsync();
  const settingsHook = useSettings();
  const updateTwitchAccessToken = settingsHook.updateTwitchAccessToken;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDialogOffset, setSettingsDialogOffset] =
    useState<DialogDragPoint>(DEFAULT_SETTINGS_DIALOG_OFFSET);
  const [settingsDialogDragging, setSettingsDialogDragging] = useState(false);
  const [streamErrorMessage, setStreamErrorMessage] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null,
  );
  const backgroundObjectUrlRef = useRef<string | null>(null);
  const settingsDialogRef = useRef<HTMLDivElement | null>(null);
  const settingsDialogDragRef = useRef<SettingsDialogDragState | null>(null);
  const avatarReactionIdRef = useRef(0);
  const emotionEffectReactionIdRef = useRef(0);
  const [avatarReaction, setAvatarReaction] =
    useState<VrmAvatarReaction | null>(null);
  const [emotionEffectReaction, setEmotionEffectReaction] =
    useState<VrmEmotionEffectReaction | null>(null);

  const emitAvatarReaction = useCallback((draft: VrmAvatarReactionDraft) => {
    avatarReactionIdRef.current += 1;
    setAvatarReaction(withReactionId(draft, avatarReactionIdRef.current));
  }, []);

  const emitEmotionEffectReaction = useCallback(
    (draft: VrmEmotionEffectReactionDraft) => {
      emotionEffectReactionIdRef.current += 1;
      setEmotionEffectReaction(
        withVrmEmotionEffectReactionId(
          draft,
          emotionEffectReactionIdRef.current,
        ),
      );
    },
    [],
  );

  const handleSettingsDialogPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if ((event.target as Element).closest('button')) return;
      const dialog = settingsDialogRef.current;
      if (!dialog) return;

      settingsDialogDragRef.current = {
        pointerId: event.pointerId,
        pointerStart: { x: event.clientX, y: event.clientY },
        offsetStart: settingsDialogOffset,
        rect: dialog.getBoundingClientRect(),
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setSettingsDialogDragging(true);
      event.preventDefault();
    },
    [settingsDialogOffset],
  );

  const handleSettingsDialogPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = settingsDialogDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const delta = clampDialogDragDelta(
        {
          x: event.clientX - drag.pointerStart.x,
          y: event.clientY - drag.pointerStart.y,
        },
        drag.rect,
        { width: window.innerWidth, height: window.innerHeight },
      );
      setSettingsDialogOffset({
        x: drag.offsetStart.x + delta.x,
        y: drag.offsetStart.y + delta.y,
      });
    },
    [],
  );

  const finishSettingsDialogDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = settingsDialogDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      settingsDialogDragRef.current = null;
      setSettingsDialogDragging(false);
    },
    [],
  );

  const resetSettingsDialogPosition = useCallback(() => {
    settingsDialogDragRef.current = null;
    setSettingsDialogDragging(false);
    setSettingsDialogOffset(DEFAULT_SETTINGS_DIALOG_OFFSET);
  }, []);

  const closeSettingsDialog = useCallback(() => {
    resetSettingsDialogPosition();
    setSettingsOpen(false);
  }, [resetSettingsDialogPosition]);

  const toggleSettingsDialog = useCallback(() => {
    resetSettingsDialogPosition();
    setSettingsOpen((open) => !open);
  }, [resetSettingsDialogPosition]);

  const handleAudioPlay = useCallback(
    async (arrayBuffer: ArrayBuffer) => {
      await play(arrayBuffer);
    },
    [play],
  );

  const { speak: speakDirector, supportsLipSync, engine: directorTtsEngine } =
    useDirectorSpeech({
      settings: settingsHook.settings,
      getApiKeyForProvider: settingsHook.getApiKeyForProvider,
      onPlay: handleAudioPlay,
    });

  const slideDeck = useSlideDeck(settingsHook.settings.present.activeDeckId);
  const scriptEditor = useDeckScriptEditor(
    settingsHook.settings.present.activeDeckId,
    slideDeck.pageCount,
  );

  const directorQueue = useDirectorQueue({
    speak: speakDirector,
    stopSpeech: stop,
    onApplyEmotion: emitAvatarReaction,
    onResetEmotion: () =>
      emitAvatarReaction({ type: 'reset', fadeMs: 280 }),
    onSlideAction: slideDeck.applyDirectorSlideAction,
  });

  const deckScriptPlayback = useDeckScriptPlayback({
    activeDeckId: settingsHook.settings.present.activeDeckId,
    deckScriptUrl: slideDeck.deck?.scriptUrl,
    queue: directorQueue,
  });

  const isDirectorBusy =
    directorQueue.playbackState === 'playing' ||
    directorQueue.playbackState === 'paused';

  const handleSpeechStart = useCallback(
    (screenplay: ScreenplayLike) => {
      const nativeReaction = createVrmReactionFromScreenplay(screenplay);
      if (nativeReaction) {
        emitAvatarReaction(sustainVrmReactionForSpeech(nativeReaction));
      } else {
        emitAvatarReaction({ type: 'reset', fadeMs: 220 });
      }

      const emotionEffectReaction = createLinkedVrmEmotionEffectReaction(
        settingsHook.settings.visual.vrmReactionControlMode,
        screenplay,
        settingsHook.settings.visual.vrmEmotionEffectMap,
      );
      if (emotionEffectReaction) {
        emitEmotionEffectReaction(emotionEffectReaction);
      } else {
        setEmotionEffectReaction(null);
      }
    },
    [
      emitAvatarReaction,
      emitEmotionEffectReaction,
      settingsHook.settings.visual.vrmEmotionEffectMap,
      settingsHook.settings.visual.vrmReactionControlMode,
    ],
  );

  const handleSpeechEnd = useCallback(() => {
    emitAvatarReaction({ type: 'reset', fadeMs: 360 });
    setEmotionEffectReaction(null);
  }, [emitAvatarReaction]);

  const {
    messages,
    isProcessing,
    partialResponse,
    processChat,
    processVisionChat,
  } = useAituberCore({
    onAudioPlay: handleAudioPlay,
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
    settings: settingsHook.settings,
    getApiKeyForProvider: settingsHook.getApiKeyForProvider,
  });
  const screenVisionController = useScreenVisionController({
    settings: settingsHook.settings.screenVision,
    onCapture: processVisionChat,
    onEnabledChange: settingsHook.updateScreenVisionEnabled,
    onDeviceIdChange: settingsHook.updateScreenVisionDeviceId,
  });

  const handleSend = useCallback(
    (text: string) => {
      // Stop previous audio if speech is currently playing
      stop();
      emitAvatarReaction({ type: 'reset', fadeMs: 160 });
      setEmotionEffectReaction(null);
      processChat(text);
    },
    [stop, emitAvatarReaction, processChat],
  );

  const { enqueueYouTubeComments, enqueueTwitchComments } =
    useLiveCommentIntelligence({
      messages,
      isProcessing,
      isSpeaking,
      processChat,
      streamPlatform: settingsHook.settings.stream.platform,
      llmSettings: settingsHook.settings.llm,
      getApiKeyForProvider: settingsHook.getApiKeyForProvider,
      enabled: settingsHook.settings.commentIntelligence.enabled,
      mode: settingsHook.settings.commentIntelligence.mode,
      analysisIntervalMs:
        settingsHook.settings.commentIntelligence.analysisIntervalMs,
      maxCommentsPerBatch:
        settingsHook.settings.commentIntelligence.maxCommentsPerBatch,
      minCommentsForLLMAnalysis:
        settingsHook.settings.commentIntelligence.minCommentsForLLMAnalysis,
      blockHighRiskViewers:
        settingsHook.settings.commentIntelligence.blockHighRiskViewers,
      viewerBlockDurationMs:
        settingsHook.settings.commentIntelligence.viewerBlockDurationMs,
      streamTopic: settingsHook.settings.commentIntelligence.streamTopic,
      streamTitle: settingsHook.settings.commentIntelligence.streamTitle,
      topicFilter: settingsHook.settings.commentIntelligence.topicFilter,
    });

  const handleYoutubeComment = useCallback(
    (comment: YouTubeChatMessage) => {
      enqueueYouTubeComments([comment]);
    },
    [enqueueYouTubeComments],
  );

  const handleTwitchComment = useCallback(
    (comment: TwitchChatMessage) => {
      enqueueTwitchComments([comment]);
    },
    [enqueueTwitchComments],
  );

  const handleBackgroundImageChange = useCallback((file: File | null) => {
    if (backgroundObjectUrlRef.current) {
      URL.revokeObjectURL(backgroundObjectUrlRef.current);
      backgroundObjectUrlRef.current = null;
    }

    if (!file) {
      setBackgroundImageUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    backgroundObjectUrlRef.current = nextUrl;
    setBackgroundImageUrl(nextUrl);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) return;

    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('access_token');
    const state = params.get('state');
    const savedState = sessionStorage.getItem('twitchOauthState');

    if (token && state && state === savedState) {
      updateTwitchAccessToken(token);
      queueMicrotask(() => setStreamErrorMessage(''));
      sessionStorage.removeItem('twitchOauthState');
    }

    history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );
  }, [updateTwitchAccessToken]);

  useYoutubeComments({
    youtubeLiveId: settingsHook.settings.stream.youtubeLiveId,
    youtubeApiKey: settingsHook.settings.stream.youtubeApiKey,
    isEnabled:
      settingsHook.settings.stream.platform === 'youtube' &&
      settingsHook.settings.stream.youtubeEnabled,
    intervalMs: settingsHook.settings.stream.youtubeCommentIntervalMs,
    onComment: handleYoutubeComment,
  });

  useTwitchComments({
    twitchChannel: settingsHook.settings.stream.twitchChannel,
    twitchClientId: settingsHook.settings.stream.twitchClientId,
    twitchAccessToken: settingsHook.settings.stream.twitchAccessToken,
    isEnabled:
      settingsHook.settings.stream.platform === 'twitch' &&
      settingsHook.settings.stream.twitchEnabled,
    intervalMs: settingsHook.settings.stream.twitchCommentIntervalMs,
    onComment: handleTwitchComment,
    onTokenExpired: () => {
      settingsHook.updateTwitchAccessToken('');
      settingsHook.updateTwitchEnabled(false);
      setStreamErrorMessage('Twitch access token expired. Please reconnect.');
    },
    onError: (message) => {
      setStreamErrorMessage(message);
      if (message) {
        console.warn(message);
      }
    },
  });

  // Close the dialog with the Escape key
  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettingsDialog();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSettingsDialog, settingsOpen]);

  useEffect(() => {
    if (!settingsOpen) return;

    const handleResize = () => resetSettingsDialogPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resetSettingsDialogPosition, settingsOpen]);

  useEffect(() => {
    const backgroundObjectUrl = backgroundObjectUrlRef;

    return () => {
      if (backgroundObjectUrl.current) {
        URL.revokeObjectURL(backgroundObjectUrl.current);
      }
    };
  }, []);

  const sessionMode = settingsHook.settings.present.sessionMode;

  return (
    <div className="app">
      {sessionMode === 'edit' ? (
        <ScriptEditorShell
          slideDeck={slideDeck}
          editor={scriptEditor}
          onSessionModeChange={settingsHook.updatePresentSessionMode}
          onToggleSettings={toggleSettingsDialog}
        />
      ) : sessionMode === 'present' ? (
        <PresentShell
          presentLayout={settingsHook.settings.present.presentLayout}
          pipCorner={settingsHook.settings.present.pipCorner}
          pipBorderless={settingsHook.settings.present.pipBorderless}
          pipOffsetX={settingsHook.settings.present.pipOffsetX}
          pipOffsetY={settingsHook.settings.present.pipOffsetY}
          pipSize={settingsHook.settings.present.pipSize}
          slideDeck={slideDeck}
          directorQueue={directorQueue}
          playbackDisabled={isProcessing || isSpeaking || isDirectorBusy}
          isDeckScriptLoading={deckScriptPlayback.isLoading}
          onPlayDeckScript={() => void deckScriptPlayback.playDeckScript()}
          onPresentLayoutChange={settingsHook.updatePresentLayout}
          onPipCornerChange={settingsHook.updatePresentPipCorner}
          onPipBorderlessChange={settingsHook.updatePresentPipBorderless}
          onPipSizeChange={settingsHook.updatePresentPipSize}
          onPipOffsetChange={settingsHook.updatePresentPipOffset}
          onSessionModeChange={settingsHook.updatePresentSessionMode}
          onToggleSettings={toggleSettingsDialog}
          mouthLevel={mouthLevel}
          isSpeaking={isSpeaking}
          avatarReaction={avatarReaction}
          emotionEffectReaction={emotionEffectReaction}
          reactionControlMode={
            settingsHook.settings.visual.vrmReactionControlMode
          }
          emotionEffectMap={settingsHook.settings.visual.vrmEmotionEffectMap}
          effectAnchor={getEmotionEffectAnchor(
            settingsHook.settings.visual.vrmEmotionEffectAnchors,
            VRM_EFFECT_ANCHOR_PROFILE_ID,
          )}
          onEffectAnchorChange={(anchor) =>
            settingsHook.updateVisualVrmEmotionEffectAnchor(
              VRM_EFFECT_ANCHOR_PROFILE_ID,
              anchor,
            )
          }
          onEffectAnchorReset={() =>
            settingsHook.resetVisualVrmEmotionEffectAnchor(
              VRM_EFFECT_ANCHOR_PROFILE_ID,
            )
          }
          backgroundImageUrl={backgroundImageUrl}
          backgroundMode={settingsHook.settings.visual.backgroundMode}
          vrmCameraFraming={settingsHook.settings.visual.vrmCameraFraming}
          onVrmCameraFramingChange={settingsHook.updateVisualVrmCameraFraming}
        />
      ) : (
        <ChatPanel
          messages={messages}
          partialResponse={partialResponse}
          isProcessing={isProcessing}
          onSend={handleSend}
          mouthLevel={mouthLevel}
          isSpeaking={isSpeaking}
          avatarReaction={avatarReaction}
          emotionEffectReaction={emotionEffectReaction}
          reactionControlMode={
            settingsHook.settings.visual.vrmReactionControlMode
          }
          emotionEffectMap={settingsHook.settings.visual.vrmEmotionEffectMap}
          effectAnchor={getEmotionEffectAnchor(
            settingsHook.settings.visual.vrmEmotionEffectAnchors,
            VRM_EFFECT_ANCHOR_PROFILE_ID,
          )}
          onEffectAnchorChange={(anchor) =>
            settingsHook.updateVisualVrmEmotionEffectAnchor(
              VRM_EFFECT_ANCHOR_PROFILE_ID,
              anchor,
            )
          }
          onEffectAnchorReset={() =>
            settingsHook.resetVisualVrmEmotionEffectAnchor(
              VRM_EFFECT_ANCHOR_PROFILE_ID,
            )
          }
          backgroundImageUrl={backgroundImageUrl}
          visual={settingsHook.settings.visual}
          onToggleSettings={toggleSettingsDialog}
          onEnterPresentMode={() =>
            settingsHook.updatePresentSessionMode('present')
          }
          onEnterEditMode={() =>
            settingsHook.updatePresentSessionMode('edit')
          }
          onVrmCameraFramingChange={settingsHook.updateVisualVrmCameraFraming}
        />
      )}

      <DirectorPanel
        sessionMode={sessionMode}
        disabled={isProcessing || isSpeaking || isDirectorBusy}
        supportsLipSync={supportsLipSync}
        ttsEngine={directorTtsEngine}
        queue={directorQueue}
        deckPlayback={deckScriptPlayback}
        onSpeak={speakDirector}
        onApplyEmotion={emitAvatarReaction}
        onResetEmotion={() =>
          emitAvatarReaction({ type: 'reset', fadeMs: 280 })
        }
      />

      {settingsOpen && (
        <div className="settings-dialog-overlay" onClick={closeSettingsDialog}>
          <div
            ref={settingsDialogRef}
            className="settings-dialog"
            style={{
              transform: `translate3d(${settingsDialogOffset.x}px, ${settingsDialogOffset.y}px, 0)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`settings-dialog-header${settingsDialogDragging ? ' is-dragging' : ''}`}
              onPointerDown={handleSettingsDialogPointerDown}
              onPointerMove={handleSettingsDialogPointerMove}
              onPointerUp={finishSettingsDialogDrag}
              onPointerCancel={finishSettingsDialogDrag}
              onLostPointerCapture={finishSettingsDialogDrag}
            >
              <h2>{UI_SETTINGS.title}</h2>
              <button
                className="settings-dialog-close"
                onClick={closeSettingsDialog}
              >
                &times;
              </button>
            </div>
            <SettingsPanel
              {...settingsHook}
              isProcessing={isProcessing}
              backgroundImageUrl={backgroundImageUrl}
              streamErrorMessage={streamErrorMessage}
              screenVisionController={screenVisionController}
              onBackgroundImageChange={handleBackgroundImageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
