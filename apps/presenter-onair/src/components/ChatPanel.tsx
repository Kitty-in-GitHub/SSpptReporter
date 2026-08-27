import { UI_SESSION_MODES, UI_SETTINGS } from '../constants/uiZh';
import type { AvatarPresenterController } from '../hooks/useAvatarPresenter';
import type { ChatMessage } from '../types/chat';
import type { VisualSettings } from '../types/settings';
import type { RefObject } from 'react';
import { AvatarShell } from './AvatarShell';
import { ChatLog } from './ChatLog';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: ChatMessage[];
  partialResponse: string;
  isProcessing: boolean;
  onSend: (text: string) => void;
  onToggleSettings: () => void;
  mouthLevelRef: RefObject<number>;
  isSpeaking: boolean;
  avatarPresenter: AvatarPresenterController;
  vrmUrl: string | null;
  vrmResolveError?: string | null;
  vrmResolving?: boolean;
  backgroundImageUrl?: string | null;
  visual: VisualSettings;
  onEnterPresentMode?: () => void;
  onEnterEditMode?: () => void;
  onEnterMocapMode?: () => void;
}

export function ChatPanel({
  messages,
  partialResponse,
  isProcessing,
  onSend,
  onToggleSettings,
  mouthLevelRef,
  isSpeaking,
  avatarPresenter,
  vrmUrl,
  vrmResolveError,
  vrmResolving,
  backgroundImageUrl,
  visual,
  onEnterPresentMode,
  onEnterEditMode,
  onEnterMocapMode,
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
            {UI_SESSION_MODES.edit}
          </button>
        )}
        {onEnterMocapMode && (
          <button
            type="button"
            className="chat-mode-button"
            onClick={onEnterMocapMode}
          >
            {UI_SESSION_MODES.mocap}
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
      <AvatarShell
        presenter={avatarPresenter}
        mouthLevelRef={mouthLevelRef}
        isSpeaking={isSpeaking}
        vrmUrl={vrmUrl}
        vrmResolveError={vrmResolveError}
        vrmResolving={vrmResolving}
        backgroundMode={visual.backgroundMode}
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
