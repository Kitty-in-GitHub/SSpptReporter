import type { CSSProperties } from 'react';
import type { PerformanceCatalog, SlideBeatDraft } from '@ssreporter/director';
import {
  resolveProfileColor,
  resolveProfileDisplayName,
} from '../../hooks/usePerformanceCatalog';

interface BeatTimelineStripProps {
  beats: SlideBeatDraft[];
  activeIndex: number;
  catalog: PerformanceCatalog | null;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

function beatSnippet(beat: SlideBeatDraft): string {
  const text = beat.utterance.replace(/\s+/g, ' ').trim();
  if (!text) return '（无台词）';
  return text.length > 18 ? `${text.slice(0, 18)}…` : text;
}

function beatProfileId(beat: SlideBeatDraft): string {
  return beat.profile ?? beat.emotion;
}

export function BeatTimelineStrip({
  beats,
  activeIndex,
  catalog,
  onSelect,
  onAdd,
}: BeatTimelineStripProps) {
  return (
    <div className="beat-timeline">
      <div className="beat-timeline-track">
        {beats.map((beat, index) => {
          const profileId = beatProfileId(beat);
          const color = resolveProfileColor(profileId, catalog);
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
              <span className="beat-timeline-profile">
                {resolveProfileDisplayName(profileId, catalog)}
              </span>
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
