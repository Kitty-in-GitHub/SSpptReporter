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
npm install          # ⚠️ 必须先装！见下方「1.1.1 首次必须 npm install」
npm run setup:tts   # 若 environment.yml 已含 pip 依赖可跳过
npm run setup:asr   # 可选：本机 Whisper ASR（首次下载模型）
```

- Node 版本：conda 环境内 **Node 22**（见 `environment.yml`）
- Python：**3.11** + `edge-tts`（`environment.yml` 的 pip 段；或 `npm run setup:tts`）
- 勿用 base Miniconda 自带的 npm（曾出现损坏）

#### 1.1.1 首次必须 `npm install`（换机高频坑）

`scripts/dev.mjs` 直接以**仓库根** `node_modules/vite/bin/vite.js` 启动 Vite（npm workspaces 提升到根）。**新 clone / node_modules 被删后直接 `npm run dev` 必报**：

```
Error: Cannot find module 'D:\project\SSpptReporter\node_modules\vite\bin\vite.js'
```

这不是代码问题，是依赖没装。先 `npm install`（约 354 个包，2 分钟左右）。装完自检：

```bash
npm run dev
# → http://localhost:5173（Vite）+ http://127.0.0.1:5050（TTS 网关）
```

**`npm install` 报 EPERM 的两个原因与对策**：

1. **npm 缓存目录不可写**（默认 `%LOCALAPPDATA%\npm-cache`，可能被杀毒/权限挡住）：
   ```bash
   npm install --cache .\.npm-cache   # 缓存重定向到仓库内，干净且不污染系统
   ```
   `.npm-cache/` 已加进 `.gitignore`（本地缓存不提交，约 100MB，可留可删）。
2. **受限环境禁止 postinstall 脚本派生子进程**（sharp / esbuild 等包的安装脚本需要 spawn；沙箱或受限 CI 会报 `spawn EPERM`）：在**正常终端**（非受限环境）执行安装，或给执行环境完整权限。

**端口检查注意**：Vite 默认绑定 IPv6 `::1`，用 `127.0.0.1:5173` 探测可能失败，但浏览器开 `http://localhost:5173` 正常——属正常现象，不是故障。

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

> **⚠️ 2026-08-25 换机实测**：新机器 `public/avatar/` 与 `assets/avatars/` 均为空时，页面能起但**无角色/VRM load error**。换机后第一步就确认 VRM 是否在位，再谈验收。

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
- [ ] `conda activate ssreporter` + `npm install`（**换机后必跑**；若 lockfile 有变）
- [ ] VRM 文件已在 `public/avatar/`（**换机后必查**，缺失则页面无角色）
- [ ] `npm run dev` 能起：5173 返回页面、5050 有 Uvicorn 日志
- [ ] 未把 `token` / `.env` / `.vrm` 加入提交
- [ ] 改动结束后更新 `docs/dev-log.md`

---

## 7. 相关文档

- 开发日志：[`dev-log.md`](./dev-log.md)
- 架构决策：[`decisions.md`](./decisions.md)
- Director 协议：[`director-json-schema.md`](./director-json-schema.md)
- Phase0 验收：[`phase0-scaffold.md`](./phase0-scaffold.md)
- TTS 选型：[`tts-selection.md`](./tts-selection.md)
