import { useEffect, useState } from 'react';
import {
  isBuiltInProfile,
  type PerformanceCatalog,
  type PerformanceProfile,
} from '@ssreporter/director';
import { resolveProfileDisplayName } from '../../hooks/usePerformanceCatalog';

interface ProfileEditDialogProps {
  catalog: PerformanceCatalog;
  profileId: string;
  overlayProfile: PerformanceProfile | undefined;
  isSaving: boolean;
  onClose: () => void;
  onSave: (profileId: string, profile: PerformanceProfile) => Promise<void>;
}

export function ProfileEditDialog({
  catalog,
  profileId,
  overlayProfile,
  isSaving,
  onClose,
  onSave,
}: ProfileEditDialogProps) {
  const merged = catalog.profiles[profileId];
  const [label, setLabel] = useState(
    overlayProfile?.label ?? merged?.label ?? resolveProfileDisplayName(profileId, catalog),
  );
  const [hint, setHint] = useState(overlayProfile?.hint ?? merged?.hint ?? '');
  const [speed, setSpeed] = useState(
    String(overlayProfile?.voice?.speed ?? merged?.voice?.speed ?? 1),
  );
  const [pauseAfter, setPauseAfter] = useState(
    String(
      overlayProfile?.timing?.pause_after_ms ?? merged?.timing?.pause_after_ms ?? 0,
    ),
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setLabel(
      overlayProfile?.label ?? merged?.label ?? resolveProfileDisplayName(profileId, catalog),
    );
    setHint(overlayProfile?.hint ?? merged?.hint ?? '');
    setSpeed(String(overlayProfile?.voice?.speed ?? merged?.voice?.speed ?? 1));
    setPauseAfter(
      String(
        overlayProfile?.timing?.pause_after_ms ?? merged?.timing?.pause_after_ms ?? 0,
      ),
    );
  }, [catalog, merged?.hint, merged?.label, merged?.timing?.pause_after_ms, merged?.voice?.speed, overlayProfile, profileId]);

  const handleSubmit = async () => {
    setFormError(null);
    const parsedSpeed = Number.parseFloat(speed);
    const parsedPauseAfter = Number.parseInt(pauseAfter, 10);
    if (Number.isNaN(parsedSpeed) || parsedSpeed < 0.25 || parsedSpeed > 4) {
      setFormError('语速需在 0.25–4 之间');
      return;
    }
    if (Number.isNaN(parsedPauseAfter) || parsedPauseAfter < 0 || parsedPauseAfter > 5000) {
      setFormError('播后停顿需在 0–5000 ms');
      return;
    }

    const nextProfile: PerformanceProfile = {
      ...overlayProfile,
      ...(!isBuiltInProfile(profileId)
        ? {
            vrm: overlayProfile?.vrm ?? merged?.vrm,
            voice: {
              ...(overlayProfile?.voice ?? merged?.voice),
              speed: parsedSpeed,
            },
            timing: {
              ...(overlayProfile?.timing ?? merged?.timing),
              pause_after_ms: parsedPauseAfter,
            },
          }
        : {
            voice: { speed: parsedSpeed },
            timing: { pause_after_ms: parsedPauseAfter },
          }),
      label: isBuiltInProfile(profileId) ? undefined : label.trim() || undefined,
      hint: hint.trim() || undefined,
    };

    try {
      await onSave(profileId, nextProfile);
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败');
    }
  };

  return (
    <div className="profile-create-backdrop" role="presentation" onClick={onClose}>
      <div
        className="profile-create-dialog"
        role="dialog"
        aria-labelledby="profile-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="profile-create-header">
          <h3 id="profile-edit-title">
            编辑预设 · {resolveProfileDisplayName(profileId, catalog)}
          </h3>
          <button type="button" className="profile-create-close" onClick={onClose}>
            ×
          </button>
        </header>

        <p className="profile-create-lead">
          {isBuiltInProfile(profileId)
            ? '保存为本场次覆盖项（写入 performance.json），不影响全局默认。'
            : '修改自定义预设；VRM/音色基底保持不变，此处主要改显示名与语速/停顿。'}
        </p>

        {!isBuiltInProfile(profileId) ? (
          <label className="profile-create-field">
            显示名称
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
        ) : null}

        <label className="profile-create-field">
          说明（可选）
          <input
            type="text"
            value={hint}
            onChange={(event) => setHint(event.target.value)}
          />
        </label>

        <label className="profile-create-field">
          默认语速
          <input
            type="number"
            min={0.25}
            max={4}
            step={0.05}
            value={speed}
            onChange={(event) => setSpeed(event.target.value)}
          />
        </label>

        <label className="profile-create-field">
          播后停顿 (ms)
          <input
            type="number"
            min={0}
            max={5000}
            step={50}
            value={pauseAfter}
            onChange={(event) => setPauseAfter(event.target.value)}
          />
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
            {isSaving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
