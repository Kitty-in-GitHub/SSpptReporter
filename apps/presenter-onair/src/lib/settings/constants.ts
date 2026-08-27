import {
  DEFAULT_EDGE_TTS_API_URL,
  DEFAULT_EDGE_TTS_MODEL,
  DEFAULT_EDGE_TTS_VOICE,
} from '../voiceOptions';

export { DEFAULT_EDGE_TTS_VOICE };

export const SETTINGS_STORAGE_KEY = 'react-vrm-app-settings';

export const DEFAULT_AIVIS_CLOUD_MODEL_UUID =
  '22e8ed77-94fe-4ef2-871f-a86f94e9a579';
export const DEFAULT_GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview';
export const DEFAULT_GEMINI_TTS_LANGUAGE_CODE = 'zh-CN';
export const DEFAULT_OPENAI_COMPATIBLE_MODEL = DEFAULT_EDGE_TTS_MODEL;
export const DEFAULT_OPENAI_COMPATIBLE_ENDPOINT =
  'http://localhost:11434/v1/chat/completions';
export const DEFAULT_OPENAI_COMPATIBLE_TTS_ENDPOINT = DEFAULT_EDGE_TTS_API_URL;
export const DEFAULT_UNREAL_SPEECH_TTS_ENDPOINT =
  'https://api.v8.unrealspeech.com/stream';
export const DEFAULT_ELEVENLABS_TTS_ENDPOINT =
  'https://api.elevenlabs.io/v1/text-to-speech';
export const DEFAULT_ELEVENLABS_MODEL = 'eleven_multilingual_v2';
export const DEFAULT_ELEVENLABS_OUTPUT_FORMAT = 'mp3_44100_128';
export const DEFAULT_INWORLD_TTS_ENDPOINT = 'https://api.inworld.ai/tts/v1/voice';
export const DEFAULT_INWORLD_MODEL = 'inworld-tts-2';
export const DEFAULT_INWORLD_AUDIO_ENCODING = 'MP3';
export const DEFAULT_INWORLD_SAMPLE_RATE_HERTZ = '48000';
export const DEFAULT_INWORLD_LANGUAGE = 'ja-JP';
export const DEFAULT_GRADIUM_TTS_ENDPOINT =
  'https://api.gradium.ai/api/post/speech/tts';
export const DEFAULT_GRADIUM_OUTPUT_FORMAT = 'wav';
export const DEFAULT_PIPER_PLUS_BASE_PATH = `${import.meta.env.BASE_URL}piper/`;
export const DEFAULT_PIPER_PLUS_MODEL_CONFIG_FILE = 'tsukuyomi-config.json';
export const DEFAULT_PIPER_PLUS_MODEL_FILE = 'tsukuyomi-wavlm-300epoch.onnx';
export const DEFAULT_PIPER_PLUS_VOICE_FILE = 'mei_normal.htsvoice';
export const DEFAULT_OPENROUTER_MAX_CANDIDATES = 1;
export const DEFAULT_OPENROUTER_MAX_WORKING = 10;

export const EMPTY_MODEL_IDS: string[] = [];
