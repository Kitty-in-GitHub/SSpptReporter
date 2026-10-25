import {
  deckIdFromFileName,
  isValidDeckId,
  normalizeDeckId,
} from '@ssreporter/director';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UI_DECKS } from '../../constants/uiZh';
import {
  deleteDeck,
  fetchDeckLibrary,
  importDeckPdf,
  scaffoldDeck,
  type DeckSummary,
} from '../../lib/decks/deckLibraryApi';
import { AppToolbar } from '../present/AppToolbar';
import './deckLibrary.css';

interface DeckLibraryPanelProps {
  activeDeckId: string;
  onSwitchDeck: (deckId: string) => void;
  onOpenEditor: () => void;
  onOpenPresent: () => void;
  onToggleSettings: () => void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败';
}

export function DeckLibraryPanel({
  activeDeckId,
  onSwitchDeck,
  onOpenEditor,
  onOpenPresent,
  onToggleSettings,
}: DeckLibraryPanelProps) {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [devApi, setDevApi] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [busyDeckId, setBusyDeckId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [deckId, setDeckId] = useState('');
  const deckIdTouchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDeckLibrary();
      setDecks(result.decks);
      setDevApi(result.devApi);
    } catch (refreshError) {
      setError(describeError(refreshError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    setFile(picked);
    setError(null);
    setNotice(null);
    if (!picked) {
      return;
    }
    if (!picked.name.toLowerCase().endsWith('.pdf')) {
      setError(UI_DECKS.fileTypeError);
      setFile(null);
      return;
    }
    if (!title.trim()) {
      setTitle(picked.name.replace(/\.pdf$/i, ''));
    }
    if (!deckIdTouchedRef.current) {
      setDeckId(deckIdFromFileName(picked.name));
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError(UI_DECKS.needFile);
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(UI_DECKS.needTitle);
      return;
    }
    const normalizedId = normalizeDeckId(deckId);
    if (!normalizedId || !isValidDeckId(normalizedId)) {
      setError(`${UI_DECKS.needDeckId}（${UI_DECKS.deckIdHint}）`);
      return;
    }

    setIsImporting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await importDeckPdf({
        file,
        deckId: normalizedId,
        title: trimmedTitle,
      });
      onSwitchDeck(result.deckId);
      setNotice(
        `${UI_DECKS.importDone}：${result.deckId}（${result.pageCount} ${UI_DECKS.pagesSuffix}，${result.scriptActions} ${UI_DECKS.actionsSuffix}）`,
      );
      setFile(null);
      setTitle('');
      setDeckId('');
      deckIdTouchedRef.current = false;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refresh();
    } catch (importError) {
      setError(describeError(importError));
    } finally {
      setIsImporting(false);
    }
  };

  const handleScaffold = async (targetId: string) => {
    setBusyDeckId(targetId);
    setError(null);
    setNotice(null);
    try {
      const result = await scaffoldDeck(targetId);
      setNotice(
        `${UI_DECKS.scaffoldDone}：${result.createdSlides} 页新建，共 ${result.scriptActions} ${UI_DECKS.actionsSuffix}`,
      );
      await refresh();
    } catch (scaffoldError) {
      setError(describeError(scaffoldError));
    } finally {
      setBusyDeckId(null);
    }
  };

  const handleDelete = async (targetId: string) => {
    if (!window.confirm(UI_DECKS.deleteConfirm)) {
      return;
    }
    setBusyDeckId(targetId);
    setError(null);
    setNotice(null);
    try {
      await deleteDeck(targetId);
      if (targetId === activeDeckId) {
        onSwitchDeck('demo');
      }
      setNotice(`${UI_DECKS.deleted}：${targetId}`);
      await refresh();
    } catch (deleteError) {
      setError(describeError(deleteError));
    } finally {
      setBusyDeckId(null);
    }
  };

  return (
    <div className="deck-library">
      <AppToolbar
        onToggleSettings={onToggleSettings}
        title={UI_DECKS.title}
      />

      <div className="deck-library-body">
        <p className="deck-library-lead">{UI_DECKS.lead}</p>
        {!devApi ? (
          <p className="deck-library-notice is-warning">
            {UI_DECKS.devOnlyNotice}
          </p>
        ) : null}
        {error ? <p className="deck-library-error">{error}</p> : null}
        {notice ? <p className="deck-library-notice">{notice}</p> : null}

        <section className="deck-import-card">
          <h2 className="deck-import-title">{UI_DECKS.importTitle}</h2>
          <div className="deck-import-row">
            <label className="deck-import-field">
              <span>{UI_DECKS.fileLabel}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                disabled={!devApi || isImporting}
                onChange={handleFileChange}
              />
            </label>
            <label className="deck-import-field">
              <span>{UI_DECKS.titleLabel}</span>
              <input
                type="text"
                value={title}
                disabled={!devApi || isImporting}
                placeholder="我的答辩"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="deck-import-field">
              <span>{UI_DECKS.deckIdLabel}</span>
              <input
                type="text"
                value={deckId}
                disabled={!devApi || isImporting}
                placeholder="my_defense"
                onChange={(event) => {
                  deckIdTouchedRef.current = true;
                  setDeckId(event.target.value);
                }}
              />
            </label>
          </div>
          <p className="deck-import-hint">{UI_DECKS.deckIdHint}</p>
          <div className="deck-import-actions">
            <button
              type="button"
              className="deck-primary-button"
              disabled={!devApi || isImporting}
              onClick={() => void handleImport()}
            >
              {isImporting ? UI_DECKS.importing : UI_DECKS.importAction}
            </button>
            <button
              type="button"
              className="deck-secondary-button"
              disabled={isLoading}
              onClick={() => void refresh()}
            >
              {UI_DECKS.refresh}
            </button>
          </div>
        </section>

        <section className="deck-list">
          {decks.length === 0 && !isLoading ? (
            <p className="deck-list-empty">{UI_DECKS.empty}</p>
          ) : null}
          {decks.map((deck) => {
            const isActive = deck.id === activeDeckId;
            const isBusy = busyDeckId === deck.id;
            return (
              <article
                key={deck.id}
                className={`deck-card${isActive ? ' is-active' : ''}`}
              >
                <header className="deck-card-head">
                  <div>
                    <h3 className="deck-card-title">{deck.title}</h3>
                    <div className="deck-card-id">
                      {deck.id}
                      <span className="deck-card-kind">
                        {deck.isPrivate
                          ? UI_DECKS.privateLabel
                          : UI_DECKS.publicLabel}
                      </span>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="deck-active-badge">
                      {UI_DECKS.activeBadge}
                    </span>
                  ) : null}
                </header>

                <div className="deck-card-status">
                  <span
                    className={`deck-chip${deck.hasPdf ? ' is-ok' : ' is-missing'}`}
                  >
                    {deck.hasPdf ? UI_DECKS.hasPdf : UI_DECKS.noPdf}
                  </span>
                  <span className="deck-chip">
                    {deck.slidePages} {UI_DECKS.pagesSuffix}
                  </span>
                  <span className="deck-chip">
                    {deck.scriptActions} {UI_DECKS.actionsSuffix}
                  </span>
                </div>

                <div className="deck-card-actions">
                  <button
                    type="button"
                    className="deck-secondary-button"
                    disabled={isActive}
                    onClick={() => onSwitchDeck(deck.id)}
                  >
                    {UI_DECKS.switchAction}
                  </button>
                  <button
                    type="button"
                    className="deck-secondary-button"
                    onClick={() => {
                      onSwitchDeck(deck.id);
                      onOpenEditor();
                    }}
                  >
                    {UI_DECKS.editorAction}
                  </button>
                  <button
                    type="button"
                    className="deck-secondary-button"
                    onClick={() => {
                      onSwitchDeck(deck.id);
                      onOpenPresent();
                    }}
                  >
                    {UI_DECKS.presentAction}
                  </button>
                  <button
                    type="button"
                    className="deck-secondary-button"
                    disabled={!devApi || isBusy || !deck.hasPdf}
                    title={deck.hasPdf ? undefined : UI_DECKS.noPdf}
                    onClick={() => void handleScaffold(deck.id)}
                  >
                    {UI_DECKS.scaffoldAction}
                  </button>
                  <button
                    type="button"
                    className="deck-danger-button"
                    disabled={!devApi || isBusy || !deck.isPrivate}
                    onClick={() => void handleDelete(deck.id)}
                  >
                    {UI_DECKS.deleteAction}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
