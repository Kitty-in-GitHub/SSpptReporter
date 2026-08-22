import type {
  CommentIntelligenceSettings,
  ManneriSettings,
  StreamSettings,
  StreamingPlatformOption,
} from '../types/settings';

const STREAM_INTERVAL_OPTIONS = [5000, 10000, 20000, 30000, 60000] as const;
const COMMENT_ANALYSIS_INTERVAL_OPTIONS = [1000, 2000, 5000, 10000] as const;
const COMMENT_BATCH_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const;
const COMMENT_LLM_MIN_COMMENTS_OPTIONS = [4, 8, 12, 20] as const;
const MANNERI_SIMILARITY_THRESHOLD_OPTIONS = [
  0.6, 0.7, 0.75, 0.8, 0.9,
] as const;
const MANNERI_LOOKBACK_WINDOW_OPTIONS = [4, 6, 8, 10, 15, 20] as const;
const MANNERI_MIN_MESSAGE_LENGTH_OPTIONS = [4, 8, 10, 16, 24] as const;
const VIEWER_BLOCK_DURATION_OPTIONS = [
  { label: '1 分钟', value: 60 * 1000 },
  { label: '5 分钟', value: 5 * 60 * 1000 },
  { label: '10 分钟', value: 10 * 60 * 1000 },
  { label: '30 分钟', value: 30 * 60 * 1000 },
] as const;
const MANNERI_COOLDOWN_OPTIONS = [
  { label: '1 分钟', value: 60 * 1000 },
  { label: '3 分钟', value: 3 * 60 * 1000 },
  { label: '5 分钟', value: 5 * 60 * 1000 },
  { label: '10 分钟', value: 10 * 60 * 1000 },
] as const;

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

function getTwitchRedirectUri(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URL(window.location.pathname, window.location.origin).toString();
}

