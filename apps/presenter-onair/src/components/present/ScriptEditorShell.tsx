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

const EDGE_VOICE_OPTIONS = [
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓（女，亲和）' },
  { id: 'zh-CN-YunxiNeural', label: '云希（男，讲解）' },
  { id: 'zh-CN-YunjianNeural', label: '云健（男，严肃）' },
  { id: 'zh-CN-XiaoyiNeural', label: '晓伊（女，温柔）' },
];
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
          {editor.isLoading || !pageDraft || !beat ? (
            <div className="script-editor-loading">加载讲稿…</div>
          ) : (
            <>
              <div className="script-editor-form-header">
                <h2 className="script-editor-form-title">
                  第 {editor.currentPage} 页 · {pageDraft.beats.length} 个节拍
                </h2>
                <button type="button" className="script-editor-beat-add" onClick={editor.addBeat}>
                  + 添加节拍
                </button>
              </div>

              <div className="script-editor-beat-tabs">
                {pageDraft.beats.map((item, index) => (
                  <button
                    key={`beat-tab-${index}`}
                    type="button"
                    className={`script-editor-beat-tab${
                      index === editor.activeBeatIndex ? ' is-active' : ''
                    }`}
                    onClick={() => editor.setActiveBeatIndex(index)}
                  >
                    节拍 {index + 1}
                  </button>
                ))}
              </div>

              <label className="script-editor-field">
                朗读文本
                <textarea
                  value={beat.utterance}
                  rows={6}
                  onChange={(event) =>
                    editor.updateBeat(editor.activeBeatIndex, {
                      utterance: event.target.value,
                    })
                  }
                  placeholder="输入本节拍要讲的内容；留空表示只动作/停顿"
                />
              </label>

              <div className="script-editor-field-row">
                <label className="script-editor-field">
                  表演预设（profile）
                  <select
                    value={beat.profile ?? beat.emotion}
                    onChange={(event) => {
                      const value = event.target.value;
                      editor.updateBeat(editor.activeBeatIndex, {
                        profile: value,
                        emotion: value as typeof beat.emotion,
                      });
                    }}
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
                    value={beat.gesture}
                    onChange={(event) =>
                      editor.updateBeat(editor.activeBeatIndex, {
                        gesture: event.target.value as typeof beat.gesture,
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

              <div className="script-editor-field-row">
                <label className="script-editor-field">
                  音色（Edge）
                  <select
                    value={beat.voice?.speaker ?? ''}
                    onChange={(event) => {
                      const speaker = event.target.value;
                      editor.updateBeat(editor.activeBeatIndex, {
                        voice: {
                          ...beat.voice,
                          speaker: speaker || undefined,
                        },
                      });
                    }}
                  >
                    <option value="">留空 → 用 profile / 设置</option>
                    {EDGE_VOICE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="script-editor-field">
                  语速覆盖
                  <input
                    type="number"
                    min={0.25}
                    max={4}
                    step={0.05}
                    value={beat.voice?.speed ?? ''}
                    placeholder="留空用 profile"
                    onChange={(event) => {
                      const raw = event.target.value;
                      editor.updateBeat(editor.activeBeatIndex, {
                        voice: {
                          ...beat.voice,
                          speed: raw ? Number.parseFloat(raw) : undefined,
                        },
                      });
                    }}
                  />
                </label>

                <label className="script-editor-field">
                  播前停顿 (ms)
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={beat.timing?.pause_before_ms ?? ''}
                    placeholder="profile"
                    onChange={(event) => {
                      const raw = event.target.value;
                      editor.updateBeat(editor.activeBeatIndex, {
                        timing: {
                          ...beat.timing,
                          pause_before_ms: raw
                            ? Number.parseInt(raw, 10)
                            : undefined,
                        },
                      });
                    }}
                  />
                </label>

                <label className="script-editor-field">
                  播后停顿 (ms)
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={beat.timing?.pause_after_ms ?? ''}
                    placeholder="profile"
                    onChange={(event) => {
                      const raw = event.target.value;
                      editor.updateBeat(editor.activeBeatIndex, {
                        timing: {
                          ...beat.timing,
                          pause_after_ms: raw
                            ? Number.parseInt(raw, 10)
                            : undefined,
                        },
                      });
                    }}
                  />
                </label>
              </div>

              <label className="script-editor-field">
                句内重读（emphasis JSON）
                <input
                  type="text"
                  value={
                    beat.emphasis ? JSON.stringify(beat.emphasis) : ''
                  }
                  placeholder='例：[[2,6],[10,12]]'
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    if (!raw) {
                      editor.updateBeat(editor.activeBeatIndex, {
                        emphasis: undefined,
                      });
                      return;
                    }
                    try {
                      const parsed = JSON.parse(raw) as [number, number][];
                      editor.updateBeat(editor.activeBeatIndex, {
                        emphasis: parsed,
                      });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                />
              </label>

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
