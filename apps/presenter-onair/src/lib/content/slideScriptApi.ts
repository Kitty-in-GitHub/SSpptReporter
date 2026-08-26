import {
  pageToSlideFilename,
  parseSlideMarkdownToPageDraft,
  serializeSlideMarkdown,
  type SlideBeatDraft,
  type SlidePageDraft,
} from '@ssreporter/director';

export async function fetchSlideMarkdown(
  deckId: string,
  page: number,
): Promise<string | null> {
  const url = `/content/decks/${encodeURIComponent(deckId)}/slides/${pageToSlideFilename(page)}`;
  const response = await fetch(url);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`无法加载讲稿：${url}（${response.status}）`);
  }
  return response.text();
}

function defaultPageDraft(page: number): SlidePageDraft {
  return {
    page,
    beats: [
      {
        utterance: '',
        emotion: page === 1 ? 'friendly' : 'neutral',
        gesture: page === 1 ? 'bow' : 'explain',
        camera: 'bust',
        action_id: `p${String(page).padStart(2, '0')}`,
        slide_action: { goto: page },
      },
    ],
  };
}

function isSlidePageDraft(value: unknown): value is SlidePageDraft {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as SlidePageDraft;
  return Number.isInteger(record.page) && Array.isArray(record.beats);
}

export async function loadSlidePageDraftFromDisk(
  deckId: string,
  page: number,
): Promise<SlidePageDraft> {
  const content = await fetchSlideMarkdown(deckId, page);
  if (!content) {
    return defaultPageDraft(page);
  }
  return parseSlideMarkdownToPageDraft(page, content);
}

export async function saveSlidePageToDisk(
  deckId: string,
  pageDraft: SlidePageDraft,
): Promise<void> {
  const content = serializeSlideMarkdown(pageDraft);
  const response = await fetch(
    `/api/content/decks/${encodeURIComponent(deckId)}/slides/${pageDraft.page}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );

  const payload = (await response.json()) as { ok?: boolean; message?: string };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? `保存失败（${response.status}）`);
  }
}

/** @deprecated Use loadSlidePageDraftFromDisk */
export async function loadSlideDraftFromDisk(
  deckId: string,
  page: number,
): Promise<SlidePageDraft> {
  return loadSlidePageDraftFromDisk(deckId, page);
}

/** @deprecated Use saveSlidePageToDisk */
export async function saveSlideToDisk(
  deckId: string,
  draft: SlidePageDraft | (SlideBeatDraft & { page: number }),
): Promise<void> {
  const pageDraft: SlidePageDraft =
    'beats' in draft && Array.isArray(draft.beats)
      ? draft
      : (() => {
          const legacy = draft as SlideBeatDraft & { page: number };
          return {
            page: legacy.page,
            beats: [
              {
                utterance: legacy.utterance,
                profile: legacy.profile,
                emotion: legacy.emotion,
                gesture: legacy.gesture,
                camera: legacy.camera,
                action_id: legacy.action_id,
                slide_action: legacy.slide_action,
                voice: legacy.voice,
                timing: legacy.timing,
              },
            ],
          };
        })();
  await saveSlidePageToDisk(deckId, pageDraft);
}

export async function compileDeckOnDisk(
  deckId: string,
): Promise<{ count: number }> {
  const response = await fetch(
    `/api/content/decks/${encodeURIComponent(deckId)}/compile`,
    { method: 'POST' },
  );
  const payload = (await response.json()) as {
    ok?: boolean;
    count?: number;
    message?: string;
    issues?: { source: string; message: string }[];
  };

  if (!response.ok || !payload.ok) {
    const issueText = payload.issues
      ?.map((issue) => `${issue.source}: ${issue.message}`)
      .join('; ');
    throw new Error(issueText || payload.message || `编译失败（${response.status}）`);
  }

  return { count: payload.count ?? 0 };
}

export function normalizeStoredPageDraft(
  _deckId: string,
  page: number,
  stored: unknown,
): SlidePageDraft | null {
  if (!stored) {
    return null;
  }
  if (isSlidePageDraft(stored)) {
    return stored;
  }
  const legacy = stored as SlideBeatDraft & { page?: number };
  if (typeof legacy.utterance === 'string' && legacy.emotion && legacy.gesture) {
    return {
      page: legacy.page ?? page,
      beats: [
        {
          utterance: legacy.utterance,
          profile: legacy.profile,
          emotion: legacy.emotion,
          gesture: legacy.gesture,
          camera: legacy.camera ?? 'bust',
          action_id: legacy.action_id,
          slide_action: legacy.slide_action,
          voice: legacy.voice,
          timing: legacy.timing,
        },
      ],
    };
  }
  return null;
}
