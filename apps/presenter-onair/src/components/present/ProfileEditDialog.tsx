import { useEffect, useState } from 'react';
import {
  isBuiltInProfile,
  type PerformanceCatalog,
  type PerformanceProfile,
} from '@ssreporter/director';
import { EDGE_VOICE_OPTIONS } from '../../constants/performanceUi';
import { resolveProfileDisplayName } from '../../hooks/usePerformanceCatalog';

interface ProfileEditDialogProps {
  catalog: PerformanceCatalog;
  profileId: string;
  overlayProfile: PerformanceProfile | undefined;
  isSaving: boolean;
  onClose: () => void;
  onSave: (profileId: string, profile: PerformanceProfile) => Promise<void>;
}

function mergedVoiceField(
  overlayProfile: PerformanceProfile | undefined,
  merged: PerformanceProfile | undefined,
  key: 'speaker' | 'pitch' | 'volume' | 'style_hint',
): string {
  const overlay = overlayProfile?.voice?.[key];
  if (overlay != null && overlay !== '') {
    return String(overlay);
  }
  const base = merged?.voice?.[key];
  return base != null ? String(base) : '';
}

function buildVoicePatch(
  speed: number,
  speaker: string,
  pitch: string,
  volume: string,
  styleHint: string,
  includeSpeaker: boolean,
): PerformanceProfile['voice'] {
  const voice: NonNullable<PerformanceProfile['voice']> = { speed };
  if (includeSpeaker && speaker.trim()) {
    voice.speaker = speaker.trim();
  }
  if (pitch.trim()) {
    voice.pitch = pitch.trim();
  }
  if (volume.trim()) {
    voice.volume = volume.trim();
  }
  if (styleHint.trim()) {
    voice.style_hint = styleHint.trim();
  }
  return voice;
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
  const isBuiltIn = isBuiltInProfile(profileId);

  const [label, setLabel] = useState(
    overlayProfile?.label ?? merged?.label ?? resolveProfileDisplayName(profileId, catalog),
  );
  const [hint, setHint] = useState(overlayProfile?.hint ?? merged?.hint ?? '');
  const [speaker, setSpeaker] = useState(
    mergedVoiceField(overlayProfile, merged, 'speaker'),
  );
  const [speed, setSpeed] = useState(
    String(overlayProfile?.voice?.speed ?? merged?.voice?.speed ?? 1),
  );
  const [pitch, setPitch] = useState(mergedVoiceField(overlayProfile, merged, 'pitch'));
  const [volume, setVolume] = useState(
    mergedVoiceField(overlayProfile, merged, 'volume'),
  );
  const [styleHint, setStyleHint] = useState(
    mergedVoiceField(overlayProfile, merged, 'style_hint'),
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
    setSpeaker(mergedVoiceField(overlayProfile, merged, 'speaker'));
    setSpeed(String(overlayProfile?.voice?.speed ?? merged?.voice?.speed ?? 1));
    setPitch(mergedVoiceField(overlayProfile, merged, 'pitch'));
    setVolume(mergedVoiceField(overlayProfile, merged, 'volume'));
    setStyleHint(mergedVoiceField(overlayProfile, merged, 'style_hint'));
    setPauseAfter(
      String(
        overlayProfile?.timing?.pause_after_ms ?? merged?.timing?.pause_after_ms ?? 0,
      ),
    );
  }, [catalog, merged, overlayProfile, profileId]);

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

    const voicePatch = buildVoicePatch(
      parsedSpeed,
      speaker,
      pitch,
      volume,
      styleHint,
      !isBuiltIn,
    );

    const nextProfile: PerformanceProfile = {
      ...overlayProfile,
      ...(!isBuiltIn
        ? {
            vrm: overlayProfile?.vrm ?? merged?.vrm,
            voice: {
              ...(overlayProfile?.voice ?? merged?.voice),
              ...voicePatch,
            },
            timing: {
              ...(overlayProfile?.timing ?? merged?.timing),
              pause_after_ms: parsedPauseAfter,
            },
          }
        : {
            voice: voicePatch,
            timing: { pause_after_ms: parsedPauseAfter },
          }),
      label: isBuiltIn ? undefined : label.trim() || undefined,
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
          {isBuiltIn
            ? '保存为本场次覆盖项（写入 performance.json），不影响全局默认。'
            : '修改自定义预设；VRM 基底保持不变，可调整音色与语速/语气。'}
        </p>

        {!isBuiltIn ? (
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

        {!isBuiltIn ? (
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
        ) : null}

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
            {isSaving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
