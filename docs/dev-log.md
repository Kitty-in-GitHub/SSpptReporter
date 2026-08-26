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

---

---

---

---

---

### 2026-08-26 · Phase 3 Present 导演：一页多 beat + performance profile

- **设备/环境**：Windows / conda ssreporter
- **做了什么**：
  - `DirectorAction` 扩展 `profile`、`voice`、`timing`；schema + `packages/director` 校验
  - `performance.json`（`content/persona/` + deck 覆盖）统一映射 VRM 表情/手势与 TTS 语速/停顿
  - 讲稿 `<!-- beat -->` 多节拍编译；demo `03.md` 示例 3 beat
  - 播放：`useDirectorQueue` 播前/播后停顿 + `useDirectorSpeech` 按拍语速；编辑讲稿 UI 节拍标签
  - 文档：`docs/phase3-present-director.md`、ADR-009、`content-decks.md` 更新
- **未做 / 阻塞**：毫秒级时间轴；`emphasis` 未接 TTS；Q&A 路径未用 profile（可后续复用）
- **下一台机器应优先**：`npm run dev` → 编辑讲稿试多 beat → 汇报播放验收；按需改 `performance.json`
- **相关文件**：`packages/director/src/performance-profile.ts`、`slide-script-draft.ts`、`useDirectorQueue.ts`、`ScriptEditorShell.tsx`
- **验证方式**：`npm run test -w @ssreporter/director`；汇报模式播放 demo 讲稿（script.jsonl 约 8 条）

---


- **设备/环境**：Windows 11 / Node 24
- **做了什么**：
  - 现象：评委提问无论问什么，都固定回答「我需要对照材料确认才能给出准确回答」
  - 根因：`createBrainLlmClient.complete` 把 `chatService.chatOnce()` 的返回值 `ToolChatCompletion` 对象用 `String()` 转成 `"[object Object]"`，导致 LLM 输出永远无法解析成 JSON，`answerQuestion` 每次都走兜底文案分支（错误含 "JSON" 时固定返回该句）
  - 修复：新增 `extractChatCompletionText()`，按 OnAir `runOnceText` 同款逻辑从 `blocks` 提取 text 块拼接；新增单元测试 4 项锁定
  - 验证：新测试 4/4 过；端到端探针（真实知识库 + mock LLM）确认 `usedFallback: false`、confidence 0.9、检索命中
- **未做 / 阻塞**：`qaVoicePreferences.test.ts` 3 项失败为**预先存在**（干净树同样失败，localStorage mock 问题），未处理；另 typecheck 有 4 处仓库遗留错误（`directorReactions.test.ts`、`vrmaGesturePlayback.ts`、`slideIndex.ts`），均与本次修复无关
- **下一台机器应优先**：浏览器实测 Q&A（Vite 已热更新）；如需可顺手修 qaVoicePreferences 测试与遗留 typecheck
- **相关文件**：`apps/presenter-onair/src/lib/brain/createBrainLlmClient.ts`、新增 `createBrainLlmClient.test.ts`
- **验证方式**：`npm run dev` → 汇报模式 → 评委提问（真实 LLM 应答）

---

- **设备/环境**：Windows 11 / Node 24（非 conda）/ npm 11
- **做了什么**：
  - 根目录 `node_modules` 缺失导致 `npm run dev` 报 `Cannot find module vite/bin/vite.js` → `npm install`（354 包）
  - `npm install` 两次 EPERM：缓存目录不可写（重定向 `--cache .\.npm-cache`）、postinstall spawn 受限（需完整权限）→ `.npm-cache/` 加入 `.gitignore`
  - 冒烟验证：5173（Vite 7.3.6，HTTP 200，绑定 IPv6 `::1`）+ 5050（Edge-TTS 网关）均正常
  - `docs/cross-device-dev.md`：新增「1.1.1 首次必须 npm install」、EPERM 对策、IPv6 端口检查说明、VRM 缺失实测警告、交接清单补两项
