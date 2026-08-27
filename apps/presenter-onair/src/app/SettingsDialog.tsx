import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { SettingsPanel } from '../components/SettingsPanel';
import { UI_SETTINGS } from '../constants/uiZh';
import type { useScreenVisionController } from '../hooks/useScreenVisionController';
import type { useSettings } from '../hooks/useSettings';
import { useResolvedVrmModel } from '../hooks/useResolvedVrmModel';
import { DEFAULT_VRM_MODEL_ID } from '../lib/vrm/vrmModelCatalog';
import { clampDialogDragDelta, type DialogDragPoint } from '../lib/dialogDrag';

const DEFAULT_SETTINGS_DIALOG_OFFSET: DialogDragPoint = { x: 0, y: 0 };

interface SettingsDialogDragState {
  pointerId: number;
  pointerStart: DialogDragPoint;
  offsetStart: DialogDragPoint;
  rect: DOMRect;
}

type SettingsHook = ReturnType<typeof useSettings>;
type ScreenVisionController = ReturnType<typeof useScreenVisionController>;

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settingsHook: SettingsHook;
  isProcessing: boolean;
  backgroundImageUrl: string | null;
  streamErrorMessage: string;
  screenVisionController: ScreenVisionController;
  onBackgroundImageChange: (file: File | null) => void;
}

export function SettingsDialog({
  open,
  onClose,
  settingsHook,
  isProcessing,
  backgroundImageUrl,
  streamErrorMessage,
  screenVisionController,
  onBackgroundImageChange,
}: SettingsDialogProps) {
  const [settingsDialogOffset, setSettingsDialogOffset] =
    useState<DialogDragPoint>(DEFAULT_SETTINGS_DIALOG_OFFSET);
  const [settingsDialogDragging, setSettingsDialogDragging] = useState(false);
  const settingsDialogRef = useRef<HTMLDivElement | null>(null);
  const settingsDialogDragRef = useRef<SettingsDialogDragState | null>(null);

  const { resolveError: vrmResolveError } = useResolvedVrmModel(
    settingsHook.settings.visual,
  );

  useEffect(() => {
    if (
      vrmResolveError &&
      settingsHook.settings.visual.vrmModelSource === 'imported'
    ) {
      settingsHook.updateVisualVrmModel('builtin', DEFAULT_VRM_MODEL_ID);
    }
  }, [
    vrmResolveError,
    settingsHook.settings.visual.vrmModelSource,
    settingsHook.updateVisualVrmModel,
  ]);

  const handleSettingsDialogPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if ((event.target as Element).closest('button')) return;
      const dialog = settingsDialogRef.current;
      if (!dialog) return;

      settingsDialogDragRef.current = {
        pointerId: event.pointerId,
        pointerStart: { x: event.clientX, y: event.clientY },
        offsetStart: settingsDialogOffset,
        rect: dialog.getBoundingClientRect(),
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setSettingsDialogDragging(true);
      event.preventDefault();
    },
    [settingsDialogOffset],
  );

  const handleSettingsDialogPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = settingsDialogDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const delta = clampDialogDragDelta(
        {
          x: event.clientX - drag.pointerStart.x,
          y: event.clientY - drag.pointerStart.y,
        },
        drag.rect,
        { width: window.innerWidth, height: window.innerHeight },
      );
      setSettingsDialogOffset({
        x: drag.offsetStart.x + delta.x,
        y: drag.offsetStart.y + delta.y,
      });
    },
    [],
  );

  const finishSettingsDialogDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = settingsDialogDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      settingsDialogDragRef.current = null;
      setSettingsDialogDragging(false);
    },
    [],
  );

  const resetSettingsDialogPosition = useCallback(() => {
    settingsDialogDragRef.current = null;
    setSettingsDialogDragging(false);
    setSettingsDialogOffset(DEFAULT_SETTINGS_DIALOG_OFFSET);
  }, []);

  const closeSettingsDialog = useCallback(() => {
    resetSettingsDialogPosition();
    onClose();
  }, [onClose, resetSettingsDialogPosition]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettingsDialog();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSettingsDialog, open]);

  useEffect(() => {
    if (!open) return;

    const handleResize = () => resetSettingsDialogPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, resetSettingsDialogPosition]);

  useEffect(() => {
    resetSettingsDialogPosition();
  }, [open, resetSettingsDialogPosition]);

  if (!open) return null;

  return (
    <div className="settings-dialog-overlay" onClick={closeSettingsDialog}>
      <div
        ref={settingsDialogRef}
        className="settings-dialog"
        style={{
          transform: `translate3d(${settingsDialogOffset.x}px, ${settingsDialogOffset.y}px, 0)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`settings-dialog-header${settingsDialogDragging ? ' is-dragging' : ''}`}
          onPointerDown={handleSettingsDialogPointerDown}
          onPointerMove={handleSettingsDialogPointerMove}
          onPointerUp={finishSettingsDialogDrag}
          onPointerCancel={finishSettingsDialogDrag}
          onLostPointerCapture={finishSettingsDialogDrag}
        >
          <h2>{UI_SETTINGS.title}</h2>
          <button
            className="settings-dialog-close"
            onClick={closeSettingsDialog}
          >
            &times;
          </button>
        </div>
        <SettingsPanel
          {...settingsHook}
          isProcessing={isProcessing}
          backgroundImageUrl={backgroundImageUrl}
          vrmResolveError={vrmResolveError}
          streamErrorMessage={streamErrorMessage}
          screenVisionController={screenVisionController}
          onBackgroundImageChange={onBackgroundImageChange}
        />
      </div>
    </div>
  );
}
