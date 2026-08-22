import { describe, expect, it } from 'vitest';
import {
  parseDirectorActionJson,
  validateDirectorAction,
} from './validate.js';

const VALID_ACTION = {
  schema_version: '1.0',
  action_id: 'phase0-sample',
  mode: 'system',
  utterance: '大家好，我是答辩助手，接下来由我说明技术方案。',
  emotion: 'friendly',
  gesture: 'bow',
  camera: 'bust',
};

describe('validateDirectorAction', () => {
  it('accepts the Phase 0 sample fixture shape', () => {
    const result = validateDirectorAction(VALID_ACTION);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.action.action_id).toBe('phase0-sample');
      expect(result.action.emotion).toBe('friendly');
    }
  });

  it('rejects missing schema_version', () => {
    const { schema_version: _ignored, ...invalid } = VALID_ACTION;
    const result = validateDirectorAction(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('rejects invalid emotion', () => {
    const result = validateDirectorAction({
      ...VALID_ACTION,
      emotion: 'not-a-real-emotion',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects utterance longer than 2000 characters', () => {
    const result = validateDirectorAction({
      ...VALID_ACTION,
      utterance: 'a'.repeat(2001),
    });
    expect(result.ok).toBe(false);
  });
});

describe('parseDirectorActionJson', () => {
  it('parses valid JSON', () => {
    const result = parseDirectorActionJson(JSON.stringify(VALID_ACTION));
    expect(result.ok).toBe(true);
  });

  it('rejects malformed JSON', () => {
    const result = parseDirectorActionJson('{ not json');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/json/i);
    }
  });
});
