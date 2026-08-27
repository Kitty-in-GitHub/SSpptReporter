import type { ChatProviderOption, TTSEngineOption } from '../../types/settings';
import { UI_EFFECT_OPTIONS, UI_EMOTION_WITH_KEY } from '../../constants/uiZh';

export const LLM_PROVIDERS: {
  value: ChatProviderOption;
  label: string;
  disabled?: boolean;
}[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'openai-compatible', label: 'OpenAI-Compatible' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'gemini-nano', label: 'Gemini Nano' },
  { value: 'claude', label: 'Claude' },
  { value: 'xai', label: 'xAI' },
  { value: 'zai', label: 'Z.ai' },
  { value: 'kimi', label: 'Kimi' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'sakana', label: 'Sakana AI (Node/backend only)', disabled: true },
  { value: 'plamo', label: 'PLaMo' },
];

export const TTS_ENGINES: { value: TTSEngineOption; label: string }[] = [
  { value: 'openai', label: 'OpenAI TTS' },
  { value: 'geminiTts', label: 'Gemini TTS' },
  { value: 'openaiCompatible', label: 'OpenAI 兼容（Edge-TTS）' },
  { value: 'voicevox', label: 'VOICEVOX' },
  { value: 'voicepeak', label: 'VOICEPEAK' },
  { value: 'aivisSpeech', label: 'AivisSpeech' },
  { value: 'aivisCloud', label: 'Aivis Cloud' },
  { value: 'minimax', label: 'MiniMax' },
  { value: 'xai', label: 'xAI TTS' },
  { value: 'unrealSpeech', label: 'Unreal Speech' },
  { value: 'elevenLabs', label: 'ElevenLabs' },
  { value: 'inworld', label: 'Inworld' },
  { value: 'gradium', label: 'Gradium' },
  { value: 'piperPlus', label: 'Piper Plus' },
  { value: 'webSpeech', label: 'Web Speech API' },
  { value: 'none', label: '无' },
];

export const VRM_REACTION_EMOTION_OPTIONS = UI_EMOTION_WITH_KEY;
export const VRM_EFFECT_OPTIONS = UI_EFFECT_OPTIONS;

export const OPENAI_SPEAKERS = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
export const GEMINI_TTS_MODELS = [
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
] as const;
export const GEMINI_TTS_SPEAKERS = [
  'Zephyr',
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Leda',
  'Orus',
  'Aoede',
  'Callirrhoe',
  'Autonoe',
  'Enceladus',
  'Iapetus',
  'Umbriel',
  'Algieba',
  'Despina',
  'Erinome',
  'Algenib',
  'Rasalgethi',
  'Laomedeia',
  'Achernar',
  'Alnilam',
  'Schedar',
  'Gacrux',
  'Pulcherrima',
  'Achird',
  'Zubenelgenubi',
  'Vindemiatrix',
  'Sadachbia',
  'Sadaltager',
  'Sulafat',
] as const;
export const XAI_SPEAKERS = ['ara', 'eve', 'leo', 'rex', 'sal'];
export const XAI_CODECS = ['mp3', 'wav', 'pcm', 'mulaw', 'alaw'] as const;
export const XAI_SAMPLE_RATES = [8000, 16000, 22050, 24000, 44100, 48000] as const;
export const XAI_BIT_RATES = [32000, 64000, 96000, 128000, 192000] as const;
export const UNREAL_SPEECH_SPEAKERS = [
  'af_bella',
  'af_sarah',
  'am_adam',
  'am_michael',
] as const;
export const UNREAL_SPEECH_CODECS = ['libmp3lame', 'pcm_mulaw', 'pcm_s16le'] as const;
export const ELEVENLABS_MODELS = [
  'eleven_multilingual_v2',
  'eleven_flash_v2_5',
  'eleven_turbo_v2_5',
] as const;
export const ELEVENLABS_OUTPUT_FORMATS = [
  'mp3_44100_128',
  'mp3_22050_32',
  'pcm_16000',
  'ulaw_8000',
] as const;
export const INWORLD_MODELS = [
  'inworld-tts-2',
  'inworld-tts-1.5-mini',
  'inworld-tts-1.5-max',
] as const;
export const INWORLD_AUDIO_ENCODINGS = [
  'MP3',
  'OGG_OPUS',
  'FLAC',
  'LINEAR16',
  'WAV',
  'PCM',
  'ALAW',
  'MULAW',
] as const;
export const INWORLD_DELIVERY_MODES = ['STABLE', 'BALANCED', 'CREATIVE'] as const;
export const GRADIUM_VOICES: Record<string, string> = {
  YTpq7expH9539ERJ: 'Emma - English (US, feminine)',
  LFZvm12tW_z0xfGo: 'Kent - English (US, masculine)',
  jtEKaLYNn6iif5PR: 'Sydney - English (US, feminine)',
  KWJiFWu2O9nMPYcR: 'John - English (US, masculine)',
  ubuXFxVQwVYnZQhy: 'Eva - English (GB, feminine)',
  m86j6D7UZpGzHsNu: 'Jack - English (GB, masculine)',
  b35yykvVppLXyw_l: 'Elise - French (FR, feminine)',
  axlOaUiFyOZhy4nv: 'Leo - French (FR, masculine)',
  '-uP9MuGtBqAvEyxI': 'Mia - German (DE, feminine)',
  '0y1VZjPabOBU3rWy': 'Maximilian - German (DE, masculine)',
  B36pbz5_UoWn4BDl: 'Valentina - Spanish (MX, feminine)',
  xu7iJ_fn2ElcWp2s: 'Sergio - Spanish (ES, masculine)',
  pYcGZz9VOo4n2ynh: 'Alice - Portuguese (BR, feminine)',
  'M-FvVo9c-jGR4PgP': 'Davi - Portuguese (BR, masculine)',
};
export const GRADIUM_OUTPUT_FORMATS = [
  'wav',
  'pcm',
  'opus',
  'ulaw_8000',
  'mulaw_8000',
  'alaw_8000',
  'pcm_8000',
  'pcm_16000',
  'pcm_22050',
  'pcm_24000',
  'pcm_44100',
  'pcm_48000',
] as const;

export const VOICEPEAK_SPEAKERS = [
  { id: 'f1', name: '日本人女性 1' },
  { id: 'f2', name: '日本人女性 2' },
  { id: 'f3', name: '日本人女性 3' },
  { id: 'm1', name: '日本人男性 1' },
  { id: 'm2', name: '日本人男性 2' },
  { id: 'm3', name: '日本人男性 3' },
  { id: 'c', name: '女孩' },
];

export const AIVIS_CLOUD_PRESETS = [
  {
    id: 'kohaku',
    label: '琥珀',
    modelUuid: '22e8ed77-94fe-4ef2-871f-a86f94e9a579',
    speakerUuid: '',
    styleId: '',
  },
  {
    id: 'mao',
    label: '真央',
    modelUuid: 'a59cb814-0083-4369-8542-f51a29e72af7',
    speakerUuid: '',
    styleId: '',
  },
] as const;

export interface VoiceSpeaker {
  name: string;
  speaker_uuid: string;
  styles: { name: string; id: number }[];
}

export interface MinimaxVoice {
  voice_id: string;
  voice_name: string;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
}

export interface InworldVoice {
  voiceId: string;
  displayName?: string;
  langCode?: string;
  gender?: string;
}
