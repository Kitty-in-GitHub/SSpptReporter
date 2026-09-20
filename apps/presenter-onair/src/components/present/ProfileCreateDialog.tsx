import { useEffect, useMemo, useState } from 'react';
import {
  cloneProfileTemplate,
  isBuiltInProfile,
  listSelectableProfiles,
  sanitizeProfileId,
  type PerformanceCatalog,
  type PerformanceProfile,
} from '@ssreporter/director';
import { EDGE_VOICE_OPTIONS } from '../../constants/performanceUi';
import {
  buildProfileVoicePatch,
  resolveProfileDisplayName,
} from '../../hooks/usePerformanceCatalog';

interface ProfileCreateDialogProps {
  catalog: PerformanceCatalog;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (profileId: string, profile: PerformanceProfile) => Promise<void>;
}

function templateVoiceField(
  template: PerformanceProfile,
  key: 'speaker' | 'pitch' | 'volume' | 'style_hint',
): string {
  const value = template.voice?.[key];
  return value != null && value !== '' ? String(value) : '';
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
  const [speaker, setSpeaker] = useState('');
  const [speed, setSpeed] = useState('1');
  const [pitch, setPitch] = useState('');
  const [volume, setVolume] = useState('');
  const [styleHint, setStyleHint] = useState('');
  const [pauseAfter, setPauseAfter] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  const baseOptions = useMemo(() => listSelectableProfiles(catalog), [catalog]);
  const template = useMemo(
    () => cloneProfileTemplate(baseProfile, catalog),
    [baseProfile, catalog],
  );

  // 切换「复制自」时，参数回到该预设的默认值
  useEffect(() => {
    setSpeaker(templateVoiceField(template, 'speaker'));
    setSpeed(String(template.voice?.speed ?? 1));
    setPitch(templateVoiceField(template, 'pitch'));
    setVolume(templateVoiceField(template, 'volume'));
    setStyleHint(templateVoiceField(template, 'style_hint'));
    setPauseAfter(String(template.timing?.pause_after_ms ?? 0));
  }, [template]);

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

    const parsedSpeed = Number.parseFloat(speed);
    const parsedPauseAfter = Number.parseInt(pauseAfter, 10);
    if (Number.isNaN(parsedSpeed) || parsedSpeed < 0.25 || parsedSpeed > 4) {
      setFormError('语速需在 0.25–4 之间');
      return;
    }
    if (
      Number.isNaN(parsedPauseAfter) ||
      parsedPauseAfter < 0 ||
      parsedPauseAfter > 5000
    ) {
      setFormError('播后停顿需在 0–5000 ms');
      return;
    }
    if (pitch.trim().length > 32) {
      setFormError('音高描述过长（最多 32 字符）');
      return;
    }
    if (volume.trim().length > 32) {
      setFormError('音量描述过长（最多 32 字符）');
      return;
    }
    if (styleHint.trim().length > 500) {
      setFormError('语气提示过长（最多 500 字符）');
      return;
    }

    const profile: PerformanceProfile = {
      ...template,
      label: label.trim(),
      hint: hint.trim() || undefined,
      voice: buildProfileVoicePatch(
        parsedSpeed,
        speaker,
        pitch,
        volume,
        styleHint,
        true,
      ),
      timing: { ...template.timing, pause_after_ms: parsedPauseAfter },
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

        <label className="profile-create-field">
          默认音色
          <select value={speaker} onChange={(event) => setSpeaker(event.target.value)}>
            <option value="">跟随模板</option>
            {EDGE_VOICE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}（{option.hint}）
              </option>
            ))}
          </select>
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
          音高 pitch（可选）
          <input
            type="text"
            value={pitch}
            placeholder="-2Hz / +2Hz"
            maxLength={32}
            onChange={(event) => setPitch(event.target.value)}
          />
        </label>

        <label className="profile-create-field">
          音量 volume（可选）
          <input
            type="text"
            value={volume}
            placeholder="-5% / +10%"
            maxLength={32}
            onChange={(event) => setVolume(event.target.value)}
          />
        </label>

        <label className="profile-create-field">
          语气 style_hint（可选）
          <input
            type="text"
            value={styleHint}
            placeholder="Gemini TTS 语气；Edge 会忽略"
            maxLength={500}
            onChange={(event) => setStyleHint(event.target.value)}
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
