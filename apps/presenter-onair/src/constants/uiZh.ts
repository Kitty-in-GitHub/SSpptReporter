import type {
  VrmEmotionEffect,
  VrmReactionEmotion,
} from '../lib/vrmReactions';

/** 短标签（角色预览按钮） */
export const UI_EMOTION_SHORT: Record<VrmReactionEmotion, string> = {
  happy: '开心',
  surprised: '惊讶',
  sad: '悲伤',
  angry: '生气',
  relaxed: '放松',
  thinking: '思考',
  neutral: '平常',
};

export const UI_EMOTION_WITH_KEY: ReadonlyArray<{
  value: VrmReactionEmotion;
  label: string;
}> = [
  { value: 'happy', label: '开心（happy）' },
  { value: 'surprised', label: '惊讶（surprised）' },
  { value: 'sad', label: '悲伤（sad）' },
  { value: 'angry', label: '生气（angry）' },
  { value: 'relaxed', label: '放松（relaxed）' },
  { value: 'thinking', label: '思考（thinking）' },
  { value: 'neutral', label: '平常（neutral）' },
];

export const UI_EFFECT_OPTIONS: ReadonlyArray<{
  value: VrmEmotionEffect | 'none';
  label: string;
}> = [
  { value: 'none', label: '无' },
  { value: 'happy', label: '开心（happy）' },
  { value: 'surprised', label: '惊讶（surprised）' },
  { value: 'sad', label: '悲伤（sad）' },
  { value: 'angry', label: '生气（angry）' },
  { value: 'relaxed', label: '放松（relaxed）' },
  { value: 'thinking', label: '思考（thinking）' },
];

export const UI_ANCHOR_TARGETS = [
  { target: 'face' as const, label: '面部' },
  { target: 'leftEye' as const, label: '左眼' },
  { target: 'rightEye' as const, label: '右眼' },
];

export const UI_CHAT = {
  empty: '发送消息开始对话',
  userRole: '你',
  assistantRole: '助手',
  inputPlaceholder: '输入消息（Enter 发送）',
  listeningPlaceholder: '语音识别中…',
  micUnsupported: '当前浏览器不支持语音识别（推荐 Chrome）',
  micStop: '停止语音识别',
  micStart: '开始语音识别',
  send: '发送',
};

export const UI_SETTINGS = {
  title: '设置',
  ariaLabel: '设置',
};
