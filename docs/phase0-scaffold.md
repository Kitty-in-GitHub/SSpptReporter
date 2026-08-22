# Phase 0 仓库目录清单

目标：**3～7 天内**做到「浏览器加载自有 VRM + 播放一段 TTS + 口型」。  
不接完整 Brain / PPT；只搭骨架与可跑通的身体。

> **现状（已落地）**：身体底座为 `apps/presenter-onair`（AITuber OnAir VRM 模板）；  
> npm workspaces；`packages/director` 已接线；运行时模型 `public/avatar/StarString1.0.vrm`。  
> 跨设备接力见 [`AGENTS.md`](../AGENTS.md) 与 [`dev-log.md`](./dev-log.md)。

---

## 1. 目录树（当前）

```
SSreporter/
├── README.md
├── package.json                 # npm workspaces
├── environment.yml              # conda: ssreporter + Node 22
├── schemas/
│   └── director-action.schema.json
├── docs/
│   ├── virtual-host-presenter-path.md
│   ├── director-json-schema.md
│   └── phase0-scaffold.md       # 本文件
├── content/                     # Phase1 再用
├── assets/
│   └── avatars/                 # VRoid 备份；运行时复制到 onair public
├── apps/
│   └── presenter-onair/         # Phase0 主战场（OnAir VRM）
│       ├── src/components/DirectorPanel.tsx
│       ├── src/fixtures/sample-action.json
│       └── public/avatar/miko.vrm
└── packages/
    └── director/                # 类型 + Ajv 校验 + emotion 映射
```

---

## 2. Phase 0 验收清单

| # | 项 | 完成标准 |
|---|----|----------|
| 1 | VRoid 导出 VRM 1.0 | 半身、含口型相关 Expression（Aa/Ih/Ou 等或等价） |
| 2 | `presenter-web` 能加载该 VRM | 浏览器可见角色，可旋转/固定 bust 机位 |
| 3 | 播放 `sample-tts.wav` 或浏览器 TTS | 有声音 |
| 4 | 口型跟随音频 | 肉眼可辨张嘴 |
| 5 | 读入一条 `DirectorAction` fixture | `emotion` 能改表情（哪怕只改 happy） |
| 6 | Schema 校验 | 非法 JSON 被 `packages/director` 拒绝 |

**非目标（Phase 0 不做）**：PPT 翻页、ASR、真 LLM、手势库、打断队列。

---

## 3. 建议依赖（presenter-web）

- `vite` + `react` + `typescript`
- `three` + `@pixiv/three-vrm`（或 `@react-three/fiber` + drei）
- 口型：`three-vrm-lip-sync` 或自封装 `wLipSync`
- 校验：`ajv`（放在 `packages/director`）

可选参考实现（抄管线，勿整仓吞）：
- https://github.com/pradhankukiran/talk2avatar
- https://pixiv.github.io/three-vrm/packages/three-vrm/examples/

---

## 4. 样例 fixture

路径：`apps/presenter-onair/src/fixtures/sample-action.json`

```json
{
  "schema_version": "1.0",
  "action_id": "phase0-sample",
  "mode": "system",
  "utterance": "大家好，我是答辩助手，接下来由我说明技术方案。",
  "emotion": "friendly",
  "gesture": "bow",
  "camera": "bust"
}
```

Phase 0 可先：**忽略 gesture**，只消费 `utterance` + `emotion`。

---

## 5. 建仓命令备忘（Windows / pnpm）

```bash
cd d:\project\SSreporter
# 若采用 pnpm monorepo
pnpm init
# 再创建 apps/presenter-web（vite react-ts）
# pnpm add -w 等按你习惯配置 workspace
```

本地模型：把 VRoid 导出的文件放到 `assets/avatars/presenter.vrm`，在 `VrmStage` 里写死路径即可。

---

## 6. 与后续阶段的衔接

| Phase | 在本目录上增量 |
|-------|----------------|
| 1 讲 PPT | `content/decks/<name>/` 页索引；UI 左栏幻灯；消费 `slide_action` |
| 2 问答 | `packages/brain` + `packages/voice`；队列 + `barge_in` |
| 3 加固 | 流式 TTS、日志、断网讲稿缓存 |

协议始终以 `schemas/director-action.schema.json` 为单一事实来源。
