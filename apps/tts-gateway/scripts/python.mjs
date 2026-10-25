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

/** 读取某 Python 环境里已安装包的版本；未安装或查询失败返回 null。 */
export function pythonPackageVersion(python, packageName) {
  const script = [
    'import importlib.metadata as m',
    `print(m.version(${JSON.stringify(packageName)}))`,
  ].join('; ');
  const result = spawnSync(python, ['-c', script], {
    encoding: 'utf8',
    shell: false,
    timeout: 20000,
  });
  if (result.status !== 0) {
    return null;
  }
  const version = (result.stdout || '').trim();
  return version || null;
}

/** 语义化版本比较：a < b 返回负数，相等 0，a > b 正数。非法片段按 0 处理。 */
export function compareVersions(a, b) {
  const parse = (value) =>
    String(value)
      .split(/[.+-]/)
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isFinite(part) ? part : 0));
  const left = parse(a);
  const right = parse(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}
