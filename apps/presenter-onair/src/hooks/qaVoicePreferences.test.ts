import { afterEach, describe, expect, it } from 'vitest';
import {
  QA_AUTO_SUBMIT_STORAGE_KEY,
  readQaAutoSubmitPreference,
  shouldSubmitOnListeningEnd,
  writeQaAutoSubmitPreference,
} from './qaVoicePreferences';

describe('qaVoicePreferences', () => {
  afterEach(() => {
    window.localStorage.removeItem(QA_AUTO_SUBMIT_STORAGE_KEY);
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
});
