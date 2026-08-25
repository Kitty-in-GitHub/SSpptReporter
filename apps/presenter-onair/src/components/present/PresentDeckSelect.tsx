import { UI_PRESENT } from '../../constants/uiZh';
import { useDeckCatalog } from '../../hooks/useDeckCatalog';

interface PresentDeckSelectProps {
  activeDeckId: string;
  onDeckChange: (deckId: string) => void;
  disabled?: boolean;
}

export function PresentDeckSelect({
  activeDeckId,
  onDeckChange,
  disabled,
}: PresentDeckSelectProps) {
  const catalog = useDeckCatalog();

  return (
    <label className="present-deck-select">
      <span className="present-deck-select-label">{UI_PRESENT.deckLabel}</span>
      <select
        className="present-deck-select-input"
        value={activeDeckId}
        disabled={disabled || catalog.loading}
        onChange={(event) => onDeckChange(event.target.value)}
        title={catalog.error ?? undefined}
      >
        {catalog.decks.map((deck) => (
          <option key={deck.id} value={deck.id}>
            {deck.title}
            {deck.isPrivate ? UI_PRESENT.deckPrivateSuffix : ''}
          </option>
        ))}
        {!catalog.decks.length && !catalog.loading ? (
          <option value={activeDeckId}>{activeDeckId}</option>
        ) : null}
      </select>
    </label>
  );
}
