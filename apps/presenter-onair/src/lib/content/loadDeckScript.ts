import {
  parseScriptJsonl,
  type DirectorAction,
} from '@ssreporter/director';

function resolveDeckId(deckId?: string | null): string {
  const trimmed = (deckId ?? '').trim();
  return trimmed || 'demo';
}

export function resolveDeckScriptUrl(
  deckId?: string | null,
  scriptUrl?: string | null,
): string {
  const id = resolveDeckId(deckId);
  const trimmed = scriptUrl?.trim();
  if (trimmed) {
    return trimmed;
  }
  return `/content/decks/${encodeURIComponent(id)}/script.jsonl`;
}

export async function loadDeckScript(
  deckId?: string | null,
  scriptUrl?: string | null,
): Promise<DirectorAction[]> {
  const url = resolveDeckScriptUrl(deckId, scriptUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`无法加载讲稿：${url}（${response.status}）`);
  }

  const content = await response.text();
  const result = parseScriptJsonl(content);
  if (result.issues.length > 0) {
    const detail = result.issues
      .map((issue) => `${issue.source}: ${issue.message}`)
      .join('; ');
    throw new Error(`讲稿校验失败：${detail}`);
  }
  if (result.actions.length === 0) {
    throw new Error(`讲稿为空：${url}`);
  }

  return result.actions;
}
