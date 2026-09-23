import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const WASM_RELATIVE_DIR = path.join('mediapipe', 'wasm');
const WASM_URL_PREFIX = '/mediapipe/wasm/';
const PACKAGE_WASM_DIR = path.join(
  '@mediapipe',
  'tasks-vision',
  'wasm',
);

function resolveWasmSource(appRoot: string): string | null {
  // npm workspaces 会把依赖提升到仓库根 node_modules
  const candidates = [
    path.resolve(appRoot, 'node_modules', PACKAGE_WASM_DIR),
    path.resolve(appRoot, '..', '..', 'node_modules', PACKAGE_WASM_DIR),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

/**
 * 把 `@mediapipe/tasks-vision` 自带的 wasm 同步到 `public/mediapipe/wasm/`。
 *
 * 背景：面捕 Worker 原先从 jsDelivr 按写死的版本号拉 wasm，而该版本在 npm 上并不存在
 * （404），且 CDN 版本与本地安装的 npm 包版本可能不一致。改为同步本地文件后，
 * 版本与 JS 包天然匹配、无需联网，也不再需要手动 setup 步骤。
 *
 * 生成物在 .gitignore 中排除；仅在内容有变化时覆盖，避免开发时反复触发重载。
 */
export function mediapipeWasmAssets(): Plugin {
  let appRoot = process.cwd();

  return {
    name: 'ssreporter-mediapipe-wasm',

    configResolved(config) {
      appRoot = config.root;
    },

    /**
     * 兜底：正常路径下 glue 由 Worker 里的 `self.import` 以 classic script 求值
     * （见 faceCapture.worker.ts），不会走 Vite 的模块解析。但若某处退化成
     * `await import(<wasmLoaderPath>)`，Vite 会给该 URL 追加 `?import`，而 public/
     * 下的文件不在模块图里、带查询会解析失败（500）。这里在 Vite 内部中间件之前
     * 拦下该前缀、忽略查询串，直接按静态文件返回，避免出现难懂的 500。
     */
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (!pathname.startsWith(WASM_URL_PREFIX)) {
          next();
          return;
        }

        const wasmDir = path.join(appRoot, 'public', WASM_RELATIVE_DIR);
        const filePath = path.join(
          wasmDir,
          decodeURIComponent(pathname.slice(WASM_URL_PREFIX.length)),
        );
        if (!filePath.startsWith(wasmDir) || !fs.existsSync(filePath)) {
          next();
          return;
        }

        res.setHeader(
          'Content-Type',
          filePath.endsWith('.wasm') ? 'application/wasm' : 'text/javascript',
        );
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(filePath).pipe(res);
      });
    },

    buildStart() {
      const source = resolveWasmSource(appRoot);
      if (!source) {
        this.warn(
          '未找到 @mediapipe/tasks-vision/wasm —— 面捕模式将不可用，请先执行 npm install',
        );
        return;
      }

      const target = path.join(appRoot, 'public', WASM_RELATIVE_DIR);
      fs.mkdirSync(target, { recursive: true });

      for (const name of fs.readdirSync(source)) {
        const from = path.join(source, name);
        if (!fs.statSync(from).isFile()) {
          continue;
        }
        const to = path.join(target, name);
        const content = fs.readFileSync(from);
        const existing = fs.existsSync(to) ? fs.readFileSync(to) : null;
        if (existing?.equals(content)) {
          continue;
        }
        fs.writeFileSync(to, content);
      }
    },
  };
}
