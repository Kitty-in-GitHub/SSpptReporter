import type { XaiReasoningEffort } from '@aituber-onair/core';
import type { EmotionEffectAnchor } from '../lib/emotionEffectAnchor';
import type {
  VrmEmotionEffectMap,
  VrmReactionControlMode,
} from '../lib/vrmReactions';
import type { PresentSettings } from './present';
import type { VrmCameraFraming } from '../lib/vrmCameraFraming';

export type ChatProviderOption =
  | 'openai'
  | 'openai-compatible'
  | 'openrouter'
  | 'gemini'
  | 'gemini-nano'
  | 'claude'
  | 'zai'
  | 'kimi'
  | 'xai'
  | 'deepseek'
  | 'mistral'
  | 'sakana'
  | 'plamo';
export type TTSEngineOption =
  | 'openai'
  | 'geminiTts'
  | 'openaiCompatible'
  | 'voicevox'
  | 'voicepeak'
  | 'aivisSpeech'
  | 'aivisCloud'
  | 'minimax'
  | 'xai'
  | 'unrealSpeech'
  | 'elevenLabs'
  | 'inworld'
  | 'gradium'
  | 'piperPlus'
  | 'webSpeech'
  | 'none';
export type StreamingPlatformOption = 'none' | 'youtube' | 'twitch';

export interface ProviderApiKeys {
  openai?: string;
  'openai-compatible'?: string;
  openrouter?: string;
  gemini?: string;
  claude?: string;
  zai?: string;
  kimi?: string;
  xai?: string;
  deepseek?: string;
  mistral?: string;
  sakana?: string;
  plamo?: string;
}

export interface LLMSettings {
  provider: ChatProviderOption;
  model: string;
  systemPrompt: string;
  endpoint?: string;
  xaiReasoningEffort?: XaiReasoningEffort;
  apiKeys: ProviderApiKeys;
  openRouterDynamicFreeModels?: {
    models: string[];
    fetchedAt: number;
    maxCandidates: number;
  };
}

export interface TTSSettings {
  engine: TTSEngineOption;
  speaker: string;
  openAiCompatibleApiKey?: string;
  openAiCompatibleApiUrl?: string;
  openAiCompatibleModel?: string;
  openAiCompatibleSpeed?: string;
  geminiTtsModel?: string;
  geminiTtsLanguageCode?: string;
  geminiTtsPrompt?: string;
  voicevoxApiUrl?: string;
  voicepeakApiUrl?: string;
  aivisSpeechApiUrl?: string;
  aivisCloudApiKey?: string;
  aivisCloudModelUuid?: string;
  aivisCloudSpeakerUuid?: string;
  aivisCloudStyleId?: string;
  minimaxApiKey?: string;
  minimaxGroupId?: string;
  xaiLanguage?: string;
  xaiCodec?: string;
  xaiSampleRate?: number;
  xaiBitRate?: number;
  unrealSpeechApiKey?: string;
  unrealSpeechApiUrl?: string;
  unrealSpeechBitrate?: string;
  unrealSpeechSpeed?: string;
  unrealSpeechPitch?: string;
  unrealSpeechCodec?: string;
  unrealSpeechTemperature?: string;
  elevenLabsApiKey?: string;
  elevenLabsApiUrl?: string;
  elevenLabsModel?: string;
  elevenLabsOutputFormat?: string;
  elevenLabsLanguageCode?: string;
  elevenLabsStability?: string;
  elevenLabsSimilarityBoost?: string;
  elevenLabsStyle?: string;
  elevenLabsUseSpeakerBoost?: 'default' | 'true' | 'false';
  elevenLabsSpeed?: string;
  elevenLabsSeed?: string;
  elevenLabsApplyTextNormalization?: 'default' | 'auto' | 'on' | 'off';
  inworldApiKey?: string;
  inworldApiUrl?: string;
  inworldModel?: string;
  inworldAudioEncoding?: string;
  inworldSampleRateHertz?: string;
  inworldBitRate?: string;
  inworldSpeakingRate?: string;
  inworldLanguage?: string;
  inworldDeliveryMode?: 'default' | 'STABLE' | 'BALANCED' | 'CREATIVE';
  inworldTemperature?: string;
  gradiumApiKey?: string;
  gradiumApiUrl?: string;
  gradiumOutputFormat?: string;
  gradiumTemperature?: string;
  gradiumVoiceSimilarity?: string;
  gradiumPaddingBonus?: string;
  gradiumRewriteRules?: string;
  piperPlusBasePath?: string;
  piperPlusModelConfigFile?: string;
  piperPlusModelFile?: string;
  piperPlusVoiceFile?: string;
  piperPlusSpeed?: string;
  piperPlusNoiseScale?: string;
  webSpeechRate?: string;
  webSpeechPitch?: string;
  webSpeechVolume?: string;
  webSpeechLanguage?: string;
}

