import { UI_SETTINGS } from '../constants/uiZh';
import type { ChatMessage } from '../types/chat';
import type { VisualSettings } from '../types/settings';
import type { EmotionEffectAnchor } from '../lib/emotionEffectAnchor';
import type {
  VrmAvatarReaction,
  VrmEmotionEffectReaction,
  VrmEmotionEffectMap,
  VrmReactionControlMode,
} from '../lib/vrmReactions';
import { AvatarBackground } from './AvatarPanel';
import { ChatLog } from './ChatLog';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: ChatMessage[];
  partialResponse: string;
  isProcessing: boolean;
  onSend: (text: string) => void;
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
  visual: VisualSettings;
  onEnterPresentMode?: () => void;
  onEnterEditMode?: () => void;
  onVrmCameraFramingChange?: (
    framing: VisualSettings['vrmCameraFraming'],
  ) => void;
}

export function ChatPanel({
  messages,
  partialResponse,
  isProcessing,
  onSend,
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
  visual,
  onEnterPresentMode,
  onEnterEditMode,
  onVrmCameraFramingChange,
}: ChatPanelProps) {
  const isBroadcast = visual.layoutMode === 'broadcast';
  const shouldShowInput = !isBroadcast || visual.showInputInBroadcast;
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');
  const broadcastCaption =
    partialResponse || latestAssistantMessage?.content.trim() || '';
  const panelStyle =
    visual.backgroundMode === 'green'
      ? { backgroundColor: '#00ff00' }
      : visual.backgroundMode === 'transparent'
        ? { backgroundColor: 'transparent' }
        : backgroundImageUrl
          ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined;

  return (
    <div
      className={`chat-panel${isBroadcast ? ' chat-panel-broadcast' : ''}${
        isBroadcast && shouldShowInput ? ' chat-panel-broadcast-input' : ''
      }`}
      style={panelStyle}
    >
      <div className="chat-panel-toolbar">
        {onEnterPresentMode && (
          <button
            type="button"
            className="chat-mode-button"
            onClick={onEnterPresentMode}
          >
            汇报
          </button>
        )}
        {onEnterEditMode && (
          <button
            type="button"
            className="chat-mode-button"
            onClick={onEnterEditMode}
          >
            编辑讲稿
          </button>
        )}
        <button
          type="button"
          className="settings-button chat-settings-button"
          onClick={onToggleSettings}
          aria-label={UI_SETTINGS.ariaLabel}
        >
          ⚙
        </button>
      </div>
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
        vrmCameraFraming={visual.vrmCameraFraming}
        onVrmCameraFramingChange={onVrmCameraFramingChange}
      />
      {isBroadcast ? (
        broadcastCaption && (
          <div className="broadcast-caption">{broadcastCaption}</div>
        )
      ) : (
        <ChatLog messages={messages} partialResponse={partialResponse} />
      )}
      {shouldShowInput && <ChatInput onSend={onSend} disabled={isProcessing} />}
    </div>
  );
}
