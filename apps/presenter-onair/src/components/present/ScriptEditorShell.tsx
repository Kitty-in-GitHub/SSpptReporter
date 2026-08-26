import { useRef } from 'react';
import type { SlideAction } from '@ssreporter/director';
import { UI_SESSION_MODES, UI_SETTINGS } from '../../constants/uiZh';
import { usePerformanceCatalog } from '../../hooks/usePerformanceCatalog';
import type { DeckScriptEditorController } from '../../hooks/useDeckScriptEditor';
import type { SlideDeckController } from '../../hooks/useSlideDeck';
import type { SessionMode } from '../../types/present';
import { BeatPerformanceEditor } from './BeatPerformanceEditor';
import { BeatTimelineStrip } from './BeatTimelineStrip';
import { PdfSlideViewer } from './PdfSlideViewer';
import { PresentControls } from './PresentControls';
import { SessionModeToolbar } from './SessionModeToolbar';
import './scriptEditor.css';

interface ScriptEditorShellProps {
  slideDeck: SlideDeckController;
  editor: DeckScriptEditorController;
  deckId: string;
  onSessionModeChange: (mode: SessionMode) => void;
  onToggleSettings: () => void;
}

function slideActionKind(action: SlideAction | undefined): 'goto' | 'next' | 'prev' {
  if (action?.next) return 'next';
  if (action?.prev) return 'prev';
  return 'goto';
}

export function ScriptEditorShell({
  slideDeck,
  editor,
  deckId,
  onSessionModeChange,
  onToggleSettings,
}: ScriptEditorShellProps) {
  const utteranceRef = useRef<HTMLTextAreaElement>(null);
  const {
    catalog,
    deckOverlay,
    addDeckProfile,
    updateDeckProfile,
    removeDeckProfile,
    hasDeckOverride,
    isSaving: isSavingProfile,
    error: performanceError,
  } = usePerformanceCatalog(deckId);
  const pageDraft = editor.pageDraft;
  const beat = editor.activeBeat;
  const pageCount = slideDeck.pageCount;
  const slideAction = beat?.slide_action ?? { goto: editor.currentPage };
  const actionKind = slideActionKind(slideAction);

  const handleSlideActionKindChange = (kind: 'goto' | 'next' | 'prev') => {
    if (!beat) return;
    if (kind === 'next') {
      editor.updateBeat(editor.activeBeatIndex, { slide_action: { next: true } });
      return;
    }
    if (kind === 'prev') {
      editor.updateBeat(editor.activeBeatIndex, { slide_action: { prev: true } });
      return;
    }
    editor.updateBeat(editor.activeBeatIndex, {
      slide_action: { goto: slideAction.goto ?? editor.currentPage },
    });
  };

  const handleGotoPageChange = (value: number) => {
    if (!beat) return;
    editor.updateBeat(editor.activeBeatIndex, { slide_action: { goto: value } });
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
        title={slideDeck.deck?.title ?? UI_SESSION_MODES.edit}
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
            disabled={!pageDraft || editor.isSaving || !editor.isDirty}
            onClick={() => void editor.saveCurrentPage()}
          >
            保存本页
          </button>
          <button
            type="button"
            className="is-primary"
            disabled={!pageDraft || editor.isSaving}
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

      {(editor.status || editor.error || performanceError) && (
        <div
          className={`script-editor-status${editor.error || performanceError ? ' is-error' : ''}${
            editor.isDirty ? ' is-dirty' : ''
          }`}
        >
          {editor.error ?? performanceError ?? editor.status}
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
          {editor.isLoading || !pageDraft || !beat ? (
            <div className="script-editor-loading">加载讲稿…</div>
          ) : (
            <>
              <div className="script-editor-form-header">
                <div>
                  <h2 className="script-editor-form-title">
                    第 {editor.currentPage} 页 · {pageDraft.beats.length} 个节拍
                  </h2>
                  <p className="script-editor-form-subtitle">
                    可视化编排汇报情绪、语速与停顿；保存并编译后写入讲稿。
                  </p>
                </div>
                <button type="button" className="script-editor-beat-add" onClick={editor.addBeat}>
                  + 添加节拍
                </button>
              </div>

              <BeatTimelineStrip
                beats={pageDraft.beats}
                activeIndex={editor.activeBeatIndex}
                catalog={catalog}
                onSelect={editor.setActiveBeatIndex}
                onAdd={editor.addBeat}
              />

              <label className="script-editor-field script-editor-utterance">
                朗读文本
                <textarea
                  ref={utteranceRef}
                  value={beat.utterance}
                  rows={5}
                  onChange={(event) =>
                    editor.updateBeat(editor.activeBeatIndex, {
                      utterance: event.target.value,
                    })
                  }
                  placeholder="输入本节拍要讲的内容；留空表示只动作/停顿"
                />
              </label>

              <BeatPerformanceEditor
                beat={beat}
                catalog={catalog}
                deckOverlay={deckOverlay}
                utteranceTextareaRef={utteranceRef}
                isSavingProfile={isSavingProfile}
                hasDeckOverride={hasDeckOverride}
                onUpdate={(patch) => editor.updateBeat(editor.activeBeatIndex, patch)}
                onAddProfile={addDeckProfile}
                onUpdateProfile={updateDeckProfile}
                onRemoveProfile={removeDeckProfile}
              />

              <fieldset className="script-editor-field script-editor-slide-action">
                <legend>翻页动作（本节拍）</legend>
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
                <label>
                  <input
                    type="radio"
                    name="slide-action-kind"
                    checked={!beat.slide_action}
                    onChange={() =>
                      editor.updateBeat(editor.activeBeatIndex, {
                        slide_action: undefined,
                      })
                    }
                  />
                  不翻页
                </label>
                {actionKind === 'goto' && (
                  <label className="script-editor-goto">
                    页码
                    <input
                      type="number"
                      min={1}
                      max={pageCount || undefined}
                      value={slideAction.goto ?? editor.currentPage}
                      onChange={(event) =>
                        handleGotoPageChange(Number(event.target.value) || 1)
                      }
                    />
                  </label>
                )}
              </fieldset>

              {pageDraft.beats.length > 1 && (
                <button
                  type="button"
                  className="script-editor-beat-remove"
                  onClick={() => editor.removeBeat(editor.activeBeatIndex)}
                >
                  删除当前节拍
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
