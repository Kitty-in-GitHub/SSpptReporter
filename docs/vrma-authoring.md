# 自制 VRMA 手势动作（Blender / Unity）

SSreporter 播放管线已支持：Director `gesture` → 加载 `public/avatar/gestures/<name>.vrma`（缺失则回退 Expression 面部近似）。

本文说明如何**对着现成 VRM 皮套**自制骨骼短动作并导出 `.vrma`。两条路径并列：**Blender** 与 **Unity**。都是「导入模型 → 扭骨头 / 挂动画 → 导出」，**不需要重建模型**。

---

## 目的与前置

| 项 | 说明 |
|----|------|
| 目标文件 | `apps/presenter-onair/public/avatar/gestures/<gesture>.vrma` |
| 文件名约定 | 与讲稿 `gesture` 字段一致，见下表 |
| 开源占位 | `npm run setup:gestures`（MIT，来自 hikari-archive；语义仅为近似） |
| 自写覆盖 | 用自制文件覆盖同名 `.vrma` 即可，无需改代码 |
| 皮套 | 本机 `StarString1.0.vrm`（不进 Git） |

### 文件名 ↔ Director gesture

| 文件 | 用途 |
|------|------|
| `bow.vrma` | 开场 / 结束致意 |
| `nod.vrma` | 点头认同 |
| `think.vrma` | 思考 |
| `explain.vrma` | 讲解 |
| `point_slide.vrma` | 指向幻灯 |
| `open_hands.vrma` | 开放说明 |
| `emphasize.vrma` | 强调 |

映射代码：[`apps/presenter-onair/src/lib/gestureToVrmReaction.ts`](../apps/presenter-onair/src/lib/gestureToVrmReaction.ts)。

### 路径怎么选

| 情况 | 建议 |
|------|------|
| 安装包要小、不想装游戏引擎 | **Blender**（约 350 MB 下载） |
| 已会 Unity / 想接 Mixamo Humanoid 现成动作 | **Unity + UniVRM**（编辑器体积大，数 GB 级） |

---

## 路径 A：Blender + VRM Add-on

### 软件下载

| 软件 | 链接 | 体量（约） |
|------|------|------------|
| Blender（官方） | https://www.blender.org/download/ | Windows x64 MSI ~344 MB |
| Blender（国内镜像示例） | https://mirrors.aliyun.com/blender/release/ | 同上 |
| VRM Add-on for Blender | https://vrm-addon-for-blender.info/ | 插件 zip，数 MB～十几 MB |
| 插件源码 / Release | https://github.com/saturday06/vrm-addon-for-blender | — |

建议使用较新的 Blender 4.x LTS，并安装与之匹配的 VRM Add-on 版本（以插件说明为准）。

### 简教程（手 K 短动作）

1. 安装 Blender；`Edit → Preferences → Add-ons → Install…` 选择 VRM Add-on 的 zip，启用插件。
2. `File → Import → VRM (.vrm)`，导入本机 `StarString1.0.vrm`（或你在用的皮套）。
3. 选中骨架（Armature），进入 **Pose Mode**。
4. 在时间轴设帧：例如第 1 帧为站立，中间帧脊柱前倾 / 手臂抬起，末帧回到站立（短动作 1～2 秒即可）。
5. 对改过的骨头按 `I` 插入关键帧（Location / Rotation）。
6. 时间轴播放预览，确认无严重穿模。
7. `File → Export → VRM Animation (.vrma)`，导出例如 `bow.vrma`。
8. 复制到 `apps/presenter-onair/public/avatar/gestures/`，覆盖占位文件。
9. `npm run dev` → 汇报 → 播放本场讲稿，确认对应页有骨骼动作。

可选：从 Mixamo / BVH 导入动作再映射到 VRM Humanoid 后导出；骨骼映射步骤见下文「图文」。

### 视频与图文（优先国内）

