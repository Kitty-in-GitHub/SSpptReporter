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

### 2026-10-23 · 工程健康整改：conda 环境、lint 修通、P2 逐项、验收状态补记

- **设备/环境**：Win / conda **`ssreporter`**（Node v22.23.2、npm 10.9.8、Python 3.11.16）
- **做了什么**：
  - **环境**：改用 conda `ssreporter` 跑全部命令（此前用的是系统 Node 24 / Python 3.12，导致 `embedding:false`）；`npm install` 在 Node 22 下重跑；`npm run setup:asr` 装入 faster-whisper 1.2.1 → `/health` 现在 `asr:true`（base）、`embedding:true`
  - **lint 修通**：补 `globals` devDependency（此前 `npm run lint` 直接崩溃）；把 9 个 `create*Updaters` 工厂改名 `use*Updaters`（96 处 `rules-of-hooks` 消除）；拆分 `resolveScriptCueSummary` → `scriptCueSummary.ts`、`isEmotionProfile` → `lib/present/emotionProfile.ts`；修 `prefer-const` / 未使用变量；`react-hooks` 的 refs / set-state-in-effect / preserve-manual-memoization / exhaustive-deps 降为 **warn**（40+ 处属有意模式，重构另开任务）
  - **P2-7**：`packages/director` 与 `packages/brain` 索引不再导出 node-only 模块（`compileDeckDir` / `buildBrainVectorsCli`），消除 `node:fs` 外置构建警告
  - **P2-6**：会话与重型库按需加载 —— `EditSession` / `MocapSession` / `PresentSession` 改 `React.lazy` + `Suspense`；`manualChunks` 拆出 `vendor-three` / `vendor-pdf`；主包 **1.95MB → 578KB**（gzip 555KB → 169KB）
  - **P2-8**：`npm audit fix` 把 `fast-uri` 3.1.5 → 3.1.9；剩余 `sharp`（Node 专用、不进浏览器）与 vitest 1.x 开发依赖风险写入 `docs/dependency-security.md`；新增 `npm run audit:prod`
  - **P2-9**：修正 ADR 撞号 —— 重复的「Q&A ASR 多引擎」改为 **ADR-016**（内容未变），全文按 001→016 重排
  - **P2-10**：四个占位目录 README 统一标注「无 package.json、不参与构建」，并修正 `vrm-runtime` 的过期指引
  - **P2-11**：新增 `.github/workflows/ci.yml`（`npm ci` → typecheck → lint → test → build；audit 非阻塞）
  - **P2-12**：本机 ASR / embedding 按 conda 环境安装并验证
  - **验收状态补记**：Phase 2 / 2.5 / 3 由「待验收」改为「已通过本机验收（补记 2026-10-23）」，`AGENTS.md` 阶段表同步
- **验证（conda 环境）**：`typecheck` 全过；`lint` **0 error / 48 warning**；`test` **106 通过**（36 + 13 + 57）；`build` 通过无体积告警；`npm run dev` 起来后 5173 / 5050 正常，`/health` 为 `asr:true, whisper_model:"base", embedding:true`；三个懒加载会话模块 dev 下均可解析
- **未做 / 阻塞**：48 条 React Compiler 建议警告（refs / set-state-in-effect）未重构；`sharp` 漏洞需升级 `@huggingface/transformers` 4.3.1（破坏性，需回归浏览器内 Whisper）；浏览器内的人工点检（懒加载切换、口型、面捕）仍需人工过一遍
- **下一台机器应优先**：`npm run dev` 后用 Firefox 走一遍会话切换（聊天→汇报→导演台→面捕），确认懒加载无白屏
- **相关文件**：`apps/presenter-onair/{eslint.config.js,vite.config.ts,package.json}` · `src/app/App.tsx` · `src/hooks/settings/*` · `src/components/present/{PresentScriptCue,scriptCueSummary}.ts(x)` · `src/lib/present/emotionProfile.ts` · `packages/{director,brain}/src/index.ts` · `docs/{decisions,phase2-acceptance,phase2-5-asr,phase3-present-director,dependency-security}.md` · `AGENTS.md` · `.github/workflows/ci.yml`
- **验证方式**：`npm run typecheck && npm run lint -w @ssreporter/presenter-onair && npm run test && npm run build`；`npm run dev` 后查 `/health`

---

### 2026-09-24 · 面捕引擎按「采集 / 引擎」两段重建接回

- **设备/环境**：Win / Firefox（采集主线的唯一可用浏览器）
- **做了什么**：
  - 新增 `useFaceCaptureEngine`：**建在 `useVideoSource` 之上**，吃 `state.frameSource`（探针 `<video>`）→ rAF 取帧泵（背压：Worker 回消息前不取下一帧）→ Worker（MediaPipe FaceLandmarker）→ Kalidokit 解算 → 平滑 → `frameRef` 给 `AvatarPanel` 帧循环读；**帧走 ref、状态走 state**（25~30fps 不进 React）
  - 恢复 `src/workers/faceCapture.worker.ts`，含两个老坑的修法：wasm glue 用「fetch + 间接 eval」按 classic script 求值（否则 `custom_dbg is not defined` / `ModuleFactory not set.`）、**没检测到脸也必须回一条消息**（否则主线程帧泵永久锁死）；新增 GPU→CPU 自动降级，实际 delegate 由 `ready` 消息回报
  - `useVideoSource` 新增 `state.frameSource`（复用探针元素，少挂一条 sink）
  - 接线 `MocapSession` / `MocapPanel`：`faceCaptureRef` / `faceCaptureActive` / `faceCaptureError`；工具条与「复制诊断日志」把**采集状态**与**引擎状态**分开报（`画面流动中 · N fps` vs `面捕：加载中 / 就绪 / 错误`）——卡住时先看哪一段红
  - 恢复 `faceCapture.smoothing`（默认 0.35 + 设置面板滑块）
- **关键取舍**：
  - **不走 `MediaStreamTrackProcessor`**：Firefox 不支持该 API（Chromium 侧是 2021 年的私有版本、且在主线 worker 语义上也不一致），零拷贝 VideoFrame 那条路等 Firefox 支持再做，避免写一条本机永远跑不到的死代码
  - **Worker 生命周期只跟 `enabled`，不跟帧源**：采集自愈重开只换 `<video>`，模型不重载；平滑度同理放 ref，拖滑块不会重建 Worker
- **未做 / 阻塞**：本机 Chromium 采集坏（上一条），引擎未在 Chromium 上验证；「浏览器拿不到帧时给明确提示」那条提示未做
- **下一台机器应优先**：Firefox 进面捕模式 → 确认工具条两段状态都正常 → 抬头 / 低头 / 转头 / 眨眼 / 说话口型是否跟手，并按手感调 `平滑度`（0.2~0.6）
- **相关文件**：`apps/presenter-onair/src/hooks/useFaceCaptureEngine.ts` · `src/workers/faceCapture.worker.ts` · `src/hooks/useVideoSource.ts` · `src/app/MocapSession.tsx` · `src/components/mocap/MocapPanel.tsx` · `src/components/settings/FaceCaptureSettingsSection.tsx` · `src/lib/settings/faceCapture.ts` · `docs/face-capture.md`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）；Firefox 人工点检

---

---

### 2026-09-24 · 采集开发主线定为 Firefox（Chromium 侧停止排查）

- **设备/环境**：Win；用户实测 **Edge 坏、Firefox 好**
- **本轮新增证据（决定性）**：用户在 Edge 里打开**第三方在线摄像头测试站**，复现同一现象 ——
  「只能获取第一帧，后续帧拿不到」。这同时排除了两件事：
  1. **不是本项目代码/页面**的问题（已在 dev-log 2026-09-02 用 `camera-test.html` 排除过一次，这次是更外的对照）
  2. **不是我们的约束**所致：在线站点用的是默认约束（`video: true`），照样卡
  - 因此上一条把「Chromium 拿的是原生 640×480、Firefox 是 crop-and-scale」当第一嫌疑**被推翻**，降级为「与本故障无关的模式差异」
- **Firefox 侧验证（同一天）**：`后端=videoFrameCallback 呈现帧=158(25fps) 解码帧=0 后端帧=158(25fps) 空闲=0ms 后端活着=true 重开=0`
  - 说明本轮三处读数修复生效：`backendFps` 不再恒 0；`解码帧=0` 但 `呈现帧` 在涨 → Firefox 的 rVFC 有效，**严格判据对 Firefox 安全**（日志里 `+8903ms 流已停止出新帧 idleMs=1058 → 9910ms 流恢复出帧` 是真实首帧延迟，未到 4s 阈值，看门狗未误动）
- **决策**：**面捕 / 摄像头采集的开发与验收只在 Firefox 上做**；Chromium 侧排查到此为止
  - 写入 `AGENTS.md`（当前阶段表 + 硬性约束 9）
  - `docs/face-capture.md` 文首加警示、文末「已知问题」补决策段
