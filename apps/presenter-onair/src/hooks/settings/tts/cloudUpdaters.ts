import { useCallback } from 'react';
import type { SetSettings } from '../types';

export interface TtsCloudUpdaterDeps {
  setSettings: SetSettings;
}

export function createTtsCloudUpdaters(deps: TtsCloudUpdaterDeps) {
  const { setSettings } = deps;

  const updateGeminiTtsModel = useCallback(
    (model: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, geminiTtsModel: model },
      }));
    },
    [setSettings],
  );

  const updateGeminiTtsLanguageCode = useCallback(
    (languageCode: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, geminiTtsLanguageCode: languageCode },
      }));
    },
    [setSettings],
  );

  const updateGeminiTtsPrompt = useCallback(
    (prompt: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, geminiTtsPrompt: prompt },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudApiKey = useCallback(
    (key: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudApiKey: key },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudModelUuid = useCallback(
    (modelUuid: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudModelUuid: modelUuid },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudSpeakerUuid = useCallback(
    (speakerUuid: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudSpeakerUuid: speakerUuid },
      }));
    },
    [setSettings],
  );

  const updateAivisCloudStyleId = useCallback(
    (styleId: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisCloudStyleId: styleId },
      }));
    },
    [setSettings],
  );

  const updateMinimaxApiKey = useCallback(
    (key: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, minimaxApiKey: key },
      }));
    },
    [setSettings],
  );

  const updateMinimaxGroupId = useCallback(
    (groupId: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, minimaxGroupId: groupId },
      }));
    },
    [setSettings],
  );

  const updateXaiLanguage = useCallback(
    (language: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiLanguage: language },
      }));
    },
    [setSettings],
  );

  const updateXaiCodec = useCallback(
    (codec: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiCodec: codec },
      }));
    },
    [setSettings],
  );

  const updateXaiSampleRate = useCallback(
    (sampleRate: number) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiSampleRate: sampleRate },
      }));
    },
    [setSettings],
  );

  const updateXaiBitRate = useCallback(
    (bitRate: number) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, xaiBitRate: bitRate },
      }));
    },
    [setSettings],
  );

  return {
    updateGeminiTtsModel,
    updateGeminiTtsLanguageCode,
    updateGeminiTtsPrompt,
    updateAivisCloudApiKey,
    updateAivisCloudModelUuid,
    updateAivisCloudSpeakerUuid,
    updateAivisCloudStyleId,
    updateMinimaxApiKey,
    updateMinimaxGroupId,
    updateXaiLanguage,
    updateXaiCodec,
    updateXaiSampleRate,
    updateXaiBitRate,
  };
}
