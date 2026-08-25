import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePython } from './python.mjs';

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requirements = path.join(gatewayRoot, 'requirements-asr.txt');
const python = resolvePython();

console.log(`[tts-gateway] Using Python: ${python}`);
console.log('[tts-gateway] Installing ASR requirements (faster-whisper)…');
console.log('[tts-gateway] First run may download the Whisper model (~150MB for base).');

const result = spawnSync(
  python,
  ['-m', 'pip', 'install', '-r', requirements],
  { stdio: 'inherit', shell: false },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('[tts-gateway] ASR setup complete. Restart npm run dev to load Whisper.');
