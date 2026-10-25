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
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败';
}

function deckDirectory(deck: DeckSummary): string {
  return `${deck.isPrivate ? 'content-private' : 'content'}/decks/${deck.id}`;
}

export function DeckLibraryPanel({
  activeDeckId,
  onSwitchDeck,
}: DeckLibraryPanelProps) {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [devApi, setDevApi] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [busyDeckId, setBusyDeckId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [highlightDeckId, setHighlightDeckId] = useState<string | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedDeck =
    decks.find((deck) => deck.id === selectedDeckId) ??
    decks.find((deck) => deck.id === activeDeckId) ??
    decks[0] ??
    null;

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

  // 选中项直接由 selectedDeckId 派生：无效（未选/已删）时回落到当前场次或第一项，
  // 不需要在 effect 里补写 state。

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
      setNotice(`${UI_DECKS.importDone}：${result.title ?? result.deckId}`);
      setHighlightDeckId(result.deckId);
      setSelectedDeckId(result.deckId);
      await refresh();
    } catch (importError) {
      setError(describeError(importError));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (deck: DeckSummary) => {
    if (!window.confirm(UI_DECKS.deleteConfirm)) {
      return;
    }
    setBusyDeckId(deck.id);
    setError(null);
    setNotice(null);
    try {
      await deleteDeck(deck.id);
      if (deck.id === activeDeckId) {
        onSwitchDeck('demo');
      }
      setNotice(`${UI_DECKS.deleted}：${deck.title}`);
      setSelectedDeckId('');
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

  const submitRename = async (deck: DeckSummary) => {
    const title = renameValue.trim();
    if (!title) {
      return;
    }
    setBusyDeckId(deck.id);
    setError(null);
    setNotice(null);
    try {
      await renameDeckTitle(deck.id, title);
      setNotice(`${UI_DECKS.renamed}：${title}`);
      cancelRename();
      await refresh();
    } catch (renameError) {
      setError(describeError(renameError));
    } finally {
      setBusyDeckId(null);
    }
  };

  const isRenamingSelected = selectedDeck !== null && renamingId === selectedDeck.id;
  const isBusy = selectedDeck !== null && busyDeckId === selectedDeck.id;

  return (
    <div className="deck-library">
      <AppToolbar title={UI_DECKS.title} />

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

        <div className="deck-library-columns">
          <nav className="deck-list" aria-label={UI_DECKS.listTitle}>
            {decks.length === 0 && !isLoading ? (
              <p className="deck-list-empty">{UI_DECKS.empty}</p>
            ) : (
              decks.map((deck) => {
                const isActive = deck.id === activeDeckId;
                const isSelected = selectedDeck?.id === deck.id;
                const isNew = highlightDeckId === deck.id;
                return (
                  <button
                    key={deck.id}
                    type="button"
                    className={`deck-row${isSelected ? ' is-selected' : ''}${
                      isNew ? ' is-new' : ''
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => setSelectedDeckId(deck.id)}
                  >
                    <span className="deck-row-title">{deck.title}</span>
                    <span className="deck-row-meta">
                      {deck.id} ·{' '}
                      {deck.isPrivate ? UI_DECKS.privateLabel : UI_DECKS.publicLabel}
                      {isActive ? ` · ${UI_DECKS.activeBadge}` : ''}
                    </span>
                  </button>
                );
              })
            )}
          </nav>

          <section className="deck-detail" aria-label={UI_DECKS.detailTitle}>
            {selectedDeck ? (
              <>
                <header className="deck-detail-head">
                  {isRenamingSelected ? (
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
                            void submitRename(selectedDeck);
                          } else if (event.key === 'Escape') {
                            cancelRename();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="deck-primary-button"
                        disabled={isBusy || !renameValue.trim()}
                        onClick={() => void submitRename(selectedDeck)}
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
                    <div className="deck-detail-title-row">
                      <h3 className="deck-detail-title">{selectedDeck.title}</h3>
                      <button
                        type="button"
                        className="deck-icon-button deck-rename-trigger"
                        aria-label={UI_DECKS.renameAction}
                        title={UI_DECKS.renameAction}
                        disabled={!devApi || isBusy}
                        onClick={() => startRename(selectedDeck)}
                      >
                        ✎
                      </button>
                      {selectedDeck.id === activeDeckId ? (
                        <span className="deck-active-badge">
                          {UI_DECKS.activeBadge}
                        </span>
                      ) : null}
                    </div>
                  )}
                </header>

                <dl className="deck-detail-props">
                  <div className="deck-prop">
                    <dt>{UI_DECKS.propId}</dt>
                    <dd>
                      <code>{selectedDeck.id}</code>
                    </dd>
                  </div>
                  <div className="deck-prop">
                    <dt>{UI_DECKS.propType}</dt>
                    <dd>
                      {selectedDeck.isPrivate
                        ? UI_DECKS.privateLabel
                        : UI_DECKS.publicLabel}
                    </dd>
                  </div>
                  <div className="deck-prop">
                    <dt>{UI_DECKS.propDir}</dt>
                    <dd>
                      <code>{deckDirectory(selectedDeck)}</code>
                    </dd>
                  </div>
                </dl>

                <footer className="deck-detail-actions">
                  {isBusy ? (
                    <span className="deck-card-busy">{UI_DECKS.busy}</span>
                  ) : (
                    <button
                      type="button"
                      className="deck-icon-button deck-delete-trigger"
                      aria-label={UI_DECKS.deleteAction}
                      title={
                        selectedDeck.isPrivate
                          ? UI_DECKS.deleteAction
                          : UI_DECKS.deletePublicHint
                      }
                      disabled={!devApi || !selectedDeck.isPrivate}
                      onClick={() => void handleDelete(selectedDeck)}
                    >
                      🗑
                    </button>
                  )}
                </footer>
              </>
            ) : (
              <p className="deck-detail-empty">{UI_DECKS.detailEmpty}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
