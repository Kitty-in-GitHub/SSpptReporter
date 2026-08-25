import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePython } from './python.mjs';

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requirements = path.join(gatewayRoot, 'requirements-embed.txt');
const python = resolvePython();

console.log(`[tts-gateway] Using Python: ${python}`);
console.log('[tts-gateway] Installing embedding requirements (fastembed, CPU ONNX)…');
console.log(
  '[tts-gateway] First run may download BAAI/bge-small-zh-v1.5 (~100MB).',
);

const result = spawnSync(
  python,
  ['-m', 'pip', 'install', '-r', requirements],
  { stdio: 'inherit', shell: false },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('[tts-gateway] Embedding setup complete. Restart npm run dev to load model.');
