# 上游血缘与 Fork（AITuber OnAir）

SSreporter 的身体底座来自 [AITuber OnAir](https://github.com/shinshin86/aituber-onair)（MIT，© Yuki Shindo）。  
当前仓库是在 VRM 模板上演进的 **monorepo 衍生项目**，不是上游整仓的 1:1 拷贝。

## GitHub 不能事后「挂上」fork 关系

已有的独立仓库（如 `Kitty-in-GitHub/SSpptReporter`）**无法**被 GitHub 改成 `forked from shinshin86/aituber-onair`。  
若需要网络上的 fork 徽章 / 方便对上游开 PR，只能走下面方案之一。

## 推荐：双仓（产品仓 + 上游 fork）

| 仓库 | 角色 |
|------|------|
| **SSpptReporter**（本仓） | 答辩助手产品：Director、Present、`content/` 示例、TTS 网关等 |
| **aituber-onair 的真实 fork** | 只服务「给上游贡献」：在 fork 上改模板/修 bug，再开 PR |

步骤：

```bash
# 1. 在 GitHub 上 Fork shinshin86/aituber-onair
#    或：gh repo fork shinshin86/aituber-onair --clone

# 2. 本仓继续作为主开发仓；README / NOTICE 写明上游

# 3. 若要给上游贡献：在 fork 仓 cherry-pick / 重做补丁后开 PR
```

优点：产品历史与上游历史不搅在一起；PR 路径清晰。  
缺点：没有「本仓 forked from …」那一行徽章（用 README 致谢补足）。

## 备选：新建 fork 后 force-push 本仓历史

若你**强烈需要** GitHub 显示 `forked from aituber-onair`：

1. Fork `shinshin86/aituber-onair`（可改名，例如仍叫 `SSpptReporter`，需先处理旧仓命名冲突）
2. 把本仓分支 force-push 到该 fork 的默认分支
3. 旧独立仓归档或删除

注意：

- 会丢掉与上游 commit 的可对齐历史；仅获得 **GitHub 元数据上的 fork 关系**
- 目录结构与上游不同，对上游开 PR 仍然很吃力，往往仍要在干净 fork 上重做补丁
- 公开前务必确认无私有讲稿 / 密钥

## 本仓已做的合规与致谢

- `LICENSE`：MIT，保留 Yuki Shindo 与 SSreporter 版权行
- `NOTICE`：说明衍生自 AITuber OnAir 与 `@aituber-onair/*` 依赖
- `apps/presenter-onair/MIKO_ASSET_TERMS.md`：Miko 角色条款（非 MIT）

本地可加 upstream remote（仅同步参考，**不会**变成 GitHub fork）：

```bash
git remote add upstream https://github.com/shinshin86/aituber-onair.git
git fetch upstream
```
