import {
  MAX_PIP_SIZE,
  MIN_PIP_SIZE,
  PIP_CORNER_LABELS,
  type PipCorner,
} from '../../types/present';

interface PresentPipControlsProps {
  pipCorner: PipCorner;
  pipBorderless: boolean;
  pipSize: number;
  onPipCornerChange: (corner: PipCorner) => void;
  onPipBorderlessChange: (borderless: boolean) => void;
  onPipSizeChange: (size: number) => void;
  onResetPipOffset: () => void;
}

export function PresentPipControls({
  pipCorner,
  pipBorderless,
  pipSize,
  onPipCornerChange,
  onPipBorderlessChange,
  onPipSizeChange,
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
      <label className="present-pip-size">
        <span>窗口 {Math.round(pipSize * 100)}%</span>
        <input
          type="range"
          min={Math.round(MIN_PIP_SIZE * 100)}
          max={Math.round(MAX_PIP_SIZE * 100)}
          step={5}
          value={Math.round(pipSize * 100)}
          onChange={(event) =>
            onPipSizeChange(Number(event.target.value) / 100)
          }
          title="画中画窗口大小"
        />
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
