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
import type { TTSEngineOption } from '../types/settings';

interface DirectorPanelProps {
  disabled?: boolean;
  supportsLipSync: boolean;
  ttsEngine: TTSEngineOption;
  onSpeak: (text: string) => Promise<void>;
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

const INVALID_FIXTURE = {
  schema_version: '9.9',
  mode: 'present',
  utterance: '这条应被拒绝',
  emotion: 'not-a-real-emotion',
};

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

function completionMessage(supportsLipSync: boolean, ttsEngine: TTSEngineOption) {
  if (ttsEngine === 'webSpeech') {
    return '播放完成（Web Speech 无口型；换 VOICEVOX / 云端 TTS 可测口型）';
  }
  if (supportsLipSync) {
    return '播放完成（TTS + 口型）';
  }
  return '播放完成';
}

export function DirectorPanel({
  disabled = false,
  supportsLipSync,
  ttsEngine,
  onSpeak,
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
      await onSpeak(action.utterance);
      setStatus(completionMessage(supportsLipSync, ttsEngine));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '播放失败');
    } finally {
      onResetEmotion();
    }
  }, [
    onApplyEmotion,
    onResetEmotion,
    onSpeak,
    supportsLipSync,
    ttsEngine,
  ]);

  const runInvalidFixture = useCallback(() => {
    const result = validateDirectorAction(INVALID_FIXTURE);
    if (result.ok) {
      setLastErrors(['意外：非法 fixture 通过了校验']);
      setStatus('校验异常');
      return;
    }
    setLastErrors(result.errors);
    setStatus('非法 JSON 已被 schema 拒绝（符合 Phase 0 #6）');
  }, []);

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
      <div style={{ fontWeight: 600, marginBottom: 8 }}>导演台 · Phase 0</div>
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
        <button
          type="button"
          disabled={disabled}
          onClick={runInvalidFixture}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            border: '1px solid #64748b',
            borderRadius: 8,
            padding: '8px 12px',
            background: 'transparent',
            color: '#e8eef8',
          }}
        >
          测试非法 JSON
        </button>
      </div>
      <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
        TTS：设置 → <code>{ttsEngine}</code>
        {supportsLipSync ? '（支持口型）' : '（当前引擎无口型）'}
      </div>
      <div style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>
        VRM：<code>public/avatar/StarString1.0.vrm</code>
      </div>
    </div>
  );
}
