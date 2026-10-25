import { DeckLibraryPanel } from '../components/decks/DeckLibraryPanel';
import type { useSettings } from '../hooks/useSettings';

type SettingsHook = ReturnType<typeof useSettings>;

interface DeckLibrarySessionProps {
  settingsHook: SettingsHook;
  onToggleSettings: () => void;
}

export function DeckLibrarySession({
  settingsHook,
  onToggleSettings,
}: DeckLibrarySessionProps) {
  return (
    <DeckLibraryPanel
      activeDeckId={settingsHook.settings.present.activeDeckId || 'demo'}
      onSwitchDeck={settingsHook.updatePresentActiveDeckId}
      onOpenEditor={() => settingsHook.updatePresentSessionMode('edit')}
      onOpenPresent={() => settingsHook.updatePresentSessionMode('present')}
      onToggleSettings={onToggleSettings}
    />
  );
}
