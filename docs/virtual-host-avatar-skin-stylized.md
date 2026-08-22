# 虚拟风格皮套方案（已筛掉写实）

> 约束：**只要虚拟风格**（二次元 / 卡通 / 风格化 3D），不要写实、不要「真人照片数字人」。  
> 焦点：非专业 + AI 能做出可驱动的皮套。  
> 日期：2026-08-20

---

## 已排除

| 排除项 | 原因 |
|--------|------|
| VTubeMe 等自拍→写实 VRM | 写实向 |
| MuseTalk / LivePortrait + 真人照片 | 写实数字人 |
| MetaHuman / Audio2Face | 写实高端 |
| Ready Player Me 类写实捏人 | 风格不符 |

神经数字人若输入是 **AI 二次元立绘**（非真人照），风格上仍算虚拟风，但工程上是「会说话的立绘」而非传统皮套；下文单独标为备选，不进主推荐。

---

## 筛选后的主推荐（只保留虚拟风）

| 优先级 | 方案 | 风格 | 非专业难度 | 可播性 | 一句话 |
|--------|------|------|------------|--------|--------|
| **1** | **VRoid 捏人 → VRM** | 二次元 3D | 低（滑条） | 最高 | 虚拟风默认答案 |
| **2** | **文生图 → PNGTuber** | 任意虚拟插画风 | 最低 | 高 | AI 换皮最快 |
| **3** | **AI 概念图 + VRoid 贴图/配色** | 二次元 3D + 你的设定 | 低–中 | 高 | 兼顾独特与可驱动 |
| **4** | **AutoVtuber 类（AI→VRoid 底座）** | 二次元 3D | 中（要跑管线） | 中–高 | 量产换皮实验方向 |
| **5** | **Mannequin → Inochi2D** | 2D 卡通/二次元 | 低–中 | 中 | 比 Live2D 省事的 2D |
| **6** | **商单虚拟风 Live2D / 定制 VRM** | 最精美虚拟风 | 付钱即可 | 最高 | 要「精美」时再上 |
| 备选 | **二次元立绘 → 神经口型** | 虚拟插画风 | 低 | 中（要 GPU） | 半身说话立绘，非传统皮套 |
| 不荐 | 文生 mesh→AutoRig 当主皮套 | 风格不稳 | 高翻车 | 差 | 脸与二次元一致性差 |
| 不荐 | 自学 Live2D 绑骨 | — | 很高 | — | 与非专业目标冲突 |

---

## 推荐怎么选（虚拟风专用）

### A. 要稳定、要接成熟驱动（答辩/直播都用）→ **VRoid**

- [VRoid Studio](https://vroid.com/en/studio) 免费捏人 → `.vrm`
- 可下 [VRoid Hub](https://hub.vroid.com) 模型（核授权）
- 驱动：AIRI / ChatdollKit / three-vrm / AITuber VRM 模板均可

**AI 用法**：只做人设与概念图，不负责绑骨。

### B. 要画风自由、最快迭代 → **PNGTuber**

- 二次元/卡通文生图 → 张嘴/闭嘴/情绪差分 PNG
- 驱动：AITuber OnAir PNG 模板、OBS、各类 PNGTuber 工具

**AI 用法**：皮套本体几乎全靠 AI；控制层最简单。

### C. 要「像自己的角色」又不要写实 → **概念图 + VRoid**

1. 文生图定发型/服装/配色  
2. VRoid 按图捏，或把 AI 花纹画进贴图  
3. 仍导出标准 VRM  

这是非专业里 **虚拟风辨识度** 和 **可驱动性** 平衡最好的组合。

### D. 想做可量产换皮体系 → **贴标准二次元底座（AutoVtuber 思路）**

- 开源参考：[AutoVtuber](https://github.com/Lee-unhn/AutoVtuber)  
- 表单 → SDXL 二次元概念 → 贴合 **VRoid 底座** → `.vrm`  
- 不是写实管线；目标就是虚拟风量产

### E. 坚持 2D 动态、又不要 Cubism → **Mannequin / Inochi2D**

- [Mannequin](https://ar14.itch.io/mannequin) 捏 2D 角色，可导出 Inochi2D  
- 仍有一点学习成本，但远低于 Live2D 商单流程

---

## 场景速查（虚拟风）

| 场景 | 首选 | 次选 |
|------|------|------|
| 竞标/答辩（虚拟形象即可） | VRoid 正装捏人 | 概念图+VRoid；或商务风二次元 PNG 半身 |
| 日常直播 / 人设玩梗 | PNGTuber | VRoid |
| 经常换皮、多角色 | PNGTuber 或 AutoVtuber 方向 | VRoid Hub 多模 |
| 要「精美到能当门面」 | 商单虚拟风 Live2D 或定制 VRM | 自己深捏 VRoid + 定制贴图 |

---

## 和驱动怎么接（只列虚拟风资产）

```
虚拟风皮套                 驱动
─────────────             ────
VRoid / Auto → .vrm   →   three-vrm / AIRI / ChatdollKit …
AI 插画差分 PNG       →   PNGTuber / AITuber PNG 模板
Mannequin → Inochi2D  →   Inochi Session
二次元立绘（备选）     →   神经口型（非必需）
```

---

## 结论（筛完就这三句）

1. **主路径：VRoid（虚拟风 3D 皮套标准答案）。**  
2. **AI 主战场：文生图做设定 + PNG 差分，或给 VRoid 当概念/贴图。**  
3. **量产换皮：走「AI → 二次元标准底座」，不要走写实，也不要赌自动 Live2D 绑骨。**

写实向工具对本需求一律可忽略。

---

**案例列举（6 条路径）** → [virtual-host-avatar-skin-cases.md](./virtual-host-avatar-skin-cases.md)
