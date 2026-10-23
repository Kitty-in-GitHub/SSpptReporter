import { isBuiltInProfile } from '@ssreporter/director';
import type { Emotion } from '@ssreporter/director';

/** 内置预设名同时是情绪名（讲稿编辑器的「情绪」槽位判定）。 */
export function isEmotionProfile(profileId: string): profileId is Emotion {
  return isBuiltInProfile(profileId);
}
