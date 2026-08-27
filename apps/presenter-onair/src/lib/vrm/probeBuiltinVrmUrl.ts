export function builtinVrmMissingMessage(modelId: string): string {
  return `请将 ${modelId} 复制到 apps/presenter-onair/public/avatar/`;
}

export async function probeBuiltinVrmUrl(url: string): Promise<boolean> {
  try {
    const headResponse = await fetch(url, { method: 'HEAD' });
    if (headResponse.ok) {
      return true;
    }
    if (headResponse.status === 405 || headResponse.status === 404) {
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
      });
      return getResponse.ok;
    }
    return false;
  } catch {
    return false;
  }
}
