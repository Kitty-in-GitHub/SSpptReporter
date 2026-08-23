import type { DeckManifest } from '../../types/present';

function resolveDeckId(deckId?: string | null): string {
  const trimmed = (deckId ?? '').trim();
  return trimmed || 'demo';
}

export async function loadDeckManifest(
  deckId?: string | null,
): Promise<DeckManifest> {
  const id = resolveDeckId(deckId);
  const contentUrl = `/content/decks/${encodeURIComponent(id)}/deck.json`;
  const legacyUrl =
    id === 'demo'
      ? '/decks/demo/deck.json'
      : `/decks/${encodeURIComponent(id)}/deck.json`;

  let response = await fetch(contentUrl);
  if (!response.ok) {
    response = await fetch(legacyUrl);
  }
  if (!response.ok) {
    throw new Error(
      `无法加载 deck：${contentUrl} / ${legacyUrl}（${response.status}）`,
    );
  }

  const manifest = (await response.json()) as DeckManifest;
  if (manifest.slideSource?.type !== 'pdf' || !manifest.slideSource.url) {
    throw new Error(`deck ${id} 仅支持 slideSource.type = "pdf"`);
  }

  return {
    ...manifest,
    id: manifest.id || id,
    scriptUrl:
      manifest.scriptUrl ||
      `/content/decks/${encodeURIComponent(id)}/script.jsonl`,
  };
}
