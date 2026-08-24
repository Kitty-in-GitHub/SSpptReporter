# content/ — 示例知识库（可进公开仓）

本目录只放**可公开**的示例材料。真实答辩内容请放 [`content-private/`](../content-private/README.md)（默认不进 Git）。

## 快速开始（demo）

```bash
# 1. 改讲稿
#    content/decks/demo/slides/01.md …

# 2. 编译
npm run compile:deck

# 3. 启动应用
npm run dev

# 4. 应用内「编辑讲稿」，或汇报模式 → Director「播放本场讲稿」
```

示例 PDF：`apps/presenter-onair/public/decks/demo/slides.pdf`（已进 Git）。

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
除 `demo` 外，`public/decks/*` 已被 ignore，适合私有 PDF。

## 公开 vs 私有

| 位置 | Git | 说明 |
|------|-----|------|
| `content/decks/demo/` | ✅ | 示例讲稿 |
| `public/decks/demo/` | ✅ | 示例 PDF |
| `content-private/` | ❌ | 真实答辩 / persona / FAQ |
| `public/decks/<其他>/` | ❌ | 私有 PDF |

运行时同一 URL 前缀 `/content/…`：先查私有，再查示例。

## 与 LLM 的关系

- **Phase 1（现在）**：`slides/*.md` 由你手写，编译后驱动 Present 播放
- **Phase 2（后续）**：同目录材料可作为按页 RAG；persona / FAQ 建议放 `content-private/`
