# 依赖安全现状（npm audit 基线）

> 最后核对：2026-10-23 · Node 22（conda `ssreporter`）· npm 10.9

本项目是**本机运行的单机工具**（浏览器 + 本机 TTS 网关），不对外提供网络服务，因此依赖漏洞的处置标准是「**是否可达 + 是否随浏览器产物发布**」，而不是一律清零。

## 结论

| 范围 | 现状 | 处置 |
|------|------|------|
| **生产依赖**（`npm audit --omit=dev`） | 2 个 high，均来自 `sharp` | 接受，见下方理由 |
| **开发依赖**（`npm audit`） | vitest 1.x 的 `tinypool`、`source-map-js` 等 | 接受；升级 vitest 属破坏性变更，另开任务 |
| 已修复 | `fast-uri` 3.1.5 → 3.1.9（经 `npm audit fix`） | 完成 |

## 剩余风险与理由

### `sharp`（经 `@huggingface/transformers` → 可选依赖）

- `sharp` 是 **Node 端**图像库，只在使用 `@huggingface/transformers` 的 Node 运行时才会被加载
- 浏览器里的「浏览器内 Whisper」走的是 `transformers.web` 产物 + onnxruntime-web，**`sharp` 不会进入前端 bundle**（可用 `dist/assets` 里没有 sharp 证实）
- 触发漏洞需要处理**不可信图片**（libvips / libheif / librsvg 解码器）；本项目只在浏览器做语音识别，Node 侧不处理用户图片
- 官方修复路径是升级 `@huggingface/transformers` 到 **4.3.1**（破坏性），需在浏览器内 Whisper 上做回归后再升

### 开发依赖（`tinypool` / `source-map-js` 等）

- 仅在 `npm run test`（vitest 1.x）过程中使用，不进入发布产物
- 修复需要 vitest 5（破坏性），与当前测试用例需要一起迁移，不在本次范围

## 如何复查

```bash
# 生产依赖（CI 中作为提示项，不阻塞）
npm run audit:prod

# 全量（含开发依赖）
npm audit
```

## 升级前的验收要求

升级 `@huggingface/transformers` 时，**必须**按 [`phase2-5-asr.md`](./phase2-5-asr.md) 验证「浏览器内 Whisper」：选该引擎 → 首次下载模型 → 中文转写成功。升级 vitest 时运行 `npm run test`（当前 106 项）确认全过。
