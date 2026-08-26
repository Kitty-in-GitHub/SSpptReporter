import type { CSSProperties } from 'react';
import {
  EMOTIONS,
  GESTURES,
  type DirectorAction,
  type Emotion,
  type Gesture,
  type PerformanceCatalog,
  type SlideBeatDraft,
  resolveBeatPerformance,
} from '@ssreporter/director';
import type { RefObject } from 'react';
import {
  EDGE_VOICE_OPTIONS,
  GESTURE_ICONS,
  GESTURE_LABELS,
  PROFILE_COLORS,
  PROFILE_HINTS,
  PROFILE_LABELS,
  formatPauseLabel,
  formatSpeedLabel,
} from '../../constants/performanceUi';
import { EmphasisTextEditor } from './EmphasisTextEditor';

interface BeatPerformanceEditorProps {
  beat: SlideBeatDraft;
  catalog: PerformanceCatalog | null;
  utteranceTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onUpdate: (patch: Partial<SlideBeatDraft>) => void;
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

function effectiveSpeed(beat: SlideBeatDraft, catalog: PerformanceCatalog | null): number {
  return resolveBeatPerformance(beatPreviewAction(beat), catalog ?? undefined).voice
    .speed ?? 1;
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
  utteranceTextareaRef,
  onUpdate,
}: BeatPerformanceEditorProps) {
  const profileName = (beat.profile ?? beat.emotion) as Emotion;
  const resolved = resolveBeatPerformance(beatPreviewAction(beat), catalog ?? undefined);
  const speedValue = beat.voice?.speed ?? effectiveSpeed(beat, catalog);
  const pauseBefore =
    beat.timing?.pause_before_ms ?? effectivePause(beat, catalog, 'pause_before_ms');
  const pauseAfter =
    beat.timing?.pause_after_ms ?? effectivePause(beat, catalog, 'pause_after_ms');
  const speakerValue = beat.voice?.speaker ?? '';

  return (
    <div className="beat-performance-editor">
      <section className="beat-performance-section">
        <h3 className="beat-performance-heading">汇报情绪 · 表演预设</h3>
        <p className="beat-performance-lead">
          选择本节拍的情绪与默认语速；写入讲稿后编译即生效。
        </p>
        <div className="profile-picker" role="listbox" aria-label="表演预设">
          {EMOTIONS.map((emotion) => {
            const selected = profileName === emotion;
            const preview = resolveBeatPerformance(
              {
                schema_version: '1.0',
                mode: 'present',
                utterance: '',
                profile: emotion,
                emotion,
              },
              catalog ?? undefined,
            );
            const speed = preview.voice.speed ?? 1;
            return (
              <button
                key={emotion}
                type="button"
                role="option"
                aria-selected={selected}
                className={`profile-card${selected ? ' is-selected' : ''}`}
                style={{ '--profile-color': PROFILE_COLORS[emotion] } as CSSProperties}
                onClick={() =>
                  onUpdate({
                    profile: emotion,
                    emotion,
                  })
                }
              >
                <span className="profile-card-dot" aria-hidden />
                <span className="profile-card-label">{PROFILE_LABELS[emotion]}</span>
                <span className="profile-card-hint">{PROFILE_HINTS[emotion]}</span>
                <span className="profile-card-meta">
                  {formatSpeedLabel(speed)} · ×{speed.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="beat-performance-section">
        <h3 className="beat-performance-heading">手势</h3>
        <div className="gesture-picker" role="listbox" aria-label="手势">
          {GESTURES.map((gesture) => {
            const selected = beat.gesture === gesture;
            return (
              <button
                key={gesture}
                type="button"
                role="option"
                aria-selected={selected}
                className={`gesture-chip${selected ? ' is-selected' : ''}`}
                onClick={() => onUpdate({ gesture: gesture as Gesture })}
              >
                <span className="gesture-chip-icon" aria-hidden>
                  {GESTURE_ICONS[gesture]}
                </span>
                {GESTURE_LABELS[gesture]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="beat-performance-section">
        <h3 className="beat-performance-heading">汇报语速 · 音色</h3>
        <div className="voice-picker">
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
              {EDGE_VOICE_OPTIONS.find((item) => item.id === effectiveSpeaker(beat, catalog))
                ?.label ?? '默认'}
            </span>
          </button>
          {EDGE_VOICE_OPTIONS.map((option) => (
            <button
              key={option.id}
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
          ))}
        </div>

        <div className="slider-field">
          <div className="slider-field-header">
            <span>语速</span>
            <span className="slider-field-value">
              ×{speedValue.toFixed(2)}
              <span className="slider-field-tag">{formatSpeedLabel(speedValue)}</span>
              {beat.voice?.speed == null && (
                <span className="slider-field-inherited">来自预设</span>
              )}
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={speedValue}
            onChange={(event) => {
              const value = Number.parseFloat(event.target.value);
              onUpdate({
                voice: { ...beat.voice, speed: value },
              });
            }}
          />
          <div className="slider-field-scale">
            <span>慢 0.5</span>
            <span>常速 1.0</span>
            <span>快 1.5</span>
          </div>
          {beat.voice?.speed != null && (
            <button
              type="button"
              className="slider-field-reset"
              onClick={() =>
                onUpdate({
                  voice: { ...beat.voice, speed: undefined },
                })
              }
            >
              恢复预设语速
            </button>
          )}
        </div>
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
          {PROFILE_LABELS[resolved.emotion]} · {GESTURE_LABELS[resolved.gesture]} · ×
          {(resolved.voice.speed ?? 1).toFixed(2)} · 前 {resolved.timing.pause_before_ms ?? 0}{' '}
          ms / 后 {resolved.timing.pause_after_ms ?? 0} ms
        </span>
      </aside>
    </div>
  );
}
