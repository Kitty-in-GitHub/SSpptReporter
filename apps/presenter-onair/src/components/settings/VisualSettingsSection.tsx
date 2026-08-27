import { useRef, useState } from 'react';
import {
  BUILTIN_VRM_MODELS,
  formatVrmModelLabel,
} from '../../lib/vrm/vrmModelCatalog';
import type { SettingsHook } from './SettingsSectionShell';
import { SettingsSectionShell } from './SettingsSectionShell';

export interface VisualSettingsSectionProps
  extends Pick<
    SettingsHook,
    | 'settings'
    | 'importedVrmModels'
    | 'updateVisualBackgroundMode'
    | 'updateVisualVrmModel'
    | 'importVrmModelFile'
    | 'removeImportedVrmModel'
    | 'updateVisualLayoutMode'
    | 'updateVisualVrmCameraFraming'
    | 'resetVisualVrmCameraFraming'
    | 'updateVisualShowInputInBroadcast'
  > {
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  backgroundImageUrl: string | null;
  vrmResolveError?: string | null;
  onBackgroundImageChange: (file: File | null) => void;
}

export function VisualSettingsSection({
  disabled,
  isExpanded,
  onToggleExpand,
  settings,
  importedVrmModels,
  updateVisualBackgroundMode,
  updateVisualVrmModel,
  importVrmModelFile,
  removeImportedVrmModel,
  updateVisualLayoutMode,
  updateVisualVrmCameraFraming,
  resetVisualVrmCameraFraming,
  updateVisualShowInputInBroadcast,
  backgroundImageUrl,
  vrmResolveError = null,
  onBackgroundImageChange,
}: VisualSettingsSectionProps) {
  const vrmFileInputRef = useRef<HTMLInputElement>(null);
  const [vrmImportError, setVrmImportError] = useState('');

  const selectedVrmKey = `${settings.visual.vrmModelSource}:${settings.visual.vrmModelId}`;
  const activeImportedVrm = importedVrmModels.find(
    (entry) => entry.id === settings.visual.vrmModelId,
  );
  const currentVrmLabel = formatVrmModelLabel(
    settings.visual.vrmModelSource,
    settings.visual.vrmModelId,
    activeImportedVrm?.name,
  );

  const handleVrmModelSelect = (value: string) => {
    const colonIndex = value.indexOf(':');
    if (colonIndex <= 0) return;
    const source = value.slice(0, colonIndex);
    const modelId = value.slice(colonIndex + 1);
    if (source !== 'builtin' && source !== 'imported') return;
    updateVisualVrmModel(source, modelId);
  };

  const handleVrmImport = async (file: File | null) => {
    if (!file) return;
    setVrmImportError('');
    try {
      await importVrmModelFile(file);
    } catch (error) {
      setVrmImportError(
        error instanceof Error ? error.message : 'VRM 导入失败。',
      );
    }
    if (vrmFileInputRef.current) {
      vrmFileInputRef.current.value = '';
    }
  };

  const handleRemoveImportedVrm = async (modelId: string) => {
    setVrmImportError('');
    try {
      await removeImportedVrmModel(modelId);
    } catch (error) {
      setVrmImportError(
        error instanceof Error ? error.message : '无法删除导入的 VRM。',
      );
    }
  };

  return (
    <SettingsSectionShell
      title="画面"
      disabled={disabled}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <>
<div className="settings-field">
              <label htmlFor="visual-background-mode">背景模式</label>
              <select
                id="visual-background-mode"
                value={settings.visual.backgroundMode}
                onChange={(e) =>
                  updateVisualBackgroundMode(
                    e.target.value as 'default' | 'green' | 'transparent',
                  )
                }
                disabled={disabled}
              >
                <option value="default">默认背景</option>
                <option value="transparent">透明（仅皮套）</option>
                <option value="green">绿幕</option>
              </select>
            </div>

            <div className="settings-field">
              <label>镜头构图</label>
              <label className="settings-range-field" htmlFor="visual-vrm-framing-pan-x">
                左右（{Math.round(settings.visual.vrmCameraFraming.panX * 100)}）
              </label>
              <input
                id="visual-vrm-framing-pan-x"
                type="range"
                min={-100}
                max={100}
                step={5}
                value={Math.round(settings.visual.vrmCameraFraming.panX * 100)}
                onChange={(e) =>
                  updateVisualVrmCameraFraming({
                    panX: Number(e.target.value) / 100,
                  })
                }
                disabled={disabled}
              />
              <label className="settings-range-field" htmlFor="visual-vrm-framing-pan-y">
                上下（{Math.round(settings.visual.vrmCameraFraming.panY * 100)}）
              </label>
              <input
                id="visual-vrm-framing-pan-y"
                type="range"
                min={-100}
                max={100}
                step={5}
                value={Math.round(settings.visual.vrmCameraFraming.panY * 100)}
                onChange={(e) =>
                  updateVisualVrmCameraFraming({
                    panY: Number(e.target.value) / 100,
                  })
                }
                disabled={disabled}
              />
              <label className="settings-range-field" htmlFor="visual-vrm-framing-zoom">
                远近（{Math.round(settings.visual.vrmCameraFraming.zoom * 100)}%）
              </label>
              <input
                id="visual-vrm-framing-zoom"
                type="range"
                min={50}
                max={200}
                step={5}
                value={Math.round(settings.visual.vrmCameraFraming.zoom * 100)}
                onChange={(e) =>
                  updateVisualVrmCameraFraming({
                    zoom: Number(e.target.value) / 100,
                  })
                }
                disabled={disabled}
              />
              <div className="settings-file-actions">
                <button
                  type="button"
                  className="settings-clear-button"
                  onClick={resetVisualVrmCameraFraming}
                  disabled={disabled}
                >
                  恢复默认构图
                </button>
              </div>
              <p className="settings-field-hint">
                皮套上：左键旋转、滚轮缩放、右键拖动平移；松手后自动保存。双击恢复为上方滑块设定。锚点里的「特效大小」不是镜头。
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="visual-layout-mode">显示模式</label>
              <select
                id="visual-layout-mode"
                value={settings.visual.layoutMode}
                onChange={(e) =>
                  updateVisualLayoutMode(e.target.value as 'chat' | 'broadcast')
                }
                disabled={disabled}
              >
                <option value="chat">常规聊天</option>
                <option value="broadcast">单人直播</option>
              </select>
            </div>

            <label className="settings-checkbox-field">
              <input
                type="checkbox"
                checked={settings.visual.showInputInBroadcast}
                onChange={(e) =>
                  updateVisualShowInputInBroadcast(e.target.checked)
                }
                disabled={
                  disabled || settings.visual.layoutMode !== 'broadcast'
                }
              />
              <span>单人直播时显示输入框</span>
            </label>

            <div className="settings-field">
              <label htmlFor="background-image">背景画像</label>
              <div className="settings-file-picker-row">
                <input
                  id="background-image"
                  className="settings-file-input-hidden"
                  type="file"
                  accept="image/*"
                  disabled={disabled}
                  onChange={(e) => {
                    onBackgroundImageChange(e.target.files?.[0] ?? null);
                    e.currentTarget.value = '';
                  }}
                />
                <label
                  htmlFor="background-image"
                  className={`settings-file-trigger${disabled ? ' is-disabled' : ''}`}
                >
                  选择图片
                </label>
                <span className="settings-file-hint">PNG / JPG</span>
              </div>
              <div className="settings-file-actions">
                <span className="settings-file-status">
                  {backgroundImageUrl ? '已设置' : '未设置'}
                </span>
                {backgroundImageUrl && (
                  <button
                    type="button"
                    className="settings-clear-button"
                    onClick={() => onBackgroundImageChange(null)}
                    disabled={disabled}
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
            <div className="settings-field">
              <label htmlFor="vrm-model-select">虚拟角色（VRM）</label>
              <select
                id="vrm-model-select"
                value={selectedVrmKey}
                onChange={(event) => handleVrmModelSelect(event.target.value)}
                disabled={disabled}
              >
                <optgroup label="内置（public/avatar/）">
                  {BUILTIN_VRM_MODELS.map((model) => (
                    <option
                      key={`builtin:${model.id}`}
                      value={`builtin:${model.id}`}
                    >
                      {model.label}
                    </option>
                  ))}
                </optgroup>
                {importedVrmModels.length > 0 ? (
                  <optgroup label="已导入（本机 IndexedDB）">
                    {importedVrmModels.map((model) => (
                      <option
                        key={`imported:${model.id}`}
                        value={`imported:${model.id}`}
                      >
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
              <div className="settings-file-picker-row">
                <input
                  ref={vrmFileInputRef}
                  id="vrm-model-import"
                  type="file"
                  accept=".vrm"
                  className="settings-file-input-hidden"
                  disabled={disabled}
                  onChange={(event) =>
                    void handleVrmImport(event.target.files?.[0] ?? null)
                  }
                />
                <label
                  htmlFor="vrm-model-import"
                  className={`settings-file-trigger${disabled ? ' is-disabled' : ''}`}
                >
                  导入 VRM
                </label>
                <span className="settings-file-hint">.vrm 文件</span>
              </div>
              {importedVrmModels.length > 0 ? (
                <div className="settings-emotion-mapping-list">
                  {importedVrmModels.map((model) => (
                    <div
                      key={model.id}
                      className="settings-file-actions"
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span className="settings-file-status">{model.name}</span>
                      <button
                        type="button"
                        className="settings-clear-button"
                        onClick={() => void handleRemoveImportedVrm(model.id)}
                        disabled={disabled}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="settings-file-actions">
                <span className="settings-file-status">
                  当前：{currentVrmLabel}
                </span>
              </div>
              {vrmImportError ? (
                <p className="settings-field-hint">{vrmImportError}</p>
              ) : vrmResolveError ? (
                <p className="settings-field-hint">{vrmResolveError}</p>
              ) : (
                <p className="settings-field-hint">
                  内置模型需放在 apps/presenter-onair/public/avatar/；导入模型仅存本机浏览器，换机需重新导入。
                </p>
              )}
            </div>
      </>
    </SettingsSectionShell>
  );
}
