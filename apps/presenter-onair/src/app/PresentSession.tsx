import { useCallback, useRef, type RefObject } from 'react';
import { DirectorPanel } from '../components/DirectorPanel';
import { PresentShell } from '../components/present/PresentShell';
import { useAvatarPresenter } from '../hooks/useAvatarPresenter';
import { useDeckScriptPlayback } from '../hooks/useDeckScriptPlayback';
import { useDirectorQueue } from '../hooks/useDirectorQueue';
import { useDirectorSpeech } from '../hooks/useDirectorSpeech';
import { usePerformanceCatalog } from '../hooks/usePerformanceCatalog';
import { useResolvedVrmModel } from '../hooks/useResolvedVrmModel';
import { useSlideDeck } from '../hooks/useSlideDeck';
import type { useSettings } from '../hooks/useSettings';
import { getEmotionEffectAnchor } from '../lib/emotionEffectAnchor';

type SettingsHook = ReturnType<typeof useSettings>;

interface PresentSessionProps {
  settingsHook: SettingsHook;
  onToggleSettings: () => void;
  onStageModeChange: (active: boolean) => void;
  presentStageMode: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  mouthLevelRef: RefObject<number>;
  backgroundImageUrl: string | null;
  onPlay: (arrayBuffer: ArrayBuffer) => Promise<void>;
  onStop: () => void;
}

export function PresentSession({
  settingsHook,
  onToggleSettings,
  onStageModeChange,
  presentStageMode,
  isProcessing,
  isSpeaking,
  mouthLevelRef,
  backgroundImageUrl,
  onPlay,
  onStop,
}: PresentSessionProps) {
  const {
    vrmUrl,
    isResolving: isVrmResolving,
    resolveError: vrmResolveError,
    effectAnchorProfileId,
  } = useResolvedVrmModel(settingsHook.settings.visual);

  const avatarPresenter = useAvatarPresenter(
    {
      reactionControlMode: settingsHook.settings.visual.vrmReactionControlMode,
      emotionEffectMap: settingsHook.settings.visual.vrmEmotionEffectMap,
      effectAnchor: getEmotionEffectAnchor(
        settingsHook.settings.visual.vrmEmotionEffectAnchors,
        effectAnchorProfileId,
      ),
      vrmCameraFraming: settingsHook.settings.visual.vrmCameraFraming,
    },
    {
      onEffectAnchorChange: (anchor) =>
        settingsHook.updateVisualVrmEmotionEffectAnchor(
          effectAnchorProfileId,
          anchor,
        ),
      onEffectAnchorReset: () =>
        settingsHook.resetVisualVrmEmotionEffectAnchor(effectAnchorProfileId),
      onVrmCameraFramingChange: settingsHook.updateVisualVrmCameraFraming,
    },
  );

  const handleAudioPlay = useCallback(
    async (arrayBuffer: ArrayBuffer) => {
      await onPlay(arrayBuffer);
    },
    [onPlay],
  );

  const { speak: speakDirector, supportsLipSync, engine: directorTtsEngine } =
    useDirectorSpeech({
      settings: settingsHook.settings,
      getApiKeyForProvider: settingsHook.getApiKeyForProvider,
      onPlay: handleAudioPlay,
    });

  const slideDeck = useSlideDeck(settingsHook.settings.present.activeDeckId);

  const resumeDeckAfterQaRef = useRef(
    settingsHook.settings.present.resumeDeckAfterQaInterrupt,
  );
  resumeDeckAfterQaRef.current =
    settingsHook.settings.present.resumeDeckAfterQaInterrupt;

  const performanceCatalog = usePerformanceCatalog(
    settingsHook.settings.present.activeDeckId,
  );

  const directorQueue = useDirectorQueue({
    speak: speakDirector,
    stopSpeech: onStop,
    onApplyReaction: avatarPresenter.applyReaction,
    onResetEmotion: () => avatarPresenter.reset(280),
    onSlideAction: slideDeck.applyDirectorSlideAction,
    resolvePerformance: performanceCatalog.resolvePerformance,
    resumeDeckAfterQaInterrupt: () => resumeDeckAfterQaRef.current,
  });

  const deckScriptPlayback = useDeckScriptPlayback({
    activeDeckId: settingsHook.settings.present.activeDeckId,
    deckScriptUrl: slideDeck.deck?.scriptUrl,
    queue: directorQueue,
  });

  const isDirectorBusy =
    directorQueue.playbackState === 'playing' ||
    directorQueue.playbackState === 'paused';

  return (
    <>
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
        onToggleSettings={onToggleSettings}
        mouthLevelRef={mouthLevelRef}
        isSpeaking={isSpeaking}
        avatarPresenter={avatarPresenter}
        vrmUrl={vrmUrl}
        vrmResolveError={vrmResolveError}
        vrmResolving={isVrmResolving}
        backgroundImageUrl={backgroundImageUrl}
        backgroundMode={settingsHook.settings.visual.backgroundMode}
        onStageModeChange={onStageModeChange}
        activeDeckId={settingsHook.settings.present.activeDeckId}
        onDeckChange={settingsHook.updatePresentActiveDeckId}
        resumeDeckAfterQaInterrupt={
          settingsHook.settings.present.resumeDeckAfterQaInterrupt
        }
        onResumeDeckAfterQaInterruptChange={
          settingsHook.updatePresentResumeDeckAfterQaInterrupt
        }
        qaAsrEngine={settingsHook.settings.present.qaAsrEngine}
        onQaAsrEngineChange={settingsHook.updatePresentQaAsrEngine}
        getCloudAsrApiKey={() =>
          settingsHook.getApiKeyForProvider('openai')
        }
        llmSettings={settingsHook.settings.llm}
        getApiKeyForProvider={settingsHook.getApiKeyForProvider}
      />

      {!presentStageMode ? (
        <DirectorPanel
          sessionMode="present"
          disabled={isProcessing || isSpeaking || isDirectorBusy}
          supportsLipSync={supportsLipSync}
          ttsEngine={directorTtsEngine}
          queue={directorQueue}
          deckPlayback={deckScriptPlayback}
          onSpeak={speakDirector}
          onApplyReaction={avatarPresenter.applyReaction}
          onResetEmotion={() => avatarPresenter.reset(280)}
        />
      ) : null}
    </>
  );
}