export interface StreamSettings {
  platform: StreamingPlatformOption;
  youtubeApiKey: string;
  youtubeLiveId: string;
  youtubeEnabled: boolean;
  youtubeCommentIntervalMs: number;
  twitchClientId: string;
  twitchAccessToken: string;
  twitchChannel: string;
  twitchEnabled: boolean;
  twitchCommentIntervalMs: number;
}

export type FaceCaptureMouthDriver = 'faceCapture' | 'tts';
export type FaceCaptureSource = 'webcam';
/**
 * 视频采集后端。见 `useVideoSource` —— 在 Chromium 里这是两条不同的取帧路径，
 * 可切换对照（视频流路径与 ImageCapture 静态抓帧路径）。
 */
export type CameraVideoBackend = 'videoFrameCallback' | 'grabFrame';

export interface FaceCaptureSettings {
  mouthDriver: FaceCaptureMouthDriver;
  source: FaceCaptureSource;
  deviceId: string;
  showCameraPreview: boolean;
  /** 采集后端（视频获取模块用） */
  videoBackend: CameraVideoBackend;
  /** 面捕帧平滑系数 0~1（越大越稳、越迟钝） */
  smoothing: number;
}

export interface CommentIntelligenceSettings {
  enabled: boolean;
  mode: 'rules' | 'hybrid' | 'llm-assisted';
  useSameLLMSettings: boolean;
  streamTopic: string;
  streamTitle: string;
  topicFilter: 'off' | 'prefer' | 'require';
  maxCommentsPerBatch: number;
  analysisIntervalMs: number;
  minCommentsForLLMAnalysis: number;
  blockHighRiskViewers: boolean;
  viewerBlockDurationMs: number;
}

export interface ManneriSettings {
  enabled: boolean;
  similarityThreshold: number;
  lookbackWindow: number;
  interventionCooldownMs: number;
  minMessageLength: number;
}

export type { VrmCameraFraming };
export {
  DEFAULT_VRM_CAMERA_FRAMING,
  MAX_VRM_FRAMING_ZOOM,
  MIN_VRM_FRAMING_ZOOM,
  normalizeVrmCameraFraming,
} from '../lib/vrmCameraFraming';

export type VrmModelSource = 'builtin' | 'imported';

export interface VisualSettings {
  backgroundMode: 'default' | 'green' | 'transparent';
  layoutMode: 'chat' | 'broadcast';
  showInputInBroadcast: boolean;
  vrmModelSource: VrmModelSource;
  vrmModelId: string;
  vrmCameraFraming: VrmCameraFraming;
  vrmEmotionEffectAnchors: Record<string, EmotionEffectAnchor>;
  vrmReactionControlMode: VrmReactionControlMode;
  vrmEmotionEffectMap: VrmEmotionEffectMap;
  /**
   * 暂停 VRM 渲染：帧循环仍在跑但不做任何场景更新与 WebGL 绘制。
   * 用于排查「渲染与摄像头采集抢资源」，也方便直播时临时冻结皮套。
   */
  vrmRenderPaused: boolean;
}

export interface ScreenVisionSettings {
  deviceId: string;
  prompt: string;
  autoIntervalMs: number;
  enabled: boolean;
}

export interface AppSettings {
  llm: LLMSettings;
  tts: TTSSettings;
  visual: VisualSettings;
  present: PresentSettings;
  screenVision: ScreenVisionSettings;
  stream: StreamSettings;
  faceCapture: FaceCaptureSettings;
  commentIntelligence: CommentIntelligenceSettings;
  manneri: ManneriSettings;
}
