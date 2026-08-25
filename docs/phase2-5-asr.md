# Phase 2.5：ASR（语音转文字）增强

> **状态：功能完成、待本机验收**  
> 评委提问支持四引擎：**Web Speech（默认）** / **浏览器内 Whisper（WASM）** / **本机网关 Whisper** / **云端 Whisper API**。

ASR = **语音 → 文字**。转写结果进入现有 Brain Q&A。本期**不做**向量 RAG。

---

## 引擎对照

| 引擎 | 安装 | 联网 | 说明 |
|------|------|------|------|
| 浏览器 Web Speech | 无 | 通常需要 | Chrome/Edge 内置 |
| 浏览器内 Whisper | 无（首次自动下模型 ~75MB） | **首次要**，之后可离线 | `@huggingface/transformers` + WASM |
| 本机 Whisper（网关） | `npm run setup:asr` | 首次下模型 | Faster-Whisper，CPU |
| 云端 Whisper API | OpenAI Key | 每次转写 | 上传音频到云端 |

选「本机 Whisper（网关）」且未安装时，会弹出**操作指引弹窗**（复制 `npm run setup:asr`、改用浏览器内 Whisper / Web Speech）。

---

## 环境准备

```bash
conda activate ssreporter
cd d:\project\SSreporter
npm install
npm run setup:tts    # TTS + python-multipart
npm run setup:asr    # 可选：仅本机网关 Whisper
npm run dev
```

---

## 手动验收表

| # | 项 | 操作 | 通过标准 |
|---|-----|------|----------|
| 1 | Web Speech | 语音引擎选浏览器 → 麦克风 | 中文转写可用 |
| 2 | 浏览器内 Whisper | 选「浏览器内 Whisper」→ 首次录音 | 显示下载进度 → 转写成功；断网再试仍可用（同浏览器） |
| 3 | 本机未安装弹窗 | 未 setup:asr 时选「本机 Whisper（网关）」 | 弹出指引；可一键改用浏览器内 Whisper |
| 4 | 本机已安装 | setup:asr 后重启 → 本机网关 | 录音后转写正确 |
| 5 | 云端 | 配置 OpenAI Key | 转写正确 |

---

## 相关代码

| 用途 | 路径 |
|------|------|
| 浏览器 Whisper | `lib/voice/browserWhisperAsr.ts` |
| 网关健康检查 | `lib/voice/gatewayAsrHealth.ts` |
| 安装指引弹窗 | `GatewayAsrSetupDialog.tsx` |
| 网关转写 | `apps/tts-gateway/server.py` |

---

## 已知限制

- 浏览器/网关 Whisper 为整段录音再转写，非边说边出字  
- 浏览器内模型首次下载依赖 Hugging Face / CDN  
- CPU 转写有数秒延迟  
