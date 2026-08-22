# 虚拟主播（VRM + 语义驱动）开源项目与案例整理

> 整理日期：2026-08-20  
> 对应选型结论：以 **VRM 标准人型** 为形象层，以 **LLM + TTS + 口型/表情/手势** 为驱动，避开 Live2D 手工绑骨。  
> 用途：竞标 / 答辩 / 直播 虚拟主播的调研与选型参考。

---

## 1. 路径是否「有人做过」？

**有。** 这不是纸面架构，已有从「浏览器 Demo」到「完整 AI VTuber 引擎」的开源实现。

大致可分成四类：

| 类别 | 你能直接拿什么 | 代表项目 |
|------|----------------|----------|
| A. 奠基 Demo | LLM + TTS + VRM 表情/口型闭环 | ChatVRM → Amica |
| B. AI VTuber 整机 | ASR/TTS/打断/直播弹幕/本地模型 | Open-LLM-VTuber、AIRI、AITuber OnAir |
| C. 现代 Web 运行时 | 流式 LLM、viseme、R3F/Three | talk2avatar、svelte-vrm-live、ARPA Avatar |
| D. Unity / 高端数字人 | 正式答辩观感、uLipSync、A2F | ChatdollKit、LLMAvatarTalk |

你之前设想的「LLM + Skill + MD 知识库」属于 **Brain**；下列项目多数已把 **Body + Voice** 跑通，缺的往往是「竞标领域 RAG / 表演导演协议」——这正是可自建差异化的部分。

---

## 2. 优先关注的整机 / 接近整机项目

### 2.1 [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber)

