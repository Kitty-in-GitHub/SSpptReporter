import {
  type DirectorAction,
  type PerformanceCatalog,
  resolveBeatPerformance,
} from '@ssreporter/director';
import { useEffect, useState } from 'react';
import { loadPerformanceCatalog } from '../lib/content/loadPerformanceCatalog';

export function usePerformanceCatalog(deckId: string) {
  const [catalog, setCatalog] = useState<PerformanceCatalog | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPerformanceCatalog(deckId).then((loaded) => {
      if (!cancelled) {
        setCatalog(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const resolvePerformance = (action: DirectorAction) =>
    resolveBeatPerformance(action, catalog ?? undefined);

  return { catalog, resolvePerformance };
}
