# Mocap Gateway（规划中）

本机 UDP → WebSocket 桥，用于 iFacialMocap / VMC 等外部面捕 App。

**M1 未实现**；面捕模式当前仅支持浏览器摄像头（`faceCapture.source = webcam`）。

参考实现路径：

- 类比 [`apps/tts-gateway`](../../tts-gateway/server.py)
- 浏览器通过 WebSocket 收 blendshape / 骨骼数据
- 写入与 [`FaceCaptureFrame`](../../apps/presenter-onair/src/lib/avatar/faceCaptureTypes.ts) 相同结构
