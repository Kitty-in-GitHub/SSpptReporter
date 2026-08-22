# 后续技术路径：讲 PPT + 答辩问答（皮套已定 VRoid→VRM）

> 目标阶段：**能讲幻灯片、能接评委提问**。  
> 已锁定：虚拟风皮套 = VRoid 捏人 → `.vrm`。  
> 暂不优先：娱乐直播弹幕、全身跳舞、写实数字人。  
> 日期：2026-08-20

---

## 1. 场景拆成两种模式

| 模式 | 输入 | 输出 | 关键能力 |
|------|------|------|----------|
| **Present（讲稿）** | 当前页码 + 预写讲稿/大纲 | 语音讲解 + 翻页/强调 + VRM 口型手势 | 控场、对齐 PPT |
| **Q&A（答辩）** | 评委语音/文字 + 全套材料上下文 | 短答/引用页码 + VRM 说话 | 听懂、答准、可打断 |

两种模式共用同一套：**VRM 身体 + TTS 口型 + LLM 大脑**；差别只在「导演策略」和「检索范围」。

---

## 2. 推荐总架构（答辩优先）

```
┌─────────────────────────────────────────────────────────┐
│  呈现层（浏览器双栏最省事）                                │
│  左：PPT/PDF 幻灯    右：半身 VRM（three-vrm）             │
│  或：OBS 捕获「幻灯窗口 + 透明 VRM 窗」投到大屏            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Director（表演导演）                                     │
│  emotion / gesture / camera / slide_action / speak       │
└───────────────────────────┬─────────────────────────────┘
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌────────────┐   ┌────────────┐   ┌────────────────┐
   │ Brain      │   │ Voice      │   │ Body           │
   │ LLM+Skill  │   │ TTS(+ASR)  │   │ VRM 口型/表情  │
   │ MD/RAG/PPT │   │ 流式优先   │   │ + 少量手势片段 │
   └────────────┘   └────────────┘   └────────────────┘
```

**原则**：LLM 不直接拧骨骼，只输出结构化意图；换 VRM 文件不影响大脑。

---

## 3. 推荐技术选型（MVP）

| 层 | 推荐 | 理由 |
|----|------|------|
| **皮套** | VRoid → VRM 1.0，半身构图、正装/商务二次元 | 已定；答辩不需要全身 |
| **呈现** | **Web 双栏**（幻灯 iframe/PDF.js + R3F/`@pixiv/three-vrm`） | 一场答辩一台浏览器即可；易录屏 |
| **备选呈现** | PowerPoint 全屏 + 旁路透明 VRM 窗（OBS/Electron） | 评委习惯看原生 PPT 时用 |
| **Brain** | 云端或本地 LLM + **Skill** + **MD 知识库** + **按页 RAG** | 与你最初设想一致 |
| **ASR（问答）** | 浏览器 Web Speech 先跑通 → 再换 Faster-Whisper / 云 ASR | 答辩现场噪声要可换 |
| **TTS** | 中文自然音优先（Edge TTS / CosyVoice / 商业中文 TTS） | 口型靠音频驱动即可 |
| **口型** | `wLipSync` / `three-vrm-lip-sync` 或 TTS 自带 viseme | 无真人面捕 |
| **手势** | 5～10 个 VRMA/Mixamo 片段：讲解、指页、思考、致意 | 够用，别上全套动作库 |
| **可参考整机** | talk2avatar（流式 LLM→TTS→VRM）；AITuber OnAir VRM 模板；ChatdollKit（若改 Unity） | 抄管线，不必整仓吞 |

**暂缓**：Unity/UE、MetaHuman、直播弹幕、全自动换皮管线。

---

## 4. Brain 怎么服务「讲 PPT + 问答」

### 4.1 材料入库（开场前一次）

1. PPT/PDF → 按页抽文本（+ 可选截图 caption）  
2. 每页一条：`slide_id`、标题、要点、备注讲稿  
3. 全文 MD：项目背景、数据表、FAQ、红线话术  
4. Skill：`present_slide`、`answer_judge`、`cite_slide`、`admit_unknown`

### 4.2 Present 模式

- 输入：`{ mode: "present", slide_id, outline? }`  
- 输出示例：