| 类型 | 链接 | 说明 |
|------|------|------|
| B 站视频 | [【blender】虚拟形象 VRM 制作教程](https://www.bilibili.com/video/BV1xD4y137ja/) | 偏 VRM 导入 / 插件入门；**导出 VRMA 以本文文字步骤为准** |
| B 站搜索 | 关键词：`Blender VRM 插件`、`Blender 导出 VRMA`、`Blender VRM 动画` | 专用「导出 VRMA」中文视频可能较少，以搜索结果为准 |
| 中文图文 | [VRMA 格式入门：BVH 转 VRMA（含 Blender）](https://xmohe.com/techie/vrma-animation-start-guide) | 含插件安装、骨骼映射、导出选项 |
| 官方说明 | [VRM Animation](https://vrm.dev/en/vrma/) | 格式与工具列表 |

---

## 路径 B：Unity + UniVRM

### 软件下载

| 软件 | 链接 | 说明 |
|------|------|------|
| Unity Hub（中国） | https://unity.cn/ | 建议再装 **2022.3 LTS** 编辑器 |
| Unity Hub（国际） | https://unity.com/download | 体积大（编辑器常数 GB） |
| UniVRM | https://github.com/vrm-c/UniVRM/releases | 下载与 Unity 版本匹配的 `.unitypackage` / UPM 包 |
| 官方 VRMA 导出说明 | https://vrm.dev/vrma/univrm-vrma/vrma-export/ | 英文 / 日文技术页 |
| 中文文档（VRCD） | [UniVRM 汉化](https://docs.vrcd.org.cn/books/vrm-univrm)、[VRM-Animation 导出](https://docs.vrcd.org.cn/books/vrm-vrm/page/vrm-animation-e4C) | 国内可读 |

菜单名随 UniVRM 版本可能略有差异；以你安装版本的文档为准。常见入口：`VRM1 → Experimental → Convert BVH to VRM-Animation`（把 BVH / Humanoid 动画转成 `.vrma`）。

### 简教程

1. 用 Unity Hub 新建 3D 工程（2022.3 LTS）。
2. 导入 UniVRM（Package / `.unitypackage`）。
3. 将 `StarString1.0.vrm` 拖入 `Assets`，生成带 Humanoid Avatar 的 Prefab，拖入场景。
4. **手 K**：打开 Animation 窗口，创建 Animation Clip，在 Timeline 上旋转骨骼关键帧（鞠躬、抬手等）。  
   **或**：从 Mixamo 下载 Humanoid FBX，Rig 设为 Humanoid，挂到同一 Avatar 上预览并裁剪。
5. 若有 BVH：按 UniVRM / VRCD 文档用 **Convert BVH to VRM-Animation**（或等价导出）生成 `.vrma`。  
   若仅有 Animation Clip：按 [VRM-Animation export](https://vrm.dev/vrma/univrm-vrma/vrma-export/) 用 exporter 逐帧导出（部分版本需脚本 / 示例工程）。
6. 将导出的文件改名为 `bow.vrma` 等，放入 `apps/presenter-onair/public/avatar/gestures/`。
7. `npm run dev` → 汇报 → 播放本场讲稿验证。

### 视频与图文（优先国内）

| 类型 | 链接 | 说明 |
|------|------|------|
| B 站视频 | [如何将 FBX 转化成 VRM（含 UniVRM / Humanoid）](https://www.bilibili.com/video/BV13541187K3/) | 偏 **模型** 导出与骨骼映射；**VRMA 动画导出以文字步骤 + VRCD 为准** |
| B 站搜索 | 关键词：`Unity UniVRM`、`Unity VRMA`、`BVH 转 VRMA`、`VRM Animation` | 专用 VRMA 导出视频较少，用关键词找最新投稿 |
| 中文图文 | [独游魔盒：Unity 端 VRMA](https://xmohe.com/techie/vrma-animation-start-guide) | 含 UniVRM 版本提示与转换思路 |
| 中文文档 | [VRCD：VRM Animation](https://docs.vrcd.org.cn/books/vrm-vrm/page/vrm-animation-vgc) | 概念与 UniVRM 能力 |

---

## 接入 SSreporter 检查清单

- [ ] 文件名与 `gesture` 枚举一致（见上表）
- [ ] 路径：`apps/presenter-onair/public/avatar/gestures/`（`*.vrma` 已 gitignore，换机需自备或再跑 `npm run setup:gestures`）
- [ ] 刷新或重启 `npm run dev` 后播放讲稿，对应页有**手臂 / 躯干**动作（不只是脸）
- [ ] 若动作穿模或幅度过大：回 Blender / Unity 减小旋转幅度后重新导出覆盖

相关代码：

- 播放：[`vrmaGesturePlayback.ts`](../apps/presenter-onair/src/lib/vrmaGesturePlayback.ts)
- 占位下载：[`scripts/setup-gesture-vrma.mjs`](../apps/presenter-onair/scripts/setup-gesture-vrma.mjs)

---

## 常见问题

**Q：Expression 和 VRMA 有什么区别？**  
Expression 只动面部 blendshape；VRMA 动骨骼（头、手、躯干）。二者可同时触发。

**Q：开源占位动作「不像鞠躬」？**  
正常。占位来自挥手 / 伸展等片段。要对齐语义请按本文自写 `bow.vrma` 等覆盖。

**Q：AI 能直接生成精美 VRMA 吗？**  
不能替代在 Blender / Unity 里精修。程序化关键帧最多做粗糙占位，答辩建议本机手 K 或改现成 Humanoid 动画。