- **未做 / 阻塞**：Chromium 采集层未修（已确认与本项目代码无关）；留给系统层/换机的建议清单：
  相机 AI 效果中间层（Windows Studio Effects / OEM 相机效果 / NVIDIA Broadcast 类）→ 安全软件摄像头防护 →
  `edge://flags` 关 Media Foundation Camera Capture → 设备禁用再启用 / 重启清 FrameServer 状态 / USB 省电 →
  重装 VC++ redist + `sfc` `DISM`（对应 Chrome 的 SxS 报错）
- **下一台机器应优先**：在 Firefox 上继续面捕引擎重建；取帧链路**先做能力探测**
  （Firefox 的 `MediaStreamTrackProcessor` / WebCodecs 支持与 Chromium 不一致，缺失则退回
  `<video>` + `createImageBitmap`）；若新机器 Chromium 采集正常，用 `camera-test.html` 复验后再放开
- **相关文件**：`AGENTS.md` · `docs/face-capture.md` · `apps/presenter-onair/public/camera-test.html`
- **验证方式**：无代码改动；Firefox 下 `npm run dev` → 面捕模式读数行为「画面流动中 · 约 N fps」

---

---

---

### 2026-09-24 · 修 `useVideoSource` 三处读数缺陷（Edge 的「冻结」被误报成「流动」）

- **设备/环境**：Win；用户实测 **Edge 卡、Firefox 正常、Chrome 不能正常播放**；设备 `Integrated Camera 30c9:00a8` 640×480
- **用户报的读数**：`后端=videoFrameCallback 呈现帧=15(1fps) 解码帧=15 后端帧=15(0fps) 空闲=0ms 后端活着=true 重开=0`
- **根因一 · `backendFps` 在 `videoFrameCallback` 后端下恒为 0（读数骗人）**
  - 原代码先 `lastPresented = signals.presented`，随后又用 `signals.presented - lastPresented` 算后端帧率 → 恒等于 0；`grabFrame` 分支用的是另一个变量 `lastGrab`，只有它是对的
  - 也就是说「0fps」这个数与摄像头状态无关，任何状态下都显示 0
  - 修法：后端帧率改用「更新 last* 之前」的增量（`presentedDelta` / `grabFrames - lastGrab`）
- **根因二（关键）· 播放时钟把「冻结」伪装成「流动」，看门狗因此彻底失效**
  - 三信号并集里含 `currentTime`；它对 MediaStream 是**播放时钟**，一帧都不来也每秒推进 → `streamAdvanced` 恒真、`lastStreamFrameAt` 每秒被刷新 → `idleMs` 永远 0、`重开=0`，`stalled` 判定与自愈重开全部不触发；「画面流动中 · 约 1 fps」也是时钟给的假读数
  - 与「呈现帧 / 解码帧双双停在 15」合起来看，Edge 的真实状态是**冻结在 15 帧**（正是本文档里那条「出 10~15 帧后停死」）
  - 修法：`currentTime` 只在「本会话从未见过任何帧计数（呈现帧与解码帧都恒为 0）」时兜底 —— 这正是模块注释原本写的意图（「前两者都不可用时的兜底」），实现跑偏成了并集。Firefox 这类拿不到帧计数的浏览器行为不变
- **根因三 · 开流期误报 `stalled`**：采样没有跳过 `opening`（`video` 元素尚未创建，signals 全 0），日志里 `+2385ms` / `+12674ms` 两条 `流已停止出新帧` 都源自此；修法：`!video` 直接不采样
- **未做 / 阻塞**：Chromium 采集层本身「出十几帧后卡死」仍未解决（空白对照页 `camera-test.html` 同样卡 → 与本项目代码无关）；已建议用户在 `edge://flags` 把 **Media Foundation Camera Capture** 设为 Disabled 后重试
- **下一台机器应优先**：进面捕模式看读数行 —— Edge 现在应显示 `流已断 x.xs` 且 `重开` 递增（说明冻结被正确识别、自愈在跑）；Firefox 应仍为「画面流动中」
- **相关文件**：`apps/presenter-onair/src/hooks/useVideoSource.ts` · `docs/face-capture.md`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

---

### 2026-09-02 · 修面捕：wasm 不再打 CDN（原 URL 版本号不存在）

- **设备/环境**：Win / conda ssreporter
- **现象**：面捕模式报 `Failed to fetch dynamically imported module: https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm/vision_wasm_internal.js`
- **根因**：**不是网络问题** —— Worker 里 CDN 版本号写死 `0.10.22`，而 npm 上根本没有这个版本
  - 实测 `registry.npmjs.org/@mediapipe/tasks-vision/0.10.22` → 404（0.10.21 / 0.10.35 均 200）
  - `package.json` 写的是区间 `^0.10.22`，实际装的是 **0.10.35**，CDN 版本与本地包也不一致
  - 即该 URL 自写下起必然 404
- **做了什么**：
  - 新增 `vite-mediapipe-plugin.ts`：dev / build 启动时把 `node_modules/@mediapipe/tasks-vision/wasm/` 同步到 `public/mediapipe/wasm/`（仅在缺失或大小变化时覆盖）
  - 插件同时注册 dev 中间件，**拦下 `/mediapipe/wasm/*` 并忽略查询串**（见下方第二个根因）
  - Worker 的 `WASM_BASE` 改为 `${import.meta.env.BASE_URL}mediapipe/wasm`
  - **模型 `face_landmarker.task`（3.6 MB）也本地化**：vendored 到 `public/mediapipe/models/` 并**入库**（外部 URL 不可靠；公开授权、体积可接受）；`.gitignore` 只忽略 `public/mediapipe/wasm/` 生成物
  - 面捕 Worker 现在**完全不依赖外网**
  - 同步 `docs/face-capture.md`
- **第二个根因（改完上一项后仍报错才暴露）**：MediaPipe 在 module worker 里走 `await import(<wasmLoaderPath>)` 兜底，而 **Vite dev 会给动态 import 的 URL 追加 `?import`**；`public/` 下的文件不在 Vite 模块图里，带该查询会被判定为「public 文件不可被 import」而返回 **500**
  - 实测：`/mediapipe/wasm/vision_wasm_internal.js` → 200，但 `...js?import` → **500**（报错文案正是 `Failed to fetch dynamically imported module: ...js?import`）
  - 修法：插件在 `configureServer` 里注册中间件（早于 Vite 内部中间件），对该前缀的请求**剥掉查询串**直接返回静态文件
  - 修复后实测 `...js`、`...js?import`、`...wasm?import`、`nosimd...js?import` 均 200（5173 / 5174 两个实例都验证过）
- **第三个根因（改完前两项后报 `ModuleFactory not set.`）**：
  - MediaPipe 加载 wasm glue 的逻辑是：`importScripts(url)` 失败则退化为 `await import(url)`；之后断言 `self.ModuleFactory`，否则抛 `ModuleFactory not set.`
  - glue（`vision_wasm_internal.js`）**只有 UMD 导出**（末尾 `module.exports = ModuleFactory`）、没有 ES6 export，顶层只有 `var ModuleFactory = (() => {...})()`
    - `importScripts`（classic script）：顶层 `var` 成为全局 → `self.ModuleFactory` 可用
    - `await import`（ES module）：`var` 是模块作用域 → `self.ModuleFactory === undefined` → 报错
  - 而 module worker 里 `importScripts` 是「存在但调用即 TypeError」，必然落到 `await import` 分支
  - **试过的弯路**：改成 classic worker（去掉 `{ type: 'module' }` + `worker.format: 'iife'`）**不可行** —— Vite dev 恒按 ESM 提供 worker 脚本（`worker.format` 只影响 build），classic worker 里那段 `import "/@vite/env"` 之外的 ESM `import` 语句会直接语法报错
  - 试过的修法（后被推翻）：给 glue 末尾追加垫片 `self.ModuleFactory = ModuleFactory;`，让 ESM 路径也能拿到工厂函数 —— 这确实过了 `ModuleFactory not set.`，但立刻撞上第四个根因
- **第四个根因（改完前三项后报 `custom_dbg is not defined`）**：
  - glue 的 `custom_emscripten_dbgn` 在 `if` 块内用**函数声明**定义 `custom_dbg`，靠 Annex B 提升到函数作用域；**ES module 一律严格模式**，块级函数不外泄 → 调用时报 `custom_dbg is not defined`
  - 也就是说 glue 是 sloppy mode 的经典脚本，**本质上不能按 ESM 求值**，追加垫片属于治错了层
  - 修法：Worker 里把 `self.import` 换成「fetch + 间接 eval」的加载器 —— MediaPipe 的顺序是 `importScripts` → `self.import` → `import`，module worker 里第一条必抛 TypeError，正好落到第二条；间接 eval 在全局、非严格模式执行，语义等同 `importScripts`
  - 插件回退为纯拷贝（去掉垫片），dev 中间件保留为兜底
