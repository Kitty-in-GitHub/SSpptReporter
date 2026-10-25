import { useEffect, useState } from 'react';
import { SettingsPanel, type SettingsCategory } from '../components/SettingsPanel';
import { AppToolbar } from '../components/present/AppToolbar';
import { UI_SETTINGS } from '../constants/uiZh';
import type { useScreenVisionController } from '../hooks/useScreenVisionController';
import type { useSettings } from '../hooks/useSettings';
import { useResolvedVrmModel } from '../hooks/useResolvedVrmModel';
import { DEFAULT_VRM_MODEL_ID } from '../lib/vrm/vrmModelCatalog';
import './settingsSession.css';

type SettingsHook = ReturnType<typeof useSettings>;
type ScreenVisionController = ReturnType<typeof useScreenVisionController>;

interface SettingsSessionProps {
  settingsHook: SettingsHook;
  isProcessing: boolean;
  backgroundImageUrl: string | null;
  streamErrorMessage: string;
  screenVisionController: ScreenVisionController;
  onBackgroundImageChange: (file: File | null) => void;
}

const CATEGORIES: SettingsCategory[] = [
  'model',
  'voice',
  'present',
  'visual',
  'mocap',
  'stream',
];

export function SettingsSession({
  settingsHook,
  isProcessing,
  backgroundImageUrl,
  streamErrorMessage,
  screenVisionController,
  onBackgroundImageChange,
}: SettingsSessionProps) {
  const [category, setCategory] = useState<SettingsCategory>('model');

  const { resolveError: vrmResolveError } = useResolvedVrmModel(
    settingsHook.settings.visual,
  );

  useEffect(() => {
    if (
      vrmResolveError &&
      settingsHook.settings.visual.vrmModelSource === 'imported'
    ) {
      settingsHook.updateVisualVrmModel('builtin', DEFAULT_VRM_MODEL_ID);
    }
  }, [
    vrmResolveError,
    settingsHook.settings.visual.vrmModelSource,
    settingsHook.updateVisualVrmModel,
  ]);

  return (
    <div className="settings-session">
      <AppToolbar title={UI_SETTINGS.title} />

      <nav className="settings-nav" aria-label={UI_SETTINGS.navAriaLabel}>
        {CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            className={`settings-nav-tab${key === category ? ' is-active' : ''}`}
            aria-current={key === category ? 'page' : undefined}
            onClick={() => setCategory(key)}
          >
            {UI_SETTINGS.tabs[key]}
          </button>
        ))}
      </nav>

      <div className="settings-session-body">
        <SettingsPanel
          {...settingsHook}
          category={category}
          isProcessing={isProcessing}
          backgroundImageUrl={backgroundImageUrl}
          vrmResolveError={vrmResolveError}
          streamErrorMessage={streamErrorMessage}
          screenVisionController={screenVisionController}
          onBackgroundImageChange={onBackgroundImageChange}
        />
      </div>
    </div>
  );
}
