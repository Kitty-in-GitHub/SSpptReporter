# 架构决策记录（ADR）

跨设备开发时，**已拍板的决定不要重复争论**；若要推翻，先在此追加新 ADR 并说明原因。

格式：日期 · 状态（accepted / superseded）· 决策 · 理由

---

## ADR-001 · VRM 皮套路线

- **日期**：2026-08-20
- **状态**：accepted
- **决策**：VRoid Studio → `.vrm`；虚拟二次元风，不做写实数字人；不用 Live2D 作为主方案。
- **理由**：自动绑骨成本高；VRM 生态与 Web 运行时成熟。

## ADR-002 · 身体底座

- **日期**：2026-08-21
- **状态**：accepted
- **决策**：主应用基于 **AITuber OnAir** VRM 模板（`apps/presenter-onair`）；AITuberKit 仅作幻灯/Q&A UX 参考，不整仓依赖。
- **理由**：OnAir 已含 VRM + TTS + 口型管线；减少从零造轮子。

## ADR-003 · Director 协议

- **日期**：2026-08-21
- **状态**：accepted
- **决策**：Brain/LLM 只输出 `DirectorAction` JSON；单一 schema：`schemas/director-action.schema.json`；校验在 `packages/director`。
- **理由**：换皮套不改大脑；可测试、可日志、可打断。

## ADR-004 · 仓库与资产策略

- **日期**：2026-08-22
- **状态**：superseded by ADR-008
- **决策**：GitHub **私仓**；`content/` 知识库进 Git；**所有 `.vrm` 不进 Git**（含示例 miko）；密钥不进 Git。
- **理由**：答辩材料需版本管理；模型体积大且可能涉及授权；密钥安全。

## ADR-008 · 公开仓与双知识库

- **日期**：2026-08-23
- **状态**：accepted
- **决策**：
  - 代码仓可公开；根目录 MIT（`LICENSE` + `NOTICE`，致谢 AITuber OnAir）
  - **示例知识库** `content/` + `public/decks/demo/` 进公开仓
  - **私有知识库** `content-private/` 与非 demo 的 `public/decks/*` 不进 Git
  - `.vrm` / 密钥仍不进 Git
  - GitHub fork 血缘见 `docs/upstream-fork.md`（推荐产品仓 + 上游 fork 双仓）
- **理由**：真实答辩材料与示例分离；合规再分发；fork 元数据无法事后挂到已有独立仓。

## ADR-005 · 当前运行时模型

- **日期**：2026-08-22
- **状态**：accepted
- **决策**：运行时加载 `StarString1.0.vrm`；`miko.vrm` 保留在本地 `assets/avatars/` 与 `public/avatar/` 作备份，不删除。
- **理由**：用户定制皮套；保留 OnAir 默认以便回退。

## ADR-006 · 工具链与环境

- **日期**：2026-08-21
- **状态**：accepted
- **决策**：conda 环境 `ssreporter` + Node 22；npm workspaces（非 pnpm）；Windows 上不用 `conda run` 跑 npm。
- **理由**：base conda npm 曾损坏；workspaces 足够当前规模。

## ADR-007 · Phase 划分

- **日期**：2026-08-20
- **状态**：accepted
- **决策**：
  - **Phase 0**：VRM + TTS + 口型 + 单条 DirectorAction
  - **Phase 1**：知识库 + Present + PPT 双栏 + Director 队列
  - **Phase 2**：Q&A + ASR + `barge_in` 打断
- **理由**：先跑通身体，再叠大脑与答辩场景。