- **未做 / 阻塞**：`public/avatar/StarString1.0.vrm` 不在位（换机未复制，需用户提供）；Phase 2 / 2.5 未做人工验收
- **下一台机器应优先**：按 `docs/phase2-acceptance.md` 做 Phase 2 人工验收（9 项）；VRM 到位后补 Phase 0/1 抽查
- **相关文件**：`.gitignore`、`docs/cross-device-dev.md`
- **验证方式**：`npm run dev` → localhost:5173 页面 + 5050 Uvicorn

---

### 2026-08-24 · 本机 CPU Embedding（无显卡）

- **做了什么**：
  - `tts-gateway`：`POST /v1/embeddings`（fastembed + ONNX CPU，默认 `BAAI/bge-small-zh-v1.5`）
  - `npm run setup:embed`；`GET /health` 增加 `embedding` / `embed_model`
  - 应用：`resolveBrainEmbedder` 本机优先；Vite `/api/embed` 代理
  - 文档：`brain-retrieval.md`、ADR-011
- **未做 / 阻塞**：未在本机跑通 `setup:embed` 下载模型（需用户环境 pip）
- **下一台机器应优先**：`setup:embed` → 重启 dev → 问法与材料措辞不一致时对比 TF
- **相关文件**：`apps/tts-gateway/server.py`、`createBrainEmbedder.ts`、`gatewayEmbedHealth.ts`
- **验证方式**：`GET http://127.0.0.1:5050/health` 含 `embedding: true`；`npm run test -w @ssreporter/brain`

### 2026-08-24 · Brain Hybrid 检索（向量 + TF + RRF）

- **做了什么**：
  - `packages/brain`：云端 Embedding 客户端、余弦检索、RRF、`retrieveHybrid`；`answerQuestion` 可选 embedder
  - 可选缓存 `brain-vectors.json` + `npm run build:brain-vectors -- --deck demo`
  - 应用：`createBrainEmbedder`、`loadBrainKnowledge` / `useBrainQa` 接线；无 Key 退回 TF
  - 文档：`docs/brain-retrieval.md`、ADR-010
- **未做 / 阻塞**：未提交真实 `brain-vectors.json`（需本机 Key 生成）；手测命中率对比待验收
- **下一台机器应优先**：有 OpenAI Key 时 `build:brain-vectors`；无 Key 确认 Q&A 仍走 TF
- **相关文件**：`packages/brain/src/{embedClient,vectorRetrieve,retrieveHybrid,vectorIndex}.ts`、`createBrainEmbedder.ts`
- **验证方式**：`npm run test -w @ssreporter/brain`

### 2026-08-24 · ASR：安装指引弹窗 + 浏览器内 Whisper（WASM）

- **做了什么**：
  - 选「本机 Whisper（网关）」未就绪时弹出操作指引（复制 `setup:asr`、改用 WASM/Web Speech）
  - 新增引擎 `browserWhisper`：`@huggingface/transformers` + Whisper base（首次下载进度）
- **相关文件**：`GatewayAsrSetupDialog.tsx`、`browserWhisperAsr.ts`、`docs/phase2-5-asr.md`
- **验证方式**：汇报 → 语音引擎切换；未装网关时看弹窗；WASM 首次听写看下载进度

### 2026-08-24 · Phase 2.5 ASR：Web Speech / 本机 Whisper / 云端

- **做了什么**：
  - `tts-gateway` 增加 `POST /v1/audio/transcriptions`（faster-whisper，可选安装）
  - Vite `/api/asr` 代理；`qaAsrEngine` 设置 + Q&A 面板语音引擎切换
  - MediaRecorder 整段录音 → 本机/云端转写 → 现有自动提问流程
  - 文档：`docs/phase2-5-asr.md`、ADR-009
