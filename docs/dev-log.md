# 开发日志（跨设备 / AI 接力）

> **用法**：每完成一段有意义的工作，在**本文件最上方**（「## 日志条目」下第一条）追加一条。  
> 其他设备的 AI 接手时：**先读最新 3 条**，再读 [`AGENTS.md`](../AGENTS.md)。

---

## 日志条目模板（复制后填写）

```markdown
### YYYY-MM-DD · <一句话标题>

- **设备/环境**：（可选，如 Win10 / Mac / conda ssreporter）
- **做了什么**：
- **未做 / 阻塞**：
- **下一台机器应优先**：
- **相关文件**：（路径列表）
- **验证方式**：（如 npm run dev，点 Director 按钮）
```

---

### 2026-08-22 · 默认 TTS：OpenAI 兼容 + Edge-TTS 网关

- **做了什么**：
  - 默认引擎改为 `openaiCompatible`（`127.0.0.1:5050`，发音人 `zh-CN-XiaoxiaoNeural`）
  - 本地网关不再强制 API Key；更新 Settings 文案与 phase0 / `.env.example`
- **验证**：先启动 openai-edge-tts → `npm run dev` → Director 试播 + 口型
- **相关文件**：`voiceOptions.ts`、`useSettings.ts`、`SettingsPanel.tsx`

### 2026-08-22 · 文档：TTS 选型与低配置本机方案

- **做了什么**：
  - 新增 `docs/tts-selection.md`（云端 API、Edge-TTS 兜底、Piper/sherpa 离线、独显升级路径、不进 Git 清单）
  - 更新 `AGENTS.md`、`README.md`、`cross-device-dev.md` 文档索引
- **下一台机器应优先**：按 `tts-selection.md` 配置 Gemini/Edge-TTS；Phase 0 口型验收
- **相关文件**：`docs/tts-selection.md`

### 2026-08-22 · Phase 0 收尾：Director TTS + 口型管线

- **设备/环境**：Windows 10，`conda activate ssreporter`
- **做了什么**：
  - 抽取 `lib/voiceOptions.ts`；新增 `useDirectorSpeech`（OnAir `VoiceEngineAdapter`）
  - `DirectorPanel` 改走 Settings TTS → `useAudioLipsync.play`（支持 VOICEVOX / 云端 TTS）
  - 增加「测试非法 JSON」按钮；`packages/director` Vitest 6 项
  - 文档：`phase0-acceptance.md`、`.env.example`；更新 AGENTS / phase0-scaffold
- **未做 / 阻塞**：
  - 口型需本机配 TTS 后人工验收（无 VOICEVOX/API Key 的 CI 环境无法自动测）
  - Director 队列、知识库内容仍属 Phase 1
- **下一台机器应优先**：
  1. 按 `docs/phase0-acceptance.md` 验收口型
  2. 通过后进入 Phase 1 知识库或 Director 队列
- **相关文件**：
  - `apps/presenter-onair/src/hooks/useDirectorSpeech.ts`
  - `apps/presenter-onair/src/lib/voiceOptions.ts`
  - `packages/director/src/validate.test.ts`
- **验证方式**：`npm run typecheck && npm run test`；`npm run dev` → Director 按钮

---

### 2026-08-22 · 切换主模型为 StarString1.0.vrm

- **设备/环境**：Windows 10，`conda activate ssreporter`
- **做了什么**：
  - `StarString1.0.vrm` 移至 `assets/avatars/`，运行时复制到 `public/avatar/`
  - `miko.vrm` 保留（`assets/avatars/` + `public/avatar/`）
  - 更新 `AvatarPanel.tsx`、`App.tsx`、`DirectorPanel.tsx` 加载路径
  - 私仓 `origin` 推送成功（`main` @ `697c560`）
- **未做 / 阻塞**：
  - Phase0 真 TTS 口型未在 StarString 上完整验收
  - Director 仍仅为 fixture 按钮，无 LLM 队列
- **下一台机器应优先**：
  1. 从网盘/U 盘复制 `StarString1.0.vrm` 到 `public/avatar/`
  2. Settings 配 VOICEVOX，测口型
  3. 开始 `content/persona` 或 Director 队列
- **相关文件**：
  - `apps/presenter-onair/src/components/AvatarPanel.tsx`
  - `apps/presenter-onair/public/avatar/StarString1.0.vrm`（本地）
- **验证方式**：`npm run dev` → 可见 StarString → 左下角播放 sample-action

---

### 2026-08-22 · 私仓接入与跨设备文档体系

- **设备/环境**：Windows 10，Git + Git Credential Manager
- **做了什么**：
  - `origin` → `https://github.com/Kitty-in-GitHub/SSpptReporter.git`
  - `.gitignore` 排除 `*.vrm`、`token`、`.env`
  - 新增 `AGENTS.md`、`docs/cross-device-dev.md`、`docs/decisions.md`、本日志
- **未做 / 阻塞**：无
- **下一台机器应优先**：`git pull` → 读 `AGENTS.md` → 复制 VRM → `npm run dev`
- **相关文件**：`AGENTS.md`，`docs/cross-device-dev.md`
- **验证方式**：新 clone 后按 cross-device-dev 手册跑通

---

### 2026-08-21 · Phase 0 脚手架与 Director 包

- **设备/环境**：Windows 10，conda `ssreporter`（Node 22）
- **做了什么**：
  - `apps/presenter-onair`：AITuber OnAir VRM 模板 + `DirectorPanel`
  - `packages/director`：Ajv 校验 + `emotionToVrmExpression`
  - npm workspaces；`vite.config.ts` 修复 `three` 提升到根 `node_modules` 的 alias
  - 样例 `sample-action.json` 可驱动表情 + Web Speech
- **未做 / 阻塞**：
  - Windows `conda run` 不可用，需先 `activate`
  - 知识库、`packages/brain` 未实现
- **下一台机器应优先**：验收 Phase0 清单（见 `docs/phase0-scaffold.md`）
- **相关文件**：
  - `packages/director/`
  - `apps/presenter-onair/src/components/DirectorPanel.tsx`
  - `schemas/director-action.schema.json`
- **验证方式**：`npm run typecheck`；`npm run dev`；Director 按钮

---

### 2026-08-20 · 技术路径与底座选型定稿

- **设备/环境**：规划阶段
- **做了什么**：
  - 确定 VRoid→VRM、OnAir 身体、Director JSON、私仓 + 知识库策略
  - 文档：`virtual-host-presenter-path.md`、`virtual-host-base-choice.md`、`director-json-schema.md`
- **未做 / 阻塞**：无代码
- **下一台机器应优先**：阅读 `docs/decisions.md` ADR-001～007
- **相关文件**：`docs/virtual-host-presenter-path.md`
- **验证方式**：—
