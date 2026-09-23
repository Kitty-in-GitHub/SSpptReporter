import { useEffect, useRef, useState } from 'react';
import {
  PRESENT_LAYOUT_LABELS,
  type PipCorner,
  type PresentLayout,
} from '../../types/present';
import { PresentPipControls } from './PresentPipControls';

interface PresentViewMenuProps {
  presentLayout: PresentLayout;
  onPresentLayoutChange: (layout: PresentLayout) => void;
  isPipLayout: boolean;
  pipCorner: PipCorner;
  pipBorderless: boolean;
  pipSize: number;
  onPipCornerChange: (corner: PipCorner) => void;
  onPipBorderlessChange: (borderless: boolean) => void;
  onPipSizeChange: (size: number) => void;
  onResetPipOffset: () => void;
}

/** 视图参数（布局 + 画中画）收纳进弹层，避免常驻挤占工具条 */
export function PresentViewMenu({
  presentLayout,
  onPresentLayoutChange,
  isPipLayout,
  pipCorner,
  pipBorderless,
  pipSize,
  onPipCornerChange,
  onPipBorderlessChange,
  onPipSizeChange,
  onResetPipOffset,
}: PresentViewMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="present-view-menu" ref={rootRef}>
      <button
        type="button"
        className={`present-view-trigger${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        视图 ▾
      </button>

      {open ? (
        <div className="present-view-popover" role="group" aria-label="视图参数">
          <label className="present-toolbar-layout">
            布局
            <select
              value={presentLayout}
              onChange={(event) =>
                onPresentLayoutChange(event.target.value as PresentLayout)
              }
            >
              {Object.entries(PRESENT_LAYOUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {isPipLayout ? (
            <PresentPipControls
              pipCorner={pipCorner}
              pipBorderless={pipBorderless}
              pipSize={pipSize}
              onPipCornerChange={onPipCornerChange}
              onPipBorderlessChange={onPipBorderlessChange}
              onPipSizeChange={onPipSizeChange}
              onResetPipOffset={onResetPipOffset}
            />
          ) : (
            <p className="present-view-hint">
              选「画中画」布局后，可在此调整窗口位置、大小与边框。
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
