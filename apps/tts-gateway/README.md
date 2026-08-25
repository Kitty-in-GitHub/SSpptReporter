# @ssreporter/tts-gateway

本机 **CPU** 语音网关：

- **TTS**：Edge-TTS，`POST /v1/audio/speech`
- **ASR（可选）**：Faster-Whisper，`POST /v1/audio/transcriptions`

由根目录 `npm run dev` 与 presenter-onair **一并启动**（默认 `http://127.0.0.1:5050`）。

## 依赖

- Python 3.10+（推荐 `conda activate ssreporter`）
- TTS：网络（Edge-TTS 走微软在线合成）
- ASR：可选，首次需下载 Whisper 模型

```bash
npm run setup:tts   # 基础依赖（含 python-multipart）
npm run setup:asr   # 安装 faster-whisper（本机 ASR）
```

## 单独启动

```bash
npm run start -w @ssreporter/tts-gateway
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `TTS_GATEWAY_HOST` / `HOST` | `127.0.0.1` | 监听地址 |
| `TTS_GATEWAY_PORT` / `PORT` | `5050` | 监听端口 |
| `DEFAULT_VOICE` | `zh-CN-XiaoxiaoNeural` | TTS 发音人 |
| `WHISPER_MODEL` | `base` | ASR 模型（`tiny` / `base` / `small`） |
| `PYTHON` | conda / PATH | 指定 Python |

## 健康检查

`GET /health` → `{ "status": "ok", "asr": true|false, ... }`

## SSreporter 设置

- TTS：Settings → TTS → OpenAI 兼容，URL `http://127.0.0.1:5050/v1/audio/speech`
- ASR：Settings → 汇报 Q&A → 本机 Whisper；开发时走同源代理 `/api/asr`

详见 [`docs/tts-selection.md`](../../docs/tts-selection.md)、[`docs/phase2-5-asr.md`](../../docs/phase2-5-asr.md)。
