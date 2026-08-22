# TTS 选型与低配置本机方案

> 面向 SSreporter 答辩助手：中文语音、VRM 口型、核显/低配置本机兜底。  
> 日期：2026-08-22  
> 应用入口：Settings → TTS；Director 试播走同一套引擎。

---

## 1. 本项目里 TTS 怎么工作

- **本机 TTS 网关**：`apps/tts-gateway`（Edge-TTS，CPU）；`npm run dev` 与页面一并启动，见 §1.2。
- **合成时机**：点击播放 / 对话时**实时合成**，音频在内存中播放并驱动口型；**不会**把整段语音预先下载进仓库。
- **口型**：除 `webSpeech`、`none` 外，能返回音频缓冲的引擎均支持口型（见 `supportsDirectorLipSync`）。

### 1.1 在 SSreporter 里怎么配

| 接入方式 | Settings 路径 | 口型 |
|----------|---------------|------|
| 内置云端引擎 | TTS → `openai` / `geminiTts` / `minimax` 等 | ✅（非 webSpeech） |
| 本机桌面引擎 | TTS → `voicevox` / `aivisSpeech` / `voicepeak` | ✅ |
| 浏览器 WASM | TTS → `piperPlus`（需 `public/piper/` 资源） | ✅ |
| **本机 HTTP 服务（推荐兜底）** | TTS → **`openaiCompatible`**，URL 填 `http://127.0.0.1:<端口>/v1/audio/speech` | ✅ |
| 仅试听 | TTS → `webSpeech` | ❌ |

默认引擎为 **`openaiCompatible`**，指向仓库内 **`apps/tts-gateway`**（`npm run dev` 自动监听 `127.0.0.1:5050`）。云端引擎需 API Key。

### 1.2 一键启动（Phase A）

```bash
conda activate ssreporter
npm install
npm run setup:tts   # 首次或 environment.yml 未重装时
npm run dev         # 页面 + TTS 网关
```

- 仅页面：`npm run dev:web`
- 网关说明：[`apps/tts-gateway/README.md`](../apps/tts-gateway/README.md)

---

## 2. 推荐总览（按硬件）

### 2.1 核显 / 无独显（低配置本机）

| 优先级 | 方案 | 类型 | 中文 | 口型 | 算力 | 备注 |
|--------|------|------|------|------|------|------|
| **① 正式答辩主用** | Gemini TTS / OpenAI TTS | 云端 API | ★★★★★ | ✅ | 几乎无 | 项目已内置；需 Key + 网络 |
| **② 本机兜底** | **仓库内 tts-gateway**（Edge-TTS） | 本机进程 + 在线引擎 | ★★★★ | ✅ | **CPU** | `npm run dev` 自动启动；免费、需联网 |
| **③ 口型验收** | VOICEVOX / AivisSpeech | 桌面软件 | 弱（偏日） | ✅ | CPU | Phase 0 已支持 |
| **④ 完全离线** | Piper Plus / sherpa-onnx | 本机 ONNX | ★★★ | ✅* | CPU | *Piper 内置；sherpa 需自建 HTTP |
| **⑤ 不推荐核显主用** | CosyVoice / GPT-SoVITS / Fish Speech | 大模型 | 好 | ✅ | 需独显 | 见 §4 升级路径 |

### 2.2 有独显（约 6GB+ VRAM）时可选

| 方案 | 用途 | 仓库 |
|------|------|------|
| CosyVoice 3 | 中文预置 / 零样本、流式 | https://github.com/FunAudioLLM/CosyVoice |
| GPT-SoVITS | 少样本克隆、WebUI 调参 | https://github.com/RVC-Boss/GPT-SoVITS |
| IndexTTS2 | 情感表达 | https://github.com/index-tts/index-tts |
| Fish Speech | 高音质、多语言 | https://github.com/fishaudio/fish-speech |

---

## 3. 三层架构（建议写入答辩机部署习惯）

```text
Layer 1  正式答辩（默认）
         Gemini TTS / OpenAI API
         → Settings 内置引擎 + API Key

Layer 2  本机兜底（核显 CPU，需联网）
         openai-edge-tts 等 @ localhost
         → Settings → openaiCompatible

Layer 3  离线彩排（断网）
         Piper Plus 或 sherpa-onnx Kokoro
         → piperPlus 或自建 OpenAI 兼容服务
```

---

## 4. 云端 API（答辩主音色）

| 服务 | SSreporter 引擎 | 中文 | 费用 | 说明 |
|------|-----------------|------|------|------|
| Google Gemini TTS | `geminiTts` | 很好 | 按量 | 与 Gemini API Key 共用 |
| OpenAI TTS | `openai` | 很好 | 按量 | https://platform.openai.com/docs/guides/text-to-speech |
| MiniMax | `minimax` | 好 | 按量 | Settings 填 minimax Key |
| ElevenLabs | `elevenLabs` | 好 | 订阅 | |
| xAI | `xai` | 一般 | 按量 | |

**答辩建议**：正式场合优先 **Gemini TTS** 或 **OpenAI**；本机只跑 VRM + Director，语音走 API，核显完全够用。

---

## 5. 本机方案（开源链接 + 接入说明）

### 5.1 仓库内 Edge-TTS 网关（默认）

路径：**`apps/tts-gateway`** — `npm run dev` 自动启动，OpenAI 兼容 `POST /v1/audio/speech`。

