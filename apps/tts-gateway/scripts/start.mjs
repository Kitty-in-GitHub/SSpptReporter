import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pythonCanImportAll, resolvePython } from './python.mjs';

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = resolvePython();
const port = Number(process.env.TTS_GATEWAY_PORT || '5050');
const host = process.env.TTS_GATEWAY_HOST || '127.0.0.1';

function ensureDependencies() {
  if (pythonCanImportAll(python, ['edge_tts', 'fastapi', 'uvicorn'])) {
    return;
  }

  console.log('[tts-gateway] Python deps missing — run: npm run setup:tts');
  const setup = spawnSync(
    process.execPath,
    [path.join(gatewayRoot, 'scripts', 'setup.mjs')],
    { stdio: 'inherit', cwd: gatewayRoot },
  );
  if (setup.status !== 0) {
    process.exit(setup.status ?? 1);
  }
}

function isPortFree(bindHost, bindPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(bindPort, bindHost);
  });
}

async function main() {
  ensureDependencies();

  const free = await isPortFree(host, port);
  if (!free) {
    console.error(
      `[tts-gateway] Port ${port} is already in use on ${host}.`,
    );
    console.error(
      '[tts-gateway] Run from repo root: npm run dev:stop   then: npm run dev',
    );
    process.exit(1);
  }

  console.log(`[tts-gateway] Using Python: ${python}`);
  console.log(
    `[tts-gateway] Starting Edge-TTS gateway at http://${host}:${port}`,
  );
  console.log(
    `[tts-gateway] OpenAI endpoint: http://${host}:${port}/v1/audio/speech`,
  );

  const child = spawn(
    python,
    ['-m', 'uvicorn', 'server:app', '--host', host, '--port', String(port)],
    {
      cwd: gatewayRoot,
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        HOST: host,
        PORT: String(port),
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
}

main().catch((error) => {
  console.error('[tts-gateway]', error);
  process.exit(1);
});
