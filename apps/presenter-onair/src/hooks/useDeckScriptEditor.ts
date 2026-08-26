import type { SlidePageDraft } from '@ssreporter/director';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  compileDeckOnDisk,
  loadSlidePageDraftFromDisk,
  normalizeStoredPageDraft,
  saveSlidePageToDisk,
} from '../lib/content/slideScriptApi';
import {
  clearSlideDraft,
  loadSlideDraft,
  saveSlideDraft,
} from '../lib/content/slideScriptStorage';

function draftsEqual(a: SlidePageDraft, b: SlidePageDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useDeckScriptEditor(deckId: string, pageCount: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDraft, setPageDraft] = useState<SlidePageDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<SlidePageDraft | null>(null);
  const [activeBeatIndex, setActiveBeatIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loadTokenRef = useRef(0);

  const isDirty =
    pageDraft !== null &&
    savedDraft !== null &&
    !draftsEqual(pageDraft, savedDraft);

  const loadPage = useCallback(
    async (page: number) => {
      const token = loadTokenRef.current + 1;
      loadTokenRef.current = token;
      setIsLoading(true);
      setError(null);
      setStatus(`加载第 ${page} 页…`);

      try {
        const diskDraft = await loadSlidePageDraftFromDisk(deckId, page);
        if (loadTokenRef.current !== token) {
          return;
        }

        const localDraft = normalizeStoredPageDraft(
          deckId,
          page,
          loadSlideDraft(deckId, page),
        );
        const nextDraft = localDraft ?? diskDraft;
        setPageDraft(nextDraft);
        setSavedDraft(diskDraft);
        setCurrentPage(page);
        setActiveBeatIndex(0);
        setStatus(
          localDraft && !draftsEqual(localDraft, diskDraft)
            ? '已恢复本地草稿（未保存到磁盘）'
            : '',
        );
      } catch (err) {
        if (loadTokenRef.current !== token) {
          return;
        }
        setError(err instanceof Error ? err.message : '加载失败');
        setStatus('');
      } finally {
        if (loadTokenRef.current === token) {
          setIsLoading(false);
        }
      }
    },
    [deckId],
  );

  useEffect(() => {
    if (pageCount > 0) {
      void loadPage(1);
    }
  }, [deckId, loadPage, pageCount]);

  useEffect(() => {
    if (!pageDraft || !isDirty) {
      return;
    }
    saveSlideDraft(deckId, pageDraft);
  }, [deckId, pageDraft, isDirty]);

  const updatePageDraft = useCallback((patch: Partial<SlidePageDraft>) => {
    setPageDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setStatus('');
  }, []);

  const updateBeat = useCallback(
    (beatIndex: number, patch: Partial<SlidePageDraft['beats'][number]>) => {
      setPageDraft((prev) => {
        if (!prev) {
          return prev;
        }
        const beats = prev.beats.map((beat, index) =>
          index === beatIndex ? { ...beat, ...patch } : beat,
        );
        return { ...prev, beats };
      });
      setStatus('');
    },
    [],
  );

  const addBeat = useCallback(() => {
    setPageDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const beatIndex = prev.beats.length;
      return {
        ...prev,
        beats: [
          ...prev.beats,
          {
            utterance: '',
            emotion: 'neutral',
            gesture: 'nod',
            camera: 'bust',
            action_id: `p${String(prev.page).padStart(2, '0')}-b${String(
              beatIndex + 1,
            ).padStart(2, '0')}`,
          },
        ],
      };
    });
    setActiveBeatIndex((prev) => prev + 1);
    setStatus('');
  }, []);

  const removeBeat = useCallback((beatIndex: number) => {
    setPageDraft((prev) => {
      if (!prev || prev.beats.length <= 1) {
        return prev;
      }
      const beats = prev.beats.filter((_, index) => index !== beatIndex);
      return { ...prev, beats };
    });
    setActiveBeatIndex((prev) => Math.max(0, prev - (beatIndex <= prev ? 1 : 0)));
    setStatus('');
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const safePage =
        pageCount > 0
          ? Math.min(pageCount, Math.max(1, page))
          : Math.max(1, page);
      if (safePage === currentPage) {
        return;
      }
      void loadPage(safePage);
    },
    [currentPage, loadPage, pageCount],
  );

  const saveCurrentPage = useCallback(async () => {
    if (!pageDraft) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setStatus('保存中…');
    try {
      await saveSlidePageToDisk(deckId, pageDraft);
      clearSlideDraft(deckId, pageDraft.page);
      setSavedDraft(pageDraft);
      setStatus(`第 ${pageDraft.page} 页已保存`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      setStatus('');
    } finally {
      setIsSaving(false);
    }
  }, [deckId, pageDraft]);

  const saveAndCompile = useCallback(async () => {
    if (!pageDraft) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setStatus('保存并编译…');
    try {
      await saveSlidePageToDisk(deckId, pageDraft);
      clearSlideDraft(deckId, pageDraft.page);
      setSavedDraft(pageDraft);
      const result = await compileDeckOnDisk(deckId);
      setStatus(`已保存并编译（${result.count} 条）`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存/编译失败');
      setStatus('');
    } finally {
      setIsSaving(false);
    }
  }, [deckId, pageDraft]);

  const discardLocalDraft = useCallback(() => {
    if (!pageDraft) {
      return;
    }
    clearSlideDraft(deckId, pageDraft.page);
    void loadPage(pageDraft.page);
  }, [deckId, pageDraft, loadPage]);

  const activeBeat = pageDraft?.beats[activeBeatIndex] ?? null;

  return {
    currentPage,
    pageDraft,
    activeBeatIndex,
    activeBeat,
    isDirty,
    isLoading,
    isSaving,
    status,
    error,
    updatePageDraft,
    updateBeat,
    addBeat,
    removeBeat,
    setActiveBeatIndex,
    goToPage,
    saveCurrentPage,
    saveAndCompile,
    discardLocalDraft,
    reloadCurrentPage: () => void loadPage(currentPage),
  };
}

export type DeckScriptEditorController = ReturnType<typeof useDeckScriptEditor>;