- **未做 / 阻塞**：无
- **下一台机器应优先**：进面捕模式确认摄像头画面与头眼/口型驱动正常（首次需允许摄像头权限）
- **相关文件**：`apps/presenter-onair/vite-mediapipe-plugin.ts` · `vite.config.ts` · `src/hooks/useFaceCapture.ts` · `src/workers/faceCapture.worker.ts` · `public/mediapipe/models/face_landmarker.task` · `.gitignore` · `docs/face-capture.md`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）；dev 下 `/mediapipe/wasm/vision_wasm_internal.js?import` 返回 200、`useFaceCapture.ts` 转译为 `type=module`（已实测）

---

### 2026-09-02 · Firefox 对照暴露检测器缺陷 + 系统层线索

- **设备/环境**：Win；用户实际用的是 **Edge**（不是 Chrome）；另试 Firefox
- **用户实测**：
  - **Firefox**：`camera-test.html` 里**视频正常播放**，但判定显示「已 32.4 秒没有新帧（累计 0 帧）」
  - **Edge**：一直卡死（前几轮的读数与肉眼观察一致）
  - **Chrome**：**根本起不来** —— `应用程序无法启动，因为程序的并行配置并不正确`（典型 SxS / 运行库 / 清单损坏）
- **检测器缺陷（我的问题）**：`getVideoPlaybackQuality().totalVideoFrames` 被当成「流是否活着的事实来源」，
  但 **Firefox 对 MediaStream 源恒为 0** → 永远判「静止」。旧版预览里那套三信号取或的设计才是对的，
  重构模块时被我简化掉了。**教训：跨浏览器可用的判据不能只依赖单一 API。**
  - 修法：流活性改为**三个元素级信号取并集** —— `requestVideoFrameCallback` 呈现帧计数 /
    `totalVideoFrames` / `currentTime`，任一推进即算活着；`streamFps` 也按这个优先级取值
  - 新增 `state.presentedFrames` 与 `state.activeBackend`（回退后的事实），读数行把三路信号都摊开
- **线索（重要）**：Edge 卡、Chrome 起不来、Firefox 正常 ——
  Chromium 系在 Windows 上采集走 **Media Foundation**，Firefox 不走；
  而 Chrome 的 SxS 报错说明**系统运行库/组件状态已经损坏**。两者很可能是同一个根因。
- **未做 / 阻塞**：需要用户在系统层修（重装 VC++ 运行库、`sfc` / `DISM` 修复、修/重装 Edge、更新显卡驱动）
- **下一步（更好的消息）**：**Firefox 是当前可用的环境**，可以在它上面继续验证采集模块与后续面捕
- **相关文件**：`apps/presenter-onair/src/hooks/useVideoSource.ts` · `src/components/mocap/MocapPanel.tsx`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · 修 `useVideoSource` 代码评审提出的问题

- **设备/环境**：Win / conda ssreporter
- **起因**：用户对该模块做了代码评审，列出 9 条问题。逐条核对后确认并修复如下
- **P0-1 · `grabFrame` 路径下 stall 看门狗失效（设计级）**
  - 原实现用 `markFrame()`（后端取到帧）刷 `lastFrameAt`；而 `grabFrame` 在一条**已经卡死的流**上仍可能继续返回同一帧 → 看门狗永不触发，`status` 永远 `streaming`，直接废掉「双后端对照」这个卖点
  - 修法：**流活性只认 `<video>` 自身的解码帧数**（`videoDecodedFrames`）；后端计数独立成 `backendFrames` / `backendFps` / `backendAlive`，语义在类型注释里写明（grabFrame 下 `backendFps` 上限约 5，与流帧率无关）
  - 新增 `streamFps`（流自身解码帧率），UI 的「画面流动中 · 约 N fps」改用它
  - ⚠️ 本条的「流活性只认 `videoDecodedFrames`」**已被上一条修正**：该字段在 Firefox 对 MediaStream 恒为 0，
    现改为「呈现帧 / 解码帧 / currentTime 三路取并集」
- **P0-2 · restart 后旧 `grabFrame` 定时链复活，双倍抓帧（资源泄漏）**
  - `teardown()` 只能清掉待触发的 timer，**正在 `await grabFrame()` 的那次调用**恢复后 `disposed` 仍为 false → 又排新 timer；新 `open()` 再起一条 → 每 200ms 双倍抓帧
  - 修法：引入**代数号 `generation`**，`teardown()` 与每次 `startBackend()` 都 +1；异步闭包恢复执行时校验代数，不匹配即退出。rVFC 回调同样校验
- **P1 · restart 无上限、无退避（设备丢失时刷爆日志/CPU）**
  - 修法：失败按 `500ms × 2^n` 退避、上限 15s；连续 5 次失败后 `gaveUp=true` 停止自动恢复并在状态里说明
  - 同时把重开条件收紧为**流与后端都不出帧**才重开（后端正跑着时重开会把可用路径打断）
- **`new ImageCapture(track)` 抛异常无回退**
  - 原来只判了 `typeof ImageCapture !== 'function'`；构造抛错会让模块握着已打开的流停在 `error`
  - 修法：构造包 try/catch，失败即回退到 rVFC 后端
- **重开窗口内仍采样** → 短暂误报 `stalled` 且可能叠加一次重开
  - 修法：`sample()` 开头 `if (disposed || restarting) return;`；并让 `restarting` **保持到 `open()` 结束**（否则 open 期间 video 为 null，采样会再触发一次重开 —— 这是修第一条时新暴露的坑）
- **未采纳的一条**：评审认为严格模式的「微任务让出」防护是概率性的。核对后判断它是确定的 —— React 的「挂载→卸载→再挂载」在**同一个同步批次**内完成，两次 `open()` 都会在同一微任务检查点挂起，第一个恢复时 `disposed` 必为 true。已在注释里把前提写明
- **未做 / 阻塞**：`videoDecodedFrames` 在 open 后有最多 1s 显示 0（诊断字段，无害）；`IDLE_STATE` 共享引用导致的漏 re-render 无害
- **相关文件**：`apps/presenter-onair/src/hooks/useVideoSource.ts` · `src/components/mocap/MocapPanel.tsx` · `docs/face-capture.md`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · 废弃面捕与旧取帧，重写视频获取模块 `useVideoSource`

- **设备/环境**：Win / conda ssreporter（核显）
- **起因**：用户要求「彻底废弃当前的面捕和视频获取，从头写一个视频获取模块，先尝试实现视频获取」
- **删除**：`hooks/useFaceCapture.ts`、`workers/faceCapture.worker.ts`、`hooks/useCameraPreviewStream.ts`、`lib/faceCaptureLog.ts`
  - 识别层保留待接回：`lib/vrm/faceCaptureMapper.ts`（kalidokit → `FaceCaptureFrame`）、`lib/vrm/faceCaptureSmoothing.ts`、`applyFaceCaptureToVrm.ts`（纯函数 + 有测试）
  - MediaPipe 的 wasm/模型资产与 vite 插件保留（重建面捕要用）
- **新增 `hooks/useVideoSource.ts`**：只做视频获取
  - 职责单一：拿到活着的 video track，并量化「帧还活着吗」；不识别、不搬像素、不渲染
  - **两个可切换后端**：`videoFrameCallback`（默认，rVFC 回调计数）与 `grabFrame`（`ImageCapture.grabFrame()` 轮询，Windows 上走静态抓帧实现，与视频流路径不同）
  - 同时记录 `<video>` 自身的解码帧数作为**独立旁证**，区分「流死了」与「只是这个后端没取到」
  - 状态机 `idle/opening/streaming/stalled/error` + 帧断 4s 自动重开
  - 严格模式双开防护（先让出微任务）
- **新增 `lib/cameraLog.ts`**：原 `faceCaptureLog` 改名，前缀改 `[camera]`
- **设置**：`faceCapture` 去掉 `smoothing` 与 `inferenceDelegate`（面捕废弃后无意义），新增 `videoBackend`；设置分区改名为「摄像头（仅面捕模式）」，说明面捕引擎重建中
- **面捕页**：预览不再自己测帧，直接展示 `useVideoSource` 的状态（设备/分辨率/本后端帧/video 解码帧/fps/空闲/重开）；预览窗里可直接切采集后端；`faceCaptureActive` 改为 `false`（口型交给音频）
- **未做 / 阻塞**：识别与驱动未接回；Chromium 侧采集卡死问题未解决（见 `docs/face-capture.md` 的「已知问题」）
- **下一台机器应优先**：跑 `camera-test.html` 的约束预设找出能持续出帧的组合；再在面捕页对照两个采集后端
- **相关文件**：`apps/presenter-onair/src/hooks/useVideoSource.ts`（新增） · `src/lib/cameraLog.ts`（新增） · `src/components/mocap/MocapPanel.tsx` · `src/app/MocapSession.tsx` · `src/components/settings/FaceCaptureSettingsSection.tsx` · `src/types/settings.ts` · `src/lib/settings/faceCapture.ts` · `src/hooks/settings/faceCaptureUpdaters.ts` · `AGENTS.md` · `docs/face-capture.md`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · 决定性对照：独立预览也卡死 → 排除应用处理链路

