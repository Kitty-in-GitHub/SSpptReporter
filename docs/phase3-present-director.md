# Phase 3 · Present 导演时间线（节拍 + Profile）

> **状态：已实现（待验收）**  
> 一页多 beat、performance profile 统一驱动 VRM + TTS、句间停顿与语速覆盖。

---

## 能力概览

| 能力 | 说明 |
|------|------|
| 一页多 beat | `slides/NN.md` 内用 `<!-- beat -->` 分段 |
| Performance Profile | `content/persona/performance.json` + deck 覆盖 |
| 每拍 TTS | `voice.speaker` / speed / pitch / volume；Gemini `style_hint`（待接） | 
| 句内重读 | `emphasis` → Edge **segment-resynth**（见 [`tts-voice-directive.md`](./tts-voice-directive.md)） |
| 每拍 Body | profile → 表情 + 默认手势，可被 beat `gesture` 覆盖 |
| 编辑 UI | 讲稿导演台 → 可视化预设/语速/停顿 + 新建/编辑/删除自定义预设 |

---

## 讲稿格式

```markdown
---
emotion: confident
slide_action: {"goto": 3}
---

<!-- beat -->
profile: confident
gesture: explain

第一段讲稿。

<!-- beat -->
profile: thinking
gesture: nod
utterance:

<!-- beat -->
profile: emphatic
第二段讲稿。
```

- `profile` / `emotion`：表演预设名（见 `performance.json`）
- `voice: {"speed":0.95}` 或 `voice_speed: 0.95`
- `timing: {"pause_after_ms":400}` 或 `pause_after_ms: 400`
- 空 `utterance`：只动作 / 停顿，不朗读

---

## performance.json

```json
{
  "profiles": {
    "confident": {
      "vrm": { "expression": "happy", "intensity": 0.35, "gesture": "explain" },
      "voice": { "speed": 0.95 },
      "timing": { "pause_after_ms": 300 }
    }
  }
}
```

加载顺序：`DEFAULT_PERFORMANCE_CATALOG` → `content/persona/performance.json` → `content/decks/<id>/performance.json`（后者覆盖）。

---

## DirectorAction 扩展字段

| 字段 | 说明 |
|------|------|
| `profile` | 表演预设名 |
| `voice` | `{ speed?, pitch?, style_hint? }` |
| `timing` | `{ pause_before_ms?, pause_after_ms? }` |

---

## 验收

1. `npm run compile:deck` → demo `script.jsonl` 条数增加（03.md 为 3 条）
2. 汇报 → 播放本场讲稿：第三页中间有 nod、句间停顿可感知
3. 设置 Edge-TTS speed 1.0，profile `emphatic` 覆盖为 1.05 可听出更快
4. 讲稿导演台 → 添加/编辑预设 → 添加节拍 → 保存并编译 → 播放生效

---

## 讲稿导演台（Preset UI）

- 工具栏第三项：**讲稿导演台**（原「编辑讲稿」）
- 表演预设：内置 7 张 + `performance.json` 自定义卡片
- **+ 新建预设**：写入 `content/decks/<id>/performance.json`（dev 写盘 API）
- **编辑 / 删除**：自定义预设可删；内置预设可保存场次覆盖或「恢复默认」
- `vrm.intensity` 已接入播放（表情强度随 profile）

---

## 相关文件

| 路径 | 作用 |
|------|------|
| `schemas/director-action.schema.json` | 协议 |
| `packages/director/src/performance-profile.ts` | Profile 解析 |
| `packages/director/src/slide-script-draft.ts` | 多 beat 解析/序列化 |
| `content/persona/performance.json` | 全场默认 |
| `apps/presenter-onair/src/hooks/useDirectorQueue.ts` | 停顿 + profile 播放 |
| `apps/presenter-onair/src/hooks/useDirectorSpeech.ts` | 按拍语速 |
