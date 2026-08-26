import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  QA_AUTO_SUBMIT_STORAGE_KEY,
  readQaAutoSubmitPreference,
  shouldSubmitOnListeningEnd,
  writeQaAutoSubmitPreference,
} from './qaVoicePreferences';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
}

describe('qaVoicePreferences', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults auto submit to true when unset', () => {
    expect(readQaAutoSubmitPreference()).toBe(true);
  });

  it('persists auto submit preference', () => {
    writeQaAutoSubmitPreference(false);
    expect(readQaAutoSubmitPreference()).toBe(false);
    writeQaAutoSubmitPreference(true);
    expect(readQaAutoSubmitPreference()).toBe(true);
  });

  it('should submit on listening end only when enabled and text exists', () => {
    expect(shouldSubmitOnListeningEnd(true, '  Phase 1  ')).toBe(true);
    expect(shouldSubmitOnListeningEnd(false, 'Phase 1')).toBe(false);
    expect(shouldSubmitOnListeningEnd(true, '   ')).toBe(false);
  });

  it('ignores unknown storage values', () => {
    window.localStorage.setItem(QA_AUTO_SUBMIT_STORAGE_KEY, 'maybe');
    expect(readQaAutoSubmitPreference()).toBe(true);
  });
});
