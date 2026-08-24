/**
 * Generate demo deck PDF. Uses Python + fpdf2 (CJK fonts via system font).
 * Requires: pip install fpdf2
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pyScript = path.join(scriptDir, 'generate-demo-deck.py');

const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
const result = spawnSync(pythonCmd, [pyScript], { stdio: 'inherit' });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
