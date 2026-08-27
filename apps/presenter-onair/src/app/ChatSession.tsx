import { useEffect, type RefObject } from 'react';
import { ChatPanel } from '../components/ChatPanel';
import { useAvatarPresenter } from '../hooks/useAvatarPresenter';
import { useResolvedVrmModel } from '../hooks/useResolvedVrmModel';
import type { AvatarPresenterController } from '../hooks/useAvatarPresenter';
import type { useSettings } from '../hooks/useSettings';
import type { ChatMessage } from '../types/chat';
import { getEmotionEffectAnchor } from '../lib/emotionEffectAnchor';

type SettingsHook = ReturnType<typeof useSettings>;

interface ChatSessionProps {
  settingsHook: SettingsHook;
  onToggleSettings: () => void;
  avatarPresenterRef: RefObject<AvatarPresenterController | null>;
  messages: ChatMessage[];
  partialResponse: string;
  isProcessing: boolean;
  onSend: (text: string) => void;
  mouthLevelRef: RefObject<number>;
  isSpeaking: boolean;
  backgroundImageUrl: string | null;
}

export function ChatSession({
  settingsHook,
  onToggleSettings,
  avatarPresenterRef,
  messages,
  partialResponse,
  isProcessing,
  onSend,
  mouthLevelRef,
  isSpeaking,
  backgroundImageUrl,
}: ChatSessionProps) {
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

  useEffect(() => {
    avatarPresenterRef.current = avatarPresenter;
    return () => {
      avatarPresenterRef.current = null;
    };
  }, [avatarPresenter, avatarPresenterRef]);

  return (
    <ChatPanel
      messages={messages}
      partialResponse={partialResponse}
      isProcessing={isProcessing}
      onSend={onSend}
      mouthLevelRef={mouthLevelRef}
      isSpeaking={isSpeaking}
      avatarPresenter={avatarPresenter}
      vrmUrl={vrmUrl}
      vrmResolveError={vrmResolveError}
      vrmResolving={isVrmResolving}
      backgroundImageUrl={backgroundImageUrl}
      visual={settingsHook.settings.visual}
      onToggleSettings={onToggleSettings}
      onEnterPresentMode={() =>
        settingsHook.updatePresentSessionMode('present')
      }
      onEnterEditMode={() => settingsHook.updatePresentSessionMode('edit')}
    />
  );
}
