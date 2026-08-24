export const QA_AUTO_SUBMIT_STORAGE_KEY = 'ssreporter.qaAutoSubmit';

export function readQaAutoSubmitPreference(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const raw = window.localStorage.getItem(QA_AUTO_SUBMIT_STORAGE_KEY);
    if (raw === 'false') {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function writeQaAutoSubmitPreference(value: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      QA_AUTO_SUBMIT_STORAGE_KEY,
      value ? 'true' : 'false',
    );
  } catch {
    // ignore quota / private mode
  }
}

export function shouldSubmitOnListeningEnd(
  autoSubmit: boolean,
  text: string,
): boolean {
  return autoSubmit && text.trim().length > 0;
}
