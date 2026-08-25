# Phase 2.5：ASR（语音转文字）增强

> **状态：功能完成、待本机验收**  
> 评委提问支持三引擎：**Web Speech（默认）** / **本机 Faster-Whisper** / **云端 Whisper API**。

ASR = **语音 → 文字**。转写结果进入现有 Brain Q&A（关键词检索 + LLM + TTS）。本期**不做**向量 RAG。

---

## 环境准备

```bash
conda activate ssreporter
cd d:\project\SSreporter
npm install
npm run setup:tts    # TTS + python-multipart
npm run setup:asr    # 可选：本机 Whisper（首次下载 ~150MB base 模型）
npm run dev
```

- 本机 ASR：网关 `http://127.0.0.1:5050`，Vite 代理 `/api/asr` → 同端口  
- 健康检查：`GET http://127.0.0.1:5050/health` 中 `asr: true` 表示 Whisper 已安装  

环境变量（可选）：

| 变量 | 默认 | 说明 |
|------|------|------|
| `WHISPER_MODEL` | `base` | faster-whisper 模型名（`tiny` / `base` / `small`） |

---

## 手动验收表

| # | 项 | 操作 | 通过标准 |
|---|-----|------|----------|
| 1 | Web Speech | 汇报 → 评委提问 → 语音引擎选浏览器 → 麦克风 | 中文转写填入框，可提问 |
| 2 | 本机 Whisper | `npm run setup:asr` 后重启 dev；引擎选本机 Whisper | 录音结束显示「识别中…」→ 转写正确 |
| 3 | 云端 Whisper | 配置 OpenAI Key；引擎选云端 | 转写正确 |
| 4 | 回退 | 未 setup:asr 却选本机 | 明确错误提示（安装说明） |
| 5 | 演讲模式 | 顶部唤出栏 🎤 | 与底部面板同一引擎行为 |

---

## 相关代码

| 用途 | 路径 |
|------|------|
| 网关转写 | `apps/tts-gateway/server.py` → `POST /v1/audio/transcriptions` |
| 前端上传 | `apps/presenter-onair/src/lib/voice/transcribeAudio.ts` |
| 录音 | `useMediaRecorderAsr.ts` |
| Q&A 接入 | `useQaVoiceInput.ts` · `QaPanel.tsx` |
| 设置 | Settings → 汇报 Q&A · `present.qaAsrEngine` |

---

## 已知限制

- 本机/云端为「录完整段再转写」，非边说边出字  
- CPU Whisper 延迟约 2～5 秒（视时长与模型）  
- Web Speech 仍依赖 Chrome/Edge  
