# 面捕模式（Mocap Session）

面捕模式用于**直播皮套**：浏览器摄像头 + MediaPipe + Kalidokit 驱动 VRM 头眼与口型，与答辩汇报模式隔离。

## 进入方式

顶部模式栏：**聊天 · 汇报 · 讲稿导演台 · 面捕**，或聊天页工具条「面捕」。

## 口型驱动

设置 → **面捕（仅面捕模式）** 或面捕顶栏快捷切换：

| 模式 | 行为 |
|------|------|
| **面捕** | 真人说话驱动口型；AI 回复**不播放 TTS 音频**（可显示字幕） |
| **TTS** | AI 弹幕/聊天回复播放 TTS，`mouthLevelRef` 驱动口型；头眼仍跟面捕 |

## OBS 采集

1. 设置 → 视觉：背景选 **绿幕** 或 **透明**（`layoutMode` 单人直播布局亦可）
2. OBS 添加浏览器源 `http://localhost:5173`
3. 绿幕：色度键；透明：浏览器源启用 alpha

## 摄像头权限

面捕模式会请求 `getUserMedia`；汇报/聊天/导演台**不会**启动面捕 Worker。

## 技术栈

- [@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) Face Landmarker（Web Worker）
- [kalidokit](https://github.com/yeemachine/kalidokit) `Face.solve`
- 合并层：[`applyFaceCaptureToVrm`](../../apps/presenter-onair/src/lib/vrm/applyFaceCaptureToVrm.ts)

### wasm 与模型从哪来

面捕 Worker **完全不依赖外网**：

| 资源 | 来源 | 是否入库 |
|------|------|----------|
| wasm | `vite-mediapipe-plugin.ts` 在 dev / build 启动时从 `node_modules/@mediapipe/tasks-vision/wasm/` 同步到 `public/mediapipe/wasm/` | ❌ 生成物，已 ignore |
| 模型 `face_landmarker.task`（约 3.6 MB） | vendored 到 `public/mediapipe/models/` | ✅ 入库 |

- 两者都用 `${BASE_URL}mediapipe/...` 引用
- wasm 版本与本地 npm 包天然一致（历史上写死 CDN 的 `@0.10.22` 在 npm 上并不存在，必然 404）
- 模型入库的原因：外部 URL 不可靠，且它是公开授权的资源、体积可接受 —— 克隆后即可离线使用
- **glue 必须按 classic script（非严格模式）求值**，否则会先后踩两个坑：
  - `custom_emscripten_dbgn` 在 `if` 块内用函数声明定义 `custom_dbg`，依赖 Annex B 提升到函数作用域；ES module 一律严格模式 → `custom_dbg is not defined`
  - 顶层 `var ModuleFactory` 不会落到全局 → `ModuleFactory not set.`
  - MediaPipe 的加载顺序是 `importScripts(url)` → `self.import(url)` → `import(url)`；module worker 里第一条必抛 TypeError（Vite dev 恒按 ESM 提供 worker 脚本，classic worker 会因 `import` 语句语法报错），所以 **Worker 把 `self.import` 换成了「fetch + 间接 eval」的加载器**，语义等同 `importScripts`。见 `src/workers/faceCapture.worker.ts`
- **dev 下插件会拦下 `/mediapipe/wasm/*` 并忽略查询串**（兜底）：万一某处退化成 `await import()`，Vite 会给该 URL 追加 `?import`，而 `public/` 文件不在模块图里、带查询会 500；中间件按静态文件返回以绕开

## 外部面捕（规划中）

iFacialMocap / VMC UDP 将通过 `apps/mocap-gateway` 本机桥接（M2）；当前仅 `source: webcam`。
