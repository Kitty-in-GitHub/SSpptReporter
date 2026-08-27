import { useEffect, useState } from 'react';
import {
  resolveBuiltinVrmUrl,
  vrmEffectAnchorProfileId,
} from '../lib/vrm/vrmModelCatalog';
import {
  builtinVrmMissingMessage,
  probeBuiltinVrmUrl,
} from '../lib/vrm/probeBuiltinVrmUrl';
import { getImportedVrmModelBlob } from '../lib/vrm/vrmModelStore';
import type { VisualSettings } from '../types/settings';

export function useResolvedVrmModel(
  visual: Pick<VisualSettings, 'vrmModelSource' | 'vrmModelId'>,
) {
  const [vrmUrl, setVrmUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const effectAnchorProfileId = vrmEffectAnchorProfileId(
    visual.vrmModelId,
    visual.vrmModelSource,
  );

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;

    setIsResolving(true);
    setResolveError(null);
    setVrmUrl(null);

    const finish = (url: string | null, error: string | null) => {
      if (revoked) return;
      setVrmUrl(url);
      setResolveError(error);
      setIsResolving(false);
    };

    if (visual.vrmModelSource === 'builtin') {
      const url = resolveBuiltinVrmUrl(visual.vrmModelId);
      void probeBuiltinVrmUrl(url)
        .then((available) => {
          if (available) {
            finish(url, null);
            return;
          }
          finish(null, builtinVrmMissingMessage(visual.vrmModelId));
        })
        .catch(() => {
          finish(null, builtinVrmMissingMessage(visual.vrmModelId));
        });
      return () => {
        revoked = true;
      };
    }

    void getImportedVrmModelBlob(visual.vrmModelId)
      .then((blob) => {
        if (!blob) {
          finish(null, '导入的 VRM 模型不存在或已删除。');
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        finish(objectUrl, null);
      })
      .catch((error) => {
        finish(
          null,
          error instanceof Error ? error.message : '无法读取导入的 VRM。',
        );
      });

    return () => {
      revoked = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [visual.vrmModelSource, visual.vrmModelId]);

  return { vrmUrl, isResolving, resolveError, effectAnchorProfileId };
}
