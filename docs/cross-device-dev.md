# 跨设备开发手册

面向**人类开发者**与**其他设备上的 AI**：在同一私仓上接力开发时的环境、同步与排错。

私仓：`https://github.com/Kitty-in-GitHub/SSpptReporter.git`  
AI 快速入口：根目录 [`AGENTS.md`](../AGENTS.md)

---

## 1. 每台机器首次搭建

### 1.1 克隆与依赖

```bash
git clone https://github.com/Kitty-in-GitHub/SSpptReporter.git
cd SSpptReporter
conda env create -f environment.yml   # 已有则：conda activate ssreporter
# 旧环境只有 Node 时，补装 Python + edge-tts：
# conda env update -f environment.yml --prune
conda activate ssreporter
npm install
npm run setup:tts   # 若 environment.yml 已含 pip 依赖可跳过
```

- Node 版本：conda 环境内 **Node 22**（见 `environment.yml`）
- Python：**3.11** + `edge-tts`（`environment.yml` 的 pip 段；或 `npm run setup:tts`）
- 勿用 base Miniconda 自带的 npm（曾出现损坏）

### 1.2 本地独有文件（不进 Git）

| 文件 | 作用 | 获取方式 |
|------|------|----------|
| `assets/avatars/StarString1.0.vrm` | 主皮套归档 | 网盘 / U 盘 / 另一台机器拷贝 |
| `apps/presenter-onair/public/avatar/StarString1.0.vrm` | 浏览器运行时加载 | 从 `assets/avatars/` 复制 |
| `assets/avatars/miko.vrm` | OnAir 默认示例备份 | 可选；另一台若从未有过可从 OnAir 模板重新拿 |
| `.env` | LLM / TTS API Key | 本机新建，参考 `.env.example`（若有）；TTS 选型见 [`docs/tts-selection.md`](./tts-selection.md) |
| `token` | GitHub PAT（若用） | 本机临时文件，**勿提交** |

复制 VRM 后启动：

```bash
conda activate ssreporter
npm run setup:tts   # 首次或 pip 依赖缺失时
npm run dev
# → http://localhost:5173 + http://127.0.0.1:5050（TTS）
# 仅页面：npm run dev:web
```

### 1.3 GitHub 认证（推送私仓）

推荐 **Git Credential Manager**，不要用把 token 写进 remote URL 的方式。

```powershell
# PowerShell 示例（username 为 GitHub 账号名）
@"
protocol=https
host=github.com
username=Kitty-in-GitHub
password=<你的 Fine-grained PAT>
"@ | git credential-manager store
```

Fine-grained PAT 需：**Repository** 选 `SSpptReporter`，**Contents: Read and write**。

验证：`git ls-remote origin` 应能看到 `main` 的 hash。

---

## 2. 日常同步流程

```bash
# 开始工作前
git pull origin main

# 开发中
npm run dev          # 热更新
npm run typecheck    # 提交前建议跑

# 结束后
git status
git add <files>
git commit -m "简述原因"
git push origin main
```

**换机后 AI 接力**：`git pull` 后阅读 `docs/dev-log.md` 最新一条。

---

## 3. Monorepo 说明

| 包 | 路径 | 说明 |
|----|------|------|
| `@ssreporter/presenter-onair` | `apps/presenter-onair` | Vite + React + OnAir |
| `@ssreporter/director` | `packages/director` | 协议类型与校验 |

- 根目录 `npm install` 安装全部 workspace
- `npm run dev` 在根目录即可启动 onair
- `@ssreporter/director` 通过 Vite alias 指向 `packages/director/src`（开发期直引 TS）

---

## 4. 皮套（VRM）切换

当前运行时：`StarString1.0.vrm`

1. 改 `apps/presenter-onair/src/components/AvatarPanel.tsx` 中 `VRM_FILE_URL`
2. 同步改 `App.tsx` 中 `VRM_EFFECT_ANCHOR_PROFILE_ID`（表情锚点配置按模型区分）
3. 将 `.vrm` 放到 `public/avatar/`（文件名与 URL 一致）
4. 可选备份到 `assets/avatars/`

换回默认 `miko.vrm`：URL 改回 `avatar/miko.vrm`，确保 `public/avatar/miko.vrm` 存在。

---

## 5. 常见问题

### `conda run -n ssreporter -- npm …` 报 UnicodeEncodeError

Windows GBK 与 conda run 冲突。**先** `conda activate ssreporter`，再直接 `npm`。

### Vite 启动报 `three.module.js` ENOENT

workspaces 把 `three` 提升到根 `node_modules`。确认 `apps/presenter-onair/vite.config.ts` 中 alias 为 `../../node_modules/three`，且根目录已 `npm install`。

### `git push` 报 Repository not found

- 私仓权限 / PAT 范围不对
- 用 `git credential-manager` 重新存凭据
- 确认 remote：`git remote -v` → `origin` 指向 `SSpptReporter.git`

### 页面无角色 / VRM load error

本地缺少 `public/avatar/StarString1.0.vrm`（未进 Git）。从 `assets/avatars/` 或网盘复制。

### 有声音但口型不动

Web Speech（Director Phase0 按钮）通常**无 viseme**。在 Settings 配置 VOICEVOX 等 TTS，并确认模型含口型 Expression（Aa/Ih/Ou 等）。

### 两台机器路径不同

文档中的 `d:\project\SSreporter` 仅为示例；以本机 clone 路径为准。环境统一靠 `environment.yml` + `package-lock.json`。

---

## 6. 给 AI 的交接清单

新会话开始时请确认：

- [ ] 已读 `AGENTS.md` 与 `docs/dev-log.md` 最新条目
- [ ] `git pull` 完成
- [ ] `conda activate ssreporter` + `npm install`（若 lockfile 有变）
- [ ] VRM 文件已在 `public/avatar/`
- [ ] 未把 `token` / `.env` / `.vrm` 加入提交
- [ ] 改动结束后更新 `docs/dev-log.md`

---

## 7. 相关文档

- 开发日志：[`dev-log.md`](./dev-log.md)
- 架构决策：[`decisions.md`](./decisions.md)
- Director 协议：[`director-json-schema.md`](./director-json-schema.md)
- Phase0 验收：[`phase0-scaffold.md`](./phase0-scaffold.md)
- TTS 选型：[`tts-selection.md`](./tts-selection.md)
