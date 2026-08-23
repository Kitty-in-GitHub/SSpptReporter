# SSreporter — AI 接手说明（跨设备）

> **给其他设备上的 AI**：先读本文件，再读 `docs/cross-device-dev.md` 与 `docs/dev-log.md`。  
> 架构与协议细节见 `docs/` 下专题文档；**以本仓库代码与 schema 为事实来源**。

## 项目是什么

虚拟主播**答辩助手**：VRoid → VRM 皮套 + **Director**（表演导演层）+ **Brain**（LLM + 知识库，建设中）。

- **Present**：按 PPT 页讲稿
- **Q&A**：评委提问短答
- LLM **只输出** `DirectorAction` JSON，不直接控骨骼

## 当前阶段（截至 2026-08-22）

| 项 | 状态 |
|----|------|
| Phase 0 | **已通过本机验收**（见 `docs/phase0-acceptance.md`） |
| Phase 1 | **进行中**：Director 队列 ✅、Present+PDF ✅、content/decks 讲稿入队 ✅ |
| 运行时 VRM | `StarString1.0.vrm`（`miko.vrm` 仅本地备份，不进 Git） |
| Director 包 | `packages/director`（类型 + Ajv 校验 + 单元测试 + 队列） |
| Director UI | `DirectorPanel` → 单条/队列播放 + TTS 口型 |
| Present 汇报 | `PresentShell` + PDF.js，5 种布局（见 `docs/present-deck.md`） |
| 知识库 `content/` | `content/decks/` MD 讲稿 + 编译入队（见 `docs/content-decks.md`） |
| 私仓 | `https://github.com/Kitty-in-GitHub/SSpptReporter.git` |

## 仓库结构（必记）

```
SSreporter/
├── AGENTS.md                 ← 本文件（AI 入口）
├── apps/presenter-onair/     ← 主应用（AITuber OnAir VRM 模板 + 我们的补丁）
├── apps/tts-gateway/         ← 本机 Edge-TTS 网关（npm run dev 一并启动）
├── packages/director/        ← DirectorAction 类型与校验
├── content/                  ← 知识库（进 Git）
├── assets/avatars/           ← VRM 本地归档（不进 Git）
├── schemas/director-action.schema.json
└── docs/                     ← 设计与跨设备文档
```

**不要**把 Phase0 主战场当成 `apps/presenter-web`（仅占位 README）。

## 硬性约束（违反会坑用户）

1. **`.vrm` 不进 Git** — 换机需手动复制到 `apps/presenter-onair/public/avatar/`。
2. **密钥不进 Git** — `.env`、`token` 已 ignore；LLM/TTS Key 只放本机。
3. **Windows 上勿用** `conda run -n ssreporter -- npm …`（GBK 编码会炸）；先 `conda activate ssreporter`。
4. **npm workspaces** — `three` 在根 `node_modules`；`vite.config.ts` 已 alias 到 `../../node_modules/three`。
5. **最小改动** — 不整仓吞 AITuberKit；参考 UX，身体底座保持 OnAir。
6. **Director 协议单一来源** — `schemas/director-action.schema.json`；改协议先改 schema 再改 `packages/director`。

## 5 分钟跑起来

```bash
git clone https://github.com/Kitty-in-GitHub/SSpptReporter.git
cd SSpptReporter   # 或本地目录名 SSreporter
conda env create -f environment.yml   # 或 conda activate ssreporter
# 旧环境仅 Node 时：conda env update -f environment.yml --prune
conda activate ssreporter
npm install
npm run setup:tts   # 首次或 environment.yml 未含 pip 时
# 复制 VRM（仓库里没有）：
#   assets/avatars/StarString1.0.vrm → apps/presenter-onair/public/avatar/StarString1.0.vrm
npm run dev         # 同时启动页面 + 本机 TTS 网关 :5050
# http://localhost:5173 — 左下角 Director · Phase 0 测 fixture
# 仅页面、不要 TTS：npm run dev:web
```

## 关键代码入口

| 用途 | 路径 |
|------|------|
| 加载 VRM | `apps/presenter-onair/src/components/AvatarPanel.tsx` → `VRM_FILE_URL` |
| Director 试播 | `apps/presenter-onair/src/components/DirectorPanel.tsx` |
| Present 汇报 | `apps/presenter-onair/src/components/present/PresentShell.tsx` |
| PDF 幻灯 | `apps/presenter-onair/src/components/present/PdfSlideViewer.tsx` |
| deck 规范 | `docs/present-deck.md` |
| 讲稿内容包 | `docs/content-decks.md` |
| Director TTS | `apps/presenter-onair/src/hooks/useDirectorSpeech.ts` |
| TTS 配置构建 | `apps/presenter-onair/src/lib/voiceOptions.ts` |
| 本机 TTS 网关 | `apps/tts-gateway/server.py` |
| 样例指令 | `apps/presenter-onair/src/fixtures/sample-action.json` |
| emotion 映射 | `packages/director/src/index.ts` → `emotionToVrmExpression` |
| 校验 | `packages/director/src/validate.ts` |
| 表情锚点 profile | `apps/presenter-onair/src/App.tsx` → `VRM_EFFECT_ANCHOR_PROFILE_ID` |

## 建议的下一步（优先级）

1. **本机验收 Step 2**：改 `slides/*.md` → `npm run compile:deck` → 播放本场讲稿
2. **Phase 2 Q&A**：`content/persona`、`content/faq` + Brain RAG
3. **Director 队列**（已完成）：`sample-queue.json` / content 讲稿试播
4. （可选）备选 TTS：VOICEVOX / 云端 Gemini 口型复测

每完成一项，**在 `docs/dev-log.md` 顶部追加一条日志**（见该文件模板）。

## 与用户协作习惯

- 用户（wang）倾向：先调研 → 定方案 → 再实现；私仓自建，不替用户创建 GitHub 仓。
- 大文件 / 皮套 / token 由用户本机管理；AI 只改代码与 `content/` 文档。
- 仅用户明确要求时才 `git commit` / `push`。

## 文档索引

| 文档 | 内容 |
|------|------|
| `docs/cross-device-dev.md` | 换机、同步、排错、密钥 |
| `docs/dev-log.md` | 开发日志（AI 跨设备同步用） |
| `docs/decisions.md` | 架构决策记录（ADR） |
| `docs/virtual-host-presenter-path.md` | 总技术路径 |
| `docs/director-json-schema.md` | Director 协议说明 |
| `docs/phase0-acceptance.md` | Phase 0 手动验收步骤 |
| `docs/tts-selection.md` | TTS 选型（云端 / 本机 / 核显兜底） |