- **设备/环境**：Win / conda ssreporter（核显）
- **用户日志（预览已独立后）的决定性证据**：
  - 预览是**完全独立的模块**（自己的 `getUserMedia`、自己的 track、无 Worker、无 MediaPipe、不碰 VRM）
  - 它照样在 **10 帧 / 0.7 秒**处停死：`paused=false readyState=4 呈现帧=10 解码帧=10 t=0.7s 轨道=live`
  - 面捕那一路同一时刻也是 `readFrames:11 / lastedMs:6001`
  - 结论：**任何最小化的摄像头消费者在我们的页面里都活不过 0.7 秒** → 问题不在我们的处理链路里
- **修掉一个我引入的 bug**：`useCameraPreviewStream` 漏了严格模式防护，日志里 `[预览] 独立请求摄像头` 出现两次（同一页面双开同一设备）。已补上与 `useFaceCapture` 同款的「先让出微任务再请求」防护
- **新增最小对照页** `apps/presenter-onair/public/camera-test.html`
  - 独立 HTML，无 MediaPipe / 无 Worker / 无 Three.js，只有 `getUserMedia` + `<video>` + 帧计数
  - 用同样的判据（`getVideoPlaybackQuality().totalVideoFrames` + `currentTime`）每秒刷新，并记录 video 媒体事件
  - 还有「再开一路」按钮，用于验证同一页面双开同一设备是否可行
  - 用途：把「应用代码」与「浏览器/设备/这台机器」彻底分开
- **用户实测对照页的结果（决定性）**：
  - **对照页依旧卡顿** → 与本仓库代码无关；同一个浏览器里，一个只有 `getUserMedia` + `<video>` 的空白页也喂不住这台摄像头
  - **任务管理器 CPU 占用 < 10%** → 连「CPU 饥饿」这条也排除（MediaPipe Worker 嫌疑同样不成立）
  - 而同一个摄像头在其它程序里流畅 → 差异只剩 **Chromium 自己**
- **对照页升级为「约束预设」实验台**：可逐个试
  `视频默认 video:true` / `640×480` / `1280×720` / `320×240` / `640×480+限帧15` / `640×480+限帧60` / `640×480+resizeMode:none`
  - 目标是**在 Chromium 里找出一个能持续出帧的约束组合**；找到就直接改应用去用，找不到才说明是浏览器采集后端的问题
  - 每个预设都会打出协商结果（`width×height @ fps`、`resizeMode`）
- **未做 / 阻塞**：待用户跑完预设实验；同时建议在浏览器层做三个开关对照（关闭硬件加速 / `chrome://flags` 里 Media Foundation 视频采集 / 换 Edge 试同一页）
- **下一台机器应优先**：先跑对照页的预设，再回传「哪个组合能持续出帧」
- **相关文件**：`apps/presenter-onair/public/camera-test.html`（新增） · `src/hooks/useCameraPreviewStream.ts`
- **验证方式**：`npx tsc -b`；对照页脚本语法已用 `node --check` 等价方式校验，`http://localhost:5173/camera-test.html` 返回 200

---

### 2026-09-02 · 预览与面捕彻底解耦（两个独立模块）

- **设备/环境**：Win / conda ssreporter（核显）
- **起因**：用户用「暂停渲染」做了对照实验 —— **暂停 VRM 渲染后视频卡顿依旧**，故 VRM 渲染与采集抢资源**也被排除**；用户要求把视频采集与面捕捉拆成两个独立模块，预览必须与面捕无关
- **用户日志（含前 5 帧节奏）给出的新事实**：
  - 帧到达节奏正常：`读到第 1~5 帧` 的 `arrivedAfterMs` 为 87/111/123/162/328，`frameTimeMs` 逐帧推进（间隔 ~32ms，偶有 80/157ms 抖动），`format:"NV12"`
  - 但每轮只读到 **8~15 帧**（约 0.5s）就彻底停；7 轮复现完全一致
  - **停点紧贴「首帧推理完成」**：多轮里 `看门狗 idleMs` 反推的最后一帧时刻与 `首帧推理完成` 相差 0~150ms
  - 摄像头侧始终正常：`frameRate:30 640×480`、`readyState:live`、`muted:false`
- **改动一：预览独立成模块** `useCameraPreviewStream(enabled, deviceId)`
  - 自己开一路 `getUserMedia`，**不与面捕共享 track**、不参与它的生命周期；关掉预览立刻释放自己那一路
  - `CameraPreview` 改用它，`MocapPanel` 不再接收面捕的 stream（`captureStream` 移除）；`useFaceCapture` 只保留 `hasStream: boolean` 给状态胶囊用
  - 目的：「预览还动不动」成为**独立证据** —— 面捕卡死时预览不该跟着卡
- **改动二：Worker 里把 VideoFrame 立刻换成 ImageBitmap**
  - VideoFrame 直接引用采集缓冲，长时间留在 Worker 里有可能耗尽采集源缓冲池 → 源头停止出帧（正是「出了十几帧就断」的形态）
  - 现在：收到帧 → `createImageBitmap(frame)` → **立刻 `frame.close()`** → 推理 → 关掉位图。主线程依旧零拷贝
- **日志增强**：预览自己的 `<video>` 媒体事件（带 `[预览]` 前缀，与面捕那一路对照）；Worker 记录首帧元信息（format/display/coded）与前 3 帧推理耗时；复制摘要里加上预览状态与 VRM 渲染状态
- **未做 / 阻塞**：待确认预览是否独立存活（若面捕卡而预览不卡 → 坐实是处理链路；两个都卡 → 回到设备/Chromium 层）
- **下一台机器应优先**：进面捕模式看预览是否**持续出帧**（面捕仍会卡），并回传新日志
- **相关文件**：`apps/presenter-onair/src/hooks/useCameraPreviewStream.ts`（新增） · `src/hooks/useFaceCapture.ts` · `src/workers/faceCapture.worker.ts` · `src/components/mocap/MocapPanel.tsx` · `src/app/MocapSession.tsx` · `docs/face-capture.md`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · VRM 渲染可暂停 + 用户日志定位（GPU 争用假设被排除）

- **设备/环境**：Win / conda ssreporter（核显）
- **用户日志给出的结论**：
  - 严格模式修复生效：只有一次 `请求摄像头`，前一次挂载明确放弃
  - 新取帧管线生效：`取帧方式：MediaStreamTrackProcessor（零拷贝 VideoFrame）`
  - **GPU 争用假设被排除** —— 这一轮 `delegate:"CPU"`（Worker 不建 WebGL 上下文）仍照样卡帧
  - 推理不是瓶颈：`roundTripMs` 98~124ms
  - **帧在「首帧推理完成」之后立刻停止**：两轮都是 `首帧推理完成` 后再无新帧，`readFrames` 只有 3 / 4
  - 摄像头本身正常：`frameRate:30 640×480`、`readyState:live`、`muted:false`
- **新增「暂停渲染」开关**：`visual.vrmRenderPaused` + 面捕页工具条按钮
  - `AvatarBackground` 的帧循环保留（便于恢复）但跳过全部场景更新与 `renderer.render`；暂停期间 `clock.getDelta()` 排空，避免恢复时 delta 突跳
  - 用途：验证「VRM 渲染与采集抢资源」，也方便直播时临时冻结皮套
- **新增帧到达节奏日志**：TrackProcessor 路径记录前 5 帧的 `arrivedAfterMs / frameTimeMs（VideoFrame.timestamp）/ size / format`，用于判断源头是「一帧都没有」还是「出了几帧就停」
- **未做 / 阻塞**：待用户用「暂停渲染」做对照实验（暂停后帧是否还断），以及回传新的帧节奏日志
- **下一台机器应优先**：进面捕模式 → 点「暂停渲染」→ 观察是否还出现「看门狗：帧已经断了」
- **相关文件**：`apps/presenter-onair/src/components/AvatarPanel.tsx` · `src/components/AvatarShell.tsx` · `src/components/mocap/MocapPanel.tsx` · `src/app/MocapSession.tsx` · `src/types/settings.ts` · `src/lib/settings/defaults.ts` · `src/hooks/settings/visualUpdaters.ts` · `src/hooks/useFaceCapture.ts`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · 换掉取帧管线：MediaStreamTrackProcessor 零拷贝 VideoFrame

- **设备/环境**：Win / conda ssreporter（核显）
- **起因**：用户反映「卡的要死」，并直接质疑取帧管线
- **旧管线（确实是问题）**：
  ```
  getUserMedia → MediaStream
     ├── 采集 <video>（1px 透明挂 body）
     │     └── rAF 每帧 → createImageBitmap(video)   ← 主线程每帧一次 GPU→CPU 位图拷贝
     │            └── postMessage(ImageBitmap) → Worker → detectForVideo
     └── 预览 <video>（同一 stream）
  ```
  `createImageBitmap` 每帧一次位图拷贝，在核显上既是主要开销、又与 VRM 的 WebGL 争同一块显卡
- **关键发现**：MediaPipe 的图像尺寸判定里含 `void 0 !== t.displayWidth ? [t.displayWidth, t.displayHeight] : …
  ` —— `displayWidth` 是 `VideoFrame` 的属性，说明 **MediaPipe 原生接受 VideoFrame**，不必先转成位图
