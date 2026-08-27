import type { CommentIntelligenceSettings } from '../../types/settings';
import {
  COMMENT_ANALYSIS_INTERVAL_OPTIONS,
  COMMENT_BATCH_SIZE_OPTIONS,
  COMMENT_LLM_MIN_COMMENTS_OPTIONS,
  VIEWER_BLOCK_DURATION_OPTIONS,
} from './streamSettingsConstants';

export interface CommentIntelligenceSettingsSectionProps {
  commentIntelligence: CommentIntelligenceSettings;
  disabled: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
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
}

export function CommentIntelligenceSettingsSection({
  commentIntelligence,
  disabled,
  isExpanded,
  onToggleExpand,
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
}: CommentIntelligenceSettingsSectionProps) {
  const commentControlsDisabled = disabled || !commentIntelligence.enabled;

  return (
    <div className="settings-section">
      <button
        type="button"
        className="settings-section-toggle"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <h3>弹幕智能</h3>
        <span
          className={`settings-section-chevron${isExpanded ? ' is-open' : ''}`}
        >
          ⌄
        </span>
      </button>

      {isExpanded && (
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
            <label htmlFor="comment-intelligence-stream-topic">直播主题</label>
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
            <label htmlFor="comment-intelligence-stream-title">直播标题</label>
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
            <label htmlFor="comment-intelligence-topic-filter">主题优先级</label>
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
            <label htmlFor="comment-intelligence-block-duration">跳过时长</label>
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
  );
}