- **未做 / 阻塞**：向量 RAG（另开计划）；流式逐字 ASR
- **下一台机器应优先**：`npm run setup:asr` 后本机验收；或用 Web Speech / 云端
- **相关文件**：`apps/tts-gateway/server.py`、`useMediaRecorderAsr.ts`、`QaPanel.tsx`
- **验证方式**：Settings → 汇报 Q&A 选引擎 · 麦克风提问

### 2026-08-24 · Q&A 增强：场次切换、可续播打断、「请重复」

- **做了什么**：
  - 汇报工具栏 **场次** 下拉（`/api/content/decks` 列举私有 + 公开 deck）
  - Q&A 面板「问答打断后自动续播讲稿」开关（默认关，写入 settings）
  - 「请重复一下」等口令 → 复述上一轮 utterance，不走 LLM
  - 补充 `content/faq` 示例条目与 README
- **相关文件**：`PresentDeckSelect.tsx`、`directorQueueMerge.ts`、`qaRepeatAction.ts`
- **验证方式**：`npm run test` · 汇报模式切换场次 · 讲稿播放中提问（开/关续播）

### 2026-08-24 · Phase 2 MVP：Brain + 汇报模式 Q&A 面板

- **做了什么**：
  - `packages/brain`：persona/FAQ/slide 关键词检索、`answerQuestion` → `DirectorAction`（`mode: qa`）、Vitest
  - `content/persona/presenter.md`、`content/faq/demo.md`、`docs/content-qa.md`
  - 汇报模式底部 `QaPanel`：文字 + Web Speech（zh-CN）→ `barge_in` 入队 + TTS
  - `docs/phase2-acceptance.md` 验收清单
- **未做 / 阻塞**：向量 RAG、云端 ASR、打断后自动续播
- **下一台机器应优先**：按 `docs/phase2-acceptance.md` 本机验收；真 FAQ 放 `content-private/faq/`
- **相关文件**：`packages/brain/`、`QaPanel.tsx`、`useBrainQa.ts`、`docs/phase2-acceptance.md`
- **验证方式**：`npm run test` · `npm run dev` → 汇报 → 评委提问

### 2026-08-24 · Phase 1 正式验收通过

- **状态**：按 `docs/phase1-acceptance.md` 本机验收通过（demo 彩排闭环）
- **下一台机器应优先**：Phase 2 Q&A（`packages/brain` + 汇报模式提问面板）

### 2026-08-24 · 文档：自制 VRMA 双路径（Blender / Unity）

- **做了什么**：
  - 新增 `docs/vrma-authoring.md`：Blender + Unity 下载链接、简教程、B 站与中文图文链接、接入检查清单
  - 交叉引用：`phase1-acceptance.md`、`AGENTS.md`
- **相关文件**：`docs/vrma-authoring.md`
- **验证方式**：打开文档按路径选软件；自写 `.vrma` 覆盖 `public/avatar/gestures/` 后播放讲稿

### 2026-08-24 · Phase 1 抛光：gesture 执行 + 验收文档 + compile CLI

- **做了什么**：
  - `gestureToVrmReaction.ts`：Director gesture → Expression 近似手势；可选 VRMA URL
  - `directorReactions.ts`：拆分 gesture / emotion；队列与 DirectorPanel 先手势后表情
  - `vrmaGesturePlayback.ts` + `AvatarPanel`：VRMA one-shot 播放，缺失文件时 Expression fallback
  - `docs/phase1-acceptance.md`；更新 `phase0-acceptance.md`、`AGENTS.md`
  - `packages/director/scripts/compile-deck-cli.mjs`：`npm run compile:deck` Windows 可见输出
  - 单测：`directorReactions.test.ts`（10 项）
- **验证**：`npm run test` → director 23 + onair 21 passed；`npm run compile:deck` → 6 actions
- **相关文件**：`gestureToVrmReaction.ts`、`directorReactions.ts`、`AvatarPanel.tsx`、`phase1-acceptance.md`

