import { useState, type ReactNode } from 'react';
import { UI_PRESENT, UI_QA } from '../../constants/uiZh';

export type PresentDockTab = 'script' | 'qa';

interface PresentBottomDockProps {
  script: ReactNode;
  qa: ReactNode;
  /** 收起时标题行显示的一行摘要 */
  scriptSummary: string;
  scriptHasError?: boolean;
  /** 评委提问 Tab 的状态提示（如知识库加载中） */
  qaStatus?: string | null;
  qaStatusIsError?: boolean;
}

/**
 * 汇报页底部统一底栏：讲稿与评委提问共用一个可收起的壳。
 * 默认收起，仅占一行；点 Tab 或右侧箭头展开。
 */
export function PresentBottomDock({
  script,
  qa,
  scriptSummary,
  scriptHasError = false,
  qaStatus = null,
  qaStatusIsError = false,
}: PresentBottomDockProps) {
  const [activeTab, setActiveTab] = useState<PresentDockTab>('script');
  const [expanded, setExpanded] = useState(false);

  const selectTab = (tab: PresentDockTab) => {
    setActiveTab(tab);
    setExpanded(true);
  };

  const summary = activeTab === 'script' ? scriptSummary : qaStatus;
  const summaryIsError =
    activeTab === 'script' ? scriptHasError : qaStatusIsError;

  return (
    <section className={`present-dock${expanded ? ' is-expanded' : ''}`}>
      <header className="present-dock-header">
        <button
          type="button"
          className={`present-dock-tab${activeTab === 'script' ? ' is-active' : ''}`}
          aria-pressed={activeTab === 'script'}
          onClick={() => selectTab('script')}
        >
          {UI_PRESENT.scriptDockTab}
        </button>
        <button
          type="button"
          className={`present-dock-tab${activeTab === 'qa' ? ' is-active' : ''}`}
          aria-pressed={activeTab === 'qa'}
          onClick={() => selectTab('qa')}
        >
          {UI_QA.panelTitle}
        </button>

        {summary ? (
          <span
            className={`present-dock-summary${summaryIsError ? ' is-error' : ''}`}
            title={summary}
          >
            {summary}
          </span>
        ) : null}

        <button
          type="button"
          className="present-dock-toggle"
          aria-expanded={expanded}
          aria-label={expanded ? '收起底部面板' : '展开底部面板'}
          title={expanded ? '收起' : '展开'}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? '▾' : '▴'}
        </button>
      </header>

      <div className="present-dock-body">
        <div
          className={`present-dock-pane${activeTab === 'script' ? ' is-active' : ''}`}
        >
          {script}
        </div>
        <div
          className={`present-dock-pane${activeTab === 'qa' ? ' is-active' : ''}`}
        >
          {qa}
        </div>
      </div>
    </section>
  );
}
