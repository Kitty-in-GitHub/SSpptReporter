import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePython } from './python.mjs';

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requirements = path.join(gatewayRoot, 'requirements.txt');
const python = resolvePython();

console.log(`[tts-gateway] Using Python: ${python}`);
console.log('[tts-gateway] Installing requirements…');

const result = spawnSync(
  python,
  ['-m', 'pip', 'install', '-r', requirements],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('[tts-gateway] Setup complete.');
