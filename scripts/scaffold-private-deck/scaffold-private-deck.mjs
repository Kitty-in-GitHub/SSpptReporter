#!/usr/bin/env node
/**
 * Scaffold a private defense deck under content-private/ (gitignored).
 *
 * Usage:
 *   npm run scaffold:deck -- --id my-defense --title "我的答辩" --pages 5
 *   npm run scaffold:deck -- --id my-defense --title "我的答辩" --force
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const templatesDir = path.join(scriptDir, 'templates');

const DECK_ID_RE = /^[a-z][a-z0-9_]{0,31}$/;

function parseArgs(argv) {
  const options = {
    id: '',
    title: '',
    pages: 3,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') {
      options.id = argv[++i]?.trim() ?? '';
    } else if (arg === '--title') {
      options.title = argv[++i]?.trim() ?? '';
    } else if (arg === '--pages') {
      options.pages = Number.parseInt(argv[++i] ?? '3', 10);
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`用法:
  npm run scaffold:deck -- --id <deckId> --title "<标题>" [--pages N] [--force]

选项:
  --id       场次标识（小写英文/数字/下划线，如 my_defense）
  --title    汇报工具栏显示标题
  --pages    生成 slides/01.md … 页数（默认 3）
  --force    覆盖已存在文件（默认跳过）

示例:
  npm run scaffold:deck -- --id my-defense --title "我的答辩" --pages 5
`);
}

function renderTemplate(name, vars) {
  const filePath = path.join(templatesDir, name);
  let text = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`{{${key}}}`, value);
  }
  return text;
}

function writeFile(targetPath, content, force, created, skipped) {
  if (fs.existsSync(targetPath) && !force) {
    skipped.push(targetPath);
    return;
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
  created.push(targetPath);
}

function padPage(n) {
  return String(n).padStart(2, '0');
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.id || !options.title) {
    console.error('错误：必须提供 --id 与 --title');
    printHelp();
    process.exit(1);
  }

  const deckId = options.id.toLowerCase().replace(/-/g, '_');
  if (!DECK_ID_RE.test(deckId)) {
    console.error(
      '错误：--id 需为小写英文/数字/下划线，且以字母开头（如 my_defense）',
    );
    process.exit(1);
  }

  const pages =
    Number.isFinite(options.pages) && options.pages >= 1
      ? Math.min(options.pages, 99)
      : 3;

  const vars = { deckId, title: options.title };
  const created = [];
  const skipped = [];

  const deckRoot = path.join(repoRoot, 'content-private', 'decks', deckId);
  const publicDeckRoot = path.join(
    repoRoot,
    'apps/presenter-onair/public/decks',
    deckId,
  );

  writeFile(
    path.join(deckRoot, 'deck.json'),
    renderTemplate('deck.json', vars),
    options.force,
    created,
    skipped,
  );

  writeFile(
    path.join(deckRoot, 'performance.json'),
    renderTemplate('performance.json', vars),
    options.force,
    created,
    skipped,
  );

  for (let page = 1; page <= pages; page += 1) {
    const slideVars = {
      ...vars,
      pageNum: String(page),
      pagePadded: padPage(page),
    };
    writeFile(
      path.join(deckRoot, 'slides', `${padPage(page)}.md`),
      renderTemplate('slide.md', slideVars),
      options.force,
      created,
      skipped,
    );
  }

  writeFile(
    path.join(repoRoot, 'content-private', 'persona', 'presenter.md'),
    renderTemplate('persona.md', vars),
    options.force,
    created,
    skipped,
  );

  writeFile(
    path.join(repoRoot, 'content-private', 'faq', `${deckId}.md`),
    renderTemplate('faq.md', vars),
    options.force,
    created,
    skipped,
  );

  writeFile(
    path.join(publicDeckRoot, 'README.txt'),
    renderTemplate('pdf-placeholder.txt', vars),
    options.force,
    created,
    skipped,
  );

  console.log(`\n场次「${deckId}」脚手架完成。\n`);
  if (created.length > 0) {
    console.log('已创建：');
    for (const file of created) {
      console.log(`  + ${path.relative(repoRoot, file)}`);
    }
  }
  if (skipped.length > 0) {
    console.log('\n已跳过（已存在，使用 --force 覆盖）：');
    for (const file of skipped) {
      console.log(`  · ${path.relative(repoRoot, file)}`);
    }
  }

  console.log(`
下一步：
  1. 拷贝 PDF → apps/presenter-onair/public/decks/${deckId}/slides.pdf
  2. 编辑 content-private/decks/${deckId}/slides/*.md 与 faq/${deckId}.md
  3. npm run compile:deck
  4. npm run dev → 汇报模式 → 场次选择 ${deckId}
`);
}

main();
