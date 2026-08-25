/** Probe local voice gateway ASR availability via Vite proxy. */
export async function fetchGatewayAsrHealth(): Promise<{
  ok: boolean;
  asr: boolean;
  message?: string;
}> {
  try {
    const response = await fetch('/api/asr/health', { method: 'GET' });
    if (!response.ok) {
      return {
        ok: false,
        asr: false,
        message: `语音网关不可用（HTTP ${response.status}）。请先运行 npm run dev。`,
      };
    }
    const payload = (await response.json()) as {
      status?: string;
      asr?: boolean;
    };
    return {
      ok: payload.status === 'ok',
      asr: payload.asr === true,
      message:
        payload.asr === true
          ? undefined
          : '本机 Whisper 尚未安装。请按弹窗指引执行 npm run setup:asr 后重启 npm run dev。',
    };
  } catch {
    return {
      ok: false,
      asr: false,
      message:
        '无法连接语音网关。请确认已运行 npm run dev（含 :5050 网关）。',
    };
  }
}
