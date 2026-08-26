import {
  DEFAULT_PERFORMANCE_CATALOG,
  mergePerformanceCatalogs,
  type PerformanceCatalog,
} from '@ssreporter/director';

async function fetchCatalog(url: string): Promise<PerformanceCatalog | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PerformanceCatalog;
  } catch {
    return null;
  }
}

export async function loadPerformanceCatalog(
  deckId: string,
): Promise<PerformanceCatalog> {
  let catalog = DEFAULT_PERFORMANCE_CATALOG;

  const persona = await fetchCatalog('/content/persona/performance.json');
  if (persona?.profiles) {
    catalog = mergePerformanceCatalogs(catalog, persona);
  }

  const deck = await fetchCatalog(
    `/content/decks/${encodeURIComponent(deckId)}/performance.json`,
  );
  if (deck?.profiles) {
    catalog = mergePerformanceCatalogs(catalog, deck);
  }

  return catalog;
}
