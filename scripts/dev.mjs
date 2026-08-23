/**
 * Start Vite + TTS gateway without nested `npm run` / cmd.exe batches.
 * On Windows, Ctrl+C exits cleanly (no garbled "终止批处理操作吗" prompt).
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(repoRoot, 'apps/presenter-onair');
const viteBin = path.join(repoRoot, 'node_modules/vite/bin/vite.js');
const ttsStart = path.join(repoRoot, 'apps/tts-gateway/scripts/start.mjs');

/** @type {import('node:child_process').ChildProcess[]} */
const children = [];
let shuttingDown = false;
let exitCode = 0;

function prefixStream(stream, label, target) {
  if (!stream) {
    return;
  }
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`[${label}] ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer.length > 0) {
      target.write(`[${label}] ${buffer}\n`);
    }
  });
}

function spawnService(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: process.env,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  prefixStream(child.stdout, label, process.stdout);
  prefixStream(child.stderr, label, process.stderr);

  children.push(child);
  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }
    shutdown(signal ? 0 : code ?? 1);
  });

  return child;
}

function killProcessTree(child) {
  if (!child.pid || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }

  child.kill('SIGTERM');
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  exitCode = code;

  for (const child of children) {
    killProcessTree(child);
  }

  setTimeout(() => process.exit(exitCode), 150).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

spawnService('web', process.execPath, [viteBin], { cwd: webRoot });
spawnService('tts', process.execPath, [ttsStart], { cwd: repoRoot });

console.log('[dev] Vite + TTS gateway starting (Ctrl+C to stop)');
