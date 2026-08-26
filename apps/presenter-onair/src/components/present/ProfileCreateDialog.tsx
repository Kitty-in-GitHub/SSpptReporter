import { useMemo, useState } from 'react';
import {
  cloneProfileTemplate,
  isBuiltInProfile,
  listSelectableProfiles,
  sanitizeProfileId,
  type PerformanceCatalog,
  type PerformanceProfile,
} from '@ssreporter/director';
import {
  resolveProfileDisplayName,
} from '../../hooks/usePerformanceCatalog';

interface ProfileCreateDialogProps {
  catalog: PerformanceCatalog;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (profileId: string, profile: PerformanceProfile) => Promise<void>;
}

export function ProfileCreateDialog({
  catalog,
  isSaving,
  onClose,
  onCreate,
}: ProfileCreateDialogProps) {
  const [profileId, setProfileId] = useState('');
  const [label, setLabel] = useState('');
  const [hint, setHint] = useState('');
  const [baseProfile, setBaseProfile] = useState<string>('confident');
  const [formError, setFormError] = useState<string | null>(null);

  const baseOptions = useMemo(() => listSelectableProfiles(catalog), [catalog]);

  const handleSubmit = async () => {
    setFormError(null);
    const normalizedId = sanitizeProfileId(profileId);
    if (!normalizedId) {
      setFormError('标识需为小写英文/数字/下划线，且以字母开头（如 opening_warm）');
      return;
    }
    if (isBuiltInProfile(normalizedId)) {
      setFormError('不能与内置预设同名，请换一个标识');
      return;
    }
    if (catalog.profiles[normalizedId]) {
      setFormError('该标识已存在');
      return;
    }
    if (!label.trim()) {
      setFormError('请填写显示名称');
      return;
    }

    const template = cloneProfileTemplate(baseProfile, catalog);
    const profile: PerformanceProfile = {
      ...template,
      label: label.trim(),
      hint: hint.trim() || undefined,
    };

    try {
      await onCreate(normalizedId, profile);
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '创建失败');
    }
  };

  return (
    <div className="profile-create-backdrop" role="presentation" onClick={onClose}>
      <div
        className="profile-create-dialog"
        role="dialog"
        aria-labelledby="profile-create-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="profile-create-header">
          <h3 id="profile-create-title">新建表演预设</h3>
          <button type="button" className="profile-create-close" onClick={onClose}>
            ×
          </button>
        </header>

        <p className="profile-create-lead">
          预设写入本场次 <code>performance.json</code>，可在任意页节拍中复用。
        </p>

        <label className="profile-create-field">
          显示名称
          <input
            type="text"
            value={label}
            placeholder="例：开场温暖"
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>

        <label className="profile-create-field">
          标识（英文，写入讲稿）
          <input
            type="text"
            value={profileId}
            placeholder="例：opening_warm"
            onChange={(event) => setProfileId(event.target.value)}
          />
        </label>

        <label className="profile-create-field">
          说明（可选）
          <input
            type="text"
            value={hint}
            placeholder="例：慢速问候、鞠躬"
            onChange={(event) => setHint(event.target.value)}
          />
        </label>

        <label className="profile-create-field">
          复制自
          <select
            value={baseProfile}
            onChange={(event) => setBaseProfile(event.target.value)}
          >
            {baseOptions.map((option) => (
              <option key={option} value={option}>
                {resolveProfileDisplayName(option, catalog)}
              </option>
            ))}
          </select>
        </label>

        {formError ? <p className="profile-create-error">{formError}</p> : null}

        <div className="profile-create-actions">
          <button type="button" className="profile-create-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="profile-create-primary"
            disabled={isSaving}
            onClick={() => void handleSubmit()}
          >
            {isSaving ? '保存中…' : '创建并选用'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function isEmotionProfile(profileId: string): profileId is import('@ssreporter/director').Emotion {
  return isBuiltInProfile(profileId);
}
