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

## 外部面捕（规划中）

iFacialMocap / VMC UDP 将通过 `apps/mocap-gateway` 本机桥接（M2）；当前仅 `source: webcam`。
