# SSreporter

虚拟主播答辩助手：VRoid→VRM 身体 + Director + 知识库（建设中）。

## 环境

```bash
conda activate ssreporter
```

（环境定义见 `environment.yml`，含 Node 22。）

## Phase 0 启动

```bash
conda activate ssreporter
cd d:\project\SSreporter
npm install
npm run dev
```

> Windows 上若 `conda run -n ssreporter -- npm …` 因编码报错，请先 `conda activate ssreporter` 再直接跑 `npm`。

浏览器打开终端提示的本地地址。左下角 **Director · Phase 0** 可播放 `sample-action.json`（表情 + Settings 配置的 TTS；非 webSpeech 引擎支持口型）。

验收步骤：[`docs/phase0-acceptance.md`](./docs/phase0-acceptance.md)

### 自定义皮套（VRM 不进 Git）

`.vrm` 已被 `.gitignore` 排除。当前运行时模型：**StarString1.0.vrm**。

| 位置 | 用途 |
|------|------|
| `assets/avatars/StarString1.0.vrm` | 主模型归档 |
| `assets/avatars/miko.vrm` | OnAir 默认模型备份 |
| `apps/presenter-onair/public/avatar/StarString1.0.vrm` | 浏览器加载路径 |

换机：复制 `StarString1.0.vrm` 到 `public/avatar/`。要换回默认示例，改 `AvatarPanel.tsx` 中的 `VRM_FILE_URL` 并恢复 `miko.vrm`。

### 知识库

讲稿 / FAQ / persona 放在 `content/`，随**私有**仓库同步（勿公开仓）。

## 跨设备开发（给其他 AI / 换机）

| 文档 | 用途 |
|------|------|
| [`AGENTS.md`](./AGENTS.md) | **AI 接手入口**（状态、约束、下一步） |
| [`docs/dev-log.md`](./docs/dev-log.md) | **开发日志**（每完成一项在顶部追加） |
| [`docs/cross-device-dev.md`](./docs/cross-device-dev.md) | 换机搭建、同步、排错 |
| [`docs/decisions.md`](./docs/decisions.md) | 架构决策（ADR，避免重复争论） |
| [`docs/phase0-acceptance.md`](./docs/phase0-acceptance.md) | Phase 0 手动验收 |
| [`docs/tts-selection.md`](./docs/tts-selection.md) | TTS 选型（云端 / 本机 / 低配置） |

私仓：`https://github.com/Kitty-in-GitHub/SSpptReporter.git`

## 架构文档

- 技术路径：`docs/virtual-host-presenter-path.md`
- 底座选型：`docs/virtual-host-base-choice.md`
- Director 协议：`docs/director-json-schema.md` / `schemas/director-action.schema.json`
- Phase 0 清单：`docs/phase0-scaffold.md`
- Phase 0 验收：`docs/phase0-acceptance.md`
- TTS 选型：`docs/tts-selection.md`

当前身体底座：`apps/presenter-onair`（AITuber OnAir VRM 模板）。
