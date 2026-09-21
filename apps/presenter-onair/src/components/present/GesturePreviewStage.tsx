import { useEffect, useRef, useState } from 'react';
import type { Gesture } from '@ssreporter/director';
import { AvatarShell } from '../AvatarShell';
import { useAvatarPresenter } from '../../hooks/useAvatarPresenter';
import { useResolvedVrmModel } from '../../hooks/useResolvedVrmModel';
import { getEmotionEffectAnchor } from '../../lib/emotionEffectAnchor';
import { avatarGestureFromDirector } from '../../lib/avatar';
import type { VisualSettings } from '../../types/settings';

export interface GesturePreviewRequest {
  gesture: Gesture;
  /** 每次点击递增，保证同一手势可重复播放 */
  id: number;
}

interface GesturePreviewStageProps {
  visual: VisualSettings;
  request: GesturePreviewRequest | null;
  onClose: () => void;
}

/**
 * 讲稿导演台右下角的动作预览窗。
 * 走与汇报完全相同的呈现层（useAvatarPresenter → AvatarShell），保证「预览所见 = 汇报所得」。
 */
export function GesturePreviewStage({
  visual,
  request,
  onClose,
}: GesturePreviewStageProps) {
  const [collapsed, setCollapsed] = useState(false);
  const mouthLevelRef = useRef(0);

  const {
    vrmUrl,
    isResolving: vrmResolving,
    resolveError: vrmResolveError,
    effectAnchorProfileId,
  } = useResolvedVrmModel(visual);

  const avatarPresenter = useAvatarPresenter(
    {
      reactionControlMode: visual.vrmReactionControlMode,
      emotionEffectMap: visual.vrmEmotionEffectMap,
      effectAnchor: getEmotionEffectAnchor(
        visual.vrmEmotionEffectAnchors,
        effectAnchorProfileId,
      ),
      vrmCameraFraming: visual.vrmCameraFraming,
    },
    {
      // 预览窗不提供锚点编辑，回调留空
      onEffectAnchorChange: () => {},
      onEffectAnchorReset: () => {},
    },
  );

  const { applyReaction } = avatarPresenter;

  useEffect(() => {
    if (!request) {
      return;
    }
    const draft = avatarGestureFromDirector({
      schema_version: '1.0',
      mode: 'present',
      utterance: '',
      gesture: request.gesture,
    });
    if (draft) {
      applyReaction(draft);
    }
  }, [request, applyReaction]);

  return (
    <aside
      className={`gesture-preview${collapsed ? ' is-collapsed' : ''}`}
      aria-label="动作预览"
    >
      <header className="gesture-preview-header">
        <span className="gesture-preview-title">动作预览</span>
        <button
          type="button"
          className="gesture-preview-action"
          aria-label={collapsed ? '展开预览' : '折叠预览'}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? '▴' : '▾'}
        </button>
        <button
          type="button"
          className="gesture-preview-action"
          aria-label="关闭预览"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      <div className="gesture-preview-body">
        <AvatarShell
          presenter={avatarPresenter}
          mouthLevelRef={mouthLevelRef}
          isSpeaking={false}
          vrmUrl={vrmUrl}
          vrmResolveError={vrmResolveError}
          vrmResolving={vrmResolving}
          backgroundMode={visual.backgroundMode}
          showExpressionControls={false}
        />
      </div>
    </aside>
  );
}
