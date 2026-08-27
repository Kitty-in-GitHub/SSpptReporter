import type { AppSettings } from '../../types/settings';
import { SETTINGS_STORAGE_KEY } from './constants';
import { getDefaultSettings, mergeLoadedSettings } from './defaults';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppSettings>;
      return mergeLoadedSettings(saved);
    }
  } catch {
    // ignore parse errors
  }
  return getDefaultSettings();
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