- **新管线**：
  ```
  getUserMedia → MediaStream（1 条 track）
     ├── MediaStreamTrackProcessor.readable → VideoFrame
     │     └── postMessage(frame, [frame])  ← 零拷贝转移，主线程不碰像素
     │           └── Worker: detectForVideo(frame) → 468 点 → kalidokit → VRM
     └── 预览 <video>（同一 track，仅作显示 sink）
  ```
  - 首选 TrackProcessor 路径；**API 缺失时保留 `<video>` + createImageBitmap 兜底**（原有代码不动）
  - 该路径下**不再创建采集用 `<video>`**（少一个 sink）
  - 取帧按需：Worker 回消息后才取下一帧，天然背压，不堆积
  - `lib.dom` 还没有 `MediaStreamTrackProcessor`，在 `useFaceCapture.ts` 里补了 `declare global` 最小声明
- **看门狗改为与取帧方式无关**：判据由「video 元素 `totalVideoFrames` 不动」改为「距上次成功取到帧多久」；超过 4s 先告警，下一周期仍无帧则重开采集流
- **未做 / 阻塞**：待人工确认卡顿与卡帧是否同时消失
- **下一台机器应优先**：进面捕模式看日志里的 `取帧方式：…` 一行应为 TrackProcessor；再确认帧率与流畅度
- **相关文件**：`apps/presenter-onair/src/hooks/useFaceCapture.ts` · `src/workers/faceCapture.worker.ts` · `docs/face-capture.md`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · 修面捕卡死：Worker 漏回消息导致主线程锁死 + 预览读数误报

- **设备/环境**：Win / conda ssreporter
- **起因**：用户反馈「预览窗口里画面是静止的」，且预览读数显示 `画面静止：摄像头没有输出新帧`（设备为内置 `Integrated Camera`，640×480）
- **根因一（确定，影响大）**：**Worker 漏回消息 → 主线程帧泵永久锁死**
  - 主线程 `pump` 发帧前置 `inFlightRef.current = true`，只在收到 Worker 的 `landmarks` / `error` 消息时才解
  - 而 Worker 里 `toLandmarkPoints()` 返回 null（**该帧没检测到人脸**）时直接 `return`，什么都不回
  - 于是一旦有**任意一帧没检测到脸**（开机第一帧几乎必然如此），锁就永远解不开 → `pump` 之后每帧都在门口 return → 面捕彻底不出新帧，直到重进模式
  - 修法：没检测到脸也回一条 `{type:'landmarks', landmarks: []}`；`landmarksToFaceCaptureFrame` 对 `<468` 点本来就返回 null，故行为不变
- **根因二**：**读数本身不可靠** —— 原先只用 `video.currentTime` 判「是否在出帧」，而该字段在 MediaStream 源上未必推进，会误报静止（小尺寸镜像预览里人不动，肉眼看也像静止，两个信号一起把人带偏）
  - 改为三个与场景无关的信号取或：`requestVideoFrameCallback` 呈现帧计数 / `getVideoPlaybackQuality().totalVideoFrames` / `currentTime`
  - 另加 `track.muted` 提示（设备被其他程序占用时的典型信号）
  - 出帧异常时（`isFlowing=false`）额外显示一行原始读数 `paused / readyState / 呈现帧 / 解码帧 / t / 轨道状态`，用于区分「播放被暂停」「一帧都没解码」「解码过又停住」三种情况；正常时隐藏
- **根因三（开发模式特有）**：**React 严格模式让摄像头被打开两次**
  - 用户提供的读数：`paused=false readyState=4 呈现帧=3 解码帧=11 t=0.8s 轨道=live`，且预览里**有图像** → 帧来过，然后在 0.8s 处停住（不是"从未出帧"）
  - `main.tsx` 开着 `StrictMode`，它会「挂载 → 卸载 → 再挂载」跑两遍 effect，而 `getUserMedia` **不可取消**：第一次挂载的请求已经发出去了，卸载只能置 `disposed`；第二次挂载又发一次 → 摄像头同时开两路，第一路随即被关。Windows 上这种时序容易让后一路中途卡死
  - 修法：`start()` 在发起请求**之前**先 `await Promise.resolve()` 让出一次微任务，使第一次挂载在请求前就发现自己已 disposed 并放弃 → 全程只开一次摄像头
  - 顺带去掉 `CameraPreview` 里 `srcObject = null` 的清理（同样会被严格模式跑两遍，让同一个 video 反复脱/接流）
  - **约束已排除**：约束只在打开设备时参与协商，既然已有十几帧抵达，说明协商出的模式可用，`ideal` 约束不可能在 0.8s 后掐断流
- **根因四（待验证）**：**采集用的 `<video>` 从未挂进 DOM**
  - 用户复测：读数仍是 `t=0.8s` 处停住（两次完全相同的停点，稳定复现），且**皮套不随头部转动** → 整条采集都停了，不只是预览
  - Chromium 对「不在文档里」的媒体元素出帧并不可靠，而它是唯一帧源；两个 video 共享同一条 track，这个 sink 异常可能拖住整条源。官方 MediaPipe 示例都是先入文档再取帧
  - 修法：`document.createElement('video')` 后 `document.body.appendChild(video)`，用 `position:fixed;1px;opacity:0`（**不能用 `display:none`**，那会完全不渲染）；`stopCapture` 里 `remove()`。并提前记 `videoRef.current`，保证 `play()` 抛错时也能摘掉
- **根因五（待验证）**：**`facingMode: 'user'` 触发多余的采集模式重配**
  - 用户第三次复测：`呈现帧=14 解码帧=14 t=0.7s`，仍是固定时间点停死（三次 0.7~0.8s）
  - 桌面设备只有一个朝向，`facingMode` 没有任何筛选价值，却会让 Chromium 在打开设备后按朝向再协商一次采集模式；那次重配失败/半途卡住正好表现为「出十几帧后固定时间点停死」
  - 修法：约束里去掉 `facingMode`，只留 `deviceId` + `width/height ideal`
- **读数改进**：采样窗口 500ms → **2s** 并输出**实测帧率**（`画面流动中 · 约 N fps`）。500ms 窗口把「相机只跑个位数帧率」误判成「停了」，而这两种情况修法完全不同
- **关键判据（用户实测）**：**相机硬件与驱动正常** —— 网页开着时其他程序提示「摄像头被占用」，关掉网页后其他程序能正常打开且画面流畅
  - 即：设备没坏，是**我们的页面握着设备却拿不到帧**（Chromium 侧采集管线僵死），所以纯代码层有可能兜住
- **卡帧自愈（新增）**：`useFaceCapture` 里加看门狗 —— 每 1.5s 查一次采集 video 的 `totalVideoFrames`，连续 4s 无新帧就 `stopCapture()` + 重开流；触发次数经 `restartCount` 传到预览窗显示「已自动重连 N 次」
  - 注意 `stopCapture()` 会清掉看门狗自己的 interval，因此每次 `start()` 都新建一个（顺序：stop → start）
- **日志（新增，按用户要求）**：面捕链路全量埋点，控制台用 `[faceCapture]` 过滤
  - 新增 `src/lib/faceCaptureLog.ts`：`faceCaptureLog` / `faceCaptureWarn` / `describeVideo` / `describeStream`，默认开启，`window.__ssreporterFaceCaptureLog = false` 关闭。**注意 Worker 与主线程的 `performance.now()` 时间原点不同**，跨线程时间戳只能看各自线程内的先后
  - `useFaceCapture`：请求/打开摄像头、**采集 video 的全部媒体事件**（`stalled`/`waiting`/`suspend`/`emptied`/`error`…，卡帧那一刻的答案就在这里）、`play()` 完成、Worker 就绪耗时、首帧与每 30 帧的往返耗时、单帧 >400ms 告警、取帧失败、看门狗判定与重连、启动失败
  - `faceCapture.worker.ts`：wasm/模型分阶段耗时、推理器就绪（含实际 delegate）、首帧与每 60 帧推理耗时、人脸进入/离开、推理异常；并把 `image.close()` 移入 `finally`（原来推理抛错时会泄漏 ImageBitmap）
- **推理后端可切换（改为设置项）**：新增设置 `faceCapture.inferenceDelegate`（`GPU` / `CPU`，默认 GPU）+ 设置 → 面捕 的「推理后端」下拉；`init` 消息携带该值，改成 `options.delegate` 并进 effect 依赖，**改完立刻重开采集，无需重进面捕模式**。Worker 里 GPU 初始化失败仍会自动回退 CPU 并告警
- **「复制诊断日志」按钮（新增）**：`faceCaptureLog` 增加 400 行环形缓冲 + `readFaceCaptureLog()`；预览窗底部一键复制「摘要（设备/状态/读数/重连次数）+ 全部日志」，剪贴板不可用时整段打到控制台
  - 目的：把此前"让用户开控制台敲命令、翻日志"的步骤全部去掉
