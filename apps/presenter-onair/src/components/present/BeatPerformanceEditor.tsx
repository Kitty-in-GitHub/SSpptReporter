import { useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import {
  GESTURES,
  isBuiltInProfile,
  listSelectableProfiles,
  type DirectorAction,
  type Gesture,
  type PerformanceCatalog,
  type PerformanceProfile,
  type SlideBeatDraft,
  resolveBeatPerformance,
} from '@ssreporter/director';
import {
  EDGE_VOICE_OPTIONS,
  GESTURE_ICONS,
  GESTURE_LABELS,
  formatPauseLabel,
} from '../../constants/performanceUi';
import {
  resolveProfileColor,
  resolveProfileDisplayName,
} from '../../hooks/usePerformanceCatalog';
import { useVoicePreview } from '../../hooks/useVoicePreview';
import { isGesturePending } from '../../lib/gestureToVrmReaction';
import { EmphasisTextEditor } from './EmphasisTextEditor';
import { isEmotionProfile, ProfileCreateDialog } from './ProfileCreateDialog';
import { ProfileEditDialog } from './ProfileEditDialog';

interface BeatPerformanceEditorProps {
  beat: SlideBeatDraft;
  catalog: PerformanceCatalog | null;
  deckOverlay: PerformanceCatalog | null;
  utteranceTextareaRef: RefObject<HTMLTextAreaElement | null>;
  isSavingProfile?: boolean;
  hasDeckOverride: (profileId: string) => boolean;
  onUpdate: (patch: Partial<SlideBeatDraft>) => void;
  onAddProfile: (profileId: string, profile: PerformanceProfile) => Promise<void>;
  onUpdateProfile: (profileId: string, profile: PerformanceProfile) => Promise<void>;
  onRemoveProfile: (profileId: string) => Promise<void>;
  onProfileCreated?: (profileId: string) => void;
}

function beatPreviewAction(beat: SlideBeatDraft): DirectorAction {
  return {
    schema_version: '1.0',
    mode: 'present',
    utterance: beat.utterance,
    profile: beat.profile,
    emotion: beat.emotion,
    gesture: beat.gesture,
    voice: beat.voice,
    timing: beat.timing,
    emphasis: beat.emphasis,
  };
}

function effectivePause(
  beat: SlideBeatDraft,
  catalog: PerformanceCatalog | null,
  key: 'pause_before_ms' | 'pause_after_ms',
): number {
  return (
    resolveBeatPerformance(beatPreviewAction(beat), catalog ?? undefined).timing[key] ?? 0
  );
}

function effectiveSpeaker(
  beat: SlideBeatDraft,
  catalog: PerformanceCatalog | null,
): string {
  return (
    resolveBeatPerformance(beatPreviewAction(beat), catalog ?? undefined).voice.speaker ??
    'zh-CN-XiaoxiaoNeural'
  );
}

export function BeatPerformanceEditor({
  beat,
  catalog,
  deckOverlay,
  utteranceTextareaRef,
  isSavingProfile = false,
  hasDeckOverride,
  onUpdate,
  onAddProfile,
  onUpdateProfile,
  onRemoveProfile,
  onProfileCreated,
}: BeatPerformanceEditorProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const voicePreview = useVoicePreview();
  const profileName = beat.profile ?? beat.emotion;
  const mergedCatalog = catalog ?? { profiles: {} };
  const profileIds = listSelectableProfiles(mergedCatalog);
  const resolved = resolveBeatPerformance(beatPreviewAction(beat), catalog ?? undefined);
  const pauseBefore =
    beat.timing?.pause_before_ms ?? effectivePause(beat, catalog, 'pause_before_ms');
  const pauseAfter =
    beat.timing?.pause_after_ms ?? effectivePause(beat, catalog, 'pause_after_ms');
  const speakerValue = beat.voice?.speaker ?? '';
  const presetSpeaker = effectiveSpeaker(beat, catalog);

  const formatVoiceScalar = (value: number | string | undefined): string => {
    if (value == null || value === '') {
      return '';
    }
    return String(value);
  };

  const resolvedPitch = formatVoiceScalar(resolved.voice.pitch);
  const resolvedVolume = formatVoiceScalar(resolved.voice.volume);
  const resolvedStyleHint = resolved.voice.style_hint?.trim() ?? '';

  const selectProfile = (profileId: string) => {
    if (isEmotionProfile(profileId)) {
      onUpdate({ profile: profileId, emotion: profileId });
      return;
    }
    onUpdate({ profile: profileId });
  };

  const handleCreateProfile = async (profileId: string, profile: PerformanceProfile) => {
    await onAddProfile(profileId, profile);
    selectProfile(profileId);
    onProfileCreated?.(profileId);
  };

  const handleDeleteProfile = async (profileId: string) => {
    const custom = !isBuiltInProfile(profileId);
    const message = custom
      ? `删除自定义预设「${resolveProfileDisplayName(profileId, catalog)}」？讲稿里已写的 profile 字段不会自动改。`
      : `移除本场次对「${resolveProfileDisplayName(profileId, catalog)}」的覆盖，恢复默认？`;
    if (!window.confirm(message)) {
      return;
    }
    await onRemoveProfile(profileId);
    if (profileName === profileId) {
      selectProfile('neutral');
    }
  };

  const canDeleteProfile = (profileId: string) =>
    !isBuiltInProfile(profileId) || hasDeckOverride(profileId);

  return (
    <div className="beat-performance-editor">
      <section className="beat-performance-section">
        <div className="beat-performance-section-header">
          <h3 className="beat-performance-heading">汇报情绪</h3>
          <button
            type="button"
            className="profile-create-trigger"
            disabled={!catalog || isSavingProfile}
            onClick={() => setCreateOpen(true)}
          >
            + 新建预设
          </button>
        </div>

        <div className="profile-picker" role="listbox" aria-label="表演预设">
          {profileIds.map((profileId) => {
            const selected = profileName === profileId;
            const color = resolveProfileColor(profileId, catalog);
            const isCustom = !isEmotionProfile(profileId);
            return (
              <div
                key={profileId}
                className={`profile-card-wrap${selected ? ' is-selected' : ''}`}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`profile-card${selected ? ' is-selected' : ''}${
                    isCustom ? ' is-custom' : ''
                  }`}
                  style={{ '--profile-color': color } as CSSProperties}
                  onClick={() => selectProfile(profileId)}
                >
                  <span className="profile-card-dot" aria-hidden />
                  <span className="profile-card-label">
                    {resolveProfileDisplayName(profileId, catalog)}
                  </span>
                </button>
                <div className="profile-card-actions">
                  <button
                    type="button"
                    className="profile-card-action"
                    disabled={isSavingProfile}
                    onClick={() => setEditProfileId(profileId)}
                  >
                    编辑
                  </button>
                  {canDeleteProfile(profileId) ? (
                    <button
                      type="button"
                      className="profile-card-action is-danger"
                      disabled={isSavingProfile}
                      onClick={() => void handleDeleteProfile(profileId)}
                    >
                      {isCustom ? '删除' : '恢复默认'}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="beat-performance-section">
        <h3 className="beat-performance-heading">手势</h3>
        <div className="gesture-picker" role="listbox" aria-label="手势">
          {GESTURES.map((gesture) => {
            const selected = beat.gesture === gesture;
            const pending = isGesturePending(gesture);
            return (
              <button
                key={gesture}
                type="button"
                role="option"
                aria-selected={selected}
                className={`gesture-chip${selected ? ' is-selected' : ''}${
                  pending ? ' is-pending' : ''
                }`}
                title={pending ? '待自制 VRMA，当前无动作' : undefined}
                onClick={() => onUpdate({ gesture: gesture as Gesture })}
              >
                <span className="gesture-chip-icon" aria-hidden>
                  {GESTURE_ICONS[gesture]}
                </span>
                {GESTURE_LABELS[gesture]}
                {pending ? (
                  <span className="gesture-chip-badge">待自制</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="beat-performance-section">
        <h3 className="beat-performance-heading">汇报音色</h3>
        <div className="voice-picker">
          <div className="voice-card-wrap">
            <button
              type="button"
              className={`voice-card${speakerValue === '' ? ' is-selected' : ''}`}
              onClick={() =>
                onUpdate({
                  voice: { ...beat.voice, speaker: undefined },
                })
              }
            >
              <span className="voice-card-label">跟随预设</span>
              <span className="voice-card-hint">
                {EDGE_VOICE_OPTIONS.find((item) => item.id === presetSpeaker)
                  ?.label ?? '默认'}
              </span>
            </button>
            <button
              type="button"
              className={`voice-card-preview${
                voicePreview.activeVoice === presetSpeaker ? ' is-active' : ''
              }`}
              title="试听"
              aria-label="试听预设音色"
              onClick={() => void voicePreview.preview(presetSpeaker)}
            >
              {voicePreview.activeVoice === presetSpeaker ? '⏹' : '🔊'}
            </button>
          </div>
          {EDGE_VOICE_OPTIONS.map((option) => (
            <div key={option.id} className="voice-card-wrap">
              <button
                type="button"
                className={`voice-card${speakerValue === option.id ? ' is-selected' : ''}`}
                onClick={() =>
                  onUpdate({
                    voice: { ...beat.voice, speaker: option.id },
                  })
                }
              >
                <span className="voice-card-label">{option.label}</span>
                <span className="voice-card-hint">{option.hint}</span>
              </button>
              <button
                type="button"
                className={`voice-card-preview${
                  voicePreview.activeVoice === option.id ? ' is-active' : ''
                }`}
                title="试听"
                aria-label={`试听${option.label}`}
                onClick={() => void voicePreview.preview(option.id)}
              >
                {voicePreview.activeVoice === option.id ? '⏹' : '🔊'}
              </button>
            </div>
          ))}
        </div>
        {voicePreview.error ? (
          <p className="voice-preview-error">{voicePreview.error}</p>
        ) : null}
      </section>

      <section className="beat-performance-section">
        <h3 className="beat-performance-heading">节拍停顿</h3>
        <div className="slider-field">
          <div className="slider-field-header">
            <span>播前停顿</span>
            <span className="slider-field-value">
              {pauseBefore} ms
              <span className="slider-field-tag">{formatPauseLabel(pauseBefore)}</span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={pauseBefore}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10);
              onUpdate({
                timing: { ...beat.timing, pause_before_ms: value },
              });
            }}
          />
        </div>
        <div className="slider-field">
          <div className="slider-field-header">
            <span>播后停顿</span>
            <span className="slider-field-value">
              {pauseAfter} ms
              <span className="slider-field-tag">{formatPauseLabel(pauseAfter)}</span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={pauseAfter}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10);
              onUpdate({
                timing: { ...beat.timing, pause_after_ms: value },
              });
            }}
          />
        </div>
      </section>

      <section className="beat-performance-section">
        <EmphasisTextEditor
          beat={beat}
          utteranceTextareaRef={utteranceTextareaRef}
          onChange={(emphasis) => onUpdate({ emphasis })}
        />
      </section>

      <aside className="beat-performance-summary" aria-label="本节拍生效摘要">
        <span className="beat-performance-summary-title">本节拍将播放为</span>
        <span>
          {resolveProfileDisplayName(resolved.profileName, catalog)} ·{' '}
          {GESTURE_LABELS[resolved.gesture]} · ×{(resolved.voice.speed ?? 1).toFixed(2)}
          {resolvedPitch ? ` · pitch ${resolvedPitch}` : ''}
          {resolvedVolume ? ` · vol ${resolvedVolume}` : ''}
          {resolvedStyleHint ? ` · 语气「${resolvedStyleHint.slice(0, 24)}${resolvedStyleHint.length > 24 ? '…' : ''}」` : ''}
          {' · 前 '}
          {resolved.timing.pause_before_ms ?? 0} ms / 后 {resolved.timing.pause_after_ms ?? 0}{' '}
          ms
        </span>
      </aside>

      {createOpen && catalog ? (
        <ProfileCreateDialog
          catalog={catalog}
          isSaving={isSavingProfile}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateProfile}
        />
      ) : null}

      {editProfileId && catalog ? (
        <ProfileEditDialog
          catalog={catalog}
          profileId={editProfileId}
          overlayProfile={deckOverlay?.profiles[editProfileId]}
          isSaving={isSavingProfile}
          onClose={() => setEditProfileId(null)}
          onSave={onUpdateProfile}
        />
      ) : null}
    </div>
  );
}
