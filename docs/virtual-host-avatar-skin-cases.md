# 六条虚拟风皮套路径：案例列举

> 对应筛选后的 6 条路径，每条给「代表案例 / 工具链 / 你能学到什么」。  
> 日期：2026-08-20

---

## 路径 1：VRoid 捏人 → VRM

**形态**：参数捏二次元 3D → 导出 `.vrm` → 播控软件驱动。

| 类型 | 案例 | 链接 / 说明 |
|------|------|-------------|
| 工具本体 | VRoid Studio | https://vroid.com/en/studio |
| 模型库 | VRoid Hub | https://hub.vroid.com （可下载他人二次元模型，核授权） |
| 媒体实测 | Vulcan Post：VRoid + VSeeFace + OBS 从零开播 | https://vulcanpost.com/804203/review-vtuber-streaming-setup-vtube-studio-vseeface-vroid/ |
| 官方向教程 | VIVERSE：免费 3D 开播（VRoid → Warudo → OBS） | https://news.viverse.com/post/how-to-start-vtubing |
| 播控案例 | Warudo（SIGGRAPH Real-Time Live 展示的交互直播沙盒，常载 VRM） | https://warudo.app/ · https://blog.siggraph.org/2025/12/warudo-vtubing-interactive-storytelling.html/ |
| 个人实践 | Linux 冷启动笔记：自捏 VRoid → Warudo（含 blendshape 命名踩坑） | https://letsbuildroboticswithshadow8472.com/index.php/2025/12/29/cold-start-vtubing-in-linux-for-2026/ |

**典型闭环**：`VRoid → .vrm → VSeeFace / Warudo / VNyan → OBS`

---

## 路径 2：文生图 → PNGTuber

**形态**：AI 出虚拟风立绘差分 → 按音量/快捷键换图。

| 类型 | 案例 | 链接 / 说明 |
|------|------|-------------|
| AI 出皮 | MyShell PNGTuber Maker | https://art.myshell.ai/creative/pngtuber-maker |
| AI 出皮 | PNGTuberMaker（提示词/参考图 → 表情包 + OBS Browser Source） | https://pngtubermaker.com/ |
| AI 出皮 | AI Ease PNGTuber Maker | https://www.aiease.ai/ai-character-generator/pngtuber/ |
| 播控（经典） | veadotube / veadotube mini | https://veado.tube/ |
| 脚手架 | AITuber OnAir 的 PNG 模板 | `npm create aituber-onair@latest -- --template pngtuber` · https://github.com/shinshin86/aituber-onair |
| 入门文 | How to Make a PNGTuber for Free (2026) | https://pngtubermaker.com/guides/how-to-make-a-pngtuber |

**典型闭环**：`文生图差分 PNG → veadotube / OBS → 直播`

---

## 路径 3：AI 概念图 + VRoid 捏人 / 贴图

**形态**：AI 只定人设与外观；骨骼与表情仍用 VRoid 标准底座（社区最常见「非专业精致化」做法）。

| 类型 | 案例 | 链接 / 说明 |
|------|------|-------------|
| 底座 | 同路径 1：自捏或 Hub 底模 | VRoid Studio / Hub |
| 概念生产 | 任意二次元文生图（SD + Animagine 等、NovelAI、商业站） | 出立绘/三视图/配色板，再对照捏 |
| 贴图增强 | VRoid 内置纹理绘制；或外部画好 UV 贴回去 | 官方能力说明见 VRoid 站点 |
| 工程化变体 | AutoVtuber 战略文档中的「B 路线：用户自捏 VRoid + AI 只加速贴图」 | https://github.com/Lee-unhn/AutoVtuber/blob/master/AUTOVTUBER.md |
| 开播侧 | 同路径 1 的 VSeeFace / Warudo 案例 | 皮套差异只在「捏之前多了 AI 设定图」 |

**说明**：这条很少有单一产品名，本质是 **工作流案例**；行业入门文也普遍写「先定人设图，再用 VRoid 落地」。

**典型闭环**：`AI 立绘/设定 → VRoid 对照捏或换贴图 → .vrm → 播控`

---

## 路径 4：AutoVtuber 类（AI → 二次元标准底座 → VRM）

**形态**：表单/提示 → AI 概念（及贴图）→ 落到已绑好的 VRoid 系底座 → 可播 `.vrm`。

