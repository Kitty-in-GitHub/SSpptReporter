# Director JSON Schema（v1.0）

Brain / LLM **只输出**本协议；Body（VRM）、Voice（TTS）、UI（幻灯）负责执行。  
机器可读定义：[schemas/director-action.schema.json](../schemas/director-action.schema.json)

---

## 设计原则

1. **不写骨骼**：无 bone / blendshape 数值；只有 `emotion` / `gesture` 枚举。  
2. **一句一拍**：一条 `DirectorAction` ≈ 一段可播报文本 + 可选翻页/手势。  
3. **可打断**：`barge_in` / `priority: emergency` 清空播报队列。  
4. **可换皮**：换 `.vrm` 只需改 Body 的 emotion→Expression 映射表。

---

## 字段速查

| 字段 | 必填 | 说明 |
|------|------|------|
| `schema_version` | 是 | 固定 `"1.0"` |
| `mode` | 是 | `present` \| `qa` \| `idle` \| `system` |
| `utterance` | 是 | 朗读文本；可空字符串 |
| `action_id` | 建议 | 日志与打断关联 |
| `emotion` | 否 | 默认 `neutral` |
| `gesture` | 否 | 默认 `none` |
| `camera` | 否 | 默认 `bust` |
| `slide_action` | 否 | 翻页/高亮 |
| `emphasis` | 否 | 文本加重区间 |
| `qa` | 否 | 问答元数据 |
| `priority` / `barge_in` | 否 | 打断策略 |

### emotion → VRM（Body 侧自行配置）

| emotion | 建议 Expression |
|---------|-----------------|
| neutral | 复位 |
| confident | happy 低权重 + 微抬下巴姿态 |
| friendly | happy |
| serious | neutral / angry 极低 |
| thinking | 配合 `think` 手势 |
| apologetic | sad 低权重 |
| emphatic | surprised 极短脉冲 |

### gesture 预置（Phase 0/1 最少集）

| gesture | 用途 |
|---------|------|
| idle | 待机呼吸 |
| bow | 开场/结束致意 |
| nod | 认同 |
| think | 思考 |
| explain | 讲解手势 |
| point_slide | 指向幻灯 |
| open_hands | 开放说明 |
| emphasize | 强调一点 |

---

## 示例

### Present：讲某一页

```json
{
  "schema_version": "1.0",
  "action_id": "present-12-a",
  "mode": "present",
  "utterance": "本页说明系统的三层结构：大脑、导演与身体。",
  "emotion": "confident",
  "gesture": "explain",
  "camera": "bust",
  "slide_action": { "goto": 12, "highlight": "架构图" },
  "emphasis": [[5, 9]]
}
```

### Present：只翻页不说话

```json
{
  "schema_version": "1.0",
  "action_id": "present-13-flip",
  "mode": "present",
  "utterance": "",
  "gesture": "point_slide",
  "slide_action": { "next": true, "cite_only": true }
}
```

### Q&A：有依据

```json
{
  "schema_version": "1.0",
  "action_id": "qa-0042",
  "mode": "qa",
  "utterance": "关于成本部分，材料在第 8 页有明细，我翻过去说明。",
  "emotion": "serious",
  "gesture": "point_slide",
  "slide_action": { "goto": 8, "highlight": "成本表" },
  "qa": {
    "question_summary": "成本如何构成",
    "confidence": 0.86,
    "sources": [{ "kind": "slide", "ref": "8" }],
    "admit_unknown": false
  }
}
```

### Q&A：材料未覆盖

```json
{
  "schema_version": "1.0",
  "action_id": "qa-0043",
  "mode": "qa",
  "utterance": "这个问题不在本次提交材料范围内，我可以会后补充书面说明。",
  "emotion": "apologetic",
  "gesture": "nod",
  "qa": {
    "question_summary": "未收录的竞品对比细节",
    "confidence": 0.2,
    "admit_unknown": true,
    "sources": []
  },
  "priority": "high"
}
```

### 打断后改口

```json
{
  "schema_version": "1.0",
  "action_id": "qa-0044",
  "mode": "qa",
  "utterance": "好的，我直接回答数据口径问题。",
  "emotion": "serious",
  "gesture": "nod",
  "barge_in": true,
  "priority": "emergency",
  "qa": {
    "question_summary": "评委打断追问数据口径",
    "confidence": 0.7,
    "sources": [{ "kind": "faq", "ref": "faq-metric-def" }]
  }
}
```

---

## LLM 输出约定

- 系统提示要求：**只输出一个 JSON 对象**，符合本 schema，不要 Markdown 围栏外的闲聊。  
- 实现上用 JSON Schema 校验；失败则重试或降级为 `{ mode, utterance: "请稍等，我整理一下。" }`。  
- 长回答拆成 **多条** `DirectorAction` 顺序入队，便于中途打断。

---

## 与执行层的契约

```
Brain  --DirectorAction-->  Director Queue
                              ├─ slide_action → UI 翻页
                              ├─ utterance    → TTS → 音频
                              ├─ 音频         → VRM 口型
                              ├─ emotion     → Expression
                              └─ gesture     → 播放片段
```
