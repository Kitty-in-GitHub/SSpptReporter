# content-private/ — 私有知识库（不进公开仓）

与仓库内 `content/`（示例知识库）**目录结构相同**，但默认被 `.gitignore` 忽略。

## 用途

| 目录 | 进 Git？ | 内容 |
|------|----------|------|
| `content/` | 是 | 示例讲稿 / 示例 PDF 引用（如 `demo`） |
| `content-private/` | 否 | 真实答辩讲稿、persona、FAQ |

开发时 Vite 会**优先**读 `content-private/`，再回落到 `content/`。同一 `deckId` 若两边都有，以私有为准。

新建场次若两边都不存在，编辑/编译 API 会写到 **`content-private/`**，避免误提交到公开树。

## 新建一场私有答辩

**推荐：一键脚手架**

```bash
npm run scaffold:deck -- --id my-defense --title "我的答辩" --pages 5
```

会在本机生成（已存在则跳过，加 `--force` 覆盖）：

| 路径 | 内容 |
|------|------|
| `content-private/decks/<id>/deck.json` | 场次元数据 |
| `content-private/decks/<id>/slides/01.md` … | 讲稿模板 |
| `content-private/decks/<id>/performance.json` | 空预设（可后续在讲稿导演台编辑） |
| `content-private/persona/presenter.md` | 人设模板（仅首次） |
| `content-private/faq/<id>.md` | FAQ 模板 |
| `apps/presenter-onair/public/decks/<id>/README.txt` | 提醒拷贝 `slides.pdf` |

然后：

1. 拷贝 PDF → `apps/presenter-onair/public/decks/<id>/slides.pdf`
2. 编辑 slides / FAQ / persona
3. `npm run compile:deck`
4. `npm run dev` → 汇报模式选该场次

**手工创建**（等价于脚手架）：

```bash
# 1. 讲稿
mkdir -p content-private/decks/my-defense/slides
# 写 deck.json + slides/01.md …

# 2. PDF（也不进 Git，见 .gitignore 对 public/decks 的规则）
mkdir -p apps/presenter-onair/public/decks/my-defense
# 把 slides.pdf 拷进去

# 3. 编译
# 应用内「保存并编译」会自动选 content-private
# 或 CLI：见 docs/content-decks.md
```

`deck.json` 示例：

```json
{
  "id": "my-defense",
  "title": "我的答辩",
  "slideSource": {
    "type": "pdf",
    "url": "/decks/my-defense/slides.pdf"
  }
}
```

## 注意

- 不要把真实姓名、学校、未公开成果写进 `content/`。
- 示例场次请继续改 `content/decks/demo/`。
- 详细规范：[`docs/content-decks.md`](../docs/content-decks.md)
