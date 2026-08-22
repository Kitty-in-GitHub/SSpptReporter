import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Prefer conda env python when `conda activate ssreporter` is active. */
export function resolvePython() {
  if (process.env.PYTHON?.trim()) {
    return process.env.PYTHON.trim();
  }

  const prefix = process.env.CONDA_PREFIX;
  if (prefix) {
    const candidate =
      process.platform === 'win32'
        ? path.join(prefix, 'python.exe')
        : path.join(prefix, 'bin', 'python');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

export function pythonCanImport(python, moduleName) {
  const result = spawnSync(python, ['-c', `import ${moduleName}`], {
    stdio: 'ignore',
    shell: false,
  });
  return result.status === 0;
}

export function pythonCanImportAll(python, moduleNames) {
  const script = moduleNames.map((name) => `import ${name}`).join('; ');
  const result = spawnSync(python, ['-c', script], {
    stdio: 'ignore',
    shell: false,
  });
  return result.status === 0;
}
