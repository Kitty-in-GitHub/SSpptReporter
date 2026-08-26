import { describe, expect, it } from 'vitest';
import type { ToolChatCompletion } from '@aituber-onair/core';
import { extractChatCompletionText } from './createBrainLlmClient';

describe('extractChatCompletionText', () => {
  it('returns trimmed string as-is', () => {
    expect(extractChatCompletionText('  你好  ')).toBe('你好');
  });

  it('joins text blocks from ToolChatCompletion', () => {
    const completion: ToolChatCompletion = {
      blocks: [
        { type: 'text', text: '这是' },
        { type: 'text', text: '回答。' },
      ],
      stop_reason: 'end',
    };
    expect(extractChatCompletionText(completion)).toBe('这是回答。');
  });

  it('ignores tool_use blocks and returns only text', () => {
    const completion: ToolChatCompletion = {
      blocks: [
        { type: 'text', text: '材料在第 2 页。' },
        { type: 'tool_use', id: 't1', name: 'goto', input: { page: 2 } },
      ],
      stop_reason: 'tool_use',
    };
    expect(extractChatCompletionText(completion)).toBe('材料在第 2 页。');
  });

  it('returns empty string for completion without text blocks', () => {
    const completion: ToolChatCompletion = {
      blocks: [],
      stop_reason: 'end',
    };
    expect(extractChatCompletionText(completion)).toBe('');
  });
});
