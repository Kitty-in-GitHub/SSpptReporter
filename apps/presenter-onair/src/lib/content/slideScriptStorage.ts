import type { SlidePageDraft } from '@ssreporter/director';

const DRAFT_PREFIX = 'ssreporter-slide-draft';

function draftKey(deckId: string, page: number): string {
  return `${DRAFT_PREFIX}:${deckId}:${page}`;
}

export function loadSlideDraft(
  deckId: string,
  page: number,
): SlidePageDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(deckId, page));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SlidePageDraft;
  } catch {
    return null;
  }
}

export function saveSlideDraft(deckId: string, draft: SlidePageDraft): void {
  localStorage.setItem(draftKey(deckId, draft.page), JSON.stringify(draft));
}

export function clearSlideDraft(deckId: string, page: number): void {
  localStorage.removeItem(draftKey(deckId, page));
}

export function clearDeckDrafts(deckId: string, pageCount: number): void {
  for (let page = 1; page <= pageCount; page += 1) {
    clearSlideDraft(deckId, page);
  }
}
