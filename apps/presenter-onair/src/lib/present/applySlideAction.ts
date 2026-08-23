import type { SlideAction } from '@ssreporter/director';

export function clampPageIndex(page: number, pageCount: number): number {
  if (pageCount <= 0) {
    return 1;
  }
  return Math.min(pageCount, Math.max(1, page));
}

export function applySlideAction(
  currentPage: number,
  pageCount: number,
  slideAction: SlideAction,
): number {
  if (slideAction.goto !== undefined) {
    return clampPageIndex(slideAction.goto, pageCount);
  }
  if (slideAction.next) {
    return clampPageIndex(currentPage + 1, pageCount);
  }
  if (slideAction.prev) {
    return clampPageIndex(currentPage - 1, pageCount);
  }
  return currentPage;
}
