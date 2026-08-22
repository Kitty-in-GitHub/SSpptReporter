# 开源底座选型结论

> 决策日期：2026-08-21  
> 前提：皮套 = VRoid→VRM；后续自建知识库 + Director；开源负责「会说话的身体」。

---

## 选定：**AITuber OnAir（VRM 模板）**

- 仓库：https://github.com/shinshin86/aituber-onair  
- 脚手架：`npm create aituber-onair@latest -- --template vrm`  
- 文档/站点：https://aituberonair.com  

### 为什么选它

| 维度 | 说明 |
|------|------|
| 对齐你的架构 | 提供 VRM 加载、口型、LLM/TTS 模块；**导演层空出来给你写** |
| 技术栈 | TypeScript / React，和计划中的 Web 双栏、Director JSON 好接 |
| 许可 | MIT，后续商用/改协议压力小 |
| 中文语音 | 生态里常见 VOICEVOX 等，比纯英文 TTS Demo 更适合答辩 |
| 可维护性 | 工具包式拆分（chat / voice / 模板），比「大而全整机」好改 |

### 你后续怎么叠

```
AITuber OnAir VRM 模板     ← 身体 + 语音管线（选用）
        ↑
  Director（自研）         ← 消费 director-action.schema.json
        ↑
  Brain：Skill + MD/RAG    ← 自研知识库
        ↑
  幻灯 UI（自研双栏）       ← Present / Q&A 翻页
```

---

## 明确不选作主底座（及原因）

| 项目 | 原因 |
|------|------|
| **AITuberKit** | 幻灯+问答最全，但许可自定义、维护放缓；自带「讲页逻辑」易和你的 Director **抢权**。作**交互参考**即可，不建议当主仓库。 |
| **talk2avatar** | 口型链路很漂亮，适合当参考或备选；中文 TTS/模块化不如 OnAir 省心。 |
| **ChatdollKit** | Unity 栈，和当前 Web 计划不一致。 |
| **Khavee** | 更像 SDK，不是开箱应用；可作二期依赖。 |

---

## 建议的第一步（选定后）

1. 用官方 CLI 生成 VRM 模板工程（可放在 `apps/presenter-web` 或独立目录）。  
2. 换成你的 `assets/avatars/*.vrm`。  
3. 跑通：打字/说话 → TTS → 口型。  
4. 再加：读一条 `DirectorAction` fixture → 映射到「说话 + 表情」。  
5. 知识库与幻灯双栏按 Phase 1/2 再接。

AITuberKit 的 [Slide 文档](https://docs.aituberkit.com/en/guide/slide-settings) 仅作「讲页/问答翻页」产品参考，不必 fork 整仓。
