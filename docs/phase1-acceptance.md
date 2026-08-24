# Phase 1 验收清单

> **状态：待本机验收**  
> Present 汇报 + PDF 翻页 + content/decks 讲稿编译入队 + Director 队列播放闭环。

完成标准：在 **汇报模式** 下，能按 `script.jsonl` 完整播完 demo 场次（或私有场次），TTS 口型同步、翻页与讲稿一致；演讲模式与画中画可用。

前置：Phase 0 已通过（见 [`phase0-acceptance.md`](./phase0-acceptance.md)）。

---

## 环境准备

```bash
conda activate ssreporter
cd d:\project\SSreporter
npm install
npm run setup:tts   # 首次或 pip 依赖缺失时
npm run compile:deck
```

确认本地存在（不进 Git）：

- `apps/presenter-onair/public/avatar/StarString1.0.vrm`

```bash
npm run dev
# → http://localhost:5173 + http://127.0.0.1:5050（TTS 网关）
```

自动化检查（可选）：

```bash
npm run typecheck
npm run test
```

---

## 手动验收表

| # | 项 | 操作 | 通过标准 |
|---|-----|------|----------|
| 1 | 汇报加载 | 右上角切到 **汇报** | demo PDF 6 页、横屏 16:9 正常显示 |
| 2 | 讲稿播放 | Director → **播放本场讲稿** | 6 条 utterance 顺序播报，TTS + 口型 |
| 3 | 翻页同步 | 同上全程观察 | `slide_action` 与当前页讲稿一致（goto / next） |
| 4 | 工具栏与快捷键 | 空格、← → | 暂停/继续、上一条/下一条、手动翻页可用 |
| 5 | 演讲模式 | 按 `F`（`Esc` 退出） | 隐藏工具栏、讲稿条、Director；浏览器全屏 |
| 6 | 画中画 | 布局选 pip + 设置 | 拖动、无边框、镜头构图满意 |
| 7 | 编辑闭环 | **编辑讲稿** → 改字 → 保存并编译 → 再播 | 播报内容已更新 |
| 8 | 私有材料（可选） | `content-private/decks/<id>/` + 对应 PDF | 真答辩材料能播完 10+ 页 |

---

## 讲稿与 PDF 工作流（验收用）

```bash
# 重新生成 demo PDF（需 pip install fpdf2）
node apps/presenter-onair/scripts/generate-demo-deck.mjs
npm run compile:deck
```

讲稿源：`content/decks/demo/slides/*.md` → `content/decks/demo/script.jsonl`  
PDF：`apps/presenter-onair/public/decks/demo/slides.pdf`

---

## 已知限制（Phase 1 非目标 / 抛光中）

| 项 | 状态 |
|----|------|
| `gesture` → Expression 近似手势 | **已接通**（`gestureToVrmReaction.ts` + `directorReactions.ts`） |
| `gesture` → VRMA 骨骼 one-shot | 可选：将 `.vrma` 放入 `public/avatar/gestures/`；缺失时用 Expression fallback |
| `camera` 每句切换（bust/medium/wide） | 未接通；使用 Settings 全局镜头构图 |
| LLM Brain / 评委 Q&A RAG | Phase 2 |
| ASR 打断 | Phase 2 |

---

## 与 Phase 0 的关系

- Phase 0 验收 **Director 单条** 表情与 TTS；手势在 Phase 0 文档中列为非目标。
- Phase 1 验收 **整场讲稿队列** + Present UI；`gesture` 字段应在播放时可见（Expression 层）。

Phase 1 通过后进入：**`content-private` 真材料彩排** → Phase 2 评委问答。
