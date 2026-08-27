import type { ReactNode } from 'react';
import { UI_SESSION_MODES } from '../../constants/uiZh';
import type { SessionMode } from '../../types/present';

interface SessionModeToolbarProps {
  sessionMode: SessionMode;
  onSessionModeChange: (mode: SessionMode) => void;
  onToggleSettings?: () => void;
  settingsAriaLabel?: string;
  title?: string;
  children?: ReactNode;
}

export function SessionModeToolbar({
  sessionMode,
  onSessionModeChange,
  onToggleSettings,
  settingsAriaLabel = '设置',
  title,
  children,
}: SessionModeToolbarProps) {
  return (
    <header className="present-toolbar session-mode-toolbar">
      <div className="present-toolbar-group">
        <button
          type="button"
          className={sessionMode === 'chat' ? 'is-active' : undefined}
          disabled={sessionMode === 'chat'}
          onClick={() => onSessionModeChange('chat')}
        >
          聊天
        </button>
        <button
          type="button"
          className={sessionMode === 'present' ? 'is-active' : undefined}
          disabled={sessionMode === 'present'}
          onClick={() => onSessionModeChange('present')}
        >
          汇报
        </button>
        <button
          type="button"
          className={sessionMode === 'edit' ? 'is-active' : undefined}
          disabled={sessionMode === 'edit'}
          onClick={() => onSessionModeChange('edit')}
        >
          {UI_SESSION_MODES.edit}
        </button>
        <button
          type="button"
          className={sessionMode === 'mocap' ? 'is-active' : undefined}
          disabled={sessionMode === 'mocap'}
          onClick={() => onSessionModeChange('mocap')}
        >
          {UI_SESSION_MODES.mocap}
        </button>
      </div>
      {children}
      {title ? <div className="present-toolbar-title">{title}</div> : null}
      {onToggleSettings ? (
        <button
          type="button"
          className="present-settings-button"
          onClick={onToggleSettings}
          aria-label={settingsAriaLabel}
        >
          ⚙
        </button>
      ) : null}
    </header>
  );
}
