# @ssreporter/tts-gateway

本机 **CPU** 语音 + 检索网关：

- **TTS**：Edge-TTS，`POST /v1/audio/speech`
- **ASR（可选）**：Faster-Whisper，`POST /v1/audio/transcriptions`
- **Embedding（可选）**：fastembed ONNX CPU，`POST /v1/embeddings`（**无显卡**）

由根目录 `npm run dev` 与 presenter-onair **一并启动**（默认 `http://127.0.0.1:5050`）。

## 依赖

- Python 3.10+（推荐 `conda activate ssreporter`）
- TTS：网络（Edge-TTS 走微软在线合成）
- ASR：可选，首次需下载 Whisper 模型
- Embedding：可选，首次需下载 `BAAI/bge-small-zh-v1.5`（约百兆）

```bash
npm run setup:tts    # 基础依赖（含 python-multipart）
npm run setup:asr    # 安装 faster-whisper（本机 ASR）
npm run setup:embed  # 安装 fastembed（本机 Embedding，CPU）
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
| `EMBED_MODEL` | `BAAI/bge-small-zh-v1.5` | Embedding 模型（fastembed） |
| `PYTHON` | conda / PATH | 指定 Python |

## 健康检查

`GET /health` → `{ "status": "ok", "asr": true|false, "embedding": true|false, "embed_model": "…", ... }`

## SSreporter 设置

- TTS：Settings → TTS → OpenAI 兼容，URL `http://127.0.0.1:5050/v1/audio/speech`
- ASR：Settings → 汇报 Q&A → 本机 Whisper；开发时走同源代理 `/api/asr`
- Brain 检索：`setup:embed` 后 Q&A 自动优先本机 embedding；开发时走 `/api/embed`

详见 [`docs/tts-selection.md`](../../docs/tts-selection.md)、[`docs/phase2-5-asr.md`](../../docs/phase2-5-asr.md)、[`docs/brain-retrieval.md`](../../docs/brain-retrieval.md)。
