# content/decks 答辩内容包

每场答辩一个目录，**Markdown 讲稿为源文件**，编译后生成 `script.jsonl` 供 Director 队列播放。

## 快速开始（demo）

```bash
# 1. 改讲稿
#    content/decks/demo/slides/01.md …

# 2. 编译
npm run compile:deck

# 3. 启动应用
npm run dev

# 4. 汇报模式 → 导演台「播放本场讲稿」
```

详细规范见 [`docs/content-decks.md`](../docs/content-decks.md)。

## 目录结构

```
content/decks/<deckId>/
├── deck.json          # 场次元数据 + PDF 路径
├── slides/            # 每页讲稿（主格式）
│   01.md
│   02.md
│   └── ...
└── script.jsonl       # 编译产物（npm run compile:deck 生成）
```

PDF 放在 `apps/presenter-onair/public/decks/<deckId>/slides.pdf`，在 `deck.json` 里引用。

## 与 LLM 的关系

- **Phase 1（现在）**：`slides/*.md` 由你手写，编译后驱动 Present 播放
- **Phase 2（后续）**：同目录材料可作为按页 RAG；`content/persona/`、`content/faq/` 供 Q&A 检索
