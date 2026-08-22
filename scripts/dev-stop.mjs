/**
 * Stop stale SSreporter dev listeners (Vite 5173, TTS 5050).
 * Safe to run before `npm run dev`; no-op when ports are free.
 */
import { execSync, spawnSync } from 'node:child_process';

const PORTS = [5173, 5174, 5050];

function getListeningPids(port) {
  if (process.platform === 'win32') {
    try {
      const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes('LISTENING')) {
          continue;
        }
        // IPv4 127.0.0.1:5173  or  IPv6 [::1]:5173
        if (!line.match(new RegExp(`:${port}\\s`))) {
          continue;
        }
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }
      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: 'utf8',
    });
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (process.platform === 'win32') {
    const result = spawnSync('taskkill', ['/PID', pid, '/F'], {
      stdio: 'ignore',
    });
    return result.status === 0;
  }

  const result = spawnSync('kill', ['-9', pid], { stdio: 'ignore' });
  return result.status === 0;
}

let stopped = 0;

for (const port of PORTS) {
  for (const pid of getListeningPids(port)) {
    if (killPid(pid)) {
      console.log(`[dev:stop] Freed port ${port} (PID ${pid})`);
      stopped += 1;
    }
  }
}

if (stopped === 0) {
  console.log('[dev:stop] Ports 5173, 5174 and 5050 are free.');
}
