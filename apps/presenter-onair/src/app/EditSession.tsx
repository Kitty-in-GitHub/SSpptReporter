import { ScriptEditorShell } from '../components/present/ScriptEditorShell';
import { useDeckScriptEditor } from '../hooks/useDeckScriptEditor';
import { useSlideDeck } from '../hooks/useSlideDeck';
import type { useSettings } from '../hooks/useSettings';

type SettingsHook = ReturnType<typeof useSettings>;

interface EditSessionProps {
  settingsHook: SettingsHook;
  onToggleSettings: () => void;
}

export function EditSession({ settingsHook, onToggleSettings }: EditSessionProps) {
  const activeDeckId = settingsHook.settings.present.activeDeckId || 'demo';
  const slideDeck = useSlideDeck(settingsHook.settings.present.activeDeckId);
  const scriptEditor = useDeckScriptEditor(
    settingsHook.settings.present.activeDeckId,
    slideDeck.pageCount,
  );

  return (
    <ScriptEditorShell
      slideDeck={slideDeck}
      editor={scriptEditor}
      deckId={activeDeckId}
      onSessionModeChange={settingsHook.updatePresentSessionMode}
      onToggleSettings={onToggleSettings}
    />
  );
}
