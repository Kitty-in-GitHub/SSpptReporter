# 面捕模式（Mocap Session）

> ⚠️ **采集链路（摄像头 / 面捕）当前只在 Firefox 上开发和验收** —— 本机 Chromium 系
> （Edge / Chrome）的采集会在出十几帧后冻结，原因见文末「已知问题」。

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

- **视频获取：`useVideoSource`（独立模块）**
- **面捕引擎：`useFaceCaptureEngine`（独立模块，建在采集之上）** —— 主线程取帧泵 + Worker
- [@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) Face Landmarker（Worker 内，478 点）
- [kalidokit](https://github.com/yeemachine/kalidokit) `Face.solve`（`faceCaptureMapper`，点在主线程解算）
- 合并层：[`applyFaceCaptureToVrm`](../../apps/presenter-onair/src/lib/vrm/applyFaceCaptureToVrm.ts)

> **现状（2026-09-24）：引擎已按「采集 / 引擎」两段重建接回。**
> 两段各自报状态：面捕页工具条左边是采集（`画面流动中 · N fps`），
> 右边是引擎（`面捕：加载中 / 就绪 / 错误`）；卡住时先看是哪一段红的。

### 视频获取模块 `useVideoSource`

职责边界很清楚：**拿到一条活着的 video track，并量化「帧还活着吗」**。
不做识别、不做像素搬运、不碰渲染。

```
getUserMedia({ deviceId, width/height: ideal })
  → MediaStream
      ├── 探针 <video>（1px、不可见但在文档里）→ 度量帧活性 + 面捕引擎的帧源（state.frameSource）
      └── stream 暴露给预览显示
```

**两个可切换后端**（Chromium 里是两条不同的取帧路径，可在设置或预览窗里切）：

| 后端 | 度量方式 |
|------|----------|
| `videoFrameCallback`（默认） | `<video>` + `requestVideoFrameCallback`：只在「有新帧真正呈现」时回调 |
| `grabFrame` | `ImageCapture.grabFrame()` 轮询（Windows 上走静态抓帧实现，与视频流路径不同） |

- ⚠️ **后端的取帧次数不能当作「流是否活着」**：`grabFrame` 在一条已经卡死的流上
  仍可能继续返回同一帧。所以流活性只认**元素级帧计数**（`requestVideoFrameCallback`
  呈现帧 / `totalVideoFrames` 解码帧），后端计数（`backendFrames` / `backendFps`）
  只表示「这个后端还活着吗」—— 两者分开看才有诊断价值：
  - `currentTime`（播放时钟）**不算流活性**：它对 MediaStream 一帧都不来也每秒推进，
    会把「冻结」误报成「流动」并让看门狗永不触发（Edge 上实测过）；只在本会话
    从未见过任何帧计数时才允许兜底（Firefox 对 MediaStream 的解码帧恒为 0）
  - 流帧不动 + 后端帧在涨 → **抓帧路径可用**，面捕可以建在它上面
  - 两者都不动 → 采集整体死了
- 状态机 `idle / opening / streaming / stalled / error`；`stalled` 时文案会区分
  「后端正跑着」与「全死」
- **自愈重开**：只有「流和后端都不出帧」且持续 4s 才重开（后端正跑着时重开会打断可用路径）；
  失败按 `500ms × 2^n` 退避、上限 15s，连续 5 次失败后停止自动恢复（`state.gaveUp`）
  - 代数号（generation）机制保证 restart 后旧的 `grabFrame` 定时链不会复活（否则会双倍抓帧）
- 日志：控制台按 `[camera]` 过滤；预览窗底部「复制诊断日志」一键导出（最近 400 条）

### 面捕引擎 `useFaceCaptureEngine`

```
state.frameSource（探针 <video>，与采集同一个 MediaStream）
  → rAF 取帧泵（背压：Worker 回消息前不取下一帧）
      └── createImageBitmap(video) → postMessage(transfer) → Worker
            └── MediaPipe FaceLandmarker.detectForVideo → 478 点
  → landmarksToFaceCaptureFrame（Kalidokit Face.solve，主线程）
  → smoothFaceCaptureFrame（settings.faceCapture.smoothing）
  → frameRef（渲染循环按需读）
      └── AvatarPanel 帧循环 → applyVrmMouthAndFaceDrive → 头眼/口型
```

几条不能改坏的约定：

- **帧走 ref、状态走 state**：25~30fps 的帧进 `frameRef`，只有 `isRunning` / `error`
  这种低频状态进 React state，否则整棵树每秒重渲染几十次
- **背压**：Worker 没回消息前不再取帧；且**没检测到人脸也必须回一条消息** ——
  历史上漏回一次就让主线程帧泵永久锁死（面捕再也不出新帧）
- **Worker 生命周期跟 `enabled`，不跟帧源**：采集自愈重开只换 `<video>`，模型不重载；
  同理平滑度放 ref，拖滑块不会重建 Worker
- **推理后端**：先试 GPU，建不起来自动退 CPU，`ready` 消息里带实际用的 delegate
- **取帧方式**：`createImageBitmap(frameSource)`。零拷贝的 `MediaStreamTrackProcessor`
  路线暂时用不了 —— **Firefox 不支持该 API**，等它支持再说
- **口型驱动**：`mouthDriver=faceCapture` 时口型也来自面捕帧；`mouthDriver=tts` 时口型走
  TTS 音频，但头眼仍然跟面捕（见 `vrmMouthAndFaceDrive.ts`）

### 已知问题（Chromium 侧，尚未解决）

在用户这台机器上（内置 `Integrated Camera 30c9:00a8`，Chrome）：
`getUserMedia` 成功、`track.readyState=live`、`muted=false`、`frameRate=30`，
但**任何消费者都只拿到 10~15 帧（约 0.5~0.7 秒）后彻底停住**，之后再无帧。

已排除：
- 应用代码 —— 一个只有 `getUserMedia` + `<video>` 的空白页
  （[`public/camera-test.html`](../../apps/presenter-onair/public/camera-test.html)）同样卡死
- CPU 饥饿 —— 卡帧时 CPU < 10%
- VRM 渲染抢资源 —— 暂停渲染后依旧卡
- 推理后端 —— CPU / GPU 后端都卡
- 摄像头硬件 —— 同一设备在其它程序里流畅

结论：问题在 **Chromium 的采集层**（或这台机器的驱动 + Chromium 组合）。
`camera-test.html` 里可以逐个试约束预设（默认 / 640×480 / 1280×720 / 320×240 /
限帧 15 / 限帧 60 / `resizeMode:none`），找出能持续出帧的组合。

**待试的外部手段**：`edge://flags` 把 **Media Foundation Camera Capture** 设为
Disabled 后重启（强制走旧采集路径，绕开 Media Foundation）；另外测试时先关掉
OBS / Windows「相机」等可能占着摄像头的程序（Windows 上 MF 同时只允许一个消费者）。

> 修好读数后（2026-09-24），Edge 上该故障应表现为 `流已断 x.xs` + `重开` 递增；
> 若仍显示「画面流动中」，说明是真正的低帧率而非冻结。

**决策（2026-09-24）：采集相关开发和验收只在 Firefox 上做。** Chromium 侧排查到此为止：

- 已排除应用代码 —— 本项目页面 / 独立在线摄像头测试站 / 默认约束（`video: true`）**都会复现**；
  早前「Chromium 拿的是原生 640×480、Firefox 是 crop-and-scale 缩放」的模式差异，因此也被排除
- 剩下的可能性都在**这台机器的 Chromium 采集路径 / 系统组件**上（相机 AI 效果中间层、
  安全软件摄像头防护、`Media Foundation Camera Capture` 开关、USB 省电、VC++ / SxS 组件），
  建议清单记在 dev-log 2026-09-24 那条里
- **恢复用 Chromium 的前提**：换一台机器，或系统层处理过之后，先用 `camera-test.html` 确认能持续出帧
- Firefox 侧取帧能力与 Chromium 不同（`MediaStreamTrackProcessor` / WebCodecs 支持不一致）：
  重建面捕取帧链路时**先做能力探测**，缺失就退回 `<video>` + `createImageBitmap`

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
