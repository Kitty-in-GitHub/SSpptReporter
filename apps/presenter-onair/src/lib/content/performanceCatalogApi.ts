import type { PerformanceCatalog } from '@ssreporter/director';

export async function loadDeckPerformanceOverlay(
  deckId: string,
): Promise<PerformanceCatalog> {
  try {
    const response = await fetch(
      `/content/decks/${encodeURIComponent(deckId)}/performance.json`,
    );
    if (!response.ok) {
      return { profiles: {} };
    }
    const data = (await response.json()) as PerformanceCatalog;
    return data?.profiles ? data : { profiles: {} };
  } catch {
    return { profiles: {} };
  }
}

export async function saveDeckPerformanceOverlay(
  deckId: string,
  overlay: PerformanceCatalog,
): Promise<void> {
  const response = await fetch(
    `/api/content/decks/${encodeURIComponent(deckId)}/performance`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overlay),
    },
  );
  const payload = (await response.json()) as { ok?: boolean; message?: string };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? `保存 performance.json 失败 (${response.status})`);
  }
}
