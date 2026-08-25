# Brain 检索（关键词 + 向量 Hybrid）

固定聊天 LLM 时，**检索质量**决定 RAG 上限。本项目采用薄实现：内存向量 + **本机 CPU Embedding（优先）** 或云端 API + 现有关键词 TF，再 **RRF** 融合；不引入 LangChain / 独立向量库。

## 行为概览

| 条件 | 检索 |
|------|------|
| 本机网关已 `setup:embed`（`GET /health` → `embedding: true`） | 向量 top-K + 关键词 TF → RRF（**零云端 embedding 费用**） |
| 本机未装，但 Settings 有云端 Embedding Key | 同上，走 OpenAI 兼容 API |
| 都无 / Embedding 失败 | **纯 TF**（与升级前一致） |

**聊天 LLM 与 Embedding 解耦**：Settings 用 DeepSeek 答句时，本机 embedding 仍可用。

输出仍经 `answerQuestion` → 合法 `DirectorAction`；Presenter / Director / TTS 协议不变。

## 本机 Embedding（无显卡）

与 TTS/ASR 共用 `apps/tts-gateway`（`:5050`）：

- 运行时：`fastembed` + ONNX **CPU**（不需 NVIDIA 显卡）
- 默认模型：`BAAI/bge-small-zh-v1.5`（约百兆，首次下载）
- 安装：`npm run setup:embed`，然后重启 `npm run dev`
- 健康检查：`GET /health` → `embedding: true`、`embed_model: "BAAI/bge-small-zh-v1.5"`
- 开发代理：浏览器走 `/api/embed/v1/embeddings`

环境变量（网关进程）：

| 变量 | 默认 | 说明 |
|------|------|------|
| `EMBED_MODEL` | `BAAI/bge-small-zh-v1.5` | fastembed 模型名 |

## 缓存文件

```
content/decks/<deckId>/brain-vectors.json          # 可公开 demo
content-private/decks/<deckId>/brain-vectors.json  # 真材料
```

运行时 `/content/decks/<id>/brain-vectors.json` 仍走「私有优先」。内容哈希（FAQ + slide 正文）或 **embedding model** 变化后，缓存视为无效；有 embedder 时会在首次提问时重建并留在内存。

**注意**：本机 `BAAI/bge-small-zh-v1.5` 与云端 `text-embedding-3-small` 向量空间不同，不能混用同一 `brain-vectors.json`。切换后需对本机重新生成缓存。

格式（version 1）：

```json
{
  "version": 1,
  "model": "BAAI/bge-small-zh-v1.5",
  "contentHash": "…",
  "chunks": [{ "id": "faq:…", "embedding": [0.1, …] }]
}
```

## 预生成缓存

**本机（推荐，零 token 费）**：

```bash
npm run setup:embed
npm run dev   # 另开终端，确保 :5050 网关在跑
# Windows cmd 示例：
set OPENAI_BASE_URL=http://127.0.0.1:5050/v1
set OPENAI_API_KEY=local
npm run build:brain-vectors -- --deck demo
```

**云端**（需 `OPENAI_API_KEY`）：

```bash
npm run build:brain-vectors -- --deck demo
```

可选：`--base-url`、`--model`；或 `SSREPORTER_EMBED_API_KEY` / `SSREPORTER_EMBED_BASE_URL`。

## 应用侧接线

- `resolveBrainEmbedder`：本机就绪 → 云端 Key → `null`（TF）
- `loadBrainKnowledgeForDeck`：并行拉取知识与 `brain-vectors.json`
- `useBrainQa`：加载时解析 embedder，提问时传入 `answerQuestion`

## 明确不做

- 浏览器内 embedding 大模型（WASM）
- GPU / CUDA 依赖
- Milvus / Chroma 等独立向量库
- LangChain / LlamaIndex / Dify 整机
- 为 DeepSeek 提供假 embedding API（官方无 embeddings）

## 相关

- [`content-qa.md`](./content-qa.md) — persona / FAQ 规范
- [`decisions.md`](./decisions.md) — ADR-010 / ADR-011
- [`apps/tts-gateway/README.md`](../apps/tts-gateway/README.md) — 网关安装
- `packages/brain` — `retrieveHybrid` / `embedClient` / `vectorRetrieve`
