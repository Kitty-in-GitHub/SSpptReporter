import { useRef, useState } from 'react';
import type { Gesture } from '@ssreporter/director';
import { UI_SESSION_MODES } from '../../constants/uiZh';
import { usePerformanceCatalog } from '../../hooks/usePerformanceCatalog';
import type { DeckScriptEditorController } from '../../hooks/useDeckScriptEditor';
import type { SlideDeckController } from '../../hooks/useSlideDeck';
import type { VisualSettings } from '../../types/settings';
import { BeatPerformanceEditor } from './BeatPerformanceEditor';
import { BeatTimelineStrip } from './BeatTimelineStrip';
import {
  GesturePreviewStage,
  type GesturePreviewRequest,
} from './GesturePreviewStage';
import { PdfSlideViewer } from './PdfSlideViewer';
import { PresentControls } from './PresentControls';
import { PresentDeckSelect } from './PresentDeckSelect';
import { AppToolbar } from './AppToolbar';
import './presentChrome.css';
import './scriptEditor.css';

interface ScriptEditorShellProps {
  slideDeck: SlideDeckController;
  editor: DeckScriptEditorController;
  deckId: string;
  visual: VisualSettings;
  onDeckChange: (deckId: string) => void;
}

export function ScriptEditorShell({
  slideDeck,
  editor,
  deckId,
  visual,
  onDeckChange,
}: ScriptEditorShellProps) {
  const utteranceRef = useRef<HTMLTextAreaElement>(null);
  const previewIdRef = useRef(0);
  const [previewRequest, setPreviewRequest] =
    useState<GesturePreviewRequest | null>(null);

  const handlePreviewGesture = (gesture: Gesture) => {
    previewIdRef.current += 1;
    setPreviewRequest({ gesture, id: previewIdRef.current });
  };
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

  const syncPdfPage = (page: number) => {
    slideDeck.goToPage(page);
    editor.goToPage(page);
  };

  return (
    <div className="script-editor-shell">
      <AppToolbar title={slideDeck.deck?.title ?? UI_SESSION_MODES.edit}>
        <PresentDeckSelect
          activeDeckId={deckId}
          onDeckChange={onDeckChange}
          disabled={editor.isSaving || slideDeck.isLoading}
        />
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
      </AppToolbar>

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
                <div className="script-editor-form-header-actions">
                  <button
                    type="button"
                    className="script-editor-beat-remove"
                    title={
                      pageDraft.beats.length > 1
                        ? '删除当前节拍'
                        : '只剩一拍：将清空本页内容（每页至少保留一拍）'
                    }
                    onClick={() => editor.removeBeat(editor.activeBeatIndex)}
                  >
                    删除节拍
                  </button>
                  <button
                    type="button"
                    className="script-editor-beat-add"
                    onClick={editor.addBeat}
                  >
                    + 添加节拍
                  </button>
                </div>
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
                onPreviewGesture={handlePreviewGesture}
                onAddProfile={addDeckProfile}
                onUpdateProfile={updateDeckProfile}
                onRemoveProfile={removeDeckProfile}
              />

              <div className="script-editor-field script-editor-auto-turn">
                <span>翻页</span>
                <p>
                  每页讲稿全部念完后自动翻到下一页，由编译器生成，无需手写翻页动作。
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {previewRequest ? (
        <GesturePreviewStage
          visual={visual}
          request={previewRequest}
          onClose={() => setPreviewRequest(null)}
        />
      ) : null}
    </div>
  );
}
