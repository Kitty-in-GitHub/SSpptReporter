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

浏览器打开终端提示的本地地址。左下角 **Director · Phase 0** 可播放 `sample-action.json`（表情 + 浏览器朗读）。

完整对话 / TTS 口型：打开右上 Settings，配置 LLM 与 TTS（推荐 VOICEVOX 等非 Web Speech 引擎以启用口型）。

### 自定义皮套（VRM 不进 Git）

`.vrm` 已被 `.gitignore` 排除。换机后：

1. 把本机/网盘上的模型拷到 `assets/avatars/`（可选备份）
2. 再覆盖 `apps/presenter-onair/public/avatar/miko.vrm`（或按 OnAir 设置改路径）

### 知识库

讲稿 / FAQ / persona 放在 `content/`，随**私有**仓库同步（勿公开仓）。

## 架构文档

- 技术路径：`docs/virtual-host-presenter-path.md`
- 底座选型：`docs/virtual-host-base-choice.md`
- Director 协议：`docs/director-json-schema.md` / `schemas/director-action.schema.json`
- Phase 0 清单：`docs/phase0-scaffold.md`

当前身体底座：`apps/presenter-onair`（AITuber OnAir VRM 模板）。
