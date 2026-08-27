export type VrmModelSource = 'builtin' | 'imported';

export const DEFAULT_VRM_MODEL_ID = 'StarString1.0.vrm';

export interface BuiltinVrmModel {
  id: string;
  label: string;
}

export const BUILTIN_VRM_MODELS: BuiltinVrmModel[] = [
  { id: 'StarString1.0.vrm', label: 'StarString 1.0（默认）' },
  { id: 'miko.vrm', label: 'miko（本地备份）' },
];

export function isBuiltinVrmModelId(modelId: string): boolean {
  return BUILTIN_VRM_MODELS.some((entry) => entry.id === modelId);
}

export function resolveBuiltinVrmUrl(modelId: string): string {
  return `${import.meta.env.BASE_URL}avatar/${modelId}`;
}

export function vrmEffectAnchorProfileId(
  modelId: string,
  source: VrmModelSource,
): string {
  if (source === 'imported') {
    return `imported/${modelId}`;
  }
  return `avatar/${modelId}`;
}

export function normalizeVrmModelSelection(
  source: VrmModelSource | undefined,
  modelId: string | undefined,
): { vrmModelSource: VrmModelSource; vrmModelId: string } {
  const vrmModelSource: VrmModelSource =
    source === 'imported' ? 'imported' : 'builtin';
  const trimmed = typeof modelId === 'string' ? modelId.trim() : '';
  if (vrmModelSource === 'builtin') {
    const vrmModelId =
      trimmed && isBuiltinVrmModelId(trimmed) ? trimmed : DEFAULT_VRM_MODEL_ID;
    return { vrmModelSource, vrmModelId };
  }
  if (vrmModelSource === 'imported') {
    if (!trimmed) {
      return {
        vrmModelSource: 'builtin',
        vrmModelId: DEFAULT_VRM_MODEL_ID,
      };
    }
    return { vrmModelSource, vrmModelId: trimmed };
  }
  return {
    vrmModelSource: 'builtin',
    vrmModelId: DEFAULT_VRM_MODEL_ID,
  };
}

export function formatVrmModelLabel(
  source: VrmModelSource,
  modelId: string,
  importedName?: string,
): string {
  if (source === 'imported') {
    return importedName?.trim() || modelId;
  }
  const builtin = BUILTIN_VRM_MODELS.find((entry) => entry.id === modelId);
  return builtin?.label ?? modelId;
}
