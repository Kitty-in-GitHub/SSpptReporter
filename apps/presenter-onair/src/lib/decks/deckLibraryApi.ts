/** 场次库（答辩 PDF 导入 / 切换 / 管理）的前端 API。
 *
 * 写盘接口只在 `npm run dev` 下存在（Vite 插件 `vite-content-api-plugin.ts`），
 * 生产构建里 `devApi` 为 false，页面据此提示。
 */

export interface DeckSummary {
  id: string;
  title: string;
  isPrivate: boolean;
  hasPdf: boolean;
  slidePages: number;
  scriptActions: number;
}

export interface DeckListResult {
  decks: DeckSummary[];
  devApi: boolean;
}

export interface DeckImportResult {
  deckId: string;
  pageCount: number;
  createdSlides: number;
  scriptActions: number;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof (payload as { message?: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : `请求失败（HTTP ${response.status}）`;
    throw new Error(message);
  }
  return (payload ?? {}) as T;
}

export async function fetchDeckLibrary(): Promise<DeckListResult> {
  const response = await fetch('/api/content/decks', { cache: 'no-store' });
  const payload = await parseResponse<{
    ok: boolean;
    devApi?: boolean;
    decks?: DeckSummary[];
  }>(response);
  return {
    decks: payload.decks ?? [],
    devApi: payload.devApi === true,
  };
}

export async function importDeckPdf(params: {
  file: File;
  deckId: string;
  title: string;
}): Promise<DeckImportResult> {
  const query = new URLSearchParams({
    deckId: params.deckId,
    title: params.title,
  });
  const response = await fetch(`/api/content/decks/import?${query.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: params.file,
  });
  return parseResponse<DeckImportResult>(response);
}

export async function scaffoldDeck(deckId: string): Promise<DeckImportResult> {
  const response = await fetch(
    `/api/content/decks/${encodeURIComponent(deckId)}/scaffold`,
    { method: 'POST' },
  );
  return parseResponse<DeckImportResult>(response);
}

export async function deleteDeck(deckId: string): Promise<void> {
  const response = await fetch(
    `/api/content/decks/${encodeURIComponent(deckId)}`,
    { method: 'DELETE' },
  );
  await parseResponse<{ ok: boolean }>(response);
}
