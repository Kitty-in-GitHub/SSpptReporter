import type { ReactNode } from 'react';

interface AppToolbarProps {
  onToggleSettings?: () => void;
  settingsAriaLabel?: string;
  title?: string;
  children?: ReactNode;
}

export function AppToolbar({
  onToggleSettings,
  settingsAriaLabel = '设置',
  title,
  children,
}: AppToolbarProps) {
  return (
    <header className="present-toolbar app-toolbar">
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
