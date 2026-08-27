import { useCallback } from 'react';
import type { SetSettings } from '../types';

export interface TtsLocalUpdaterDeps {
  setSettings: SetSettings;
}

export function createTtsLocalUpdaters(deps: TtsLocalUpdaterDeps) {
  const { setSettings } = deps;

  const updateOpenAiCompatibleApiKey = useCallback(
    (key: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleApiKey: key },
      }));
    },
    [setSettings],
  );

  const updateOpenAiCompatibleApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updateOpenAiCompatibleModel = useCallback(
    (model: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleModel: model },
      }));
    },
    [setSettings],
  );

  const updateOpenAiCompatibleSpeed = useCallback(
    (speed: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, openAiCompatibleSpeed: speed },
      }));
    },
    [setSettings],
  );

  const updateVoicevoxApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, voicevoxApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updateVoicepeakApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, voicepeakApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updateAivisSpeechApiUrl = useCallback(
    (url: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, aivisSpeechApiUrl: url },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusBasePath = useCallback(
    (basePath: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusBasePath: basePath },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusModelConfigFile = useCallback(
    (modelConfigFile: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusModelConfigFile: modelConfigFile },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusModelFile = useCallback(
    (modelFile: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusModelFile: modelFile },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusVoiceFile = useCallback(
    (voiceFile: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusVoiceFile: voiceFile },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusSpeed = useCallback(
    (speed: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusSpeed: speed },
      }));
    },
    [setSettings],
  );

  const updatePiperPlusNoiseScale = useCallback(
    (noiseScale: string) => {
      setSettings((prev) => ({
        ...prev,
        tts: { ...prev.tts, piperPlusNoiseScale: noiseScale },
      }));
    },
    [setSettings],
  );

  return {
    updateOpenAiCompatibleApiKey,
    updateOpenAiCompatibleApiUrl,
    updateOpenAiCompatibleModel,
    updateOpenAiCompatibleSpeed,
    updateVoicevoxApiUrl,
    updateVoicepeakApiUrl,
    updateAivisSpeechApiUrl,
    updatePiperPlusBasePath,
    updatePiperPlusModelConfigFile,
    updatePiperPlusModelFile,
    updatePiperPlusVoiceFile,
    updatePiperPlusSpeed,
    updatePiperPlusNoiseScale,
  };
}
