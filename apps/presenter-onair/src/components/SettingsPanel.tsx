import { useState } from 'react';
import { ScreenVisionPanel } from './ScreenVisionPanel';
import { StreamSettings } from './StreamSettings';
import type { useScreenVisionController } from '../hooks/useScreenVisionController';
import type { useSettings } from '../hooks/useSettings';
import { EmotionEffectsSection } from './settings/EmotionEffectsSection';
import { LlmSettingsSection } from './settings/LlmSettingsSection';
import { PresentQaSettingsSection } from './settings/PresentQaSettingsSection';
import { TtsSettingsSection } from './settings/TtsSettingsSection';
import { VisualSettingsSection } from './settings/VisualSettingsSection';
import { FaceCaptureSettingsSection } from './settings/FaceCaptureSettingsSection';

type SettingsHook = ReturnType<typeof useSettings>;
type ScreenVisionController = ReturnType<typeof useScreenVisionController>;

interface SettingsPanelProps extends SettingsHook {
  isProcessing: boolean;
  backgroundImageUrl: string | null;
  vrmResolveError?: string | null;
  streamErrorMessage?: string;
  screenVisionController: ScreenVisionController;
  onBackgroundImageChange: (file: File | null) => void;
}

type SectionKey =
  | 'llm'
  | 'tts'
  | 'presentQa'
  | 'visual'
  | 'emotionEffects'
  | 'stream'
  | 'faceCapture'
  | 'commentIntelligence'
  | 'manneri';

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    isProcessing,
    backgroundImageUrl,
    vrmResolveError = null,
    streamErrorMessage,
    screenVisionController,
    onBackgroundImageChange,
    settings,
    ...settingsHook
  } = props;

  const disabled = isProcessing;

  const [expandedSections, setExpandedSections] = useState<
    Record<SectionKey, boolean>
  >({
    llm: true,
    tts: true,
    presentQa: true,
    visual: true,
    emotionEffects: true,
    stream: true,
    faceCapture: true,
    commentIntelligence: true,
    manneri: true,
  });

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="settings-panel">
      <LlmSettingsSection
        {...settingsHook}
        settings={settings}
        disabled={disabled}
        isExpanded={expandedSections.llm}
        onToggleExpand={() => toggleSection('llm')}
      />

      <TtsSettingsSection
        {...settingsHook}
        settings={settings}
        disabled={disabled}
        isExpanded={expandedSections.tts}
        onToggleExpand={() => toggleSection('tts')}
      />

      <PresentQaSettingsSection
        settings={settings}
        updatePresentQaAsrEngine={settingsHook.updatePresentQaAsrEngine}
        disabled={disabled}
        isExpanded={expandedSections.presentQa}
        onToggleExpand={() => toggleSection('presentQa')}
      />

      <VisualSettingsSection
        {...settingsHook}
        settings={settings}
        disabled={disabled}
        isExpanded={expandedSections.visual}
        onToggleExpand={() => toggleSection('visual')}
        backgroundImageUrl={backgroundImageUrl}
        vrmResolveError={vrmResolveError}
        onBackgroundImageChange={onBackgroundImageChange}
      />

      <EmotionEffectsSection
        settings={settings}
        updateVisualVrmReactionControlMode={
          settingsHook.updateVisualVrmReactionControlMode
        }
        updateVisualVrmEmotionEffect={settingsHook.updateVisualVrmEmotionEffect}
        resetVisualVrmEmotionEffectMap={
          settingsHook.resetVisualVrmEmotionEffectMap
        }
        disabled={disabled}
        isExpanded={expandedSections.emotionEffects}
        onToggleExpand={() => toggleSection('emotionEffects')}
      />

      <div className="settings-section">
        <h3>屏幕视觉</h3>
        <ScreenVisionPanel
          disabled={disabled}
          settings={settings.screenVision}
          controller={screenVisionController}
          onDeviceIdChange={settingsHook.updateScreenVisionDeviceId}
          onPromptChange={settingsHook.updateScreenVisionPrompt}
          onAutoIntervalMsChange={settingsHook.updateScreenVisionAutoIntervalMs}
        />
      </div>

      <FaceCaptureSettingsSection
        {...settingsHook}
        settings={settings}
        disabled={disabled}
        isExpanded={expandedSections.faceCapture}
        onToggleExpand={() => toggleSection('faceCapture')}
      />

      <StreamSettings
        stream={settings.stream}
        commentIntelligence={settings.commentIntelligence}
        manneri={settings.manneri}
        disabled={disabled}
        isExpanded={expandedSections.stream}
        isCommentIntelligenceExpanded={expandedSections.commentIntelligence}
        isManneriExpanded={expandedSections.manneri}
        onToggleExpand={() => toggleSection('stream')}
        onToggleCommentIntelligence={() => toggleSection('commentIntelligence')}
        onToggleManneri={() => toggleSection('manneri')}
        streamErrorMessage={streamErrorMessage}
        updateStreamPlatform={settingsHook.updateStreamPlatform}
        updateYoutubeApiKey={settingsHook.updateYoutubeApiKey}
        updateYoutubeLiveId={settingsHook.updateYoutubeLiveId}
        updateYoutubeEnabled={settingsHook.updateYoutubeEnabled}
        updateYoutubeCommentIntervalMs={
          settingsHook.updateYoutubeCommentIntervalMs
        }
        updateTwitchClientId={settingsHook.updateTwitchClientId}
        updateTwitchAccessToken={settingsHook.updateTwitchAccessToken}
        updateTwitchChannel={settingsHook.updateTwitchChannel}
        updateTwitchEnabled={settingsHook.updateTwitchEnabled}
        updateTwitchCommentIntervalMs={
          settingsHook.updateTwitchCommentIntervalMs
        }
        updateCommentIntelligenceEnabled={
          settingsHook.updateCommentIntelligenceEnabled
        }
        updateCommentIntelligenceMode={settingsHook.updateCommentIntelligenceMode}
        updateCommentIntelligenceStreamTopic={
          settingsHook.updateCommentIntelligenceStreamTopic
        }
        updateCommentIntelligenceStreamTitle={
          settingsHook.updateCommentIntelligenceStreamTitle
        }
        updateCommentIntelligenceTopicFilter={
          settingsHook.updateCommentIntelligenceTopicFilter
        }
        updateCommentIntelligenceAnalysisIntervalMs={
          settingsHook.updateCommentIntelligenceAnalysisIntervalMs
        }
        updateCommentIntelligenceMaxCommentsPerBatch={
          settingsHook.updateCommentIntelligenceMaxCommentsPerBatch
        }
        updateCommentIntelligenceMinCommentsForLLMAnalysis={
          settingsHook.updateCommentIntelligenceMinCommentsForLLMAnalysis
        }
        updateCommentIntelligenceBlockHighRiskViewers={
          settingsHook.updateCommentIntelligenceBlockHighRiskViewers
        }
        updateCommentIntelligenceViewerBlockDurationMs={
          settingsHook.updateCommentIntelligenceViewerBlockDurationMs
        }
        updateManneriEnabled={settingsHook.updateManneriEnabled}
        updateManneriSimilarityThreshold={
          settingsHook.updateManneriSimilarityThreshold
        }
        updateManneriLookbackWindow={settingsHook.updateManneriLookbackWindow}
        updateManneriInterventionCooldownMs={
          settingsHook.updateManneriInterventionCooldownMs
        }
        updateManneriMinMessageLength={settingsHook.updateManneriMinMessageLength}
      />
    </div>
  );
}
