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

## Q: 本项目的三层架构是什么？

Director 负责表演调度，Brain 负责 LLM 与知识库检索，VRM 身体负责口型与表情。详见 demo 场次第 2 页讲稿。

## Q: 如果问题不在材料里怎么办？

应诚实说明不在本次提交材料范围内，设置 admit_unknown，不编造数据。可回答：「这个问题需要对照正式材料确认，目前无法从已提交内容给出准确回答。」

## Q: 请重复一下刚才的回答？

（此条供 Brain 检索参考；系统也会识别「请重复」类口令并直接复述上一轮回答，无需 LLM。）
