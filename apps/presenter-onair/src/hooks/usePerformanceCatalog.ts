import {
  type DirectorAction,
  type Emotion,
  type PerformanceCatalog,
  type PerformanceProfile,
  isBuiltInProfile,
  resolveBeatPerformance,
} from '@ssreporter/director';
import { useCallback, useEffect, useState } from 'react';
import { loadPerformanceCatalog } from '../lib/content/loadPerformanceCatalog';
import {
  loadDeckPerformanceOverlay,
  saveDeckPerformanceOverlay,
} from '../lib/content/performanceCatalogApi';

export function usePerformanceCatalog(deckId: string) {
  const [catalog, setCatalog] = useState<PerformanceCatalog | null>(null);
  const [deckOverlay, setDeckOverlay] = useState<PerformanceCatalog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [merged, overlay] = await Promise.all([
      loadPerformanceCatalog(deckId),
      loadDeckPerformanceOverlay(deckId),
    ]);
    setCatalog(merged);
    setDeckOverlay(overlay);
    return merged;
  }, [deckId]);

  useEffect(() => {
    let cancelled = false;
    void reload().catch((loadError) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : '加载预设失败');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const resolvePerformance = (action: DirectorAction) =>
    resolveBeatPerformance(action, catalog ?? undefined);

  const addDeckProfile = useCallback(
    async (profileId: string, profile: PerformanceProfile) => {
      setIsSaving(true);
      setError(null);
      try {
        const overlay = await loadDeckPerformanceOverlay(deckId);
        if (overlay.profiles[profileId]) {
          throw new Error(`预设「${profileId}」已存在`);
        }
        const nextOverlay: PerformanceCatalog = {
          profiles: {
            ...overlay.profiles,
            [profileId]: profile,
          },
        };
        await saveDeckPerformanceOverlay(deckId, nextOverlay);
        await reload();
        return profileId;
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : '保存预设失败';
        setError(message);
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [deckId, reload],
  );

  return {
    catalog,
    deckOverlay,
    error,
    isSaving,
    reload,
    addDeckProfile,
    resolvePerformance,
  };
}

export function resolveProfileDisplayName(
  profileId: string,
  catalog: PerformanceCatalog | null,
): string {
  const profile = catalog?.profiles[profileId];
  if (profile?.label?.trim()) {
    return profile.label.trim();
  }
  if (isBuiltInProfile(profileId)) {
    const labels: Record<Emotion, string> = {
      neutral: '中性',
      confident: '自信',
      friendly: '亲和',
      serious: '严肃',
      thinking: '思考',
      apologetic: '歉意',
      emphatic: '强调',
    };
    return labels[profileId as Emotion] ?? profileId;
  }
  return profileId;
}

export function resolveProfileDisplayHint(
  profileId: string,
  catalog: PerformanceCatalog | null,
): string {
  const profile = catalog?.profiles[profileId];
  if (profile?.hint?.trim()) {
    return profile.hint.trim();
  }
  if (isBuiltInProfile(profileId)) {
    const hints: Record<Emotion, string> = {
      neutral: '平稳开场、过渡',
      confident: '结论、亮点',
      friendly: '问候、互动',
      serious: '风险、限制',
      thinking: '分析、犹豫',
      apologetic: '致歉、不足',
      emphatic: '关键数字、强调',
    };
    return hints[profileId as Emotion] ?? '';
  }
  return '自定义预设';
}

const CUSTOM_PROFILE_COLORS = [
  '#14b8a6',
  '#a855f7',
  '#eab308',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

export function resolveProfileColor(
  profileId: string,
  catalog: PerformanceCatalog | null,
): string {
  const profile = catalog?.profiles[profileId];
  if (profile?.color?.trim()) {
    return profile.color.trim();
  }
  const builtInColors: Record<Emotion, string> = {
    neutral: '#94a3b8',
    confident: '#3b82f6',
    friendly: '#22c55e',
    serious: '#6366f1',
    thinking: '#f59e0b',
    apologetic: '#f472b6',
    emphatic: '#ef4444',
  };
  if (isBuiltInProfile(profileId)) {
    return builtInColors[profileId as Emotion];
  }
  let hash = 0;
  for (let index = 0; index < profileId.length; index += 1) {
    hash = (hash * 31 + profileId.charCodeAt(index)) >>> 0;
  }
  return CUSTOM_PROFILE_COLORS[hash % CUSTOM_PROFILE_COLORS.length];
}