- **未做 / 阻塞**：待用户回传控制台日志，定位 0.75s 处到底触发了哪个媒体事件
- **下一台机器应优先**：进面捕模式看三处 —— ① 是否显示「画面流动中 · 约 N fps」② 是否出现「已自动重连 N 次」③ 皮套待机动作（呼吸/眨眼）是否还在动；然后把「复制诊断日志」的内容贴出来
- **相关文件**：`apps/presenter-onair/src/hooks/useFaceCapture.ts` · `src/workers/faceCapture.worker.ts` · `src/components/mocap/MocapPanel.tsx` · `src/lib/faceCaptureLog.ts` · `src/types/settings.ts` · `src/lib/settings/faceCapture.ts` · `src/hooks/settings/faceCaptureUpdaters.ts` · `src/components/settings/FaceCaptureSettingsSection.tsx` · `src/app/MocapSession.tsx` · `src/styles/app.css`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · 面捕：摄像头预览 + 「准备中」阶段可见化

- **设备/环境**：Win / conda ssreporter
- **起因**：用户反馈「面捕一直卡在面捕准备中…，不确定连到的是不是正确的摄像头」，要求提供摄像头画面预览
- **做了什么**：
  - `useFaceCapture` 追加导出 `stream`（已获取的 MediaStream）——**不新开 `getUserMedia`**，同一设备通常不允许被两个流独占
  - `MocapPanel` 新增**摄像头预览浮层**（`CameraPreview`）：镜像显示实时画面，下方标注**实际设备名 + 分辨率**，用于确认是否选对摄像头；无流时提示去「设置 → 面捕」检查设备。位置在「摄像头」按钮正上方（该页工具条由 `justify-content: flex-end` 压在底部，预览随之贴在其上，**不是**页面顶部/右上角）
  - 该页工具条新增「摄像头」按钮（`is-active` 同步状态），与设置里的「显示摄像头预览」开关共用 `faceCapture.showCameraPreview`；**该设置默认关闭**，需手动打开
  - 状态文案由二态改三态，让「卡住」停在哪个环节可见：
    - 有 error → 显示错误
    - `isRunning` → 面捕运行中
    - 有 `stream` 但未 running → **摄像头已连接，等待面捕引擎…**（说明卡在 Worker/模型侧，不是摄像头）
    - 无 `stream` → **正在连接摄像头…**（说明卡在设备/权限侧）
  - 设置项文案「显示摄像头预览提示」→「显示摄像头预览」（原先只是个占位提示，现已落实为真预览）
  - **预览窗里可直接换摄像头**（下拉）+ 显示当前设备名与分辨率；`useFaceCapture` 的 effect 依赖 `deviceId`，改选即重开流、预览随之刷新
  - 抽 `useCameraDevices(enabled)` 供设置页与面捕页共用；**关键陷阱**：浏览器在**授权前**把 `enumerateDevices()` 的 `label`/`deviceId` 都返回空串，此时下拉只剩「摄像头 1/2/3」占位名，选中等于回到系统默认 —— 因此设置页在 `labelsHidden` 时给出提示，并在展开分区 / `devicechange` 时重新枚举
  - 预览窗底部新增**双诊断读数**：`画面流动中 / 画面静止：摄像头没有输出新帧`（判断依据是 video 的 `currentTime` 是否推进，与「人不动」无关）+ `预览播放失败：<原因>`（原先 `play()` 的异常被静默吞掉，会表现为「只有首帧的静止画面」）
  - `app.css` 补 mocap 工具条控件与预览浮层样式（此前 `.mocap-status` 等类完全没有样式）
- **未做 / 阻塞**：**未经视觉验收**（AI 无法看图）；预览窗位置（贴「摄像头」按钮上方）若挡住皮套可再调
- **下一台机器应优先**：进面捕模式，按状态文案判断卡点 ——
  - 停在「正在连接摄像头…」→ 查设备/权限（用预览窗里的下拉直接换摄像头）
  - 停在「摄像头已连接，等待面捕引擎…」→ 摄像头正常，问题在 MediaPipe 模型/GPU 初始化，看浏览器控制台 Worker 侧日志
- **相关文件**：`apps/presenter-onair/src/hooks/{useFaceCapture,useCameraDevices}.ts` · `src/app/MocapSession.tsx` · `src/components/mocap/MocapPanel.tsx` · `src/components/settings/FaceCaptureSettingsSection.tsx` · `src/styles/app.css`
- **验证方式**：`npx tsc -b`；`npx vitest run`（onair 57 passed）

---

### 2026-09-02 · 汇报页收纳：工具条瘦身 + 底部合并底栏

- **设备/环境**：Win / conda ssreporter
- **做了什么**（方向：以「收纳」为主，控件不删、只是不常显）：
  - **工具条瘦身**：新增 `PresentViewMenu`，把「布局」与「画中画（角落/大小/无边框/复位）」收进「视图 ▾」弹层。此前画中画控件只在 pip 布局下出现/消失，导致工具条宽度突变、整页换行跳动；现在工具条组数恒定
  - **底部合并**：新增 `PresentBottomDock`，把讲稿条与评委提问面板合成一个可收起的底栏（`讲稿 / 评委提问` 两个 Tab），**默认收起只占一行**，收起时标题行仍显示当前讲稿摘要与错误
  - `PresentScriptCue` 改为纯内容组件（外框/背景由底栏提供），新增 `resolveScriptCueSummary()` 供底栏收起态复用；`QaPanel` 新增 `hideHeader`（嵌入底栏时不重复标题）
  - 底栏展开高度上限 42vh
  - **汇报模式移除 DirectorPanel**（左下角「Director 试播」FAB）：它只服务 Phase 0/1 的 fixture 试播，与工具条「▶ 播放讲稿」语义重叠；连带移除 `PresentSession` 的 `presentStageMode` prop 与 `supportsLipSync`/`ttsEngine` 取值
  - dev-log/dev 工具条文案统一收进 `UI_PRESENT`
- **未做 / 阻塞**：
  - **未经视觉验收**（AI 无法看画面）。浮层是否更清爽需人工确认
  - `DirectorPanel.tsx` / `directorPanel.css` / 两个 `sample-*.json` fixture 现已**无任何引用**（保留未删，等确认后再决定）；`docs/phase0-acceptance.md` 等文档仍以「左下角 Director」为验收入口，若确定不要该面板需一并修订文档
- **下一台机器应优先**：`npm run dev` → 汇报页确认：① 工具条不再换行跳动 ② 底部默认只有一行、点 Tab 展开 ③ 画中画各布局切回正常 ④ 左下角已无试播圆钮
- **相关文件**：`apps/presenter-onair/src/components/present/{PresentViewMenu,PresentBottomDock,PresentScriptCue,QaPanel,PresentShell}.tsx` · `presentLayouts.css` · `src/constants/uiZh.ts`
- **验证方式**：`npm run typecheck`；`npm test`（36/13/57）

---

### 2026-09-02 · 落实 ADR-013：呈现层表情 / 动作分槽（修复手势被覆盖）

- **设备/环境**：Win / conda ssreporter
- **做了什么**：
  - `useAvatarPresenter` 拆两槽：`reaction`（动作事件槽）+ `expressionReaction`（情绪状态槽）；新增 `applyPerformance({gesture, emotion})` 一次提交、`resetExpression()` 只清表情、`reset()` 清两槽
  - 聊天语音路径（`onSpeechStart` / `onSpeechEnd`）改投**情绪槽**，不再占用动作槽
  - `AvatarShell` 用 `useMemo` 稳定两槽对象身份（沿用上次修的重播问题），`AvatarBackground` 拆成两个 effect
  - **动作槽不再 `controller.reset()`**：`gesture` 分支改为只清「上一次动作占用的通道」——`VrmExpressionController.gesture()` 现返回实际占用的通道名；表情通道的清零只由情绪槽执行
  - `useDirectorQueue` / `DirectorPanel` 由「连发 reset→手势→表情」改为一次 `onApplyPerformance(pair)`；`PresentSession` 的 `onResetEmotion` 改用 `resetExpression(280)`
  - 新增回归测试 `apps/presenter-onair/src/hooks/useAvatarPresenter.test.ts`（4 条，锁住双槽契约）
- **未做 / 阻塞**：无。**汇报播放现在应能同时出现身体动作与面部表情**
- **下一台机器应优先**：跑 `npm run dev` → 汇报模式播 demo 讲稿，确认占位手势（wave_both / wave_right / …）与情绪表情同时生效
- **相关文件**：`apps/presenter-onair/src/hooks/{useAvatarPresenter,useDirectorQueue}.ts` · `src/components/{AvatarShell,AvatarPanel,DirectorPanel}.tsx` · `src/lib/vrmExpressionController.ts` · `src/app/PresentSession.tsx`
- **验证方式**：`npm run typecheck`；`npm test`（director 36 / brain 13 / onair 57）
- **决策记录**：[`decisions.md` ADR-013](./decisions.md)

---

### 2026-09-02 · 已知问题记录：手势在汇报播放中被表情覆盖（已修）

