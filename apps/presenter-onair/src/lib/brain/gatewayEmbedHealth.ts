/** Probe local voice gateway embedding availability via Vite proxy. */
export async function fetchGatewayEmbedHealth(): Promise<{
  ok: boolean;
  embedding: boolean;
  model?: string;
  message?: string;
}> {
  try {
    const response = await fetch('/api/embed/health', { method: 'GET' });
    if (!response.ok) {
      return {
        ok: false,
        embedding: false,
        message: `语音网关不可用（HTTP ${response.status}）。请先运行 npm run dev。`,
      };
    }
    const payload = (await response.json()) as {
      status?: string;
      embedding?: boolean;
      embed_model?: string;
    };
    return {
      ok: payload.status === 'ok',
      embedding: payload.embedding === true,
      model: payload.embed_model?.trim() || undefined,
      message:
        payload.embedding === true
          ? undefined
          : '本机 Embedding 尚未安装。请运行 npm run setup:embed 后重启 npm run dev。',
    };
  } catch {
    return {
      ok: false,
      embedding: false,
      message:
        '无法连接语音网关。请确认已运行 npm run dev（含 :5050 网关）。',
    };
  }
}
