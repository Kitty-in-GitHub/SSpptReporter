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

export const UI_SESSION_MODES = {
  chat: '聊天',
  present: '汇报',
  edit: '讲稿导演台',
  mocap: '面捕',
} as const;

export const UI_QA = {
  panelTitle: '评委提问',
  inputPlaceholder: '输入评委问题，Enter 提交',
  listeningPlaceholder: '正在听写…',
  submit: '提问',
  submitting: '思考中…',
  micLabel: '麦克风',
  micStop: '停止',
  micUnsupported: '当前浏览器不支持语音识别（推荐 Chrome / Edge）',
  micTitle: '语音输入（Chrome / Edge）',
  autoSubmitLabel: '说完自动提问',
  knowledgeLoading: '加载知识库…',
  summaryPrefix: '摘要：',
  confidencePrefix: '置信度：',
  sourcesPrefix: '来源：',
  admitUnknownBadge: '未覆盖',
  stageMicTitle: '语音提问（说完自动提交）',
  asrEngineLabel: '语音引擎',
  asrTranscribing: '识别中…',
  asrGatewayHint:
    '本机网关 Whisper：需 npm run setup:asr 后重启 npm run dev；未安装会弹出指引',
  asrBrowserHint:
    '浏览器内 Whisper：首次使用需联网下载模型（约 75MB），之后可离线转写',
  asrCloudHint: '云端 Whisper 使用 Settings 中的 OpenAI API Key',
  gatewaySetupTitle: '本机 Whisper 尚未就绪',
  gatewaySetupLead:
    '「本机 Whisper（网关）」需要先安装 Faster-Whisper，浏览器无法自动替你安装。',
  gatewaySetupNote:
    '若不想装 Python 依赖，可改用「浏览器内 Whisper（免安装）」：首次下载模型后即可本机转写。',
  gatewaySetupDismiss: '知道了',
  copyCommand: '复制命令',
  switchToBrowserWhisper: '改用浏览器内 Whisper',
  switchToWebSpeech: '改用 Web Speech',
};

export const UI_PRESENT = {
  deckLabel: '场次',
  deckPrivateSuffix: '（私有）',
  resumeDeckAfterQa: '问答打断后自动续播讲稿',
};
