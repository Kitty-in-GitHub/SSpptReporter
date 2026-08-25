# FAQ 示例格式

每个文件对应一个场次（文件名建议与 `deckId` 一致，如 `demo.md`）。

```markdown
## Q: 评委可能问的问题？

参考答案正文。可写「详见第 3 页讲稿」。
```

运行时优先加载 `content-private/faq/<deckId>.md`，否则用本目录。

详见 [`docs/content-qa.md`](../../docs/content-qa.md)。
