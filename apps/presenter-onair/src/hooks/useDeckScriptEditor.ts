import type { SlideScriptDraft } from '@ssreporter/director';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  compileDeckOnDisk,
  loadSlideDraftFromDisk,
  saveSlideToDisk,
} from '../lib/content/slideScriptApi';
import {
  clearSlideDraft,
  loadSlideDraft,
  saveSlideDraft,
} from '../lib/content/slideScriptStorage';

function draftsEqual(a: SlideScriptDraft, b: SlideScriptDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useDeckScriptEditor(deckId: string, pageCount: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const [draft, setDraft] = useState<SlideScriptDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<SlideScriptDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loadTokenRef = useRef(0);

  const isDirty =
    draft !== null && savedDraft !== null && !draftsEqual(draft, savedDraft);

  const loadPage = useCallback(
    async (page: number) => {
      const token = loadTokenRef.current + 1;
      loadTokenRef.current = token;
      setIsLoading(true);
      setError(null);
      setStatus(`加载第 ${page} 页…`);

      try {
        const diskDraft = await loadSlideDraftFromDisk(deckId, page);
        if (loadTokenRef.current !== token) {
          return;
        }

        const localDraft = loadSlideDraft(deckId, page);
        const nextDraft = localDraft ?? diskDraft;
        setDraft(nextDraft);
        setSavedDraft(diskDraft);
        setCurrentPage(page);
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
    if (!draft || !isDirty) {
      return;
    }
    saveSlideDraft(deckId, draft);
  }, [deckId, draft, isDirty]);

  const updateDraft = useCallback((patch: Partial<SlideScriptDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setStatus('');
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const safePage = pageCount > 0
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
    if (!draft) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setStatus('保存中…');
    try {
      await saveSlideToDisk(deckId, draft);
      clearSlideDraft(deckId, draft.page);
      setSavedDraft(draft);
      setStatus(`第 ${draft.page} 页已保存`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      setStatus('');
    } finally {
      setIsSaving(false);
    }
  }, [deckId, draft]);

  const saveAndCompile = useCallback(async () => {
    if (!draft) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setStatus('保存并编译…');
    try {
      await saveSlideToDisk(deckId, draft);
      clearSlideDraft(deckId, draft.page);
      setSavedDraft(draft);
      const result = await compileDeckOnDisk(deckId);
      setStatus(`已保存并编译（${result.count} 条）`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存/编译失败');
      setStatus('');
    } finally {
      setIsSaving(false);
    }
  }, [deckId, draft]);

  const discardLocalDraft = useCallback(() => {
    if (!draft) {
      return;
    }
    clearSlideDraft(deckId, draft.page);
    void loadPage(draft.page);
  }, [deckId, draft, loadPage]);

  return {
    currentPage,
    draft,
    isDirty,
    isLoading,
    isSaving,
    status,
    error,
    updateDraft,
    goToPage,
    saveCurrentPage,
    saveAndCompile,
    discardLocalDraft,
    reloadCurrentPage: () => void loadPage(currentPage),
  };
}

export type DeckScriptEditorController = ReturnType<typeof useDeckScriptEditor>;
