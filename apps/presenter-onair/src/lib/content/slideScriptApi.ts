import {
  pageToSlideFilename,
  parseSlideMarkdownToDraft,
  serializeSlideMarkdown,
  type SlideScriptDraft,
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

export async function loadSlideDraftFromDisk(
  deckId: string,
  page: number,
): Promise<SlideScriptDraft> {
  const content = await fetchSlideMarkdown(deckId, page);
  if (!content) {
    return {
      page,
      utterance: '',
      emotion: page === 1 ? 'friendly' : 'neutral',
      gesture: page === 1 ? 'bow' : 'explain',
      camera: 'bust',
      action_id: `p${String(page).padStart(2, '0')}`,
      slide_action: { goto: page },
    };
  }
  return parseSlideMarkdownToDraft(page, content);
}

export async function saveSlideToDisk(
  deckId: string,
  draft: SlideScriptDraft,
): Promise<void> {
  const content = serializeSlideMarkdown(draft);
  const response = await fetch(
    `/api/content/decks/${encodeURIComponent(deckId)}/slides/${draft.page}`,
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