### 2026-08-24 · demo 彩排闭环：6 页 PDF + 讲稿替换

- **做了什么**：
  - `content/decks/demo/slides/01–06.md`：Phase 1 彩排验收讲稿（rehearse-01…06）
  - `generate-demo-deck.py` + mjs 包装：生成 6 页中文 PDF（fpdf2 + 系统字体）
  - `npm run compile:deck` → `script.jsonl` 6 条 action
  - `deck.json` 标题改为「Phase 1 彩排验收」
- **验证**：`node apps/presenter-onair/scripts/generate-demo-deck.mjs` → `npm run compile:deck` → `npm run dev` → 汇报 → 播放本场讲稿
- **相关文件**：`content/decks/demo/`、`public/decks/demo/slides.pdf`、`scripts/generate-demo-deck.py`

### 2026-08-23 · 公开准备：LICENSE + 双知识库 + 上游 fork 说明

- **做了什么**：
  - 根目录 `LICENSE`（MIT，保留 Yuki Shindo + SSreporter）与 `NOTICE`
  - `content/` 示例 vs `content-private/` 私有；Vite 优先读私有；非 demo PDF ignore
  - `docs/upstream-fork.md`：GitHub 无法事后挂 fork；推荐产品仓 + 上游 fork 双仓
  - ADR-008；更新 README / AGENTS / content-decks
- **未做 / 阻塞**：尚未在 GitHub 上实际创建 OnAir fork（需用户操作）
- **下一台机器应优先**：公开前审计密钥；按需 `gh repo fork shinshin86/aituber-onair`
- **相关文件**：`LICENSE`、`NOTICE`、`content-roots.ts`、`.gitignore`、`docs/upstream-fork.md`
- **验证方式**：`npm run compile:deck`；`npm run dev` 仍能播 demo

### 2026-08-22 · Phase 1.5：应用内编辑讲稿（A+C）

- **做了什么**：
  - 第三种模式「编辑讲稿」：左 PDF + 右表单；localStorage 草稿 + dev 写盘 API
  - `PUT /api/content/decks/:id/slides/:page`、`POST .../compile`
  - `serializeSlideMarkdown` / `parseSlideMarkdownToDraft`；`ScriptEditorShell`
- **验证**：`npm run dev` → 编辑讲稿 → 改字 → 保存并编译 → 汇报模式播放本场讲稿

### 2026-08-22 · 修复 Windows Ctrl+C 乱码

- **原因**：`concurrently` + 嵌套 `npm run` 走 cmd.exe，Ctrl+C 弹出 GBK「终止批处理操作吗」在 UTF-8 终端显示乱码
- **修复**：`scripts/dev.mjs` 直接用 Node 拉起 Vite + TTS，Ctrl+C 一次干净退出
- **验证**：`npm run dev` → Ctrl+C，无乱码、无需多次 Y/N

### 2026-08-22 · Phase 1 Step 2：content/decks + MD 讲稿编译入队

- **做了什么**：
  - 方案 B：`content/decks/demo/slides/*.md` → `compileDeckScript` → `script.jsonl`
  - `packages/director`：编译器 + 单测 + `npm run compile:deck`
  - Vite `/content` 静态服务；`loadDeckScript`；Director「播放本场讲稿」
  - 文档：`docs/content-decks.md`、`content/README.md`
- **验证**：`npm run compile:deck` → 4 条 action；`npm run dev` → 汇报模式 → 播放本场讲稿
- **相关文件**：`compile-deck-script.ts`、`content/decks/demo/`、`loadDeckScript.ts`、`DirectorPanel.tsx`

### 2026-08-22 · Phase 1 Step 3：Present + PDF 汇报

