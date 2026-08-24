#!/usr/bin/env node
/**
 * Download MIT-licensed VRMA gesture clips (hikari-archive) into public/avatar/gestures/.
 * Source: https://github.com/Kiu-Q/hikari-archive/tree/main/web/assets/VRMA
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/avatar/gestures');

const BASE =
  'https://raw.githubusercontent.com/Kiu-Q/hikari-archive/main/web/assets/VRMA';

/** Director gesture name → source file in hikari-archive */
const GESTURE_SOURCES = {
  bow: 'wave_both.vrma',
  nod: 'wave_left.vrma',
  think: 'idle_stretch.vrma',
  explain: 'wave_right.vrma',
  point_slide: 'idle_shoot.vrma',
  open_hands: 'idle_vSign.vrma',
  emphasize: 'idle_sport.vrma',
};

fs.mkdirSync(OUT_DIR, { recursive: true });

let ok = 0;
let fail = 0;

for (const [gesture, source] of Object.entries(GESTURE_SOURCES)) {
  const url = `${BASE}/${source}`;
  const dest = path.join(OUT_DIR, `${gesture}.vrma`);
  process.stdout.write(`Fetching ${gesture}.vrma ← ${source} ... `);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`${(buf.length / 1024).toFixed(0)} KiB`);
    ok += 1;
  } catch (error) {
    console.log(`FAILED (${error instanceof Error ? error.message : error})`);
    fail += 1;
  }
}

const notice = `# Gesture VRMA (local, not in Git)

Downloaded by \`node apps/presenter-onair/scripts/setup-gesture-vrma.mjs\`

| File | Source (hikari-archive, MIT) |
|------|------------------------------|
${Object.entries(GESTURE_SOURCES)
  .map(([g, s]) => `| ${g}.vrma | ${s} |`)
  .join('\n')}

Repo: https://github.com/Kiu-Q/hikari-archive
`;

fs.writeFileSync(path.join(OUT_DIR, 'README.md'), notice);

console.log(`\nDone: ${ok} ok, ${fail} failed → ${OUT_DIR}`);
if (fail > 0) {
  process.exit(1);
}
