/**
 * 呈现层协议：Director / Brain 只应产出或消费这些类型，
 * 不应依赖 VRM 实现细节。
 */

export interface AvatarExpressionPart {
  name: string;
  intensity?: number;
}

export type AvatarReactionDraft =
  | {
      type: 'emote';
      name: string;
      intensity?: number;
      fadeMs?: number;
      holdMs?: number;
    }
  | {
      type: 'gesture';
      parts: readonly AvatarExpressionPart[];
      fadeMs?: number;
      holdMs?: number;
      vrmaUrl?: string;
    }
  | {
      type: 'animation';
      name: string;
    }
  | {
      type: 'reset';
      fadeMs?: number;
    };

export type AvatarReaction = AvatarReactionDraft & { id: number };

/** 聊天/TTS 回调用的简要剧本（与具体皮套后端无关） */
export interface ScreenplayCue {
  emotion?: string;
  text?: string;
}

export interface AvatarReactionPair {
  gesture: AvatarReactionDraft | null;
  emotion: AvatarReactionDraft | null;
}
