# Present 模式与幻灯 deck

Phase 1 汇报呈现：浏览器内 PDF 翻页 + VRM 主播，由 Director `slide_action` 驱动翻页。

## 工作流

1. Office / WPS 制作 `.pptx`（不依赖动画）
2. 导出 **PDF**（静态页）
3. 放入 `apps/presenter-onair/public/decks/<deckId>/`
4. 编写同目录 `deck.json` 清单
5. 应用内切到 **汇报** 模式，选择布局，用 Director 队列或工具栏翻页

## deck.json 格式

```json
{
  "id": "demo",
  "title": "答辩示例",
  "slideSource": {
    "type": "pdf",
    "url": "/decks/demo/slides.pdf"
  }
}
```

| 字段 | 说明 |
|------|------|
| `id` | deck 标识，与目录名一致 |
| `title` | 工具栏显示标题 |
| `slideSource.type` | 目前仅支持 `pdf` |
| `slideSource.url` | 相对 `public/` 的 URL |

## 内置 demo

```bash
pip install fpdf2   # 首次生成需安装
node apps/presenter-onair/scripts/generate-demo-deck.mjs
npm run compile:deck
```

生成 `public/decks/demo/slides.pdf`（6 页 Phase 1 彩排，960×540 pt 宽屏 16:9）与 `deck.json`；讲稿见 `content/decks/demo/slides/*.md`。默认 `activeDeckId` 为 `demo`。

## 布局（presentLayout）

| 值 | 说明 |
|----|------|
| `split_slide_left` | 左幻灯 · 右主播（默认） |
| `split_slide_right` | 左主播 · 右幻灯 |
| `pip` | 幻灯全屏 + 画中画主播 |
| `slide_full` | 纯幻灯 |
| `avatar_full` | 纯主播 |

设置保存在 localStorage（`present` 字段），工具栏可切换。

## Director slide_action

队列播放 `present` 模式动作时，在 utterance 之前执行翻页：

| 字段 | 效果 |
|------|------|
| `{ "goto": N }` | 跳到第 N 页（1-based） |
| `{ "next": true }` | 下一页 |
| `{ "prev": true }` | 上一页 |

试播 fixture：`apps/presenter-onair/src/fixtures/sample-queue.json`（Director 面板 → 播放队列）。

## 相关代码

| 用途 | 路径 |
|------|------|
| 汇报壳层 | `apps/presenter-onair/src/components/present/PresentShell.tsx` |
| PDF 渲染 | `apps/presenter-onair/src/components/present/PdfSlideViewer.tsx` |
| deck 加载 | `apps/presenter-onair/src/lib/present/loadDeck.ts` |
| 翻页逻辑 | `apps/presenter-onair/src/lib/present/applySlideAction.ts` |
| 状态 hook | `apps/presenter-onair/src/hooks/useSlideDeck.ts` |
