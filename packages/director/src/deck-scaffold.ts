/**
 * 场次（deck）脚手架模板。
 *
 * 纯字符串函数，浏览器与 Node 均可用：导入 PDF 的 dev API 与前端校验共用同一套规则，
 * 避免「前端能建、后端建不出」的漂移。
 */

export const DECK_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

export interface DeckScaffoldInput {
  deckId: string;
  title: string;
}

/** `--id` 的规范化：小写、连字符转下划线（与 scaffold:deck 一致）。 */
export function normalizeDeckId(raw: string): string {
  return raw.trim().toLowerCase().replace(/-/g, '_');
}

export function isValidDeckId(deckId: string): boolean {
  return DECK_ID_PATTERN.test(deckId);
}

/** deck.json：PDF 固定放在 public/decks/<id>/slides.pdf。 */
export function buildDeckManifestTemplate(input: DeckScaffoldInput): string {
  const manifest = {
    id: input.deckId,
    title: input.title,
    slideSource: {
      type: 'pdf',
      url: `/decks/${input.deckId}/slides.pdf`,
    },
    scriptUrl: `/content/decks/${input.deckId}/script.jsonl`,
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** 场次级表演覆盖文件（空叠加，继承 content/persona/performance.json）。 */
export function buildEmptyPerformanceOverlay(): string {
  return `${JSON.stringify({ profiles: {} }, null, 2)}\n`;
}

/** 单页讲稿模板：页码即 `slides/NN.md` 的文件名。 */
export function buildSlideMarkdownTemplate(input: {
  deckId: string;
  page: number;
}): string {
  const pagePadded = String(input.page).padStart(2, '0');
  return [
    '---',
    'emotion: friendly',
    'gesture: explain',
    `action_id: ${input.deckId}-${pagePadded}`,
    '---',
    '',
    `第 ${input.page} 页讲稿：在此填写本页汇报正文（TTS 将朗读全文）。`,
    '',
  ].join('\n');
}

/** 从文件名粗略派生场次 id（去掉扩展名与非法字符）。 */
export function deckIdFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  const candidate = slug || 'deck';
  return /^[a-z]/.test(candidate) ? candidate : `deck_${candidate}`;
}
