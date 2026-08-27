import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioLipsync } from '../hooks/useAudioLipsync';
import { useAituberCore } from '../hooks/useAituberCore';
import { useLiveCommentIntelligence } from '../hooks/useLiveCommentIntelligence';
import { useScreenVisionController } from '../hooks/useScreenVisionController';
import { useSettings } from '../hooks/useSettings';
import { useTwitchComments } from '../hooks/useTwitchComments';
import { useYoutubeComments } from '../hooks/useYoutubeComments';
import type { AvatarPresenterController } from '../hooks/useAvatarPresenter';
import type { TwitchChatMessage } from '../services/twitch/twitchService';
import type { YouTubeChatMessage } from '../services/youtube/youtubeService';
import { ChatSession } from './ChatSession';
import { EditSession } from './EditSession';
import { PresentSession } from './PresentSession';
import { SettingsDialog } from './SettingsDialog';
import '../styles/app.css';

export default function App() {
  const { play, stop, mouthLevelRef, isSpeaking } = useAudioLipsync();
  const settingsHook = useSettings();
  const updateTwitchAccessToken = settingsHook.updateTwitchAccessToken;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [streamErrorMessage, setStreamErrorMessage] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null,
  );
  const [presentStageMode, setPresentStageMode] = useState(false);
  const backgroundObjectUrlRef = useRef<string | null>(null);
  const avatarPresenterRef = useRef<AvatarPresenterController | null>(null);

  const sessionMode = settingsHook.settings.present.sessionMode;

  useEffect(() => {
    if (sessionMode !== 'present') {
      setPresentStageMode(false);
    }
  }, [sessionMode]);

  const toggleSettingsDialog = useCallback(() => {
    setSettingsOpen((open) => !open);
  }, []);

  const closeSettingsDialog = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleAudioPlay = useCallback(
    async (arrayBuffer: ArrayBuffer) => {
      await play(arrayBuffer);
    },
    [play],
  );

  const {
    messages,
    isProcessing,
    partialResponse,
    processChat,
    processVisionChat,
  } = useAituberCore({
    onAudioPlay: handleAudioPlay,
    onSpeechStart: () => avatarPresenterRef.current?.onSpeechStart(),
    onSpeechEnd: () => avatarPresenterRef.current?.onSpeechEnd(),
    settings: settingsHook.settings,
    getApiKeyForProvider: settingsHook.getApiKeyForProvider,
  });

  const screenVisionController = useScreenVisionController({
    settings: settingsHook.settings.screenVision,
    onCapture: processVisionChat,
    onEnabledChange: settingsHook.updateScreenVisionEnabled,
    onDeviceIdChange: settingsHook.updateScreenVisionDeviceId,
  });

  const handleSend = useCallback(
    (text: string) => {
      stop();
      avatarPresenterRef.current?.reset(160);
      avatarPresenterRef.current?.clearEmotionEffect();
      processChat(text);
    },
    [stop, processChat],
  );

  const { enqueueYouTubeComments, enqueueTwitchComments } =
    useLiveCommentIntelligence({
      messages,
      isProcessing,
      isSpeaking,
      processChat,
      streamPlatform: settingsHook.settings.stream.platform,
      llmSettings: settingsHook.settings.llm,
      getApiKeyForProvider: settingsHook.getApiKeyForProvider,
      enabled: settingsHook.settings.commentIntelligence.enabled,
      mode: settingsHook.settings.commentIntelligence.mode,
      analysisIntervalMs:
        settingsHook.settings.commentIntelligence.analysisIntervalMs,
      maxCommentsPerBatch:
        settingsHook.settings.commentIntelligence.maxCommentsPerBatch,
      minCommentsForLLMAnalysis:
        settingsHook.settings.commentIntelligence.minCommentsForLLMAnalysis,
      blockHighRiskViewers:
        settingsHook.settings.commentIntelligence.blockHighRiskViewers,
      viewerBlockDurationMs:
        settingsHook.settings.commentIntelligence.viewerBlockDurationMs,
      streamTopic: settingsHook.settings.commentIntelligence.streamTopic,
      streamTitle: settingsHook.settings.commentIntelligence.streamTitle,
      topicFilter: settingsHook.settings.commentIntelligence.topicFilter,
    });

  const handleYoutubeComment = useCallback(
    (comment: YouTubeChatMessage) => {
      enqueueYouTubeComments([comment]);
    },
    [enqueueYouTubeComments],
  );

  const handleTwitchComment = useCallback(
    (comment: TwitchChatMessage) => {
      enqueueTwitchComments([comment]);
    },
    [enqueueTwitchComments],
  );

  const handleBackgroundImageChange = useCallback((file: File | null) => {
    if (backgroundObjectUrlRef.current) {
      URL.revokeObjectURL(backgroundObjectUrlRef.current);
      backgroundObjectUrlRef.current = null;
    }

    if (!file) {
      setBackgroundImageUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    backgroundObjectUrlRef.current = nextUrl;
    setBackgroundImageUrl(nextUrl);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) return;

    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('access_token');
    const state = params.get('state');
    const savedState = sessionStorage.getItem('twitchOauthState');

    if (token && state && state === savedState) {
      updateTwitchAccessToken(token);
      queueMicrotask(() => setStreamErrorMessage(''));
      sessionStorage.removeItem('twitchOauthState');
    }

    history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );
  }, [updateTwitchAccessToken]);

  useYoutubeComments({
    youtubeLiveId: settingsHook.settings.stream.youtubeLiveId,
    youtubeApiKey: settingsHook.settings.stream.youtubeApiKey,
    isEnabled:
      settingsHook.settings.stream.platform === 'youtube' &&
      settingsHook.settings.stream.youtubeEnabled,
    intervalMs: settingsHook.settings.stream.youtubeCommentIntervalMs,
    onComment: handleYoutubeComment,
  });

  useTwitchComments({
    twitchChannel: settingsHook.settings.stream.twitchChannel,
    twitchClientId: settingsHook.settings.stream.twitchClientId,
    twitchAccessToken: settingsHook.settings.stream.twitchAccessToken,
    isEnabled:
      settingsHook.settings.stream.platform === 'twitch' &&
      settingsHook.settings.stream.twitchEnabled,
    intervalMs: settingsHook.settings.stream.twitchCommentIntervalMs,
    onComment: handleTwitchComment,
    onTokenExpired: () => {
      settingsHook.updateTwitchAccessToken('');
      settingsHook.updateTwitchEnabled(false);
      setStreamErrorMessage('Twitch access token expired. Please reconnect.');
    },
    onError: (message) => {
      setStreamErrorMessage(message);
      if (message) {
        console.warn(message);
      }
    },
  });

  useEffect(() => {
    const backgroundObjectUrl = backgroundObjectUrlRef;

    return () => {
      if (backgroundObjectUrl.current) {
        URL.revokeObjectURL(backgroundObjectUrl.current);
      }
    };
  }, []);

  return (
    <div className={`app${presentStageMode ? ' is-present-stage' : ''}`}>
      {sessionMode === 'edit' ? (
        <EditSession
          settingsHook={settingsHook}
          onToggleSettings={toggleSettingsDialog}
        />
      ) : sessionMode === 'present' ? (
        <PresentSession
          settingsHook={settingsHook}
          onToggleSettings={toggleSettingsDialog}
          onStageModeChange={setPresentStageMode}
          presentStageMode={presentStageMode}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          mouthLevelRef={mouthLevelRef}
          backgroundImageUrl={backgroundImageUrl}
          onPlay={handleAudioPlay}
          onStop={stop}
        />
      ) : (
        <ChatSession
          settingsHook={settingsHook}
          onToggleSettings={toggleSettingsDialog}
          avatarPresenterRef={avatarPresenterRef}
          messages={messages}
          partialResponse={partialResponse}
          isProcessing={isProcessing}
          onSend={handleSend}
          mouthLevelRef={mouthLevelRef}
          isSpeaking={isSpeaking}
          backgroundImageUrl={backgroundImageUrl}
        />
      )}

      <SettingsDialog
        open={settingsOpen}
        onClose={closeSettingsDialog}
        settingsHook={settingsHook}
        isProcessing={isProcessing}
        backgroundImageUrl={backgroundImageUrl}
        streamErrorMessage={streamErrorMessage}
        screenVisionController={screenVisionController}
        onBackgroundImageChange={handleBackgroundImageChange}
      />
    </div>
  );
}
