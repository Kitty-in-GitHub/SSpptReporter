import type { QaAsrEngine } from '../../types/present';
import { QA_ASR_ENGINE_LABELS } from '../../types/present';
import type { SettingsHook } from './SettingsSectionShell';
import { SettingsSectionShell } from './SettingsSectionShell';

export interface PresentQaSettingsSectionProps extends Pick<SettingsHook, 'settings' | 'updatePresentQaAsrEngine'> {
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function PresentQaSettingsSection({
  disabled,
  isExpanded,
  onToggleExpand,
  settings,
  updatePresentQaAsrEngine
}: PresentQaSettingsSectionProps) {
  
  return (
    <SettingsSectionShell
      title="汇报 Q&A"
      disabled={disabled}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <>
<div className="settings-field">
              <label htmlFor="qa-asr-engine">语音输入（ASR）</label>
              <select
                id="qa-asr-engine"
                value={settings.present.qaAsrEngine}
                onChange={(e) =>
                  updatePresentQaAsrEngine(e.target.value as QaAsrEngine)
                }
                disabled={disabled}
              >
                {(Object.keys(QA_ASR_ENGINE_LABELS) as QaAsrEngine[]).map(
                  (engine) => (
                    <option key={engine} value={engine}>
                      {QA_ASR_ENGINE_LABELS[engine]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <p className="settings-hint">
              浏览器 Web Speech 免安装；浏览器内 Whisper
              首次需联网下载模型（之后可离线）；本机网关 Whisper 需{' '}
              <code>npm run setup:asr</code> 后重启{' '}
              <code>npm run dev</code>；云端 Whisper 使用上方 OpenAI API Key。
            </p>
      </>
    </SettingsSectionShell>
  );
}
