# 开源项目对照：你的计划能否「拿来就用」

> 你的计划摘要：VRoid→VRM 皮套 + 讲 PPT + 评委问答 + LLM/Skill/MD + Director 式表演。  
> 结论先说：**没有 100% 对口、开箱即答辩的成品**；有 **1 个最接近整机**，以及若干可拼装部件。  
> 日期：2026-08-21

---

## 1. 总判

| 问题 | 答案 |
|------|------|
| 有没有「装上就能答辩」的开源？ | **基本没有**（尤其缺：你的 Director Schema、Skill+MD 竞标知识、正式 PPT 控场） |
| 有没有「最接近、值得 fork」的？ | **有：AITuberKit（幻灯模式 + VRM + 问答翻页）** |
| 身体层（VRM 说话）现成吗？ | **有，且成熟**（talk2avatar / AITuber OnAir VRM / ChatdollKit） |
| 讲稿/PPT 层现成吗？ | **部分有**（AITuberKit Slide；Presenton/Docent 偏生成 PPT，不是虚拟主播） |

---

## 2. 最接近整机（优先看）

### ★ [AITuberKit](https://github.com/tegnike/aituber-kit)（文档：https://docs.aituberkit.com/）

| 你的需求 | 它有没有 |
|----------|----------|
| VRM 皮套 | ✅ |
| 讲幻灯 | ✅ **Slide Mode**（AI 按页讲解） |
| PDF→幻灯数据 | ✅（多模态分析） |
| 问答 | ✅（暂停后提问；可自动切相关页） |
| Live2D 也可 | ✅（你可只用 VRM） |
| 你的 Director JSON / Skill+MD | ❌ 需自己改 |
| 维护状态 | ⚠️ 文档写明活跃开发放缓，仍可用；**商用请看其自定义许可** |

**为何最贴**：同时覆盖「讲页 + 问答指页 + VRM」，是开源里离「答辩主播」最近的一条。  
**缺口**：不是为竞标/答辩知识库设计的；要换成你的材料结构与话术红线。

幻灯说明：https://docs.aituberkit.com/en/guide/slide-settings

---

## 3. 身体 / 对话层（可直接当 Phase 0～2 底座）

| 项目 | 链接 | 能直接用的 | 相对你计划的缺口 |
|------|------|------------|------------------|
| **talk2avatar** | https://github.com/pradhankukiran/talk2avatar | 流式 LLM→TTS→VRM 口型，Web 全栈 | 无 PPT、无按页 RAG |
| **AITuber OnAir**（VRM 模板） | https://github.com/shinshin86/aituber-onair | `create-aituber-onair --template vrm`；LLM/TTS/口型模块化 | 偏直播弹幕，非答辩幻灯 |
| **Khavee SDK** | https://github.com/khavee-ai/khavee-sdk | React VRM + 可插拔 VAD/STT/LLM/TTS + RAG 包 | 无现成「讲 PPT」壳 |
| **ChatdollKit** | https://github.com/uezo/ChatdollKit | Unity+VRM+口型+多 LLM；可外控 | 要 Unity；无 PPT 双栏 |
| **Persona / Violet** | https://github.com/Hamza-Bilal-2002/Persona | 桌面 VRM + RAG + 语音 | 助手向，非讲稿控场 |
| **Amica** | https://github.com/semperai/amica | 浏览器 VRM 对话 | 无幻灯导演 |

这些适合：**fork 做 Body+Voice**，再自己加幻灯与 Director。

---

## 4. 讲稿 / PPT 层（有幻灯、无你的 VRM 主播）

| 项目 | 链接 | 说明 |
|------|------|------|
| Presenton | https://github.com/presenton/presenton | AI **生成**可编辑 PPT，不是虚拟人讲解 |
| Docent / Sage | https://github.com/symbiont-ai/docent | PDF→叙述讲课 + TTS + 会后问答；**无 VRM** |
| DeepSlide | https://github.com/PUITAR/DeepSlide | 全流程准备/彩排；**无 VRM 皮套** |
| CLARA2 | https://github.com/0xMatthew/CLARA2 | PPT→讲稿→MetaHuman；栈重且非虚拟风 VRM |

可借鉴「按页讲稿 / 问答」，但形象层要换成你的 VRM。

---

## 5. 和你已定架构的贴合度

```
你的层          现成开源覆盖
────────        ────────────
皮套 VRM        VRoid（闭源捏）+ 各项目加载器 ✅
Body 口型       talk2avatar / OnAir / Khavee / ChatdollKit ✅
Voice ASR/TTS   同上 ✅
Brain 通用对话  同上 ✅
讲 PPT 控场     AITuberKit Slide ⭐ / 其余弱
评委问答+指页   AITuberKit ⭐ / Docent（无 VRM）
Director Schema 无，用你仓库 schemas/ ✅ 自研
Skill + MD 竞标 无，需自研
```

---

## 6. 实操建议（三选一）

### A. 最快验证「讲页+问答」（推荐先试）

1. 跑通 **AITuberKit** Slide Mode + 自有 `.vrm`  
2. 塞进一场真实答辩 PDF/材料看效果  
3. 再决定：深改它，还是只学交互、身体改用 talk2avatar  

### B. 按你仓库脚手架自建（可控、对齐 Director）

1. Body：fork **talk2avatar** 或 **AITuber OnAir VRM 模板**  
2. 幻灯：自研双栏 + 按页索引（参考 AITuberKit / Docent 的「按页」思路）  
3. Brain：Skill + MD + 你的 `director-action.schema.json`  

### C. Unity 正式场合

**ChatdollKit** + 外控 Socket + 自研 PPT 控制（工作量大）。

---

## 7. 一句话

- **整机最接近**：AITuberKit  
- **身体最接近 Web MVP**：talk2avatar / AITuber OnAir VRM  
- **计划里的差异化**（Director Schema、竞标 Skill/MD、答辩红线）**仍要自己做**——开源帮你省的是「VRM 会说话」，不是「会答辩」。
