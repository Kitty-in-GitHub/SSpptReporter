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

Brain 按问题关键词对 chunk 打分检索，取 top-K 片段注入 prompt。

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

## 私有材料建议

| 类型 | 路径 |
|------|------|
| 人设 | `content-private/persona/presenter.md` |
| 常见问题 | `content-private/faq/<defense-id>.md` |
| 按页讲稿 | `content-private/decks/<id>/slides/` |

## 相关文档

- [`docs/director-json-schema.md`](./director-json-schema.md) — Q&A JSON 示例
- [`docs/content-decks.md`](./content-decks.md) — 讲稿编译
- [`docs/phase2-acceptance.md`](./phase2-acceptance.md) — 验收清单