| 项 | 值 |
|----|-----|
| 地址 | `http://127.0.0.1:5050/v1/audio/speech` |
| 依赖 | Python 3.11 + `edge-tts`（见 `environment.yml` 或 `npm run setup:tts`） |
| API Key | 不需要 |
| 底层库 | [rany2/edge-tts](https://github.com/rany2/edge-tts) |

Settings 默认已是 `openaiCompatible`，一般无需修改。

**可选**：自行部署的社区网关（需另开进程）— [travisvn/openai-edge-tts](https://github.com/travisvn/openai-edge-tts)、[samni728/Local-TTS-Service](https://github.com/samni728/Local-TTS-Service)

**注意**：需联网；非微软官方商用 API；不能克隆真人。

---

### 5.2 桌面本机引擎（CPU，偏日语 / 口型测试）

| 项目 | 默认 API | SSreporter 引擎 |
|------|----------|-----------------|
| [VOICEVOX](https://github.com/VOICEVOX/voicevox) | `http://localhost:50021` | `voicevox` |
| [AivisSpeech](https://github.com/Aivis-Project/AivisSpeech) | `http://localhost:10101` | `aivisSpeech` |
| [VOICEPEAK](https://www.ah-soft.com/voice/)（商业） | 见软件说明 | `voicepeak` |

未填 URL 时，本项目默认：`50021`（VOICEVOX）、`10101`（AivisSpeech）。  
中文答辩**不建议**作主音色，适合 Phase 0 口型验收。

---

### 5.3 完全离线 CPU

| 项目 | 说明 | 链接 |
|------|------|------|
| **Piper Plus** | OnAir 已支持；资源约 85MB 放 `public/piper/` | https://github.com/ayutaz/piper-plus |
| **sherpa-onnx TTS** | CPU/嵌入式友好；中英 Kokoro、中文 VITS | https://github.com/k2-fsa/sherpa-onnx |
| Kokoro 中文模型 | sherpa 用 | https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh |

Piper：Settings → `piperPlus`，安装步骤见 `apps/presenter-onair/README.md`。  
sherpa-onnx 需自建 HTTP 或 OpenAI 包装，接入成本高于 Edge-TTS。

---

### 5.4 大模型本机（需独显，升级路径）

| 项目 | 克隆/声线 | 仓库 |
|------|-----------|------|
| CosyVoice | 零样本 / 预置 / 方言 | https://github.com/FunAudioLLM/CosyVoice |
| GPT-SoVITS | 1–5 分钟样本微调 | https://github.com/RVC-Boss/GPT-SoVITS |
| Fish Speech | 零样本 | https://github.com/fishaudio/fish-speech |
| F5-TTS | 零样本 | https://github.com/SWivid/F5-TTS |
| IndexTTS2 | 零样本 + 情感 | https://github.com/index-tts/index-tts |

**OpenAI 兼容包装（接 SSreporter `openaiCompatible`）**：

- [neosun100/cosyvoice-docker](https://github.com/neosun100/cosyvoice-docker) — CosyVoice3 + `/v1/audio/speech`
- [Neiroha/Neiroha-GPT-SoVITS](https://github.com/Neiroha/Neiroha-GPT-SoVITS) — GPT-SoVITS 网关

**硬件参考（推理）**：

| 方案 | 最低 | 推荐 | 仅 CPU |
|------|------|------|--------|
| CosyVoice 0.5B | 4–6GB 显存 | 8GB+ | 能跑，慢 |
| GPT-SoVITS 推理 | 4GB 显存 | 8GB+ | 很慢（老 CPU 不实用） |
| Fish Speech | 8GB+ | 12GB+ | 不推荐 |

克隆/微调训练通常需要 **8GB+ 显存**；**预置音色推理**与零样本推理算力相近，差别主要在是否训练、是否像特定人声。

---

### 5.5 Web Speech（零安装）

Settings → `webSpeech`：浏览器自带，**不支持口型**。仅用于快速试听 UI。

---

## 6. 按需求快速选型

| 需求 | 选择 |
|------|------|
| 核显、中文自然、要口型、可联网 | Edge-TTS 网关 + `openaiCompatible` |
| 核显、最好中文、可付费 | `geminiTts` 或 `openai` |
| 只验 VRM 口型 | `aivisSpeech` / `voicevox` |
| 完全离线、CPU only | `piperPlus` 或 sherpa-onnx |
| 预置音色、不克隆 | Edge / Gemini /（有独显时）CosyVoice 预置 |
| 固定真人声线克隆 | 有独显后 GPT-SoVITS；核显阶段用云端 |

---

## 7. 什么不要进 Git

与 `.vrm` 相同原则：

| 可进仓库 | 不要进仓库 |
|----------|------------|
| 本文档、`.env.example`、启动脚本说明 | TTS 模型权重（数 GB） |
| Docker compose 引用官方镜像 | 参考录音、微调 checkpoint |
| OpenAI-Compatible URL 示例 | API Key、`token`、`.env` |

每台答辩机：`docker pull` / `pip install` / 本地下模型，不随 `git clone` 分发。

---

## 8. 低配置机推荐执行顺序

1. **现在（核显）**  
   - `npm run dev` → 导演台试播 + 口型（默认网关）  
   - 正式答辩可改 Settings → `geminiTts` / `openai`

2. **Phase 0 口型验收**（见 [`phase0-acceptance.md`](./phase0-acceptance.md)）  
   - 本机：`aivisSpeech` 或 `voicevox`  
   - 或 Edge-TTS 网关测中文口型

3. **有独显后**  
   - 评估 CosyVoice Docker 或 GPT-SoVITS 固定答辩人设

---

## 9. 相关文档

- Phase 0 验收：[`phase0-acceptance.md`](./phase0-acceptance.md)
- 跨设备与 `.env`：[`cross-device-dev.md`](./cross-device-dev.md)
- OnAir Piper 安装：[`apps/presenter-onair/README.md`](../apps/presenter-onair/README.md)
- TTS 配置代码：`apps/presenter-onair/src/lib/voiceOptions.ts`
