export interface DeckCatalogEntry {
  id: string;
  title: string;
  isPrivate: boolean;
}

export async function fetchDeckCatalog(): Promise<DeckCatalogEntry[]> {
  const response = await fetch('/api/content/decks');
  if (!response.ok) {
    throw new Error(`加载场次列表失败（${response.status}）`);
  }
  const payload = (await response.json()) as {
    ok?: boolean;
    decks?: DeckCatalogEntry[];
  };
  if (!payload.decks?.length) {
    return [{ id: 'demo', title: 'demo', isPrivate: false }];
  }
  return payload.decks;
}
