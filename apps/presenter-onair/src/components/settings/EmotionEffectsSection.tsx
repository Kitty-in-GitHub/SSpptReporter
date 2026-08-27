import type { VrmEmotionEffect, VrmReactionControlMode } from '../../lib/vrmReactions';
import type { SettingsHook } from './SettingsSectionShell';
import { SettingsSectionShell } from './SettingsSectionShell';
import { VRM_EFFECT_OPTIONS, VRM_REACTION_EMOTION_OPTIONS } from './settingsConstants';

export interface EmotionEffectsSectionProps extends Pick<
  SettingsHook,
  | 'settings'
  | 'updateVisualVrmReactionControlMode'
  | 'updateVisualVrmEmotionEffect'
  | 'resetVisualVrmEmotionEffectMap'
> {
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function EmotionEffectsSection({
  disabled,
  isExpanded,
  onToggleExpand,
  settings,
  updateVisualVrmReactionControlMode,
  updateVisualVrmEmotionEffect,
  resetVisualVrmEmotionEffectMap
}: EmotionEffectsSectionProps) {
  
  return (
    <SettingsSectionShell
      title="表情特效"
      disabled={disabled}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <>
<div className="settings-field">
              <label htmlFor="vrm-reaction-control-mode">操作方法</label>
              <select
                id="vrm-reaction-control-mode"
                value={settings.visual.vrmReactionControlMode}
                onChange={(event) =>
                  updateVisualVrmReactionControlMode(
                    event.target.value as VrmReactionControlMode,
                  )
                }
                disabled={disabled}
              >
                <option value="none">无</option>
                <option value="manual">手动按钮</option>
                <option value="linked">仅随语音情感联动</option>
              </select>
              <p className="settings-field-hint">
                {settings.visual.vrmReactionControlMode === 'none'
                  ? '不显示手动按钮，播报时也不显示特效。'
                  : settings.visual.vrmReactionControlMode === 'manual'
                    ? '通过角色上的按钮预览视觉特效。'
                    : '收到语音 emotion 标签时显示视觉特效。'}
              </p>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">
                情感与特效映射
              </span>
              <div className="settings-emotion-mapping-list">
                {VRM_REACTION_EMOTION_OPTIONS.map((emotionOption) => (
                  <label
                    key={emotionOption.value}
                    className="settings-emotion-mapping-row"
                    htmlFor={`vrm-effect-${emotionOption.value}`}
                  >
                    <span>{emotionOption.label}</span>
                    <select
                      id={`vrm-effect-${emotionOption.value}`}
                      value={
                        settings.visual.vrmEmotionEffectMap[
                          emotionOption.value
                        ] || 'none'
                      }
                      onChange={(event) => {
                        const effect = event.target.value;
                        updateVisualVrmEmotionEffect(
                          emotionOption.value,
                          effect === 'none'
                            ? null
                            : (effect as VrmEmotionEffect),
                        );
                      }}
                      disabled={disabled}
                    >
                      {VRM_EFFECT_OPTIONS.map((effectOption) => (
                        <option
                          key={effectOption.value}
                          value={effectOption.value}
                        >
                          {effectOption.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="settings-clear-button settings-inline-button"
                onClick={resetVisualVrmEmotionEffectMap}
                disabled={disabled}
              >
                恢复情感映射默认值
              </button>
            </div>
      </>
    </SettingsSectionShell>
  );
}
