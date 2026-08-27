import type { useSettings } from '../../hooks/useSettings';

export type SettingsHook = ReturnType<typeof useSettings>;

export interface SettingsSectionShellProps {
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  title: string;
  children: React.ReactNode;
}

export function SettingsSectionShell({
  isExpanded,
  onToggleExpand,
  title,
  children,
}: SettingsSectionShellProps) {
  return (
    <div className="settings-section">
      <button
        type="button"
        className="settings-section-toggle"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <h3>{title}</h3>
        <span
          className={`settings-section-chevron${isExpanded ? ' is-open' : ''}`}
        >
          ⌄
        </span>
      </button>
      {isExpanded ? children : null}
    </div>
  );
}