export function StreamSettings({
  stream,
  commentIntelligence,
  manneri,
  disabled,
  isExpanded,
  isCommentIntelligenceExpanded,
  isManneriExpanded,
  onToggleExpand,
  onToggleCommentIntelligence,
  onToggleManneri,
  streamErrorMessage,
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
}: StreamSettingsProps) {
  const twitchRedirectUri = getTwitchRedirectUri();
  const isYoutubeSelected = stream.platform === 'youtube';
  const isTwitchSelected = stream.platform === 'twitch';
  const isTwitchReady =
    !!stream.twitchAccessToken &&
    !!stream.twitchChannel.trim() &&
    !!stream.twitchClientId.trim();
  const commentControlsDisabled = disabled || !commentIntelligence.enabled;
  const manneriControlsDisabled = disabled || !manneri.enabled;

  const handleConnectTwitch = () => {
    try {
      const state = window.crypto.randomUUID();
      sessionStorage.setItem('twitchOauthState', state);

      const params = new URLSearchParams({
        client_id: stream.twitchClientId,
        redirect_uri: twitchRedirectUri,
        response_type: 'token',
        scope: 'user:read:chat',
        state,
      });

      window.location.assign(
        `https://id.twitch.tv/oauth2/authorize?${params.toString()}`,
      );
    } catch (error) {
      console.error('Failed to start Twitch OAuth:', error);
    }
  };

  return (
    <>
      <div className="settings-section">
        <button
          type="button"
          className="settings-section-toggle"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
        >
          <h3>直播</h3>
          <span
            className={`settings-section-chevron${isExpanded ? ' is-open' : ''}`}
          >
            ⌄
          </span>
        </button>

        {isExpanded && (
          <>
            <div className="settings-field">
              <label htmlFor="stream-platform">直播平台</label>
              <select
                id="stream-platform"
                value={stream.platform}
                onChange={(event) =>
                  updateStreamPlatform(
                    event.target.value as StreamingPlatformOption,
                  )
                }
                disabled={disabled}
              >
                <option value="none">None</option>
                <option value="youtube">YouTube</option>
                <option value="twitch">Twitch</option>
              </select>
            </div>

            {isYoutubeSelected && (
              <>
                <div className="settings-field">
                  <label htmlFor="stream-youtube-apikey">YouTube API 密钥</label>
                  <input
                    id="stream-youtube-apikey"
                    type="password"
                    value={stream.youtubeApiKey}
                    onChange={(event) =>
                      updateYoutubeApiKey(event.target.value)
                    }
                    placeholder="YouTube Data API v3 key"
                    disabled={disabled}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="stream-youtube-liveid">
                    YouTube Live Video ID
                  </label>
                  <input
                    id="stream-youtube-liveid"
                    type="text"
                    value={stream.youtubeLiveId}
                    onChange={(event) =>
                      updateYoutubeLiveId(event.target.value)
                    }
                    placeholder="YouTube live video ID"
                    disabled={disabled}
                  />
                  <p className="settings-field-hint">
                    Use the <code>v=</code> value from the YouTube Live URL.
                  </p>
                </div>

                <div className="settings-field">
                  <label htmlFor="stream-youtube-interval">
                    Polling Interval
                  </label>
                  <select
                    id="stream-youtube-interval"
                    value={stream.youtubeCommentIntervalMs}
                    onChange={(event) =>
                      updateYoutubeCommentIntervalMs(Number(event.target.value))
                    }
                    disabled={disabled}
                  >
                    {STREAM_INTERVAL_OPTIONS.map((intervalMs) => (
                      <option key={intervalMs} value={intervalMs}>
                        {intervalMs.toLocaleString()} ms
                      </option>
                    ))}
                  </select>
                </div>

                <div className="settings-field">
                  <label htmlFor="stream-youtube-enabled">
                    <input
                      id="stream-youtube-enabled"
                      type="checkbox"
                      checked={stream.youtubeEnabled}
                      onChange={(event) =>
                        updateYoutubeEnabled(event.target.checked)
                      }
                      disabled={disabled}
                      style={{ marginRight: 8 }}
                    />
                    Enable
                  </label>
                </div>
              </>
            )}

            {isTwitchSelected && (
              <>
                <div className="settings-field">
                  <label htmlFor="stream-twitch-clientid">
                    Twitch Client ID
                  </label>
                  <input
                    id="stream-twitch-clientid"
                    type="password"
                    value={stream.twitchClientId}
                    onChange={(event) =>
                      updateTwitchClientId(event.target.value)
                    }
                    placeholder="Twitch Client ID"
                    disabled={disabled}
                  />
                </div>

                <div className="settings-field">
                  <label>Twitch Connection</label>
                  {stream.twitchAccessToken ? (
                    <div className="settings-file-actions">
                      <span className="settings-file-status">已连接</span>
                      <button
                        type="button"
                        className="settings-clear-button"
                        onClick={() => {
                          updateTwitchAccessToken('');
                          updateTwitchEnabled(false);
                        }}
                        disabled={disabled}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="settings-file-trigger"
                      onClick={handleConnectTwitch}
                      disabled={disabled || !stream.twitchClientId.trim()}
                    >
                      Connect to Twitch
                    </button>
                  )}
                  <p className="settings-field-hint">
                    Register this URL in Twitch Developer Console as an OAuth
                    Redirect URL.
                  </p>
                  <p className="settings-field-hint">{twitchRedirectUri}</p>
                </div>

                <div className="settings-field">
                  <label htmlFor="stream-twitch-channel">
                    Twitch Channel (login name)
                  </label>
                  <input
                    id="stream-twitch-channel"
                    type="text"
                    value={stream.twitchChannel}
                    onChange={(event) =>
                      updateTwitchChannel(event.target.value)
                    }
                    placeholder="example_channel"
                    disabled={disabled}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="stream-twitch-interval">
                    Dequeue Interval
                  </label>
                  <select
                    id="stream-twitch-interval"
                    value={stream.twitchCommentIntervalMs}
                    onChange={(event) =>
                      updateTwitchCommentIntervalMs(Number(event.target.value))
                    }
                    disabled={disabled}
                  >
                    {STREAM_INTERVAL_OPTIONS.map((intervalMs) => (
                      <option key={intervalMs} value={intervalMs}>
                        {intervalMs.toLocaleString()} ms
                      </option>
                    ))}
                  </select>
                  <p className="settings-field-hint">
                    One queued Twitch message is forwarded per interval.
                  </p>
                </div>

                <div className="settings-field">
                  <label htmlFor="stream-twitch-enabled">
                    <input
                      id="stream-twitch-enabled"
                      type="checkbox"
                      checked={stream.twitchEnabled}
                      onChange={(event) =>
                        updateTwitchEnabled(event.target.checked)
                      }
                      disabled={disabled || !isTwitchReady}
                      style={{ marginRight: 8 }}
                    />
                    Enable
                  </label>
                </div>
              </>
            )}

            {streamErrorMessage ? (
              <p className="settings-field-error">{streamErrorMessage}</p>
            ) : null}
          </>
        )}
      </div>

      <div className="settings-section">
        <button
          type="button"
          className="settings-section-toggle"
          onClick={onToggleCommentIntelligence}
          aria-expanded={isCommentIntelligenceExpanded}
        >
          <h3>弹幕智能</h3>
          <span
            className={`settings-section-chevron${isCommentIntelligenceExpanded ? ' is-open' : ''}`}
          >
            ⌄
          </span>
        </button>

        {isCommentIntelligenceExpanded && (
          <>
            <div className="settings-field">
              <label htmlFor="comment-intelligence-enabled">
                <input
                  id="comment-intelligence-enabled"
                  type="checkbox"
                  checked={commentIntelligence.enabled}
                  onChange={(event) =>
                    updateCommentIntelligenceEnabled(event.target.checked)
                  }
                  disabled={disabled}
                  style={{ marginRight: 8 }}
                />
                弹幕智能
              </label>
              <p className="settings-field-hint">
                在处理或播报期间暂存直播弹幕，进行优先级与安全判断，每次只发送一条。
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="comment-intelligence-mode">解析模式</label>
              <select
                id="comment-intelligence-mode"
                value={commentIntelligence.mode}
                onChange={(event) =>
                  updateCommentIntelligenceMode(
                    event.target.value as CommentIntelligenceSettings['mode'],
                  )
                }
                disabled={commentControlsDisabled}
              >
                <option value="rules">规则（无需 API）</option>
                <option value="hybrid">混合</option>
                <option value="llm-assisted">LLM 辅助</option>
              </select>
              <p className="settings-field-hint">
                规则模式不额外调用 LLM。混合与 LLM 辅助使用「大模型」区的提供商与模型；不可用时回退到规则。
              </p>
              <div className="settings-mode-help">
                <p>
                  <strong>规则：</strong>
                  无额外成本，用固定规则做安全判断、优先级与摘要。
                </p>
                <p>
                  <strong>混合：</strong>
                  平时用规则；仅当弹幕数达到阈值时才调用 LLM 分析。
                </p>
                <p>
                  <strong>LLM 辅助：</strong>
                  每次用 LLM 分析弹幕，理解更好，但 API 成本与延迟更高。
                </p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="comment-intelligence-stream-topic">
                直播主题
              </label>
              <input
                id="comment-intelligence-stream-topic"
                type="text"
                value={commentIntelligence.streamTopic}
                onChange={(event) =>
                  updateCommentIntelligenceStreamTopic(event.target.value)
                }
                placeholder="例：AI 工具介绍"
                disabled={commentControlsDisabled}
              />
            </div>

            <div className="settings-field">
              <label htmlFor="comment-intelligence-stream-title">
                直播标题
              </label>
              <input
                id="comment-intelligence-stream-title"
                type="text"
                value={commentIntelligence.streamTitle}
                onChange={(event) =>
                  updateCommentIntelligenceStreamTitle(event.target.value)
                }
                placeholder="例：今日试用效率工具"
                disabled={commentControlsDisabled}
              />
            </div>

            <div className="settings-field">
              <label htmlFor="comment-intelligence-topic-filter">
                主题优先级
              </label>
              <select
                id="comment-intelligence-topic-filter"
                value={commentIntelligence.topicFilter}
                onChange={(event) =>
                  updateCommentIntelligenceTopicFilter(
                    event.target
                      .value as CommentIntelligenceSettings['topicFilter'],
                  )
                }
                disabled={commentControlsDisabled}
              >
                <option value="off">通常</option>
                <option value="prefer">偏重主题</option>
                <option value="require">忽略主题外内容</option>
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="comment-intelligence-interval">解析間隔</label>
              <select
                id="comment-intelligence-interval"
                value={commentIntelligence.analysisIntervalMs}
                onChange={(event) =>
                  updateCommentIntelligenceAnalysisIntervalMs(
                    Number(event.target.value),
                  )
                }
                disabled={commentControlsDisabled}
              >
                {COMMENT_ANALYSIS_INTERVAL_OPTIONS.map((intervalMs) => (
                  <option key={intervalMs} value={intervalMs}>
                    {intervalMs.toLocaleString()} ms
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="comment-intelligence-batch-size">
                单次解析处理的最大弹幕数
              </label>
              <select
                id="comment-intelligence-batch-size"
                value={commentIntelligence.maxCommentsPerBatch}
                onChange={(event) =>
                  updateCommentIntelligenceMaxCommentsPerBatch(
                    Number(event.target.value),
                  )
                }
                disabled={commentControlsDisabled}
              >
                {COMMENT_BATCH_SIZE_OPTIONS.map((batchSize) => (
                  <option key={batchSize} value={batchSize}>
                    {batchSize}
                  </option>
                ))}
              </select>
            </div>

            {commentIntelligence.mode !== 'rules' && (
              <div className="settings-field">
                <label htmlFor="comment-intelligence-llm-min-comments">
                  启用 LLM 解析的最小弹幕数
                </label>
                <select
                  id="comment-intelligence-llm-min-comments"
                  value={commentIntelligence.minCommentsForLLMAnalysis}
                  onChange={(event) =>
                    updateCommentIntelligenceMinCommentsForLLMAnalysis(
                      Number(event.target.value),
                    )
                  }
                  disabled={commentControlsDisabled}
                >
                  {COMMENT_LLM_MIN_COMMENTS_OPTIONS.map((minComments) => (
                    <option key={minComments} value={minComments}>
                      {minComments}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="settings-field">
              <label htmlFor="comment-intelligence-block-viewers">
                <input
                  id="comment-intelligence-block-viewers"
                  type="checkbox"
                  checked={commentIntelligence.blockHighRiskViewers}
                  onChange={(event) =>
                    updateCommentIntelligenceBlockHighRiskViewers(
                      event.target.checked,
                    )
                  }
                  disabled={commentControlsDisabled}
                  style={{ marginRight: 8 }}
                />
                暂时跳过高风险观众
              </label>
              <p className="settings-field-hint">
                发送高风险弹幕的观众在设定时间内不再参与解析，避免直接进入核心对话。
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="comment-intelligence-block-duration">
                跳过时长
              </label>
              <select
                id="comment-intelligence-block-duration"
                value={commentIntelligence.viewerBlockDurationMs}
                onChange={(event) =>
                  updateCommentIntelligenceViewerBlockDurationMs(
                    Number(event.target.value),
                  )
                }
                disabled={
                  commentControlsDisabled ||
                  !commentIntelligence.blockHighRiskViewers
                }
              >
                {VIEWER_BLOCK_DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="settings-section">
        <button
          type="button"
          className="settings-section-toggle"
          onClick={onToggleManneri}
          aria-expanded={isManneriExpanded}
        >
          <h3>话题多样性</h3>
          <span
            className={`settings-section-chevron${isManneriExpanded ? ' is-open' : ''}`}
          >
            ⌄
          </span>
        </button>

        {isManneriExpanded && (
          <>
            <div className="settings-field">
              <label htmlFor="manneri-enabled">
                <input
                  id="manneri-enabled"
                  type="checkbox"
                  checked={manneri.enabled}
                  onChange={(event) =>
                    updateManneriEnabled(event.target.checked)
                  }
                  disabled={disabled}
                  style={{ marginRight: 8 }}
                />
                Manneri
              </label>
              <p className="settings-field-hint">
                当对话过于重复时，在回复前内部加入换话题指令。
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="manneri-similarity-threshold">
                相似度阈值
              </label>
              <select
                id="manneri-similarity-threshold"
                value={manneri.similarityThreshold}
                onChange={(event) =>
                  updateManneriSimilarityThreshold(Number(event.target.value))
                }
                disabled={manneriControlsDisabled}
              >
                {MANNERI_SIMILARITY_THRESHOLD_OPTIONS.map((threshold) => (
                  <option key={threshold} value={threshold}>
                    {Math.round(threshold * 100)}%
                  </option>
                ))}
              </select>
              <p className="settings-field-hint">
                数值越低越容易介入，越高则只检测明显重复。
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="manneri-lookback-window">最近消息条数</label>
              <select
                id="manneri-lookback-window"
                value={manneri.lookbackWindow}
                onChange={(event) =>
                  updateManneriLookbackWindow(Number(event.target.value))
                }
                disabled={manneriControlsDisabled}
              >
                {MANNERI_LOOKBACK_WINDOW_OPTIONS.map((lookbackWindow) => (
                  <option key={lookbackWindow} value={lookbackWindow}>
                    {lookbackWindow}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="manneri-cooldown">介入間隔</label>
              <select
                id="manneri-cooldown"
                value={manneri.interventionCooldownMs}
                onChange={(event) =>
                  updateManneriInterventionCooldownMs(
                    Number(event.target.value),
                  )
                }
                disabled={manneriControlsDisabled}
              >
                {MANNERI_COOLDOWN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="manneri-min-message-length">
                最短消息长度
              </label>
              <select
                id="manneri-min-message-length"
                value={manneri.minMessageLength}
                onChange={(event) =>
                  updateManneriMinMessageLength(Number(event.target.value))
                }
                disabled={manneriControlsDisabled}
              >
                {MANNERI_MIN_MESSAGE_LENGTH_OPTIONS.map((minMessageLength) => (
                  <option key={minMessageLength} value={minMessageLength}>
                    {minMessageLength}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </>
  );
}
