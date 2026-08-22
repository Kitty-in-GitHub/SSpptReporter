import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePython } from './python.mjs';

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = resolvePython();
const port = process.env.TTS_GATEWAY_PORT || '5050';
const host = process.env.TTS_GATEWAY_HOST || '127.0.0.1';

function ensureDependencies() {
  const check = spawnSync(
    python,
    ['-c', 'import edge_tts, fastapi, uvicorn'],
    { stdio: 'ignore', shell: process.platform === 'win32' },
  );
  if (check.status === 0) {
    return;
  }

  console.log(
    '[tts-gateway] Python deps missing — run: npm run setup:tts',
  );
  const setup = spawnSync(
    process.execPath,
    [path.join(gatewayRoot, 'scripts', 'setup.mjs')],
    { stdio: 'inherit', cwd: gatewayRoot },
  );
  if (setup.status !== 0) {
    process.exit(setup.status ?? 1);
  }
}

ensureDependencies();

console.log(
  `[tts-gateway] Starting Edge-TTS gateway at http://${host}:${port}`,
);
console.log(
  `[tts-gateway] OpenAI endpoint: http://${host}:${port}/v1/audio/speech`,
);

const child = spawn(
  python,
  ['-m', 'uvicorn', 'server:app', '--host', host, '--port', port],
  {
    cwd: gatewayRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      HOST: host,
      PORT: port,
      DEFAULT_VOICE: process.env.DEFAULT_VOICE || 'zh-CN-XiaoxiaoNeural',
    },
  },
);

const shutdown = () => {
  if (!child.killed) {
    child.kill('SIGTERM');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
