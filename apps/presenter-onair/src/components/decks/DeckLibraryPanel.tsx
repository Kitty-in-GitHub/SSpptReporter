import { useCallback, useEffect, useRef, useState } from 'react';
import { UI_DECKS } from '../../constants/uiZh';
import {
  deleteDeck,
  fetchDeckLibrary,
  importDeckPdf,
  renameDeckTitle,
  type DeckSummary,
} from '../../lib/decks/deckLibraryApi';
import { AppToolbar } from '../present/AppToolbar';
import './deckLibrary.css';

interface DeckLibraryPanelProps {
  activeDeckId: string;
  onSwitchDeck: (deckId: string) => void;
  onToggleSettings: () => void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败';
}

export function DeckLibraryPanel({
  activeDeckId,
  onSwitchDeck,
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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
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

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError(UI_DECKS.fileTypeError);
      return;
    }

    setIsImporting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await importDeckPdf({ file });
      setNotice(
        `${UI_DECKS.importDone}：${result.title ?? result.deckId}（${result.pageCount} ${UI_DECKS.pagesSuffix}，${result.scriptActions} ${UI_DECKS.actionsSuffix}）`,
      );
      setHighlightDeckId(result.deckId);
      await refresh();
    } catch (importError) {
      setError(describeError(importError));
    } finally {
      setIsImporting(false);
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

  const startRename = (deck: DeckSummary) => {
    setRenamingId(deck.id);
    setRenameValue(deck.title);
    setError(null);
    setNotice(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const submitRename = async (deckId: string) => {
    const title = renameValue.trim();
    if (!title) {
      return;
    }
    setBusyDeckId(deckId);
    setError(null);
    setNotice(null);
    try {
      await renameDeckTitle(deckId, title);
      setNotice(`${UI_DECKS.renamed}：${title}`);
      cancelRename();
      await refresh();
    } catch (renameError) {
      setError(describeError(renameError));
    } finally {
      setBusyDeckId(null);
    }
  };

  return (
    <div className="deck-library">
      <AppToolbar onToggleSettings={onToggleSettings} title={UI_DECKS.title} />

      <div className="deck-library-body">
        {!devApi ? (
          <p className="deck-banner is-warning">{UI_DECKS.devOnlyNotice}</p>
        ) : null}
        {error ? <p className="deck-banner is-error">{error}</p> : null}
        {notice ? <p className="deck-banner is-success">{notice}</p> : null}

        <header className="deck-list-header">
          <h2 className="deck-section-title">
            {UI_DECKS.listTitle}
            <span className="deck-list-count">
              {UI_DECKS.countPrefix}
              {decks.length}
              {UI_DECKS.countSuffix}
            </span>
          </h2>
          <div className="deck-list-actions">
            <button
              type="button"
              className="deck-primary-button"
              disabled={!devApi || isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              {isImporting ? UI_DECKS.importing : UI_DECKS.importAction}
            </button>
            <button
              type="button"
              className="deck-ghost-button"
              disabled={isLoading}
              onClick={() => void refresh()}
            >
              {isLoading ? UI_DECKS.refreshing : UI_DECKS.refresh}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={(event) => void handleImportFile(event)}
            />
          </div>
        </header>

        {decks.length === 0 && !isLoading ? (
          <p className="deck-list-empty">{UI_DECKS.empty}</p>
        ) : (
          <div className="deck-list">
            {decks.map((deck) => {
              const isActive = deck.id === activeDeckId;
              const isBusy = busyDeckId === deck.id;
              const isNew = highlightDeckId === deck.id;
              const isRenaming = renamingId === deck.id;
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
                      {isRenaming ? (
                        <div className="deck-rename-form">
                          <input
                            type="text"
                            value={renameValue}
                            maxLength={80}
                            placeholder={UI_DECKS.renamePlaceholder}
                            autoFocus
                            onChange={(event) => setRenameValue(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                void submitRename(deck.id);
                              } else if (event.key === 'Escape') {
                                cancelRename();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="deck-primary-button"
                            disabled={isBusy || !renameValue.trim()}
                            onClick={() => void submitRename(deck.id)}
                          >
                            {UI_DECKS.renameSave}
                          </button>
                          <button
                            type="button"
                            className="deck-ghost-button"
                            disabled={isBusy}
                            onClick={cancelRename}
                          >
                            {UI_DECKS.renameCancel}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="deck-card-title-row">
                            <h3 className="deck-card-title">{deck.title}</h3>
                            <button
                              type="button"
                              className="deck-icon-button deck-rename-trigger"
                              aria-label={UI_DECKS.renameAction}
                              title={UI_DECKS.renameAction}
                              disabled={!devApi || isBusy}
                              onClick={() => startRename(deck)}
                            >
                              ✎
                            </button>
                          </div>
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
                        </>
                      )}
                    </div>
                    {isActive && !isRenaming ? (
                      <span className="deck-active-badge">
                        {UI_DECKS.activeBadge}
                      </span>
                    ) : null}
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
                      <span className="deck-card-busy">{UI_DECKS.busy}</span>
                    ) : (
                      <button
                        type="button"
                        className="deck-icon-button deck-delete-trigger"
                        aria-label={UI_DECKS.deleteAction}
                        title={
                          deck.isPrivate
                            ? UI_DECKS.deleteAction
                            : UI_DECKS.deletePublicHint
                        }
                        disabled={!devApi || !deck.isPrivate}
                        onClick={() => void handleDelete(deck.id)}
                      >
                        🗑
                      </button>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
