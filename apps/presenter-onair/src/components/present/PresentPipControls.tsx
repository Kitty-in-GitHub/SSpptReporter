import type { PipCorner } from '../../types/present';
import { PIP_CORNER_LABELS } from '../../types/present';

interface PresentPipControlsProps {
  pipCorner: PipCorner;
  pipBorderless: boolean;
  onPipCornerChange: (corner: PipCorner) => void;
  onPipBorderlessChange: (borderless: boolean) => void;
  onResetPipOffset: () => void;
}

export function PresentPipControls({
  pipCorner,
  pipBorderless,
  onPipCornerChange,
  onPipBorderlessChange,
  onResetPipOffset,
}: PresentPipControlsProps) {
  return (
    <div className="present-pip-controls">
      <label className="present-toolbar-layout">
        画中画
        <select
          value={pipCorner}
          onChange={(event) =>
            onPipCornerChange(event.target.value as PipCorner)
          }
        >
          {Object.entries(PIP_CORNER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="present-pip-borderless">
        <input
          type="checkbox"
          checked={pipBorderless}
          onChange={(event) => onPipBorderlessChange(event.target.checked)}
        />
        无边框
      </label>
      <button type="button" className="present-pip-reset" onClick={onResetPipOffset}>
        复位位置
      </button>
    </div>
  );
}
