# content Q&A 知识库（Phase 2）

评委问答时 Brain 读取 **persona**（人设）、**faq**（常见问答）、**deck slides**（按页讲稿）做检索，再让 LLM 输出 `DirectorAction`（`mode: qa`）。

## 目录结构

```
content/
  persona/
    presenter.md       # 公开示例人设
  faq/
    demo.md            # 公开示例 FAQ
  decks/<id>/slides/   # 按页讲稿（兼 slide RAG）

content-private/       # 真答辩（不进 Git）
  persona/
  faq/
  decks/
```

运行时 `/content/…`：**先私有、后示例**（与 deck 相同，见 [`content-roots.ts`](../apps/presenter-onair/content-roots.ts)）。

## persona 格式

普通 Markdown，建议包含：

- 口吻（称呼、句长）
- 红线（拒答话题）
- 可选：当前项目/场次说明

Brain 将整份 persona 作为 system prompt 的一部分。

## FAQ 格式（MVP）

每个条目用二级标题：

```markdown
## Q: 评委可能问的问题？

这里是参考答案正文，可含页码提示（见第 3 页）。
```

Brain 按 **关键词 TF** 与（可选）**云端 embedding 向量相似度** 做 Hybrid 检索，再经 RRF 融合取 top-K 注入 prompt。无 Embedding Key 时退回纯关键词。详见 [`brain-retrieval.md`](./brain-retrieval.md)。

说「请重复」「再说一遍」等口令时，应用层直接复述上一轮回答，不调用 LLM。

## slide 索引

当前场次的 `content/decks/<deckId>/slides/NN.md` 正文（去掉 frontmatter）参与检索；页码来自文件名 `01` → 第 1 页。

## 与 Director 的关系

Brain **只输出** [`DirectorAction`](../schemas/director-action.schema.json)：

- `mode: "qa"`
- `utterance`：朗读短答
- `qa.sources`：`slide` / `faq` 等
- `slide_action.goto`：有证据页时翻页

执行由现有 Director 队列 + TTS + VRM 完成（含 `barge_in` 打断讲稿）。

## Q&A Performance Profile（分层）

Q&A 与 Present 讲稿共用 `performance.json`，但解析策略不同：

| 维度 | Present 讲稿 | Q&A 回答 |
|------|-------------|----------|
| TTS 音色/语速/停顿 | 由 `profile` / `emotion` preset 驱动 | 由 **`qa` 基线 preset** 统一驱动 |
| VRM 表情/强度/默认手势 | 同上 | 由 LLM 输出的 **`emotion` / `profile`** 驱动 |
| 覆盖 | `voice` / `timing`  per beat | 仅 `action.voice` / `action.timing` 可覆盖 qa 基线 |

- 内置 `qa` profile 见 `packages/director` 的 `DEFAULT_PERFORMANCE_CATALOG`；可在 `content/persona/performance.json` 或 deck 覆盖中微调。
- Brain prompt 不要求 LLM 输出 `voice`；`ensureQaActionFields` 默认 `emotion: friendly`。
- 讲稿导演台 preset 列表**不包含** `qa`（专用于问答 TTS 基线）。

详见 [`phase3-present-director.md`](./phase3-present-director.md) 的 performance 说明。

## 私有材料建议

| 类型 | 路径 |
|------|------|
| 人设 | `content-private/persona/presenter.md` |
| 常见问题 | `content-private/faq/<defense-id>.md` |
| 按页讲稿 | `content-private/decks/<id>/slides/` |

## 相关文档

- [`docs/brain-retrieval.md`](./brain-retrieval.md) — 向量缓存与 Hybrid 检索
- [`docs/director-json-schema.md`](./director-json-schema.md) — Q&A JSON 示例
- [`docs/content-decks.md`](./content-decks.md) — 讲稿编译
- [`docs/phase2-acceptance.md`](./phase2-acceptance.md) — 验收清单
