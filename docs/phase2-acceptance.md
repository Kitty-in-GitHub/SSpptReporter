# Phase 2 验收清单

> **状态：待验收**  
> 汇报模式内嵌 Q&A 面板：persona / FAQ / slide 关键词检索 → Brain 产出 `DirectorAction`（`mode: qa`）→ `barge_in` 入队播放 + 翻页。

完成标准：在 **汇报模式** 下，文字或 Web Speech 提问能得到短答 TTS；材料未覆盖时礼貌拒答；讲稿播放中可打断；有证据时可跳到对应 PDF 页。

前置：Phase 1 已通过（见 [`phase1-acceptance.md`](./phase1-acceptance.md)）。

---

## 环境准备

```bash
conda activate ssreporter
cd d:\project\SSreporter
npm install
npm run setup:tts   # 首次或 pip 依赖缺失时
```

确认本地存在（不进 Git）：

- `apps/presenter-onair/public/avatar/StarString1.0.vrm`
- 设置面板中已配置 **LLM API Key**（或选用 gemini-nano）

```bash
npm run dev
# → http://localhost:5173 + http://127.0.0.1:5050（TTS 网关）
```

自动化检查（可选）：

```bash
npm run typecheck
npm run test
```

知识库示例：`content/persona/presenter.md`、`content/faq/demo.md`；真材料放 `content-private/persona/`、`content-private/faq/`（见 [`content-qa.md`](./content-qa.md)）。

---

## 手动验收表

| # | 项 | 操作 | 通过标准 |
|---|-----|------|----------|
| 1 | 知识库加载 | 切到 **汇报**，展开底部「评委提问」 | 无加载错误；私有 `content-private` 优先于 `content/` |
| 2 | 相关提问 | 输入「Phase 1 验收了什么？」→ **提问** | 短答 + TTS；`qa.confidence` 有值；可命中 FAQ / slide |
| 3 | 无关提问 | 输入与材料无关的问题（如「今天天气如何？」） | `admit_unknown: true`，礼貌拒答，不编造 |
| 4 | 指页 | 问「架构在哪一页？」或类似 slide 问题 | 回答含证据时 PDF `goto` 到正确页 |
| 5 | 打断 | 先 **播放本场讲稿**，播放中提问 | `barge_in` 停止当前句，插入 QA 回答；播完不自动续播讲稿（MVP） |
| 6 | 语音输入 | Chrome / Edge 点 **麦克风** 说中文问题 | 默认 **说完自动提问** 并 TTS 回答；可关闭「说完自动提问」后改为手动点「提问」 |
| 7 | 演讲模式语音 | 进入 **演讲模式**，鼠标移到顶部唤出栏 | 可见 🎤 按钮；说中文后同样自动提问（与底部面板行为一致） |

---

## 已知限制（MVP）

- RAG 为关键词 TF 匹配，无向量 embedding
- ASR 仅浏览器 Web Speech（`zh-CN`），无云端 Whisper
- 无独立顶栏 `sessionMode: qa`；Q&A 嵌在汇报模式底部面板
- 讲稿被打断后需手动继续播放（不自动续播）
- LLM 输出非法 JSON 时降级为固定 `qa` action + 短答 fallback

---

## 签字

| 验收人 | 日期 | 备注 |
|--------|------|------|
| | | |
