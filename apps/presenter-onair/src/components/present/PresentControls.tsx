interface PresentControlsProps {
  currentPage: number;
  pageCount: number;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function PresentControls({
  currentPage,
  pageCount,
  disabled = false,
  onPrev,
  onNext,
}: PresentControlsProps) {
  return (
    <div className="present-controls">
      <button type="button" disabled={disabled || currentPage <= 1} onClick={onPrev}>
        上一页
      </button>
      <span className="present-controls-page">
        {pageCount > 0 ? `${currentPage} / ${pageCount}` : '— / —'}
      </span>
      <button
        type="button"
        disabled={disabled || pageCount === 0 || currentPage >= pageCount}
        onClick={onNext}
      >
        下一页
      </button>
    </div>
  );
}