- **定位**：开源界最接近 Neuro-sama 的「可本地跑」AI 伴侣 / VTuber 引擎之一（星标量级很高）。
- **能力**：免提语音、打断、多 LLM/ASR/TTS 后端、Live2D 说话脸；可纯离线。
- **与你的路径关系**：Brain + Voice 很强；形象默认偏 **Live2D**。适合当「大脑与语音管线」参考，形象层仍建议换/并行 VRM。
- **官网**：[open-llm-vtuber.github.io](https://open-llm-vtuber.github.io/)

### 2.2 [Project AIRI](https://github.com/moeru-ai/airi)（moeru-ai）

- **定位**：自托管「数字生命 / AI VTuber」平台，明确对标 Neuro-sama；WebGPU / WASM 等 Web 技术栈。
- **能力**：**VRM + Live2D 双支持**、口型、眨眼、look-at、动画；实时语音；扩展到游戏等。
- **与你的路径关系**：**最接近「VRM 身体 + 自主 Agent」的大型开源案例之一**，适合作为架构与模块拆分参考。
- **试玩 / 文档**：[airi.moeru.ai](https://airi.moeru.ai)

### 2.3 [AITuber OnAir](https://github.com/shinshin86/aituber-onair)

- **定位**：TypeScript 工具包，专门做能聊天、说话、记事、接直播弹幕的 AI VTuber。
- **能力**：`create-aituber-onair` 可脚手架生成 **PNGTuber / VRM / Live2D / Pet** 等模板；模块化 chat / voice / streaming。
- **与你的路径关系**：**最快可 fork 的 VRM 直播起步模板**；知识库可用其 LLM 层 + 自建 Skill/MD。
- **脚手架站**：[create-aituber-onair.aituberonair.com](https://create-aituber-onair.aituberonair.com/)

### 2.4 [semperai/amica](https://github.com/semperai/amica)

- **定位**：可对话的 3D 角色界面；源自 pixiv ChatVRM 生态。
- **能力**：VRM 导入、语音合成/识别、情绪表达引擎、可换多种 AI 后端。
- **与你的路径关系**：成熟的「浏览器 VRM 伴侣」产品形态参考。

### 2.5 [uezo/ChatdollKit](https://github.com/uezo/ChatdollKit)

- **定位**：Unity 上把 3D/VRM 模型变成语音聊天机器人的 SDK（日文文档齐全）。
- **能力**：多 LLM、表情与动作、眨眼、**uLipSync** 口型、UniVRM。
- **与你的路径关系**：**Unity 路线的标准答案**；答辩若要更「应用级」观感，可走这条而非纯浏览器。

---

## 3. 奠基与「最小闭环」案例（强烈建议先读）

### 3.1 [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)（已 archive）

- **历史地位**：把「浏览器里和 VRM 聊天」做成公开技术 Demo 的关键节点（2023 起广泛被 fork）。
- **技术组合**：`@pixiv/three-vrm` + ChatGPT + TTS（原 Koemotion）+ Web Speech。
- **相关**：同组织还有 [local-chat-vrm](https://github.com/pixiv/local-chat-vrm)。
- **活跃 fork 例**：[zoan37/ChatVRM](https://github.com/zoan37/ChatVRM)（接 OpenRouter、ElevenLabs、直播弹幕 Restream）。

**价值**：证明「LLM 输出情绪标签 → VRM Expression + 口型」这条语义驱动链是可行且可产品化的。

### 3.2 [pradhankukiran/talk2avatar](https://github.com/pradhankukiran/talk2avatar)

- **定位**：现代全栈「流式对话 + VRM 口型」参考实现。
- **技术组合**：Next.js + R3F + `@pixiv/three-vrm` + Vercel AI SDK + HeadTTS（Kokoro）+ **Oculus viseme → VRM blendshape**。
- **与你的路径关系**：**Web MVP 最值得对标的新项目之一**（流式句子级 TTS、首包音频延迟意识强）。

### 3.3 [dexvdev/svelte-vrm-live](https://github.com/dexvdev/svelte-vrm-live)（Threlte Live）

- **定位**：面向直播叠加层的 VRM 平台。
- **技术组合**：SvelteKit + Threlte/Three + Gemini + ElevenLabs 音素时间戳口型 + **Mixamo** 动画。
- **与你的路径关系**：直接对应「OBS 捕获 / 直播」场景。

### 3.4 [ARPAHLS/avatar](https://github.com/ARPAHLS/avatar)

- **定位**：桌面透明悬浮 VRM 伴侣（Electron）+ 浏览器开发版。
- **能力**：VRM + **VRMA** 动作、对任意音频（含系统声）做口型——可接本地 LLM 或任意发声源。
- **与你的路径关系**：适合「挂在答辩 PPT / 桌面旁」的形态，不必做人脸追踪。

### 3.5 [Hamza-Bilal-2002/Persona](https://github.com/Hamza-Bilal-2002/Persona)（Violet）

- **定位**：桌面常驻 VRM + 本地优先多 LLM + **RAG 记忆** + 语音管线。
- **与你的路径关系**：展示「知识记忆（类 MD/RAG）+ VRM 身体」已有人拼过；你的 Skill/MD 知识库可对标其记忆层。

---

## 4. 基础设施（标准库，建议锁定）

这些不是「整机」，但是你自建体系时应直接依赖的开源组件：

| 组件 | 仓库 / 说明 | 作用 |
|------|-------------|------|
| VRM 规范与 Unity 实现 | [vrm-c/UniVRM](https://github.com/vrm-c/UniVRM) | 标准人型骨骼 + Expression |
| 浏览器 VRM | [pixiv/three-vrm](https://github.com/pixiv/three-vrm) | WebGL 加载与表情 |
| Unity 口型 | [hecomi/uLipSync](https://github.com/hecomi/uLipSync) | MFCC 实时口型，支持 VRM |
| Web 口型 | [mrxz/wLipSync](https://github.com/mrxz/wlipsync)、[three-vrm-lip-sync](https://github.com/vlapky/three-vrm-lip-sync) | AudioWorklet / 浏览器侧 |
| Mixamo → VRM 动作 | [vrm-mixamo-retarget](https://www.npmjs.com/package/vrm-mixamo-retarget) 等 | 手势库复用 |
| 角色制作 | [VRoid Studio](https://vroid.com/en/studio)（免费） | 快速出第一版 VRM |
| React SDK 封装 | [SolveServeSolution/khaveeai-sdk](https://github.com/SolveServeSolution/khaveeai-sdk) | VRM + Realtime + 口型封装 |

---

## 5. 高端答辩路线（可选，非必须）

若关键场次要「数字人发布会」观感，可看 NVIDIA / UE 栈（更重、更不像「轻量 VRM」）：

| 项目 | 说明 |
|------|------|
| [wsxqaza12/LLMAvatarTalk](https://github.com/wsxqaza12/LLMAvatarTalk-An-Interactive-AI-Assistant) | Riva ASR/TTS + LLM + Audio2Face + MetaHuman |
| [BrevikSpirit/Agentic_MetaHumans](https://github.com/BrevikSpirit/Agentic_MetaHumans) | LangChain Agent + A2F + MetaHuman |
| [0xMatthew/CLARA2](https://github.com/0xMatthew/CLARA2) | PPT/材料驱动的 AI MetaHuman 演示者 |
| NVIDIA ACE 文档 | Audio2Face 微服务 + UE Pixel Streaming |

**写实视频数字人（偏成片，弱实时交互）**：

- [duixcom/Duix-Avatar](https://github.com/duixcom/Duix-Avatar) — 离线克隆与视频合成  
- [PunithVT/ai-avatar-system](https://github.com/PunithVT/ai-avatar-system) — 照片/声音克隆 + MuseTalk 口型视频  

这类适合「预录竞标片」，不建议当作唯一直播形态。

---

## 6. 案例怎么映射到你的四层架构

```
Brain（LLM + Skill + MD/RAG）
   ↑ 你自建差异化的主战场
Director（emotion / gesture / camera JSON）
   ↑ 多数开源项目做得浅，可自研
Body（VRM 渲染 + VRMA/Mixamo）
   ↑ ChatVRM / Amica / AIRI / talk2avatar / ChatdollKit
Voice（TTS + 口型）
   ↑ uLipSync / wLipSync / ElevenLabs viseme / HeadTTS
```

| 你的层 | 可借鉴项目 |
|--------|------------|
| Brain | Open-LLM-VTuber、AITuber OnAir、Persona（RAG）、自建 Skill |
| Director | ChatVRM 情绪标签、AIRI 表情动画状态、自建表演协议 |
| Body | three-vrm、AIRI VRM、AITuber VRM 模板、ChatdollKit |
| Voice | talk2avatar、uLipSync、svelte-vrm-live、ARPA Avatar |

---

## 7. 建议的「站在巨人肩上」策略

### 策略 A — 最快验证（1–2 周）

1. `npm create aituber-onair@latest` 选 **VRM** 模板，或直接跑 **talk2avatar**。  
2. 把 LLM system prompt 换成你的主播人设；MD 知识先塞进 RAG / 长上下文。  
3. OBS 捕获浏览器窗口做直播/答辩彩排。

### 策略 B — 可产品化自建（推荐中期）

1. **锁定** `@pixiv/three-vrm` + 自研 Director JSON（不绑某个开源整机）。  
2. Brain 用你已有的 Skill + MD；Voice 用本地 TTS 或云 TTS + wLipSync。  
3. 从 AIRI / Amica **只抄模块思路**，避免整仓 fork 后难维护。

### 策略 C — Unity 正式场合

1. ChatdollKit + UniVRM + uLipSync。  
2. 同一套 Brain API（HTTP/WebSocket）喂讲稿与表演指令。

### 暂不建议

- 以 Open-LLM-VTuber 的 Live2D 为主形象长期投入（与「可换模」目标冲突）。  
- 一上来就 MetaHuman（除非已有 UE/GPU 团队）。

---

## 8. 开源许可注意（落地前必查）

| 注意点 | 说明 |
|--------|------|
| ChatVRM 原版已 archive | 商用请看 fork 与依赖许可证 |
| VRM 模型本身有授权 | VRoid Hub / 定制模型常限制二次分发、商用直播条款 |
| Live2D Cubism | 若混用 Live2D，另有 SDK 授权，与 VRM 路径不同 |
| AGPL 项目（如部分直播向仓库） | 若闭源商用产品需谨慎 |

---

## 9. 精简书签清单（建议收藏）

**整机优先读**

1. https://github.com/moeru-ai/airi  
2. https://github.com/shinshin86/aituber-onair  
3. https://github.com/Open-LLM-VTuber/Open-LLM-VTuber  
4. https://github.com/semperai/amica  
5. https://github.com/uezo/ChatdollKit  

**Web 闭环优先读**

6. https://github.com/pixiv/ChatVRM  
7. https://github.com/pradhankukiran/talk2avatar  
8. https://github.com/dexvdev/svelte-vrm-live  
9. https://github.com/ARPAHLS/avatar  

**基础设施**

10. https://github.com/pixiv/three-vrm  
11. https://github.com/vrm-c/UniVRM  
12. https://github.com/hecomi/uLipSync  

**社区话题索引**

- GitHub Topic: [ai-vtuber](https://github.com/topics/ai-vtuber)  
- Hugging Face 讨论：[An AI streaming buddy like Neuro-sama](https://discuss.huggingface.co/t/an-ai-streaming-buddy-like-neuro-sama/172830)（含开源选型表）

---

## 10. 一句话结论

开源侧已经证明：**「LLM → TTS → VRM 口型/表情」** 是成熟路径；  
**Neuro-sama 类整机**（AIRI、Open-LLM-VTuber、AITuber OnAir）和 **ChatVRM 系浏览器 Demo** 都是可跑的案例。  

你的差异化不必再发明绑骨，而应放在：**竞标/答辩知识库（Skill+MD）+ 表演导演协议 + 可换 VRM 资产规范**。

---

*本文档可与画布 `canvases/virtual-host-avatar-options.canvas.tsx` 对照阅读。*  
*皮套制作（非专业 + AI）见：[virtual-host-avatar-skin.md](./virtual-host-avatar-skin.md)。*
