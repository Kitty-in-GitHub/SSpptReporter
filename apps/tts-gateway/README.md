# @ssreporter/tts-gateway

本机 **CPU** 可用的 Edge-TTS 网关，提供 OpenAI 兼容 `POST /v1/audio/speech`。

由根目录 `npm run dev` 与 presenter-onair **一并启动**（默认 `http://127.0.0.1:5050`）。

## 依赖

- Python 3.10+（推荐在 `conda activate ssreporter` 后使用环境内 Python）
- 网络（Edge-TTS 走微软在线合成，非完全离线）

首次使用若缺 Python 包，会自动执行 `npm run setup`，或手动：

```bash
npm run setup:tts
```

## 单独启动

```bash
npm run start -w @ssreporter/tts-gateway
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `TTS_GATEWAY_HOST` | `127.0.0.1` | 监听地址 |
| `TTS_GATEWAY_PORT` | `5050` | 监听端口 |
| `DEFAULT_VOICE` | `zh-CN-XiaoxiaoNeural` | 默认发音人 |
| `PYTHON` | conda / PATH | 指定 Python 可执行文件 |

## SSreporter 设置

Settings → TTS → **OpenAI 兼容（Edge-TTS）**

- URL：`http://127.0.0.1:5050/v1/audio/speech`
- API Key：留空即可

详见 [`docs/tts-selection.md`](../../docs/tts-selection.md)。
