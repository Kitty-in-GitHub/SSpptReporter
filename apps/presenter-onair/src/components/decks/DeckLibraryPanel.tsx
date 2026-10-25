import {
  deckIdFromFileName,
  isValidDeckId,
  normalizeDeckId,
} from '@ssreporter/director';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/** 点「更多」菜单里的动作后顺手收起菜单。 */
function closeMenu(event: React.MouseEvent<HTMLButtonElement>) {
  const details = event.currentTarget.closest('details');
  if (details) {
    details.open = false;
  }
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
  const [highlightDeckId, setHighlightDeckId] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [deckId, setDeckId] = useState('');
  const deckIdTouchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedId = normalizeDeckId(deckId);
  const idValid = isValidDeckId(normalizedId);
  const idExists = useMemo(
    () => decks.some((deck) => deck.id === normalizedId),
    [decks, normalizedId],
  );
  const canImport =
    devApi &&
    Boolean(file) &&
    title.trim().length > 0 &&
    idValid &&
    !idExists &&
    !isImporting;

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

  const resetForm = useCallback(() => {
    setFile(null);
    setTitle('');
    setDeckId('');
    deckIdTouchedRef.current = false;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    setError(null);
    setNotice(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (!picked.name.toLowerCase().endsWith('.pdf')) {
      setError(UI_DECKS.fileTypeError);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setFile(picked);
    if (!title.trim()) {
      setTitle(picked.name.replace(/\.pdf$/i, ''));
    }
    if (!deckIdTouchedRef.current) {
      setDeckId(deckIdFromFileName(picked.name));
    }
  };

  const handleImport = async () => {
    if (!canImport || !file) {
      return;
    }
    setIsImporting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await importDeckPdf({
        file,
        deckId: normalizedId,
        title: title.trim(),
      });
      onSwitchDeck(result.deckId);
      setNotice(
        `${UI_DECKS.importDone}：${result.deckId}（${result.pageCount} ${UI_DECKS.pagesSuffix}，${result.scriptActions} ${UI_DECKS.actionsSuffix}）`,
      );
      setHighlightDeckId(result.deckId);
      resetForm();
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
        `${UI_DECKS.scaffoldDone}：新建 ${result.createdSlides} 页，共 ${result.scriptActions} ${UI_DECKS.actionsSuffix}`,
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

  const hasFormContent = Boolean(file) || Boolean(title) || Boolean(deckId);

  return (
    <div className="deck-library">
      <AppToolbar onToggleSettings={onToggleSettings} title={UI_DECKS.title} />

      <div className="deck-library-body">
        {!devApi ? (
          <p className="deck-banner is-warning">{UI_DECKS.devOnlyNotice}</p>
        ) : null}
        {error ? <p className="deck-banner is-error">{error}</p> : null}
        {notice ? <p className="deck-banner is-success">{notice}</p> : null}

        <div className="deck-library-columns">
          <section className="deck-import-card" aria-labelledby="deck-import-title">
            <h2 className="deck-section-title" id="deck-import-title">
              {UI_DECKS.importTitle}
            </h2>
            <p className="deck-import-hint">{UI_DECKS.importHint}</p>

            <label className={`deck-file-drop${file ? ' has-file' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                disabled={!devApi || isImporting}
                onChange={handleFileChange}
              />
              <span className="deck-file-name">
                {file ? file.name : UI_DECKS.noFile}
              </span>
              <span className="deck-file-action">{UI_DECKS.fileLabel}</span>
            </label>

            <label className="deck-field">
              <span>{UI_DECKS.titleLabel}</span>
              <input
                type="text"
                value={title}
                disabled={!devApi || isImporting}
                placeholder="我的答辩"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="deck-field">
              <span>{UI_DECKS.deckIdLabel}</span>
              <input
                type="text"
                value={deckId}
                disabled={!devApi || isImporting}
                placeholder="my_defense"
                aria-invalid={deckId.length > 0 && (!idValid || idExists)}
                onChange={(event) => {
                  deckIdTouchedRef.current = true;
                  setDeckId(event.target.value);
                }}
              />
            </label>
            <p className="deck-field-hint">{UI_DECKS.deckIdHint}</p>
            {deckId.length > 0 && !idValid ? (
              <p className="deck-field-error">{UI_DECKS.deckIdInvalid}</p>
            ) : null}
            {idExists ? (
              <p className="deck-field-error">{UI_DECKS.deckIdExists}</p>
            ) : null}

            <div className="deck-import-actions">
              <button
                type="button"
                className="deck-primary-button"
                disabled={!canImport}
                onClick={() => void handleImport()}
              >
                {isImporting ? UI_DECKS.importing : UI_DECKS.importAction}
              </button>
              <button
                type="button"
                className="deck-ghost-button"
                disabled={!hasFormContent || isImporting}
                onClick={resetForm}
              >
                {UI_DECKS.reset}
              </button>
            </div>
          </section>

          <section className="deck-list-section" aria-labelledby="deck-list-title">
            <header className="deck-list-header">
              <h2 className="deck-section-title" id="deck-list-title">
                {UI_DECKS.listTitle}
                <span className="deck-list-count">
                  {UI_DECKS.countPrefix}
                  {decks.length}
                  {UI_DECKS.countSuffix}
                </span>
              </h2>
              <button
                type="button"
                className="deck-ghost-button"
                disabled={isLoading}
                onClick={() => void refresh()}
              >
                {isLoading ? UI_DECKS.refreshing : UI_DECKS.refresh}
              </button>
            </header>

            {decks.length === 0 && !isLoading ? (
              <p className="deck-list-empty">{UI_DECKS.empty}</p>
            ) : (
              <div className="deck-list">
                {decks.map((deck) => {
                  const isActive = deck.id === activeDeckId;
                  const isBusy = busyDeckId === deck.id;
                  const isNew = highlightDeckId === deck.id;
                  return (
                    <article
                      key={deck.id}
                      className={`deck-card${isActive ? ' is-active' : ''}${
                        isNew ? ' is-new' : ''
                      }`}
                      aria-busy={isBusy}
                    >
                      <header className="deck-card-head">
                        <div className="deck-card-heading">
                          <h3 className="deck-card-title">{deck.title}</h3>
                          <div className="deck-card-meta">
                            <code className="deck-card-id">{deck.id}</code>
                            <span
                              className={`deck-tag${
                                deck.isPrivate ? ' is-private' : ' is-public'
                              }`}
                            >
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
                        ) : (
                          <button
                            type="button"
                            className="deck-link-button"
                            disabled={isBusy}
                            onClick={() => onSwitchDeck(deck.id)}
                          >
                            {UI_DECKS.setActive}
                          </button>
                        )}
                      </header>

                      <div className="deck-card-chips">
                        <span
                          className={`deck-chip${deck.hasPdf ? ' is-ok' : ' is-missing'}`}
                        >
                          {deck.hasPdf ? UI_DECKS.hasPdf : UI_DECKS.noPdf}
                        </span>
                        <span className="deck-chip">
                          {deck.slidePages} {UI_DECKS.pagesSuffix}
                        </span>
                        <span
                          className={`deck-chip${deck.scriptActions > 0 ? '' : ' is-warning'}`}
                        >
                          {deck.scriptActions > 0
                            ? `${deck.scriptActions} ${UI_DECKS.actionsSuffix}`
                            : UI_DECKS.uncompiled}
                        </span>
                      </div>

                      <footer className="deck-card-actions">
                        {isBusy ? (
                          <span className="deck-card-busy">
                            {UI_DECKS.busy}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="deck-primary-button"
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
                            <details className="deck-more">
                              <summary>{UI_DECKS.more}</summary>
                              <div className="deck-more-menu">
                                <button
                                  type="button"
                                  className="deck-secondary-button"
                                  disabled={!devApi || !deck.hasPdf}
                                  title={
                                    deck.hasPdf
                                      ? undefined
                                      : UI_DECKS.scaffoldNoPdfHint
                                  }
                                  onClick={() => void handleScaffold(deck.id)}
                                >
                                  {UI_DECKS.scaffoldAction}
                                </button>
                                <button
                                  type="button"
                                  className="deck-danger-button"
                                  disabled={!devApi || !deck.isPrivate}
                                  onClick={(event) => {
                                    closeMenu(event);
                                    void handleDelete(deck.id);
                                  }}
                                >
                                  {UI_DECKS.deleteAction}
                                </button>
                              </div>
                            </details>
                          </>
                        )}
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
