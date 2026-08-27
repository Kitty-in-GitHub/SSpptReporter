import { createTtsCloudUpdaters } from './cloudUpdaters';
import { createTtsCoreUpdaters } from './core';
import { createTtsLocalUpdaters } from './localUpdaters';
import type { SetSettings } from '../types';

export interface TtsSettingsUpdaterDeps {
  setSettings: SetSettings;
}

export function createTtsSettingsUpdaters(deps: TtsSettingsUpdaterDeps) {
  return {
    ...createTtsCoreUpdaters(deps),
    ...createTtsCloudUpdaters(deps),
    ...createTtsLocalUpdaters(deps),
  };
}