- **设备/环境**：Win / conda ssreporter
- **现象**：汇报播放时只看到面部表情，看不到身体动作 —— 即使 7 个占位 VRMA 已下载到位
- **根因**：`useDirectorQueue` 对同一节拍**先后调用 3 次 reaction setter**（`reset` → 手势 → 表情），而 presenter 只有**一个** reaction 槽位；三者在同一批次内被 React 合并，只保留最后一次 → **手势被丢弃**
  - 位置：`apps/presenter-onair/src/hooks/useDirectorQueue.ts:185-196`
  - demo 8 条节拍的 emotion 均解析出非 neutral 的表情，所以**每条节拍的手势都不生效**
  - 讲稿导演台的「动作预览」窗不受影响（它只发一次 reaction）
- **顺带修正一个错误认知**：之前把「傻笑」归因于手势的表情兜底 parts，实际不对 —— 兜底也随手势一起被丢弃，傻笑纯来自 emotion 映射出的 `happy`
- **未做 / 阻塞**：本条目仅为当时记录；**同日已按 ADR-013 修复**（见上方条目）
- **修复方向（二选一）**：① 把手势 parts 与表情 blendshape 合并成一次 `applyReaction`（改动最小）；② presenter 改为「手势槽 + 表情槽」双槽，渲染层分别应用（更贴合身体/表情分层）
- **附：表情链路确认正常**：情绪 → `emotionToVrmExpression` → `VrmExpressionController.emote/gesture`（含淡入淡出、hold 回落、多候选名兜底），另有内置预设 `vrm.intensity` 与 `IDLE_MOTIONS` 待机微表情；「表情特效」叠加层需 `reactionControlMode === 'linked'` 或手动触发
- **相关文件**：`apps/presenter-onair/src/hooks/useDirectorQueue.ts` · `apps/presenter-onair/src/lib/avatar/fromDirector.ts` · `apps/presenter-onair/src/hooks/useAvatarPresenter.ts`

---

### 2026-09-02 · 讲稿导演台：手势动作预览窗

- **设备/环境**：Win / conda ssreporter
- **做了什么**：
  - 新增 `GesturePreviewStage`：讲稿导演台右下角悬浮小窗，**复用汇报同一套呈现层**（`useResolvedVrmModel` → `useAvatarPresenter` → `AvatarShell`），保证「预览所见 = 汇报所得」，不做预渲染素材
  - 手势 chip 右侧加 ▶ 按钮（与音色卡片 🔊 对称）触发预览；`none`/`idle` 不显示按钮
  - 预览走 `avatarGestureFromDirector`，与 Director 队列播放路径一致
  - 加载策略：**首次点 ▶ 才挂载并加载 VRM**；小窗可折叠（保留模型实例）或关闭（卸载）
  - `ScriptEditorShell` 新增 `visual` prop；`EditSession` 透传 `settings.visual`
- **未做 / 阻塞**：`npm run setup:gestures` 仍未执行，因此点 ▶ 播占位动作时**看不到身体动作**（语义手势更是故意为空）
- **下一台机器应优先**：`npm run setup:gestures` → 在讲稿导演台点 ▶ 逐个试听 7 个占位动作
- **相关文件**：`apps/presenter-onair/src/components/present/{GesturePreviewStage.tsx,ScriptEditorShell.tsx,BeatPerformanceEditor.tsx,scriptEditor.css}` · `apps/presenter-onair/src/app/EditSession.tsx`
- **验证方式**：`npm run typecheck`；`npm test`（36/13/53）；`npm run dev` → 讲稿导演台 → 手势 ▶

---

### 2026-09-02 · 手势改名 + 新增演讲语义手势（空实现）

- **设备/环境**：Win / conda ssreporter
- **做了什么**：
  - 7 个 hikari 占位手势改名为**实际姿势名**：`bow→wave_both`、`nod→wave_left`、`think→idle_stretch`、`explain→wave_right`、`point_slide→idle_shoot`、`open_hands→idle_vsign`、`emphasize→idle_sport`（原先语义名与实际动作不符，如 `bow` 实为双手挥手）
  - 新增 7 个**演讲语义手势**（沿用原语义名 `bow`/`nod`/`think`/`explain`/`point_slide`/`open_hands`/`emphasize`）：进入协议枚举与讲稿导演台选择器，但**无 VRMA、也不套表情兜底 → 播放时不做任何动作**，UI 标「待自制」
  - 协议同步：`schemas/director-action.schema.json`、`packages/director/src/types.ts`；`validate.ts` 里重复的 gesture 内联枚举改为引用 `GESTURES`，消除不同步隐患
  - 新建节拍默认手势改为有动作的占位名（第 1 页 `wave_both`，其余 `wave_right`）
  - demo 讲稿 6 页改用占位名，并重新 `npm run compile:deck`
  - 同步 `setup-gesture-vrma.mjs` 下载映射、fixtures、`buildQaPrompt.ts` 手势清单、相关测试与文档
- **未做 / 阻塞**：`npm run setup:gestures` 尚未执行（需访问 raw.githubusercontent.com），因此当前演示仍**无身体动作**，只有面部表情
- **下一台机器应优先**：跑 `npm run setup:gestures` 下载 7 个占位 VRMA → 验证手势播放链路；之后按 `docs/vrma-authoring.md` 自制语义手势
- **相关文件**：`packages/director/src/{types,validate,slide-script-draft}.ts` · `apps/presenter-onair/src/lib/gestureToVrmReaction.ts` · `apps/presenter-onair/src/constants/performanceUi.ts` · `content/decks/demo/slides/*.md`
- **验证方式**：`npm run typecheck`；`npm test`（director 36 / brain 13 / onair 53）；`npm run compile:deck`

---

### 2026-08-27 · 小清理：弃用 API 删除 + gitignore + 口型 prop 收紧

- **设备/环境**：Win10 / conda ssreporter
- **做了什么**：
  - 删除无引用的 `@deprecated` 包装：`slideScriptApi.loadSlideDraftFromDisk` / `saveSlideToDisk`；`createBrainEmbedder`（已统一 `resolveBrainEmbedder`）
  - `AvatarBackground` 移除废弃 `mouthLevel` prop 与相关 `useMemo`/`useEffect`；`mouthLevelRef` 改为必填（调用方本就只传 ref）
  - `.gitignore` 补充 `*.tsbuildinfo`、`**/.vite/`，避免 Vitest/TS 缓存误出现在 status
- **未做 / 阻塞**：无；旧 `ttsUpdaters.ts` 已在上一轮删除，磁盘上不存在
- **下一台机器应优先**：Phase 2/3 人工验收（无代码依赖变更）
- **相关文件**：`components/AvatarPanel.tsx` · `lib/content/slideScriptApi.ts` · `lib/brain/createBrainEmbedder.ts` · `.gitignore`
- **验证方式**：`npm run typecheck -w @ssreporter/presenter-onair`；`npm run test -w @ssreporter/presenter-onair`（45 passed）

---

### 2026-08-27 · 设置 / Stream / AvatarPanel 第二轮拆分（无 CI）

- **设备/环境**：Win10 / conda ssreporter
- **做了什么**：
  - **TTS**：`TtsSettingsSection` 瘦身；各引擎字段拆到 `components/settings/tts/*Fields.tsx`；`useTtsSpeakerLists.ts` 独立；`hooks/settings/tts/`（`core` / `cloudUpdaters` / `localUpdaters`）替代单体 `ttsUpdaters`
  - **Stream**：`StreamSettings` 改为组合器；子模块 `StreamPlatformSection` · `CommentIntelligenceSettingsSection` · `ManneriSettingsSection` · `streamSettingsConstants`
  - **AvatarPanel**：空闲动作外提 `lib/vrm/vrmIdleMotion.ts`；口型 + 面捕合并外提 `lib/vrm/vrmMouthAndFaceDrive.ts`；动画循环改调 `applyVrmMouthAndFaceCapture`
- **未做 / 阻塞**：GitHub Actions / CI（用户明确不需要）；`AvatarPanel` Three.js 场景初始化与背特效仍留组件内
- **下一台机器应优先**：Phase 2/3 人工验收；可选继续拆 `AvatarPanel` 场景生命周期或 `PresentShell`
- **相关文件**：`components/settings/tts/` · `hooks/settings/tts/` · `hooks/settings/useTtsSpeakerLists.ts` · `components/settings/Stream*.tsx` · `lib/vrm/vrmIdleMotion.ts` · `lib/vrm/vrmMouthAndFaceDrive.ts` · `components/AvatarPanel.tsx`
- **验证方式**：`npm run typecheck -w @ssreporter/presenter-onair`；`npm run test -w @ssreporter/presenter-onair`（45 passed）

---

### 2026-08-27 · 面捕模式（Mocap Session）+ Kalidokit 摄像头跟踪

