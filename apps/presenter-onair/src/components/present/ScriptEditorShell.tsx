import { EMOTIONS, GESTURES, type SlideAction } from '@ssreporter/director';
import { UI_SETTINGS } from '../../constants/uiZh';
import type { DeckScriptEditorController } from '../../hooks/useDeckScriptEditor';
import type { SlideDeckController } from '../../hooks/useSlideDeck';
import type { SessionMode } from '../../types/present';
import { PdfSlideViewer } from './PdfSlideViewer';
import { PresentControls } from './PresentControls';
import { SessionModeToolbar } from './SessionModeToolbar';
import './scriptEditor.css';

interface ScriptEditorShellProps {
  slideDeck: SlideDeckController;
  editor: DeckScriptEditorController;
  onSessionModeChange: (mode: SessionMode) => void;
  onToggleSettings: () => void;
}

const EMOTION_LABELS: Record<string, string> = {
  neutral: '中性',
  confident: '自信',
  friendly: '亲和',
  serious: '严肃',
  thinking: '思考',
  apologetic: '歉意',
  emphatic: '强调',
};

const GESTURE_LABELS: Record<string, string> = {
  none: '无',
  idle: '待机',
  bow: '鞠躬',
  nod: '点头',
  think: '思考',
  explain: '讲解',
  point_slide: '指幻灯',
  open_hands: '摊手',
  emphasize: '强调',
};

function slideActionKind(action: SlideAction | undefined): 'goto' | 'next' | 'prev' {
  if (action?.next) return 'next';
  if (action?.prev) return 'prev';
  return 'goto';
}

export function ScriptEditorShell({
  slideDeck,
  editor,
  onSessionModeChange,
  onToggleSettings,
}: ScriptEditorShellProps) {
  const draft = editor.draft;
  const pageCount = slideDeck.pageCount;
  const slideAction = draft?.slide_action ?? { goto: editor.currentPage };
  const actionKind = slideActionKind(slideAction);

  const handleSlideActionKindChange = (kind: 'goto' | 'next' | 'prev') => {
    if (!draft) return;
    if (kind === 'next') {
      editor.updateDraft({ slide_action: { next: true } });
      return;
    }
    if (kind === 'prev') {
      editor.updateDraft({ slide_action: { prev: true } });
      return;
    }
    editor.updateDraft({
      slide_action: { goto: slideAction.goto ?? draft.page },
    });
  };

  const handleGotoPageChange = (value: number) => {
    if (!draft) return;
    editor.updateDraft({ slide_action: { goto: value } });
  };

  const syncPdfPage = (page: number) => {
    slideDeck.goToPage(page);
    editor.goToPage(page);
  };

  return (
    <div className="script-editor-shell">
      <SessionModeToolbar
        sessionMode="edit"
        onSessionModeChange={onSessionModeChange}
        onToggleSettings={onToggleSettings}
        settingsAriaLabel={UI_SETTINGS.ariaLabel}
        title={slideDeck.deck?.title ?? '编辑讲稿'}
      >
        <PresentControls
          currentPage={editor.currentPage}
          pageCount={pageCount}
          disabled={pageCount === 0 || editor.isLoading}
          onPrev={() => syncPdfPage(editor.currentPage - 1)}
          onNext={() => syncPdfPage(editor.currentPage + 1)}
        />
        <div className="script-editor-actions">
          <button
            type="button"
            disabled={!draft || editor.isSaving || !editor.isDirty}
            onClick={() => void editor.saveCurrentPage()}
          >
            保存本页
          </button>
          <button
            type="button"
            className="is-primary"
            disabled={!draft || editor.isSaving}
            onClick={() => void editor.saveAndCompile()}
          >
            保存并编译
          </button>
          <button
            type="button"
            disabled={!editor.isDirty}
            onClick={editor.discardLocalDraft}
          >
            放弃草稿
          </button>
        </div>
      </SessionModeToolbar>

      {(editor.status || editor.error) && (
        <div
          className={`script-editor-status${editor.error ? ' is-error' : ''}${
            editor.isDirty ? ' is-dirty' : ''
          }`}
        >
          {editor.error ?? editor.status}
          {editor.isDirty && !editor.error ? ' · 有未保存修改（已自动存草稿）' : ''}
        </div>
      )}

      <div className="script-editor-stage">
        <div className="script-editor-pdf">
          {slideDeck.loadError ? (
            <div className="present-slide-error">{slideDeck.loadError}</div>
          ) : slideDeck.isLoading || !slideDeck.pdfUrl ? (
            <div className="present-slide-loading">正在加载 PDF…</div>
          ) : (
            <PdfSlideViewer
              pdfUrl={slideDeck.pdfUrl}
              pageNumber={editor.currentPage}
              onDocumentLoad={slideDeck.syncPageCount}
            />
          )}
        </div>

        <div className="script-editor-form">
          {editor.isLoading || !draft ? (
            <div className="script-editor-loading">加载讲稿…</div>
          ) : (
            <>
              <h2 className="script-editor-form-title">
                第 {editor.currentPage} 页讲稿
              </h2>

              <label className="script-editor-field">
                朗读文本
                <textarea
                  value={draft.utterance}
                  rows={8}
                  onChange={(event) =>
                    editor.updateDraft({ utterance: event.target.value })
                  }
                  placeholder="输入本页要讲的内容…"
                />
              </label>

              <div className="script-editor-field-row">
                <label className="script-editor-field">
                  表情
                  <select
                    value={draft.emotion}
                    onChange={(event) =>
                      editor.updateDraft({
                        emotion: event.target.value as typeof draft.emotion,
                      })
                    }
                  >
                    {EMOTIONS.map((value) => (
                      <option key={value} value={value}>
                        {EMOTION_LABELS[value] ?? value}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="script-editor-field">
                  手势
                  <select
                    value={draft.gesture}
                    onChange={(event) =>
                      editor.updateDraft({
                        gesture: event.target.value as typeof draft.gesture,
                      })
                    }
                  >
                    {GESTURES.map((value) => (
                      <option key={value} value={value}>
                        {GESTURE_LABELS[value] ?? value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="script-editor-field script-editor-slide-action">
                <legend>翻页动作</legend>
                <label>
                  <input
                    type="radio"
                    name="slide-action-kind"
                    checked={actionKind === 'goto'}
                    onChange={() => handleSlideActionKindChange('goto')}
                  />
                  跳到指定页
                </label>
                <label>
                  <input
                    type="radio"
                    name="slide-action-kind"
                    checked={actionKind === 'next'}
                    onChange={() => handleSlideActionKindChange('next')}
                  />
                  下一页
                </label>
                <label>
                  <input
                    type="radio"
                    name="slide-action-kind"
                    checked={actionKind === 'prev'}
                    onChange={() => handleSlideActionKindChange('prev')}
                  />
                  上一页
                </label>
                {actionKind === 'goto' && (
                  <label className="script-editor-goto">
                    页码
                    <input
                      type="number"
                      min={1}
                      max={pageCount || undefined}
                      value={slideAction.goto ?? draft.page}
                      onChange={(event) =>
                        handleGotoPageChange(Number(event.target.value) || 1)
                      }
                    />
                  </label>
                )}
              </fieldset>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
