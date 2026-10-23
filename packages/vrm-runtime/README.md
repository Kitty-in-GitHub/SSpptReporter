# packages/vrm-runtime（预留，未参与构建）

VRM 加载、口型、表情/动作播放在主应用内实现，尚未抽包。

当前实现位置：

- 呈现层协议与 hook：[`apps/presenter-onair/src/lib/avatar`](../../apps/presenter-onair/src/lib/avatar) · [`useAvatarPresenter`](../../apps/presenter-onair/src/hooks/useAvatarPresenter.ts)
- VRM 外壳与帧循环：[`AvatarPanel`](../../apps/presenter-onair/src/components/AvatarPanel.tsx) · [`AvatarShell`](../../apps/presenter-onair/src/components/AvatarShell.tsx)
- 表情控制器：[`vrmExpressionController`](../../apps/presenter-onair/src/lib/vrmExpressionController.ts)

**本目录没有 `package.json`，不参与 npm workspaces 构建。** 只有出现第二个消费方（例如独立非 VRM 后端）时才值得抽包，见 [`docs/decisions.md`](../../docs/decisions.md) ADR-011。
