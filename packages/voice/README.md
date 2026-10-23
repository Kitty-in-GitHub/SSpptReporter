# packages/voice（预留，未参与构建）

ASR / TTS 适配层占位。

**本目录没有 `package.json`，不参与 npm workspaces 构建。**

当前实现：

- TTS + 本机 ASR 网关：[`apps/tts-gateway`](../../apps/tts-gateway)
- 前端转写客户端：[`apps/presenter-onair/src/lib/voice/transcribeAudio.ts`](../../apps/presenter-onair/src/lib/voice/transcribeAudio.ts)

后续可将网关协议类型抽到本包；本期不必强行搬家。见 [`docs/phase2-5-asr.md`](../../docs/phase2-5-asr.md)。
