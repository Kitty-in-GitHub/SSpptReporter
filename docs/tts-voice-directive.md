# TTS VoiceDirective 与引擎适配器

> Edge（`openaiCompatible` → `tts-gateway`）为首个完整实现；其它引擎通过 `prepareUtterance` 扩展。

---

## 分层

```
DirectorAction + performance profile
        ↓
ResolvedBeatPerformance + resolveVoiceDirective()
        ↓
VoiceDirective（引擎无关）
        ↓
prepareUtterance(engineId, text, directive)
        ↓
Edge：gateway POST（speaker/speed/pitch/volume）+ 句内分段
其它：legacyVoicePatch → VoiceEngineAdapter
```

---

## VoiceDirective 字段

| 字段 | 说明 | Edge | Gemini 等（计划） |
|------|------|------|-------------------|
| `speaker` | 音色 ID | `zh-CN-YunxiNeural` | 引擎自有 voice |
| `rate` | 语速 0.25–4 | `speed` | 各引擎 rate |
| `pitch` | 音高 | `+5Hz` / `-2Hz` | 部分引擎 |
| `volume` | 音量 | `+10%` | 部分引擎 |
| `styleHint` | 自然语言风格 | **忽略** | Gemini prompt |
| `emphasis` | `[start,end)` 字符区间 | **segment-resynth** | 待适配 |

`speaker` 可写 `edge:zh-CN-YunxiNeural` 前缀，便于多引擎 profile 共存。

---

## performance.json 示例

```json
{
  "profiles": {
    "confident": {
      "vrm": { "expression": "happy", "gesture": "explain" },
      "voice": {
        "speaker": "zh-CN-YunxiNeural",
        "speed": 0.93,
        "pitch": "-2Hz"
      },
      "timing": { "pause_after_ms": 350 }
    },
    "emphatic": {
      "voice": {
        "speaker": "zh-CN-YunxiNeural",
        "speed": 1.08,
        "volume": "+10%",
        "pitch": "+2Hz"
      }
    }
  }
}
```

---

## 句内重读（Edge segment-resynth）

讲稿或 beat meta：

```yaml
emphasis: [[2,6],[10,12]]
```

播放时按区间拆成多段，逐段请求网关；**重读段**自动 `volume +12%`、`rate × 1.06`。  
口型按段连续播放，段间可能有轻微间隙（MVP 可接受）。

---

## 网关 API（扩展）

`POST /v1/audio/speech` body：

```json
{
  "model": "tts-1",
  "input": "文本",
  "voice": "zh-CN-YunxiNeural",
  "speed": 0.95,
  "pitch": "-2Hz",
  "volume": "+8%"
}
```

---

## 代码入口

| 路径 | 作用 |
|------|------|
| `packages/director/src/voice-directive.ts` | 类型 + emphasis 拆分 |
| `apps/presenter-onair/src/lib/tts/prepareUtterance.ts` | 适配器入口 |
| `apps/presenter-onair/src/lib/tts/edgeSpeechClient.ts` | 网关 fetch |
| `apps/presenter-onair/src/hooks/useDirectorSpeech.ts` | 播放 |
| `apps/tts-gateway/server.py` | Edge pitch/volume |

---

## 后续引擎

新增 `prepareGeminiUtterance` 等，在 `prepareUtterance` 分支注册；**不改** `VoiceDirective` 与讲稿格式。