| 类型 | 案例 | 链接 / 说明 |
|------|------|-------------|
| 开源主案例 | Lee-unhn/AutoVtuber | https://github.com/Lee-unhn/AutoVtuber |
| 同系 fork | techtrekleo/AutoVtuber 等镜像 | GitHub 搜 AutoVtuber |
| 管线描述 | 表单 → Ollama 人设 → SDXL+Animagine 概念图 →（早期含 TripoSR）→ MeshFitter/贴图 → VRMAssembler → VSeeFace 可用 | README 与 `AUTOVTUBER.md` |
| 战略转向（重要） | 文档记载从「一键全生成」转向「**用户自捏 VRoid + AI 加速贴图**」，更贴版权与可商用 | 同上 `AUTOVTUBER.md` |
| 下游播控 | 输出声称兼容 VSeeFace / Warudo | 与路径 1 同一播控生态 |

**成熟度**：方向对、可当「量产换皮」原型；请自行跑通验收，勿当已量产 SaaS。

**典型闭环**：`表单/提示 → AutoVtuber → .vrm (+ persona.md) → VSeeFace`

---

## 路径 5：Mannequin → Inochi2D

**形态**：2D 纸娃娃捏人 → 导出已带基础绑定的 Inochi2D → Session 直播。

| 类型 | 案例 | 链接 / 说明 |
|------|------|-------------|
| 捏人工具 | Mannequin Character Generator（AR14） | https://ar14.itch.io/mannequin |
| 文档 | Getting Started / Export（含 INX=Inochi2D） | https://ar14.works/docs/mannequin/ · https://ar14.works/docs/mannequin/exporting-basics/ |
| 官方 Devlog | 宣布 Inochi2D 导出；用途含 Inochi Session 直播 | https://ar14.itch.io/mannequin/devlog/655304/happy-holidays-lets-recap-and-plan-forward |
| 社区指南 | Steam：「From new design to vtuber」（Mannequin → Inochi Creator → Session） | https://steamcommunity.com/sharedfiles/filedetails/?id=3033438858 |
| 运行时 | Inochi2D / Inochi Creator / Inochi Session | https://inochi2d.com/ |
| 官方教程视频 | Mannequin → Inochi 直播流程（Devlog 中引用） | YouTube 检索 Mannequin Inochi2D（如 `4tdaQtvsLsA`） |

**典型闭环**：`Mannequin 捏人 → .inx → Inochi Creator 微调 → Inochi Session + 面捕 → OBS`

---

## 路径 6：商单虚拟风 Live2D / 定制 VRM

**形态**：画师出虚拟风立绘 + 绑骨师（或 3D 定制）→ 专业皮套；驱动用成熟软件。

| 类型 | 案例 | 链接 / 说明 |
|------|------|-------------|
| 产业标杆 | Hololive / Nijisanji 等事务所主播皮套 | 公开形象均为委托制作的虚拟风 Live2D/3D（非 DIY） |
| 驱动标准 | VTube Studio + Live2D Cubism 模型 | https://denchisoft.com/ （VTube Studio） |
| 接单市场 | VGen、Sketchfab 委托、各类 VTuber model commission | 搜 “Live2D commission” / “VRM commission” |
| DIY 对照价 | 入门指南中的价位带（PNG 低、Live2D 数百–数千美元、定制 3D 更高） | 例：https://kuroganeito.jp/vtubermodelcreation-en |
| 开源侧「用商单皮」 | Open-LLM-VTuber、AIRI 等可加载用户自备 Live2D/VRM | 皮套来自委托，大脑/驱动开源 |

**典型闭环**：`委托立绘+绑骨 → .json/.moc3 或定制 .vrm → VTube Studio / 自研运行时`

---

## 对照一览

| # | 路径 | 最像「已有案例」的抓手 | 案例密度 |
|---|------|------------------------|----------|
| 1 | VRoid→VRM | Vulcan/VIVERSE 开播文 + Warudo | 极多 |
| 2 | AI→PNGTuber | MyShell / PNGTuberMaker + veadotube | 多 |
| 3 | AI概念+VRoid | 工作流（Hub+自捏+贴图）；AutoVtuber B 路线文档 | 多（散） |
| 4 | AutoVtuber 类 | Lee-unhn/AutoVtuber 仓库本身 | 少但明确 |
| 5 | Mannequin→Inochi2D | AR14 官方导出 + Steam 指南 | 中 |
| 6 | 商单 Live2D/VRM | 事务所主播 + 委托市场 | 极多 |

---

## 建议怎么「点案例」

1. 先跟路径 **1** 的 Vulcan/VIVERSE 文走通一遍（证明虚拟风 3D 可播）。  
2. 用路径 **2** 的 PNGTuberMaker 出一套差分（证明 AI 换皮）。  
3. 路径 **4/5** 当进阶实验；路径 **6** 仅在要门面精美时启用。
