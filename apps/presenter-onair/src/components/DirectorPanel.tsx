import { useCallback, useMemo, useState } from 'react';
import {
  emotionToVrmExpression,
  validateDirectorAction,
  type DirectorAction,
} from '@ssreporter/director';
import sampleAction from '../fixtures/sample-action.json';
import {
  createVrmReactionFromEffect,
  createVrmReactionFromScreenplay,
  type VrmAvatarReactionDraft,
  type VrmEmotionEffect,
} from '../lib/vrmReactions';

interface DirectorPanelProps {
  disabled?: boolean;
  onApplyEmotion: (draft: VrmAvatarReactionDraft) => void;
  onResetEmotion: () => void;
}

const VRM_EMOTION_SET = new Set<string>([
  'happy',
  'surprised',
  'sad',
  'angry',
  'relaxed',
  'thinking',
  'neutral',
]);

function speakUtterance(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!text.trim()) {
      resolve();
      return;
    }
    if (!('speechSynthesis' in window)) {
      reject(new Error('Web Speech API 不可用'));
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error('语音合成失败'));
    window.speechSynthesis.speak(utter);
  });
}

function toReactionDraft(action: DirectorAction): VrmAvatarReactionDraft | null {
  const mapped = emotionToVrmExpression[action.emotion ?? 'neutral'] ?? 'neutral';
  if (mapped === 'neutral' || !VRM_EMOTION_SET.has(mapped)) return null;

  const fromScreenplay = createVrmReactionFromScreenplay({
    emotion: mapped,
    text: action.utterance,
  });
  if (fromScreenplay) return fromScreenplay;

  if (mapped !== 'neutral') {
    return createVrmReactionFromEffect(
      mapped as VrmEmotionEffect,
      action.utterance,
    );
  }

  return null;
}

export function DirectorPanel({
  disabled = false,
  onApplyEmotion,
  onResetEmotion,
}: DirectorPanelProps) {
  const [status, setStatus] = useState('就绪：可播放 sample DirectorAction');
  const [lastErrors, setLastErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateDirectorAction(sampleAction), []);

  const runFixture = useCallback(async () => {
    setLastErrors([]);
    const result = validateDirectorAction(sampleAction);
    if (!result.ok) {
      setLastErrors(result.errors);
      setStatus('校验失败');
      return;
    }

    const action = result.action;
    const draft = toReactionDraft(action);

    onResetEmotion();
    if (draft) onApplyEmotion(draft);

    setStatus(`播放中：${action.action_id ?? 'fixture'} / ${action.mode}`);
    try {
      await speakUtterance(action.utterance);
      setStatus('播放完成（Phase0：Web Speech；口型需在 Settings 配置 TTS）');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '播放失败');
    } finally {
      onResetEmotion();
    }
  }, [onApplyEmotion, onResetEmotion]);

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 40,
        maxWidth: 360,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'rgba(20, 24, 32, 0.92)',
        color: '#e8eef8',
        fontSize: 13,
        lineHeight: 1.45,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Director · Phase 0</div>
      <div style={{ opacity: 0.85, marginBottom: 8 }}>{status}</div>
      {!validation.ok && (
        <div style={{ color: '#ff8f8f', marginBottom: 8 }}>
          fixture 无效：{validation.errors.join('; ')}
        </div>
      )}
      {lastErrors.length > 0 && (
        <div style={{ color: '#ff8f8f', marginBottom: 8 }}>
          {lastErrors.join('; ')}
        </div>
      )}
      <button
        type="button"
        disabled={disabled || !validation.ok}
        onClick={() => void runFixture()}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: 0,
          borderRadius: 8,
          padding: '8px 12px',
          background: '#3b82f6',
          color: '#fff',
          fontWeight: 600,
        }}
      >
        播放 sample-action.json
      </button>
      <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
        自定义 VRM：替换 <code>public/avatar/miko.vrm</code>，或放到{' '}
        <code>assets/avatars/</code> 后复制过来。
      </div>
    </div>
  );
}