- **做了什么**：
  - `PresentShell`（5 种布局）+ `PdfSlideViewer`（pdfjs-dist）+ `useSlideDeck`
  - `App.tsx`：`sessionMode === 'present'` 切换汇报壳层；Director `slide_action` → PDF 翻页
  - `useSettings`：`present` 默认与持久化；聊天页「汇报」入口
  - `public/decks/demo/`（`generate-demo-deck.mjs` 生成 4 页 PDF + `deck.json`）
  - 文档：`docs/present-deck.md`
- **未做 / 阻塞**：本机手动验收（汇报模式 + 播放队列翻页）
- **下一台机器应优先**：Step 2 知识库 `content/decks` + `script.jsonl` 入队
- **相关文件**：`PresentShell.tsx`、`useSlideDeck.ts`、`App.tsx`、`docs/present-deck.md`
- **验证方式**：`npm run dev` → 右上角「汇报」→ 见 demo PDF → Director「播放队列」应同步翻页

### 2026-08-22 · Phase 1 Step 1：Director 队列

- **做了什么**：
  - `packages/director`：`queue.ts`（校验入队、`runDirectorQueue`、`barge_in`/emergency 合并）+ 8 项单测
  - `useDirectorQueue` + Director 面板：播放队列 fixture、暂停/继续/跳过/停止
  - `sample-queue.json`（4 条 present + slide_action）；`slide_action` 暂 console（Step 3 接 PDF）
- **验证**：`npm run test -w @ssreporter/director` → 14 passed；`npm run dev` → 导演台「播放队列」
- **相关文件**：`packages/director/src/queue.ts`、`useDirectorQueue.ts`、`DirectorPanel.tsx`

- **设备/环境**：Win10 / conda ssreporter / `npm run dev`
- **验收项**：VRM 加载、Edge-TTS 中文发声、口型、Director 表情、非法 JSON 拒绝（见 `docs/phase0-acceptance.md`）
- **下一台机器应优先**：Director 队列 → 知识库 `content/` → Phase 1 PPT 双栏
- **验证方式**：Director 播放 `sample-action.json`，TTS 经 `/api/tts` 代理

### 2026-08-22 · 修复 TTS「Network error while fetching」

- **原因**：浏览器从 `localhost:5173` 跨域请求 `127.0.0.1:5050` 可能被拦截；localStorage 里空的 model/url 也会导致异常
- **做了什么**：
  - Vite 代理 `/api/tts` → `127.0.0.1:5050`（开发默认同源）
  - `resolveOpenAiCompatibleApiUrl` 自动把本地 5050 直连改写为代理
  - 加载设置时补全空的 model / speaker
- **验证**：重启 `npm run dev` → Director 试播；`GET /api/tts/health` 200
- **相关文件**：`vite.config.ts`、`voiceOptions.ts`、`useSettings.ts`

### 2026-08-22 · 修复 dev 启动：清端口 + Windows Python 检测

- **做了什么**：
  - `scripts/dev-stop.mjs`：`npm run dev` 前自动释放 5173/5174/5050（含 IPv6）
  - 修复 `start.mjs` Windows 误报「Python deps missing」（`shell: false`）
  - TTS 绑定前检测端口，冲突时提示 `npm run dev:stop`
- **验证**：`npm run dev` → Vite + `Uvicorn running on :5050`，无 10048
- **相关文件**：`scripts/dev-stop.mjs`、`apps/tts-gateway/scripts/start.mjs`、根 `package.json`

### 2026-08-22 · Phase A：本机 TTS 网关一键启动

- **做了什么**：
  - 新增 `apps/tts-gateway`（Edge-TTS + FastAPI，`127.0.0.1:5050`）
  - 根 `npm run dev` 并行启动页面与网关；`dev:web` / `setup:tts`
  - `environment.yml` 增加 Python 3.11 + pip 依赖；更新 AGENTS / README / 验收文档
- **验证**：`conda activate ssreporter` → `npm run setup:tts` → `npm run dev` → Director 试播
- **相关文件**：`apps/tts-gateway/`、根 `package.json`、`environment.yml`

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
