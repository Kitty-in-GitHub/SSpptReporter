import { useEffect, useState } from 'react';
import { UI_SESSION_MODES, UI_SESSION_DRAWER } from '../constants/uiZh';
import type { SessionMode } from '../types/present';

const SESSION_MODE_TABS: ReadonlyArray<{ mode: SessionMode; label: string }> = [
  { mode: 'chat', label: UI_SESSION_MODES.chat },
  { mode: 'present', label: UI_SESSION_MODES.present },
  { mode: 'edit', label: UI_SESSION_MODES.edit },
  { mode: 'mocap', label: UI_SESSION_MODES.mocap },
];

interface SessionDrawerProps {
  sessionMode: SessionMode;
  onSessionModeChange: (mode: SessionMode) => void;
  /** 演讲模式等全屏场景下隐藏入口 */
  hidden?: boolean;
}

export function SessionDrawer({
  sessionMode,
  onSessionModeChange,
  hidden = false,
}: SessionDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hidden) {
      setOpen(false);
    }
  }, [hidden]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (hidden) {
    return null;
  }

  const selectMode = (mode: SessionMode) => {
    setOpen(false);
    if (mode !== sessionMode) {
      onSessionModeChange(mode);
    }
  };

  return (
    <>
      <button
        type="button"
        className="session-drawer-toggle"
        aria-label={UI_SESSION_DRAWER.toggleLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        ☰
      </button>

      {open ? (
        <>
          <div
            className="session-drawer-backdrop"
            onClick={() => setOpen(false)}
          />
          <nav className="session-drawer" aria-label={UI_SESSION_DRAWER.title}>
            <div className="session-drawer-title">
              {UI_SESSION_DRAWER.title}
            </div>
            {SESSION_MODE_TABS.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                className={`session-drawer-tab${
                  mode === sessionMode ? ' is-active' : ''
                }`}
                aria-current={mode === sessionMode}
                onClick={() => selectMode(mode)}
              >
                {label}
              </button>
            ))}
          </nav>
        </>
      ) : null}
    </>
  );
}
