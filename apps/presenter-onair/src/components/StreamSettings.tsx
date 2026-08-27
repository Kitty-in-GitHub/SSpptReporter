import type {
  CommentIntelligenceSettings,
  ManneriSettings,
  StreamSettings,
  StreamingPlatformOption,
} from '../types/settings';
import { CommentIntelligenceSettingsSection } from './settings/CommentIntelligenceSettingsSection';
import { ManneriSettingsSection } from './settings/ManneriSettingsSection';
import { StreamPlatformSection } from './settings/StreamPlatformSection';

interface StreamSettingsProps {
  stream: StreamSettings;
  commentIntelligence: CommentIntelligenceSettings;
  manneri: ManneriSettings;
  disabled: boolean;
  isExpanded: boolean;
  isCommentIntelligenceExpanded: boolean;
  isManneriExpanded: boolean;
  onToggleExpand: () => void;
  onToggleCommentIntelligence: () => void;
  onToggleManneri: () => void;
  streamErrorMessage?: string;
  updateStreamPlatform: (platform: StreamingPlatformOption) => void;
  updateYoutubeApiKey: (value: string) => void;
  updateYoutubeLiveId: (value: string) => void;
  updateYoutubeEnabled: (value: boolean) => void;
  updateYoutubeCommentIntervalMs: (value: number) => void;
  updateTwitchClientId: (value: string) => void;
  updateTwitchAccessToken: (value: string) => void;
  updateTwitchChannel: (value: string) => void;
  updateTwitchEnabled: (value: boolean) => void;
  updateTwitchCommentIntervalMs: (value: number) => void;
  updateCommentIntelligenceEnabled: (value: boolean) => void;
  updateCommentIntelligenceMode: (
    value: CommentIntelligenceSettings['mode'],
  ) => void;
  updateCommentIntelligenceStreamTopic: (value: string) => void;
  updateCommentIntelligenceStreamTitle: (value: string) => void;
  updateCommentIntelligenceTopicFilter: (
    value: CommentIntelligenceSettings['topicFilter'],
  ) => void;
  updateCommentIntelligenceAnalysisIntervalMs: (value: number) => void;
  updateCommentIntelligenceMaxCommentsPerBatch: (value: number) => void;
  updateCommentIntelligenceMinCommentsForLLMAnalysis: (value: number) => void;
  updateCommentIntelligenceBlockHighRiskViewers: (value: boolean) => void;
  updateCommentIntelligenceViewerBlockDurationMs: (value: number) => void;
  updateManneriEnabled: (value: boolean) => void;
  updateManneriSimilarityThreshold: (value: number) => void;
  updateManneriLookbackWindow: (value: number) => void;
  updateManneriInterventionCooldownMs: (value: number) => void;
  updateManneriMinMessageLength: (value: number) => void;
}

export function StreamSettings(props: StreamSettingsProps) {
  return (
    <>
      <StreamPlatformSection
        stream={props.stream}
        disabled={props.disabled}
        isExpanded={props.isExpanded}
        onToggleExpand={props.onToggleExpand}
        streamErrorMessage={props.streamErrorMessage}
        updateStreamPlatform={props.updateStreamPlatform}
        updateYoutubeApiKey={props.updateYoutubeApiKey}
        updateYoutubeLiveId={props.updateYoutubeLiveId}
        updateYoutubeEnabled={props.updateYoutubeEnabled}
        updateYoutubeCommentIntervalMs={props.updateYoutubeCommentIntervalMs}
        updateTwitchClientId={props.updateTwitchClientId}
        updateTwitchAccessToken={props.updateTwitchAccessToken}
        updateTwitchChannel={props.updateTwitchChannel}
        updateTwitchEnabled={props.updateTwitchEnabled}
        updateTwitchCommentIntervalMs={props.updateTwitchCommentIntervalMs}
      />

      <CommentIntelligenceSettingsSection
        commentIntelligence={props.commentIntelligence}
        disabled={props.disabled}
        isExpanded={props.isCommentIntelligenceExpanded}
        onToggleExpand={props.onToggleCommentIntelligence}
        updateCommentIntelligenceEnabled={props.updateCommentIntelligenceEnabled}
        updateCommentIntelligenceMode={props.updateCommentIntelligenceMode}
        updateCommentIntelligenceStreamTopic={
          props.updateCommentIntelligenceStreamTopic
        }
        updateCommentIntelligenceStreamTitle={
          props.updateCommentIntelligenceStreamTitle
        }
        updateCommentIntelligenceTopicFilter={
          props.updateCommentIntelligenceTopicFilter
        }
        updateCommentIntelligenceAnalysisIntervalMs={
          props.updateCommentIntelligenceAnalysisIntervalMs
        }
        updateCommentIntelligenceMaxCommentsPerBatch={
          props.updateCommentIntelligenceMaxCommentsPerBatch
        }
        updateCommentIntelligenceMinCommentsForLLMAnalysis={
          props.updateCommentIntelligenceMinCommentsForLLMAnalysis
        }
        updateCommentIntelligenceBlockHighRiskViewers={
          props.updateCommentIntelligenceBlockHighRiskViewers
        }
        updateCommentIntelligenceViewerBlockDurationMs={
          props.updateCommentIntelligenceViewerBlockDurationMs
        }
      />

      <ManneriSettingsSection
        manneri={props.manneri}
        disabled={props.disabled}
        isExpanded={props.isManneriExpanded}
        onToggleExpand={props.onToggleManneri}
        updateManneriEnabled={props.updateManneriEnabled}
        updateManneriSimilarityThreshold={props.updateManneriSimilarityThreshold}
        updateManneriLookbackWindow={props.updateManneriLookbackWindow}
        updateManneriInterventionCooldownMs={
          props.updateManneriInterventionCooldownMs
        }
        updateManneriMinMessageLength={props.updateManneriMinMessageLength}
      />
    </>
  );
}
