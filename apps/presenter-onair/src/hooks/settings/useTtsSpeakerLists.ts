import { useEffect, useMemo, useRef, useState } from 'react';
import { getVoiceEngineVoiceList, type VoiceEngineVoice } from '@aituber-onair/core';
import {
  resolveAivisSpeechApiUrl,
  resolveVoicevoxApiUrl,
} from '../../lib/voiceOptions';
import type { AppSettings } from '../../types/settings';
import {
  AIVIS_CLOUD_PRESETS,
  type ElevenLabsVoice,
  type InworldVoice,
  type MinimaxVoice,
  type VoiceSpeaker,
} from '../../components/settings/settingsConstants';

export interface UseTtsSpeakerListsParams {
  tts: AppSettings['tts'];
  updateTTSSpeaker: (speaker: string) => void;
  updateAivisCloudModelUuid: (modelUuid: string) => void;
  updateAivisCloudSpeakerUuid: (speakerUuid: string) => void;
  updateAivisCloudStyleId: (styleId: string) => void;
}

export function useTtsSpeakerLists({
  tts,
  updateTTSSpeaker,
  updateAivisCloudModelUuid,
  updateAivisCloudSpeakerUuid,
  updateAivisCloudStyleId,
}: UseTtsSpeakerListsParams) {
  const [voicevoxSpeakers, setVoicevoxSpeakers] = useState<VoiceSpeaker[]>([]);
  const [aivisSpeakers, setAivisSpeakers] = useState<VoiceSpeaker[]>([]);
  const [minimaxVoices, setMinimaxVoices] = useState<MinimaxVoice[]>([]);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>(
    [],
  );
  const [inworldVoices, setInworldVoices] = useState<InworldVoice[]>([]);
  const [webSpeechVoices, setWebSpeechVoices] = useState<VoiceEngineVoice[]>(
    [],
  );
  const [isFetchingWebSpeechVoices, setIsFetchingWebSpeechVoices] =
    useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isFetchingMinimaxVoices, setIsFetchingMinimaxVoices] = useState(false);
  const [isFetchingElevenLabsVoices, setIsFetchingElevenLabsVoices] =
    useState(false);
  const [isFetchingInworldVoices, setIsFetchingInworldVoices] = useState(false);
  const speakerRef = useRef(tts.speaker);

  useEffect(() => {
    speakerRef.current = tts.speaker;
  }, [tts.speaker]);

  const selectedAivisCloudPresetId = useMemo(() => {
    const matched = AIVIS_CLOUD_PRESETS.find(
      (preset) =>
        preset.modelUuid === (tts.aivisCloudModelUuid || '') &&
        preset.speakerUuid === (tts.aivisCloudSpeakerUuid || '') &&
        preset.styleId === (tts.aivisCloudStyleId || ''),
    );
    return matched?.id || AIVIS_CLOUD_PRESETS[0].id;
  }, [
    tts.aivisCloudModelUuid,
    tts.aivisCloudSpeakerUuid,
    tts.aivisCloudStyleId,
  ]);

  useEffect(() => {
    if (tts.engine !== 'voicevox' && tts.engine !== 'aivisSpeech') {
      return;
    }

    const controller = new AbortController();

    const fetchSpeakers = async () => {
      const isVoicevox = tts.engine === 'voicevox';
      const baseUrl = isVoicevox
        ? resolveVoicevoxApiUrl(tts.voicevoxApiUrl)
        : resolveAivisSpeechApiUrl(tts.aivisSpeechApiUrl);

      try {
        const response = await fetch(`${baseUrl}/speakers`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const speakers = (await response.json()) as VoiceSpeaker[];
        if (controller.signal.aborted) return;

        if (isVoicevox) {
          setVoicevoxSpeakers(speakers);
        } else {
          setAivisSpeakers(speakers);
        }
        setFetchError('');

        if (!speakerRef.current && speakers.length > 0) {
          const firstId = speakers[0]?.styles?.[0]?.id;
          if (firstId != null) updateTTSSpeaker(String(firstId));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        if (isVoicevox) {
          setVoicevoxSpeakers([]);
          setFetchError(`VOICEVOX 连接错误: ${message}`);
        } else {
          setAivisSpeakers([]);
          setFetchError(`AivisSpeech 连接错误: ${message}`);
        }
      }
    };

    void fetchSpeakers();

    return () => {
      controller.abort();
    };
  }, [
    tts.engine,
    tts.voicevoxApiUrl,
    tts.aivisSpeechApiUrl,
    updateTTSSpeaker,
  ]);

  useEffect(() => {
    if (tts.engine !== 'minimax') {
      return;
    }

    const apiKey = tts.minimaxApiKey?.trim();
    if (!apiKey) {
      setMinimaxVoices([]);
      return;
    }

    const controller = new AbortController();

    const fetchMinimaxVoices = async () => {
      setIsFetchingMinimaxVoices(true);
      try {
        const response = await fetch(
          'https://api.minimax.io/v1/query/tts_speakers',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          base_resp?: { status_code?: number; status_msg?: string };
          data?: { speakers?: MinimaxVoice[] };
        };
        if (controller.signal.aborted) return;

        if (payload.base_resp && payload.base_resp.status_code !== 0) {
          throw new Error(payload.base_resp.status_msg || 'MiniMax API error');
        }

        const voices = payload.data?.speakers || [];
        setMinimaxVoices(voices);
        setFetchError('');

        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.voice_id === speakerRef.current)
        ) {
          updateTTSSpeaker(voices[0].voice_id);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setMinimaxVoices([]);
        setFetchError(`MiniMax 连接错误: ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingMinimaxVoices(false);
        }
      }
    };

    void fetchMinimaxVoices();

    return () => {
      controller.abort();
    };
  }, [tts.engine, tts.minimaxApiKey, updateTTSSpeaker]);

  useEffect(() => {
    if (tts.engine !== 'elevenLabs') {
      return;
    }

    const apiKey = tts.elevenLabsApiKey?.trim();
    if (!apiKey) {
      queueMicrotask(() => {
        setElevenLabsVoices([]);
      });
      return;
    }

    const controller = new AbortController();

    const fetchElevenLabsVoices = async () => {
      setIsFetchingElevenLabsVoices(true);
      try {
        const response = await fetch(
          'https://api.elevenlabs.io/v2/voices?page_size=100',
          {
            method: 'GET',
            headers: {
              'xi-api-key': apiKey,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          voices?: ElevenLabsVoice[];
        };
        if (controller.signal.aborted) return;

        const voices = payload.voices || [];
        setElevenLabsVoices(voices);
        setFetchError('');

        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.voice_id === speakerRef.current)
        ) {
          updateTTSSpeaker(voices[0].voice_id);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setElevenLabsVoices([]);
        setFetchError(`ElevenLabs 连接错误: ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingElevenLabsVoices(false);
        }
      }
    };

    void fetchElevenLabsVoices();

    return () => {
      controller.abort();
    };
  }, [tts.engine, tts.elevenLabsApiKey, updateTTSSpeaker]);

  useEffect(() => {
    if (tts.engine !== 'inworld') {
      return;
    }

    const apiKey = tts.inworldApiKey?.trim();
    if (!apiKey) {
      queueMicrotask(() => {
        setInworldVoices([]);
      });
      return;
    }

    const controller = new AbortController();

    const fetchInworldVoices = async () => {
      setIsFetchingInworldVoices(true);
      try {
        const url = new URL('https://api.inworld.ai/voices/v1/voices');
        url.searchParams.set('orderBy', 'display_name asc');
        url.searchParams.set('pageSize', '2000');
        if (tts.inworldLanguage?.trim()) {
          url.searchParams.set(
            'filter',
            `lang_code = "${tts.inworldLanguage.trim()}"`,
          );
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { Authorization: `Basic ${apiKey}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          voices?: InworldVoice[];
        };
        if (controller.signal.aborted) return;

        const voices = payload.voices || [];
        setInworldVoices(voices);
        setFetchError('');

        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.voiceId === speakerRef.current)
        ) {
          updateTTSSpeaker(voices[0].voiceId);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setInworldVoices([]);
        setFetchError(`Inworld 连接错误: ${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingInworldVoices(false);
        }
      }
    };

    void fetchInworldVoices();

    return () => {
      controller.abort();
    };
  }, [
    tts.engine,
    tts.inworldApiKey,
    tts.inworldLanguage,
    updateTTSSpeaker,
  ]);

  useEffect(() => {
    if (tts.engine !== 'webSpeech') {
      return;
    }

    let active = true;
    const fetchWebSpeechVoices = async () => {
      setIsFetchingWebSpeechVoices(true);
      try {
        const voices = await getVoiceEngineVoiceList('webSpeech');
        if (!active) return;
        setWebSpeechVoices(voices);
        setFetchError('');
        if (
          voices.length > 0 &&
          !voices.some((voice) => voice.id === tts.speaker)
        ) {
          updateTTSSpeaker(voices[0].id);
        }
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : String(error);
        setWebSpeechVoices([]);
        setFetchError(`Web Speech 音色列表错误: ${message}`);
      } finally {
        if (active) {
          setIsFetchingWebSpeechVoices(false);
        }
      }
    };

    void fetchWebSpeechVoices();
    return () => {
      active = false;
    };
  }, [tts.engine, tts.speaker, updateTTSSpeaker]);

  const handleAivisCloudPresetChange = (presetId: string) => {
    const preset = AIVIS_CLOUD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    updateAivisCloudModelUuid(preset.modelUuid);
    updateAivisCloudSpeakerUuid(preset.speakerUuid);
    updateAivisCloudStyleId(preset.styleId);
    updateTTSSpeaker(preset.modelUuid);
  };

  return {
    voicevoxSpeakers,
    aivisSpeakers,
    minimaxVoices,
    elevenLabsVoices,
    inworldVoices,
    webSpeechVoices,
    isFetchingWebSpeechVoices,
    fetchError,
    isFetchingMinimaxVoices,
    isFetchingElevenLabsVoices,
    isFetchingInworldVoices,
    selectedAivisCloudPresetId,
    handleAivisCloudPresetChange,
  };
}

export type TtsSpeakerLists = ReturnType<typeof useTtsSpeakerLists>;
