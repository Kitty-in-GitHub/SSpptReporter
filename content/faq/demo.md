# demo 场次 FAQ（示例）

## Q: 本项目是什么？

SSreporter 是虚拟答辩助手：VRM 皮套 + Director 表演层 + 知识库 Brain。LLM 只输出 DirectorAction JSON，不直接控制骨骼。

## Q: Phase 1 验收了什么？

Phase 1 验证 Present 闭环：PDF 汇报、讲稿编译入队、Director 队列播放、TTS 口型、翻页同步、演讲模式与画中画。

## Q: 讲稿是怎么生成的？

在 content/decks 下按页编写 Markdown，运行 npm run compile:deck 生成 script.jsonl，汇报模式播放本场讲稿。

## Q: 手势 VRMA 从哪里来？

可运行 npm run setup:gestures 下载开源占位，或按 docs/vrma-authoring.md 在 Blender/Unity 自制后覆盖 gestures 目录。

## Q: 真实答辩材料放哪里？

放在 content-private/decks/ 与 content-private/persona、faq，不进公开 Git 仓库。
