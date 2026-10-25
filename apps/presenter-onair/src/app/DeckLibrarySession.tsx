import { DeckLibraryPanel } from '../components/decks/DeckLibraryPanel';
import type { useSettings } from '../hooks/useSettings';

type SettingsHook = ReturnType<typeof useSettings>;

interface DeckLibrarySessionProps {
  settingsHook: SettingsHook;
}

export function DeckLibrarySession({ settingsHook }: DeckLibrarySessionProps) {
  return (
    <DeckLibraryPanel
      activeDeckId={settingsHook.settings.present.activeDeckId || 'demo'}
      onSwitchDeck={settingsHook.updatePresentActiveDeckId}
    />
  );
}
