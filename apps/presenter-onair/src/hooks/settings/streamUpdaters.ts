import { useCallback } from 'react';
import { getDefaultSettings, normalizePositiveInteger } from '../../lib/settings/defaults';
import type { AppSettings, StreamingPlatformOption } from '../../types/settings';
import type { SetSettings } from './types';

export interface StreamSettingsUpdaterDeps {
  setSettings: SetSettings;
}

export function createStreamSettingsUpdaters(deps: StreamSettingsUpdaterDeps) {
  const { setSettings } = deps;

  const updateScreenVisionDeviceId = useCallback(
    (deviceId: string) => {
      setSettings((prev) => ({
        ...prev,
        screenVision: { ...prev.screenVision, deviceId },
      }));
    },
    [setSettings],
  );

  const updateScreenVisionPrompt = useCallback(
    (prompt: string) => {
      setSettings((prev) => ({
        ...prev,
        screenVision: { ...prev.screenVision, prompt },
      }));
    },
    [setSettings],
  );

  const updateScreenVisionAutoIntervalMs = useCallback(
    (autoIntervalMs: number) => {
      setSettings((prev) => ({
        ...prev,
        screenVision: { ...prev.screenVision, autoIntervalMs },
      }));
    },
    [setSettings],
  );

  const updateScreenVisionEnabled = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({
        ...prev,
        screenVision: { ...prev.screenVision, enabled },
      }));
    },
    [setSettings],
  );

  const updateStreamPlatform = useCallback(
    (platform: StreamingPlatformOption) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, platform },
      }));
    },
    [setSettings],
  );

  const updateYoutubeApiKey = useCallback(
    (youtubeApiKey: string) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, youtubeApiKey },
      }));
    },
    [setSettings],
  );

  const updateYoutubeLiveId = useCallback(
    (youtubeLiveId: string) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, youtubeLiveId },
      }));
    },
    [setSettings],
  );

  const updateYoutubeEnabled = useCallback(
    (youtubeEnabled: boolean) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, youtubeEnabled },
      }));
    },
    [setSettings],
  );

  const updateYoutubeCommentIntervalMs = useCallback(
    (youtubeCommentIntervalMs: number) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, youtubeCommentIntervalMs },
      }));
    },
    [setSettings],
  );

  const updateTwitchClientId = useCallback(
    (twitchClientId: string) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, twitchClientId },
      }));
    },
    [setSettings],
  );

  const updateTwitchAccessToken = useCallback(
    (twitchAccessToken: string) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, twitchAccessToken },
      }));
    },
    [setSettings],
  );

  const updateTwitchChannel = useCallback(
    (twitchChannel: string) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, twitchChannel },
      }));
    },
    [setSettings],
  );

  const updateTwitchEnabled = useCallback(
    (twitchEnabled: boolean) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, twitchEnabled },
      }));
    },
    [setSettings],
  );

  const updateTwitchCommentIntervalMs = useCallback(
    (twitchCommentIntervalMs: number) => {
      setSettings((prev) => ({
        ...prev,
        stream: { ...prev.stream, twitchCommentIntervalMs },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceEnabled = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: { ...prev.commentIntelligence, enabled },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceMode = useCallback(
    (mode: AppSettings['commentIntelligence']['mode']) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: { ...prev.commentIntelligence, mode },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceStreamTopic = useCallback(
    (streamTopic: string) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: { ...prev.commentIntelligence, streamTopic },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceStreamTitle = useCallback(
    (streamTitle: string) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: { ...prev.commentIntelligence, streamTitle },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceTopicFilter = useCallback(
    (topicFilter: AppSettings['commentIntelligence']['topicFilter']) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: { ...prev.commentIntelligence, topicFilter },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceAnalysisIntervalMs = useCallback(
    (analysisIntervalMs: number) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: {
          ...prev.commentIntelligence,
          analysisIntervalMs: normalizePositiveInteger(
            analysisIntervalMs,
            getDefaultSettings().commentIntelligence.analysisIntervalMs,
          ),
        },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceMaxCommentsPerBatch = useCallback(
    (maxCommentsPerBatch: number) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: {
          ...prev.commentIntelligence,
          maxCommentsPerBatch: normalizePositiveInteger(
            maxCommentsPerBatch,
            getDefaultSettings().commentIntelligence.maxCommentsPerBatch,
          ),
        },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceMinCommentsForLLMAnalysis = useCallback(
    (minCommentsForLLMAnalysis: number) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: {
          ...prev.commentIntelligence,
          minCommentsForLLMAnalysis: normalizePositiveInteger(
            minCommentsForLLMAnalysis,
            getDefaultSettings().commentIntelligence.minCommentsForLLMAnalysis,
          ),
        },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceBlockHighRiskViewers = useCallback(
    (blockHighRiskViewers: boolean) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: {
          ...prev.commentIntelligence,
          blockHighRiskViewers,
        },
      }));
    },
    [setSettings],
  );

  const updateCommentIntelligenceViewerBlockDurationMs = useCallback(
    (viewerBlockDurationMs: number) => {
      setSettings((prev) => ({
        ...prev,
        commentIntelligence: {
          ...prev.commentIntelligence,
          viewerBlockDurationMs: normalizePositiveInteger(
            viewerBlockDurationMs,
            getDefaultSettings().commentIntelligence.viewerBlockDurationMs,
          ),
        },
      }));
    },
    [setSettings],
  );

  const updateManneriEnabled = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({
        ...prev,
        manneri: { ...prev.manneri, enabled },
      }));
    },
    [setSettings],
  );

  const updateManneriSimilarityThreshold = useCallback(
    (similarityThreshold: number) => {
      setSettings((prev) => ({
        ...prev,
        manneri: {
          ...prev.manneri,
          similarityThreshold: Math.min(1, Math.max(0.1, similarityThreshold)),
        },
      }));
    },
    [setSettings],
  );

  const updateManneriLookbackWindow = useCallback(
    (lookbackWindow: number) => {
      setSettings((prev) => ({
        ...prev,
        manneri: {
          ...prev.manneri,
          lookbackWindow: normalizePositiveInteger(
            lookbackWindow,
            getDefaultSettings().manneri.lookbackWindow,
          ),
        },
      }));
    },
    [setSettings],
  );

  const updateManneriInterventionCooldownMs = useCallback(
    (interventionCooldownMs: number) => {
      setSettings((prev) => ({
        ...prev,
        manneri: {
          ...prev.manneri,
          interventionCooldownMs: normalizePositiveInteger(
            interventionCooldownMs,
            getDefaultSettings().manneri.interventionCooldownMs,
          ),
        },
      }));
    },
    [setSettings],
  );

  const updateManneriMinMessageLength = useCallback(
    (minMessageLength: number) => {
      setSettings((prev) => ({
        ...prev,
        manneri: {
          ...prev.manneri,
          minMessageLength: normalizePositiveInteger(
            minMessageLength,
            getDefaultSettings().manneri.minMessageLength,
          ),
        },
      }));
    },
    [setSettings],
  );

  return {
    updateScreenVisionDeviceId,
    updateScreenVisionPrompt,
    updateScreenVisionAutoIntervalMs,
    updateScreenVisionEnabled,
    updateStreamPlatform,
    updateYoutubeApiKey,
    updateYoutubeLiveId,
    updateYoutubeEnabled,
    updateYoutubeCommentIntervalMs,
    updateTwitchClientId,
    updateTwitchAccessToken,
    updateTwitchChannel,
    updateTwitchEnabled,
    updateTwitchCommentIntervalMs,
    updateCommentIntelligenceEnabled,
    updateCommentIntelligenceMode,
    updateCommentIntelligenceStreamTopic,
    updateCommentIntelligenceStreamTitle,
    updateCommentIntelligenceTopicFilter,
    updateCommentIntelligenceAnalysisIntervalMs,
    updateCommentIntelligenceMaxCommentsPerBatch,
    updateCommentIntelligenceMinCommentsForLLMAnalysis,
    updateCommentIntelligenceBlockHighRiskViewers,
    updateCommentIntelligenceViewerBlockDurationMs,
    updateManneriEnabled,
    updateManneriSimilarityThreshold,
    updateManneriLookbackWindow,
    updateManneriInterventionCooldownMs,
    updateManneriMinMessageLength,
  };
}
