import { useMemo } from 'react';
import type { RefObject } from 'react';
import type { SlideBeatDraft } from '@ssreporter/director';

interface EmphasisTextEditorProps {
  beat: SlideBeatDraft;
  utteranceTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (emphasis: [number, number][] | undefined) => void;
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of sorted) {
    const [start, end] = range;
    if (end <= start) continue;
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

export function EmphasisTextEditor({
  beat,
  utteranceTextareaRef,
  onChange,
}: EmphasisTextEditorProps) {
  const emphasis = beat.emphasis ?? [];
  const text = beat.utterance;

  const previewSegments = useMemo(() => {
    if (text.length === 0) {
      return [{ start: 0, end: 0, text: '（无朗读文本）', emphasized: false }];
    }
    const segments: Array<{
      start: number;
      end: number;
      text: string;
      emphasized: boolean;
    }> = [];
    let index = 0;
    while (index < text.length) {
      const range = emphasis.find(([start, end]) => index >= start && index < end);
      if (range) {
        segments.push({
          start: range[0],
          end: range[1],
          text: text.slice(range[0], range[1]),
          emphasized: true,
        });
        index = range[1];
      } else {
        const nextStart =
          emphasis
            .map(([start]) => start)
            .filter((start) => start > index)
            .sort((a, b) => a - b)[0] ?? text.length;
        segments.push({
          start: index,
          end: nextStart,
          text: text.slice(index, nextStart),
          emphasized: false,
        });
        index = nextStart;
      }
    }
    return segments;
  }, [emphasis, text]);

  const addSelection = () => {
    const element = utteranceTextareaRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    if (start === end) return;
    const next = mergeRanges([...emphasis, [start, end]]);
    onChange(next.length > 0 ? next : undefined);
  };

  const removeRange = (index: number) => {
    const next = emphasis.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length > 0 ? next : undefined);
  };

  const toggleChar = (index: number) => {
    const covered = emphasis.some(([start, end]) => index >= start && index < end);
    let next: [number, number][];
    if (covered) {
      next = emphasis.flatMap(([start, end]) => {
        if (index < start || index >= end) return [[start, end] as [number, number]];
        const parts: [number, number][] = [];
        if (index > start) parts.push([start, index]);
        if (index + 1 < end) parts.push([index + 1, end]);
        return parts;
      });
    } else {
      next = mergeRanges([...emphasis, [index, index + 1]]);
    }
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <div className="emphasis-editor">
      <div className="emphasis-editor-header">
        <span className="emphasis-editor-label">句内重读</span>
        <button
          type="button"
          className="emphasis-editor-add"
          disabled={!text}
          onClick={addSelection}
        >
          标记选区为重读
        </button>
      </div>
      <p className="emphasis-editor-hint">
        在上方朗读文本中选中字词后点「标记选读」，或点击下方预览逐字切换。
      </p>

      {emphasis.length > 0 && (
        <div className="emphasis-editor-chips">
          {emphasis.map(([start, end], index) => (
            <button
              key={`emphasis-${start}-${end}`}
              type="button"
              className="emphasis-editor-chip"
              onClick={() => removeRange(index)}
              title="点击移除"
            >
              「{text.slice(start, end) || '…'}」
              <span className="emphasis-editor-chip-meta">
                {start}–{end}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="emphasis-editor-preview" aria-label="重读预览">
        {text.length === 0 ? (
          <span className="emphasis-editor-preview-empty">暂无文本</span>
        ) : (
          previewSegments.map((segment) => (
            <span
              key={`seg-${segment.start}-${segment.end}`}
              className={
                segment.emphasized
                  ? 'emphasis-editor-mark'
                  : 'emphasis-editor-plain'
              }
            >
              {segment.text.split('').map((char, offset) => {
                const absoluteIndex = segment.start + offset;
                return (
                  <button
                    key={`char-${absoluteIndex}`}
                    type="button"
                    className={`emphasis-editor-char${
                      segment.emphasized ? ' is-emphasized' : ''
                    }`}
                    onClick={() => toggleChar(absoluteIndex)}
                  >
                    {char}
                  </button>
                );
              })}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
