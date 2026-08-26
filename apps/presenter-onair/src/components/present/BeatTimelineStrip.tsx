import type { CSSProperties } from 'react';
import type { Emotion, SlideBeatDraft } from '@ssreporter/director';
import { PROFILE_COLORS, PROFILE_LABELS } from '../../constants/performanceUi';

interface BeatTimelineStripProps {
  beats: SlideBeatDraft[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

function beatSnippet(beat: SlideBeatDraft): string {
  const text = beat.utterance.replace(/\s+/g, ' ').trim();
  if (!text) return '（无台词）';
  return text.length > 18 ? `${text.slice(0, 18)}…` : text;
}

function beatProfile(beat: SlideBeatDraft): Emotion {
  return (beat.profile ?? beat.emotion) as Emotion;
}

export function BeatTimelineStrip({
  beats,
  activeIndex,
  onSelect,
  onAdd,
}: BeatTimelineStripProps) {
  return (
    <div className="beat-timeline">
      <div className="beat-timeline-track">
        {beats.map((beat, index) => {
          const profile = beatProfile(beat);
          const color = PROFILE_COLORS[profile] ?? PROFILE_COLORS.neutral;
          const active = index === activeIndex;
          return (
            <button
              key={`beat-${index}`}
              type="button"
              className={`beat-timeline-item${active ? ' is-active' : ''}`}
              style={{ '--beat-color': color } as CSSProperties}
              onClick={() => onSelect(index)}
            >
              <span className="beat-timeline-index">节拍 {index + 1}</span>
              <span className="beat-timeline-profile">{PROFILE_LABELS[profile]}</span>
              <span className="beat-timeline-snippet">{beatSnippet(beat)}</span>
            </button>
          );
        })}
        <button type="button" className="beat-timeline-add" onClick={onAdd}>
          + 节拍
        </button>
      </div>
    </div>
  );
}
