import type { ManneriSettings } from '../../types/settings';
import {
  MANNERI_COOLDOWN_OPTIONS,
  MANNERI_LOOKBACK_WINDOW_OPTIONS,
  MANNERI_MIN_MESSAGE_LENGTH_OPTIONS,
  MANNERI_SIMILARITY_THRESHOLD_OPTIONS,
} from './streamSettingsConstants';

export interface ManneriSettingsSectionProps {
  manneri: ManneriSettings;
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  updateManneriEnabled: (value: boolean) => void;
  updateManneriSimilarityThreshold: (value: number) => void;
  updateManneriLookbackWindow: (value: number) => void;
  updateManneriInterventionCooldownMs: (value: number) => void;
  updateManneriMinMessageLength: (value: number) => void;
}

export function ManneriSettingsSection({
  manneri,
  disabled,
  isExpanded,
  onToggleExpand,
  updateManneriEnabled,
  updateManneriSimilarityThreshold,
  updateManneriLookbackWindow,
  updateManneriInterventionCooldownMs,
  updateManneriMinMessageLength,
}: ManneriSettingsSectionProps) {
  const manneriControlsDisabled = disabled || !manneri.enabled;

  return (
    <div className="settings-section">
      <button
        type="button"
        className="settings-section-toggle"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <h3>话题多样性</h3>
        <span
          className={`settings-section-chevron${isExpanded ? ' is-open' : ''}`}
        >
          ⌄
        </span>
      </button>

      {isExpanded && (
        <>
          <div className="settings-field">
            <label htmlFor="manneri-enabled">
              <input
                id="manneri-enabled"
                type="checkbox"
                checked={manneri.enabled}
                onChange={(event) => updateManneriEnabled(event.target.checked)}
                disabled={disabled}
                style={{ marginRight: 8 }}
              />
              Manneri
            </label>
            <p className="settings-field-hint">
              当对话过于重复时，在回复前内部加入换话题指令。
            </p>
          </div>

          <div className="settings-field">
            <label htmlFor="manneri-similarity-threshold">相似度阈值</label>
            <select
              id="manneri-similarity-threshold"
              value={manneri.similarityThreshold}
              onChange={(event) =>
                updateManneriSimilarityThreshold(Number(event.target.value))
              }
              disabled={manneriControlsDisabled}
            >
              {MANNERI_SIMILARITY_THRESHOLD_OPTIONS.map((threshold) => (
                <option key={threshold} value={threshold}>
                  {Math.round(threshold * 100)}%
                </option>
              ))}
            </select>
            <p className="settings-field-hint">
              数值越低越容易介入，越高则只检测明显重复。
            </p>
          </div>

          <div className="settings-field">
            <label htmlFor="manneri-lookback-window">最近消息条数</label>
            <select
              id="manneri-lookback-window"
              value={manneri.lookbackWindow}
              onChange={(event) =>
                updateManneriLookbackWindow(Number(event.target.value))
              }
              disabled={manneriControlsDisabled}
            >
              {MANNERI_LOOKBACK_WINDOW_OPTIONS.map((lookbackWindow) => (
                <option key={lookbackWindow} value={lookbackWindow}>
                  {lookbackWindow}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <label htmlFor="manneri-cooldown">介入間隔</label>
            <select
              id="manneri-cooldown"
              value={manneri.interventionCooldownMs}
              onChange={(event) =>
                updateManneriInterventionCooldownMs(Number(event.target.value))
              }
              disabled={manneriControlsDisabled}
            >
              {MANNERI_COOLDOWN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <label htmlFor="manneri-min-message-length">最短消息长度</label>
            <select
              id="manneri-min-message-length"
              value={manneri.minMessageLength}
              onChange={(event) =>
                updateManneriMinMessageLength(Number(event.target.value))
              }
              disabled={manneriControlsDisabled}
            >
              {MANNERI_MIN_MESSAGE_LENGTH_OPTIONS.map((minMessageLength) => (
                <option key={minMessageLength} value={minMessageLength}>
                  {minMessageLength}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
