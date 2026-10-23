import { useTtsCloudUpdaters } from './cloudUpdaters';
import { useTtsCoreUpdaters } from './core';
import { useTtsLocalUpdaters } from './localUpdaters';
import type { SetSettings } from '../types';

export interface TtsSettingsUpdaterDeps {
  setSettings: SetSettings;
}

export function useTtsSettingsUpdaters(deps: TtsSettingsUpdaterDeps) {
  return {
    ...useTtsCoreUpdaters(deps),
    ...useTtsCloudUpdaters(deps),
    ...useTtsLocalUpdaters(deps),
  };
}
