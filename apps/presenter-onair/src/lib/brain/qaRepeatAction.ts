import type { DirectorAction } from '@ssreporter/director';

const REPEAT_REQUEST_RE =
  /请重复|重复一下|再说一遍|没听清|听不清|听不清楚|没听懂|能再说一次/;

export function isRepeatRequest(text: string): boolean {
  return REPEAT_REQUEST_RE.test(text.trim());
}

export function createRepeatRequestAction(
  lastAction: DirectorAction | null | undefined,
): DirectorAction {
  const previousUtterance = lastAction?.utterance?.trim();
  const utterance =
    previousUtterance && previousUtterance.length > 0
      ? previousUtterance
      : '抱歉，请老师再提问一次。';

  return {
    schema_version: '1.0',
    action_id: `qa-repeat-${Date.now()}`,
    mode: 'qa',
    utterance,
    emotion: 'friendly',
    gesture: 'nod',
    qa: {
      question_summary: '请重复回答',
      confidence: 1,
      admit_unknown: false,
      sources: lastAction?.qa?.sources ?? [],
    },
    barge_in: true,
    priority: 'high',
  };
}
