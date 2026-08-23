import type { SlideAction } from '@ssreporter/director';
import { useCallback, useEffect, useRef, useState } from 'react';
import { applySlideAction } from '../lib/present/applySlideAction';
import { loadDeckManifest } from '../lib/present/loadDeck';
import type { DeckManifest } from '../types/present';

function resolveDeckId(deckId?: string | null): string {
  const trimmed = (deckId ?? '').trim();
  return trimmed || 'demo';
}

export function useSlideDeck(activeDeckId?: string | null) {
  const deckId = resolveDeckId(activeDeckId);
  const [deck, setDeck] = useState<DeckManifest | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pageCountRef = useRef(0);
  const currentPageRef = useRef(1);

  const syncPageCount = useCallback((count: number) => {
    pageCountRef.current = count;
    setPageCount(count);
    if (count > 0 && currentPageRef.current > count) {
      currentPageRef.current = count;
      setCurrentPage(count);
    }
  }, []);

  const goToPage = useCallback((page: number) => {
    const next = pageCountRef.current > 0
      ? Math.min(pageCountRef.current, Math.max(1, page))
      : Math.max(1, page);
    currentPageRef.current = next;
    setCurrentPage(next);
  }, []);

  const nextPage = useCallback(() => {
    goToPage(currentPageRef.current + 1);
  }, [goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPageRef.current - 1);
  }, [goToPage]);

  const applyDirectorSlideAction = useCallback((slideAction: SlideAction) => {
    const next = applySlideAction(
      currentPageRef.current,
      pageCountRef.current,
      slideAction,
    );
    goToPage(next);
  }, [goToPage]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setDeck(null);
    syncPageCount(0);
    currentPageRef.current = 1;
    setCurrentPage(1);

    void loadDeckManifest(deckId)
      .then((manifest) => {
        if (cancelled) {
          return;
        }
        setDeck(manifest);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : '加载幻灯失败',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deckId, syncPageCount]);

  return {
    deck,
    pdfUrl: deck?.slideSource.url ?? null,
    pageCount,
    currentPage,
    loadError,
    isLoading,
    goToPage,
    nextPage,
    prevPage,
    applyDirectorSlideAction,
    syncPageCount,
  };
}

export type SlideDeckController = ReturnType<typeof useSlideDeck>;
