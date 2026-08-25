# Brain 检索（关键词 + 向量 Hybrid）

固定聊天 LLM 时，**检索质量**决定 RAG 上限。本项目采用薄实现：内存向量 + 云端 Embedding API + 现有关键词 TF，再 **RRF** 融合；不引入 LangChain / 独立向量库。

## 行为概览

| 条件 | 检索 |
|------|------|
| Settings 有可用 Embedding（OpenAI / openai-compatible，或另有 OpenAI Key） | 向量 top-K + 关键词 TF → RRF |
| 无 Key / Embedding 失败 / 无缓存且不想打云端 | **纯 TF**（与升级前一致） |

输出仍经 `answerQuestion` → 合法 `DirectorAction`；Presenter / Director / TTS 协议不变。

## 缓存文件

```
content/decks/<deckId>/brain-vectors.json          # 可公开 demo
content-private/decks/<deckId>/brain-vectors.json  # 真材料
```

运行时 `/content/decks/<id>/brain-vectors.json` 仍走「私有优先」。内容哈希（FAQ + slide 正文）或 embedding model 变化后，缓存视为无效；有 embedder 时会在首次提问时重建并留在内存。

格式（version 1）：

```json
{
  "version": 1,
  "model": "text-embedding-3-small",
  "contentHash": "…",
  "chunks": [{ "id": "faq:…", "embedding": [0.1, …] }]
}
```

## 预生成缓存（推荐，省启动费用）

```bash
# 需 OPENAI_API_KEY；可选 OPENAI_BASE_URL、EMBEDDING_MODEL
npm run build:brain-vectors -- --deck demo
```

可选参数：`--base-url https://…/v1`、`--model text-embedding-3-small`。  
也可使用 `SSREPORTER_EMBED_API_KEY` / `SSREPORTER_EMBED_BASE_URL`。

## 应用侧接线

- `createBrainEmbedder`：从 Settings 构造 embedder（无则 `null` → TF）
- `loadBrainKnowledgeForDeck`：并行拉取知识与 `brain-vectors.json`
- `useBrainQa`：把 `embedder` + `vectorIndex` 传给 `answerQuestion`

默认模型：`text-embedding-3-small`。

## 明确不做

- 浏览器内本地 embedding 大模型  
- Milvus / Chroma 等独立向量库  
- LangChain / LlamaIndex / Dify 整机  

离线 sentence-transformers 网关若以后需要，另开增量任务。

## 相关

- [`content-qa.md`](./content-qa.md) — persona / FAQ 规范  
- [`decisions.md`](./decisions.md) — ADR-010  
- `packages/brain` — `retrieveHybrid` / `embedClient` / `vectorRetrieve`