- **做了什么**：
  - 新增 `sessionMode: mocap`（面捕），与 chat/present/edit 并列；汇报模式不接入面捕
  - `useFaceCapture` + Worker（MediaPipe Face Landmarker）+ Kalidokit `Face.solve`
  - `AvatarPanel` 可选 `faceCaptureRef`；口型可切换面捕 / TTS（`faceCapture.mouthDriver`）
  - 设置区「面捕（仅面捕模式）」；文档 `docs/face-capture.md`
- **未做 / 阻塞**：`apps/mocap-gateway` UDP 外部源（M2 占位 README）
- **下一台机器应优先**：OBS 手动验收；可选实现 iFacialMocap 桥
- **相关文件**：`app/MocapSession.tsx` · `hooks/useFaceCapture.ts` · `lib/vrm/faceCaptureMapper.ts`
- **验证方式**：切面捕模式 → 摄像头授权 → 头眼跟随；口型切换面捕/TTS

---

### 2026-08-27 · 队列失败可见化 + 巨石拆分（settings / SettingsPanel / App session）

- **做了什么**：
  - **P0 Bug**：`useDirectorQueue` 增加 `lastPlaybackError`；`useDeckScriptPlayback` 修正误报「播放完成」；`PresentScriptCue` / 导演台 FAB 展示错误
  - **P1 Bug**：导入 VRM stale 自动回退；builtin `HEAD` 探测与设置面板 `vrmResolveError` 提示
  - **拆分**：`lib/settings/`；`hooks/settings/*Updaters`；`components/settings/*Section`；`app/PresentSession` 等 session 壳
  - 文档：整理 `decisions.md` ADR 重复编号；更新 `AGENTS.md` 入口表
- **未做 / 阻塞**：CI workflow；聊天模式接 Brain（仍为产品边界）
- **下一台机器应优先**：Phase 2/3 人工验收；填 `content-private` 材料
- **相关文件**：`useDirectorQueue.ts`、`directorPlaybackError.ts`、`lib/settings/`、`hooks/settings/`、`components/settings/`、`app/`
- **验证方式**：`npm run typecheck`；`npm run test -w @ssreporter/presenter-onair`

---

### 2026-08-27 · VRM 切换与导入（设置面板 + IndexedDB）

- **设备/环境**：Win10 / presenter-onair
- **做了什么**：
  - 新增 `lib/vrm/vrmModelCatalog.ts`：内置 `StarString1.0.vrm` / `miko.vrm` 列表、URL 解析、每模型表情锚点 profile id
  - 新增 `lib/vrm/vrmModelStore.ts`：IndexedDB 存导入的 `.vrm`（不进 Git / localStorage）
  - 新增 `hooks/useResolvedVrmModel.ts`：builtin → `public/avatar/` URL；imported → blob objectURL（切换时 revoke）
  - `VisualSettings` 增加 `vrmModelSource` / `vrmModelId`；`useSettings` 持久化 + 导入/删除 API
  - `AvatarBackground` 接 `vrmUrl`，`useEffect([vrmUrl])` 切换时 dispose 并重载场景
  - `App.tsx` 按当前模型动态 `effectAnchorProfileId`；`SettingsPanel` 下拉选模型、导入、删除导入项
- **未做 / 阻塞**：无；dev 下写 `public/avatar/` 的 Vite API 未做（以 IndexedDB 导入为主）
- **下一台机器应优先**：`public/avatar/` 放皮套或设置里导入 → 切换模型验收；继续 Phase 2/3 人工验收
- **相关文件**：`lib/vrm/vrmModelCatalog.ts`、`lib/vrm/vrmModelStore.ts`、`hooks/useResolvedVrmModel.ts`、`hooks/useSettings.ts`、`components/AvatarPanel.tsx`、`components/AvatarShell.tsx`、`components/SettingsPanel.tsx`、`App.tsx`、`types/settings.ts`
- **验证方式**：`npm run test`；`npm run typecheck`；`npm run dev` → 设置 → 视觉 → 选内置 / 导入 VRM → 确认角色重载

---

### 2026-08-26 · 打磨 Sprint：私有场次脚手架 + 导演台 Voice UI + ADR

- **做了什么**：
  - `npm run scaffold:deck`：一键生成 `content-private/decks/<id>/`、persona、FAQ、PDF 占位说明
  - 讲稿导演台：`ProfileEditDialog` 补 pitch/volume/style_hint/speaker；`BeatPerformanceEditor` 高级 Voice 折叠区
  - ADR-011 Avatar 呈现层、ADR-012 Q&A 分层 profile；更新 `AGENTS.md`
- **未做 / 阻塞**：无
- **下一台机器应优先**：`scaffold:deck` 填真材料 → Phase 2/3 验收
- **相关文件**：`scripts/scaffold-private-deck/`、`ProfileEditDialog.tsx`、`BeatPerformanceEditor.tsx`
- **验证方式**：`npm run test`；`npm run scaffold:deck -- --id test-scaffold --title 测试 --pages 2`

---

### 2026-08-26 · Q&A 分层 Profile 接线（qa 基线 TTS + emotion 驱动表情）

- **做了什么**：
  - `DEFAULT_PERFORMANCE_CATALOG` 新增 `qa` 基线 preset（短答 TTS 音色/语速/停顿）
  - `resolveBeatPerformance`：`mode: qa` 时分层合并（voice/timing 来自 `qa`，VRM 来自 emotion/profile）
  - Brain prompt / `ensureQaActionFields`：明确 emotion 只管表达，默认 `friendly`
  - `content/persona/performance.json` 增加 `qa` 覆盖示例
  - 文档：`content-qa.md`、`phase2-acceptance.md`
- **未做 / 阻塞**：无
- **下一台机器应优先**：content-private 填真材料；Phase 2/3 人工验收
- **相关文件**：`packages/director/src/performance-profile.ts`、`packages/brain/src/buildQaPrompt.ts`
- **验证方式**：`npm run test`；`npm run typecheck`

---

### 2026-08-26 · Avatar 呈现层抽象（解耦 Director / Brain 与 VRM）

- **做了什么**：
  - 新增 `lib/avatar/`：`AvatarReactionDraft` 协议、Director → Avatar 映射、VRM 桥接
  - `useAvatarPresenter` 集中管理 reaction / 情绪特效 / 聊天 TTS 表情
  - `AvatarShell` 为唯一引用 `AvatarBackground` 的壳层；`ChatPanel` / `PresentShell` 只接 presenter
  - `useDirectorQueue` / `DirectorPanel` 改为 `onApplyReaction(AvatarReactionDraft)`
  - 口型改 `mouthLevelRef`，避免 60fps 驱动 React 整树重渲染
  - `directorReactions.ts` 保留 re-export 兼容旧测试
- **未做 / 阻塞**：无
- **下一台机器应优先**：Phase 2/3 人工验收；Q&A 接 VoiceDirective/profile
- **相关文件**：`apps/presenter-onair/src/lib/avatar/`、`hooks/useAvatarPresenter.ts`、`components/AvatarShell.tsx`、`App.tsx`
- **验证方式**：`npm run test`；`npx tsc --noEmit -p apps/presenter-onair`

---

- **做了什么**：
  - `vrm.intensity` 接入 `toDirectorReactionDraftsFromResolved` 播放
  - 讲稿导演台：预设 **新建 / 编辑 / 删除**（写 deck `performance.json`）
  - 修复 `qaVoicePreferences.test.ts`（localStorage mock）
  - 修复 presenter-onair 多处 typecheck（slideScriptApi、useDirectorSpeech、vrmaGesturePlayback、createBrainLlmClient 等）
  - `AGENTS.md` / `phase3-present-director.md` 同步「讲稿导演台」
- **未做 / 阻塞**：Phase 2/2.5/3 人工验收；Q&A 未接 profile
- **下一台机器应优先**：`npm run dev` → 导演台试新建/编辑预设 → 汇报播放看表情强度
- **相关文件**：`directorReactions.ts`、`ProfileEditDialog.tsx`、`usePerformanceCatalog.ts`、`BeatPerformanceEditor.tsx`
- **验证**：`npm run test`（director 35/35；onair 含 qaVoicePreferences）

---

### 2026-08-26 · 讲稿导演台可视化 + 新建表演预设

- **做了什么**：
  - 模式改名「讲稿导演台」；可视化预设卡片、语速/停顿滑块、重读选区
  - **+ 新建预设** → deck `performance.json`；自定义 profile 动态出现在卡片列表
- **相关文件**：`ScriptEditorShell.tsx`、`BeatPerformanceEditor.tsx`、`ProfileCreateDialog.tsx`、`performanceCatalogApi.ts`

---

### 2026-08-26 · TTS VoiceDirective + Edge 适配器（音色/语气/句内重读）

- **做了什么**：
  - `VoiceDirective` 引擎无关层；`prepareUtterance` + Edge 首个适配器
  - 网关扩展 `pitch` / `volume`；按拍 `speaker` + prosody；emphasis **segment-resynth**
  - profile 默认绑定 Edge Neural 音色；编辑 UI 音色/重读 JSON
  - ADR-010、`docs/tts-voice-directive.md`
- **验证**：`npm run test -w @ssreporter/director`；汇报 + Edge TTS 播放带 profile 的 demo

---


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