```json
{
  "utterance": "本页说明技术方案的三层结构……",
  "emotion": "confident",
  "gesture": "point_slide",
  "slide_action": { "goto": 12, "highlight": "架构图" },
  "next_hint": 13
}
```

- 讲稿可预生成缓存；现场只做「翻页 + 播放 + 轻微改写」。

### 4.3 Q&A 模式

- 输入：评委问题 + `current_slide` + 检索到的相关页/FAQ  
- 约束：先短答 → 再展开 → **能指页就指页**；不知就承认并给边界  
- 输出同样走 Director JSON；支持 **打断（barge-in）**：停 TTS、清空队列、重听

---

## 5. 分阶段落地（建议按这个做）

### Phase 0 — 皮套与空壳（3～7 天）

- VRoid 捏一版「答辩用」半身 VRM  
- 浏览器加载 VRM + idle 眨眼  
- 任意一段 TTS → 口型  

**验收**：大屏上角色能说话张嘴。

### Phase 1 — 能讲完一套 PPT（1～2 周）

- PPT 按页入库 + 预生成每页讲稿  
- 遥控：下一页 / 重讲本页 / 暂停  
- Director：翻页指令 + 指页手势  
- 双栏 UI 或「PPT + 旁路 VRM」  

**验收**：无人提问时，能完整讲完 10～20 页，口型同步、翻页不错乱。

### Phase 2 — 能接评委提问（再 1～2 周）

- ASR → LLM（带 RAG + 当前页）→ TTS → VRM  
- FAQ / 红线 Skill  
- 打断与「请重复一下」兜底  
- 回答末尾可选：`cite_slide: N` 自动翻到证据页  

**验收**：模拟评委连问 10 个问题，相关能答、不相关能拒、能指到页。

### Phase 3 — 答辩加固（按需）

- 延迟优化（流式句子级 TTS）  
- 本地兜底（断网讲稿缓存）  
- 录屏回放 / 话术审计日志  
- 多套材料一键切换（同一 VRM）  

---

## 6. 仓库模块建议（便于你开干）

```
apps/presenter-web/     # 双栏 UI + VRM canvas
packages/director/      # 表演 JSON schema + 状态机
packages/brain/         # LLM + Skill + MD/RAG + slide index
packages/voice/         # ASR/TTS 适配层
packages/vrm-runtime/   # 加载、口型、手势播放
content/                # 人设 md、FAQ、某次答辩的 slides 索引
assets/avatars/*.vrm
```

Brain 与 VRM **进程可分离**：答辩现场 Brain 可云端，呈现纯本地，降低翻车面。

---

## 7. 成功标准（本阶段）

| 项 | 标准 |
|----|------|
| 讲稿 | 一套真实 PPT 可自动/半自动讲完 |
| 问答 | 针对该 PPT 的评委问题，准确率与「会翻证据页」达标 |
| 形象 | 单一 VRM，口型可接受，手势不穿帮 |
| 操作 | 一人可控：开始讲 / 暂停 / 进问答 / 紧急切人工话筒 |

---

## 8. 明确不做（本阶段）

- Live2D / 写实数字人  
- 弹幕互动、唱歌、游戏陪玩  
- 全自动换皮量产  
- 追求电影级面部（MetaHuman）  

---

## 9. 下一步你可立刻做的三件事

1. **捏皮**：VRoid 出一版半身正式 VRM，用 [three-vrm dnd 示例](https://pixiv.github.io/three-vrm/packages/three-vrm/examples/dnd.html) 自检。  
2. **定材料格式**：选一场真实答辩 PPT，导出「每页文本 + 备注」JSON/MD。  
3. **定交互壳**：先做「左幻灯右角色 + 下一页按钮」，再接 LLM。  

需要的话，下一步可以直接拆：**Presenter JSON Schema** 和 **Phase 0/1 的目录脚手架清单**。

---

## 附录：已落地

- Director 协议说明：[director-json-schema.md](./director-json-schema.md)
- JSON Schema：[../schemas/director-action.schema.json](../schemas/director-action.schema.json)
- Phase 0 目录清单：[phase0-scaffold.md](./phase0-scaffold.md)
- 开源贴合度对照：[virtual-host-opensource-fit.md](./virtual-host-opensource-fit.md)
