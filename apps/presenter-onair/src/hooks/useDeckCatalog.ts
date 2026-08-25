import { useEffect, useState } from 'react';
import {
  fetchDeckCatalog,
  type DeckCatalogEntry,
} from '../lib/content/loadDeckCatalog';

export function useDeckCatalog() {
  const [decks, setDecks] = useState<DeckCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchDeckCatalog()
      .then((entries) => {
        if (!cancelled) {
          setDecks(entries);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '加载场次失败',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { decks, loading, error };
}
