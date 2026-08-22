# Phase 0 验收清单

完成标准：浏览器加载 **StarString1.0.vrm** + Settings TTS 发声 + **口型可见** + Director fixture 驱动表情 + schema 拒绝非法 JSON。

---

## 环境准备

```bash
conda activate ssreporter
cd d:\project\SSreporter
npm install
```

确认本地存在（不进 Git）：

- `apps/presenter-onair/public/avatar/StarString1.0.vrm`

```bash
npm run dev
# → http://localhost:5173
```

自动化检查（可选）：

```bash
npm run typecheck
npm run test
```

---

## 手动验收表

| # | 项 | 操作 | 通过标准 |
|---|-----|------|----------|
| 1 | VRM 加载 | 打开页面 | 可见 StarString 半身角色，可旋转视角 |
| 2 | TTS（本机） | Settings → `voicevox` 或 `aivisSpeech`，配本地 URL + Speaker | Director 按钮有声音 |
| 3 | TTS（云端） | Settings → `geminiTts` / `openai` 等，配 API Key + 中文 speaker | Director 按钮有声音 |
| 4 | 口型 | 使用非 `webSpeech` 引擎播放 sample | 说话时嘴部 Expression（Aa）肉眼可辨 |
| 5 | Director 表情 | 点「播放 sample-action.json」 | `friendly` → happy 类表情，播完复位 |
| 6 | Schema 校验 | 点「测试非法 JSON」 | 面板显示错误，不播放 |
| 7 | 单元测试 | `npm run test -w @ssreporter/director` | 6 tests passed |

---

## TTS 推荐组合

| 场景 | Settings 引擎 | 口型 |
|------|---------------|------|
| 本机离线测口型 | VOICEVOX `http://127.0.0.1:50021` | 有 |
| 中文答辩试听 | Gemini TTS / OpenAI / OpenAI-Compatible | 有 |
| 仅测文案、不测口型 | Web Speech | **无**（Director 面板会提示） |

---

## 已知限制（Phase 0 非目标）

- `gesture: bow` 等手势未执行
- 无 LLM Brain、无 Director 队列、无 `barge_in`
- 无 PPT 双栏

Phase 0 完成后进入 Phase 1：知识库 + Present 模式 + Director 队列。
