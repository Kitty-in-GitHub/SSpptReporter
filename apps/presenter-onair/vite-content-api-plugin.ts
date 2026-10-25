import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { PDFDocument } from 'pdf-lib';
import type { PerformanceCatalog } from '../../packages/director/src/performance-profile.ts';
import {
  buildDeckManifestTemplate,
  buildEmptyPerformanceOverlay,
  buildSlideMarkdownTemplate,
  isValidDeckId,
  normalizeDeckId,
} from '../../packages/director/src/deck-scaffold.ts';
import {
  compileDeckDir,
  writeSlideMarkdown,
} from '../../packages/director/src/compile-deck-dir.ts';
import {
  listDeckCatalog,
  PRIVATE_CONTENT_DIR,
  resolveDeckContentRoot,
} from './content-roots';

const pluginDir = path.dirname(fileURLToPath(import.meta.url));
/** 运行时 PDF 目录：`public/decks/<deckId>/slides.pdf`（Vite 直接静态服务）。 */
const PUBLIC_DECKS_DIR = path.join(pluginDir, 'public', 'decks');

const MAX_PDF_BYTES = 256 * 1024 * 1024;
const MAX_SLIDES = 99;

const FAQ_TEMPLATE = `# {{title}} — 常见问题（FAQ）

> 每个条目用二级标题 \`## Q:\` 开头，Brain 会按关键词 / 向量检索注入 prompt。

## Q: 本项目的核心贡献是什么？

在此填写参考答案正文。可提示页码（见第 1 页）。

## Q: 如果问题不在材料里怎么办？

应诚实说明不在本次提交材料范围内，不编造。
`;

export interface DeckSummary {
  id: string;
  title: string;
  isPrivate: boolean;
}

function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? (JSON.parse(raw) as T) : ({} as T));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error(`文件过大（上限 ${Math.round(limit / 1024 / 1024)}MB）`));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function publicDeckDir(deckId: string): string {
  return path.join(PUBLIC_DECKS_DIR, deckId);
}

function writeDeckPerformanceJson(
  contentDir: string,
  deckId: string,
  overlay: PerformanceCatalog,
): string {
  const deckDir = path.join(contentDir, 'decks', deckId);
  fs.mkdirSync(deckDir, { recursive: true });
  const filePath = path.join(deckDir, 'performance.json');
  fs.writeFileSync(filePath, `${JSON.stringify(overlay, null, 2)}\n`, 'utf8');
  return filePath;
}

/** 场次列表只返回基础属性；页数/指令数等统计不再提供（UI 不展示，也省去逐场读盘）。 */
function describeDeck(entry: {
  id: string;
  title: string;
  isPrivate: boolean;
}): DeckSummary {
  return {
    id: entry.id,
    title: entry.title,
    isPrivate: entry.isPrivate,
  };
}

/** 只补缺失页，不覆盖已有讲稿；返回新建数量。 */
function createMissingSlides(
  contentDir: string,
  deckId: string,
  pageCount: number,
): number {
  const slidesDir = path.join(contentDir, 'decks', deckId, 'slides');
  fs.mkdirSync(slidesDir, { recursive: true });
  let created = 0;
  for (let page = 1; page <= pageCount; page += 1) {
    const filename = `${String(page).padStart(2, '0')}.md`;
    const filePath = path.join(slidesDir, filename);
    if (fs.existsSync(filePath)) {
      continue;
    }
    fs.writeFileSync(
      filePath,
      buildSlideMarkdownTemplate({ deckId, page }),
      'utf8',
    );
    created += 1;
  }
  return created;
}

function ensureFaq(contentDir: string, deckId: string, title: string): void {
  const faqDir = path.join(contentDir, 'faq');
  fs.mkdirSync(faqDir, { recursive: true });
  const faqPath = path.join(faqDir, `${deckId}.md`);
  if (fs.existsSync(faqPath)) {
    return;
  }
  fs.writeFileSync(faqPath, FAQ_TEMPLATE.replaceAll('{{title}}', title), 'utf8');
}

function isPrivateDeck(deckId: string): boolean {
  return fs.existsSync(path.join(PRIVATE_CONTENT_DIR, 'decks', deckId, 'deck.json'));
}

function removeDeck(deckId: string): void {
  const privateDir = path.join(PRIVATE_CONTENT_DIR, 'decks', deckId);
  if (fs.existsSync(privateDir)) {
    fs.rmSync(privateDir, { recursive: true, force: true });
  }
  const pdfDir = publicDeckDir(deckId);
  if (fs.existsSync(pdfDir)) {
    fs.rmSync(pdfDir, { recursive: true, force: true });
  }
  const faqPath = path.join(PRIVATE_CONTENT_DIR, 'faq', `${deckId}.md`);
  if (fs.existsSync(faqPath)) {
    fs.rmSync(faqPath, { force: true });
  }
}

/**
 * 导入 PDF：写入 `public/decks/<id>/slides.pdf`，生成 deck.json / performance.json /
 * 每页讲稿，并立即编译出 script.jsonl。
 */
async function importDeck(params: {
  deckId: string;
  title: string;
  pdfBytes: Buffer;
}): Promise<{ deckId: string; pageCount: number; createdSlides: number; scriptActions: number }> {
  const { deckId, title, pdfBytes } = params;
  const deckDir = path.join(PRIVATE_CONTENT_DIR, 'decks', deckId);
  if (fs.existsSync(path.join(deckDir, 'deck.json'))) {
    throw new Error(`场次 ${deckId} 已存在，请换一个场次 ID`);
  }

  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  if (pageCount < 1 || pageCount > MAX_SLIDES) {
    throw new Error(`PDF 页数需在 1–${MAX_SLIDES} 之间（当前 ${pageCount} 页）`);
  }

  const pdfDir = publicDeckDir(deckId);
  fs.mkdirSync(pdfDir, { recursive: true });
  fs.writeFileSync(path.join(pdfDir, 'slides.pdf'), pdfBytes);

  fs.mkdirSync(deckDir, { recursive: true });
  fs.writeFileSync(
    path.join(deckDir, 'deck.json'),
    buildDeckManifestTemplate({ deckId, title }),
    'utf8',
  );
  fs.writeFileSync(
    path.join(deckDir, 'performance.json'),
    buildEmptyPerformanceOverlay(),
    'utf8',
  );

  const createdSlides = createMissingSlides(PRIVATE_CONTENT_DIR, deckId, pageCount);
  ensureFaq(PRIVATE_CONTENT_DIR, deckId, title);

  const compiled = compileDeckDir(PRIVATE_CONTENT_DIR, deckId);
  if (compiled.issues.length > 0) {
    throw new Error(
      compiled.issues.map((issue) => `${issue.source}: ${issue.message}`).join('; '),
    );
  }

  return {
    deckId,
    pageCount,
    createdSlides,
    scriptActions: compiled.count,
  };
}

/** 从 PDF 文件名派生场次标题（去扩展名）；无可用文字时回退。 */
function deckTitleFromFileName(fileName: string): string {
  const base = fileName
    .replace(/^.*[\\/]/, '')
    .replace(/\.pdf$/i, '')
    .trim();
  return (base || '未命名场次').slice(0, 80);
}

/** 生成一个未被占用的私有场次 ID（同一标题重复导入时追加 _2、_3…）。 */
function uniquePrivateDeckId(base: string): string {
  const slug = normalizeDeckId(base);
  let stem = /^[a-z]/.test(slug) ? slug : `deck_${slug}`;
  stem = stem
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  if (!stem) {
    stem = 'deck';
  }
  if (!/^[a-z]/.test(stem)) {
    stem = `deck_${stem}`.slice(0, 24);
  }
  let candidate = stem;
  let index = 2;
  while (
    fs.existsSync(path.join(PRIVATE_CONTENT_DIR, 'decks', candidate, 'deck.json'))
  ) {
    candidate = `${stem}_${index}`;
    index += 1;
  }
  return candidate;
}

/** 重写私有场次 deck.json 的 title，保留其它字段。 */
function writeDeckTitle(deckId: string, title: string): void {
  const manifestPath = path.join(
    PRIVATE_CONTENT_DIR,
    'decks',
    deckId,
    'deck.json',
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<
    string,
    unknown
  >;
  manifest.title = title;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function contentDeckApi(): Plugin {
  return {
    name: 'content-deck-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        const query = new URL(req.url ?? '/', 'http://localhost').searchParams;

        if (url === '/api/content/decks' && req.method === 'GET') {
          sendJson(res, 200, {
            ok: true,
            devApi: true,
            decks: listDeckCatalog().map(describeDeck),
          });
          return;
        }

        // 导入 PDF（原始字节流）：场次 ID 与标题均可自动生成，fileName 用于派生二者
        if (url === '/api/content/decks/import' && req.method === 'POST') {
          try {
            const fileName = (query.get('fileName') ?? '').trim();
            const explicitId = normalizeDeckId(query.get('deckId') ?? '');
            const derivedTitle = deckTitleFromFileName(fileName);
            const deckId = explicitId || uniquePrivateDeckId(derivedTitle);
            if (!isValidDeckId(deckId)) {
              sendJson(res, 400, {
                ok: false,
                message: '场次 ID 非法（小写字母开头，可含数字/下划线）',
              });
              return;
            }
            const title =
              (query.get('title') ?? '').trim() || derivedTitle;

            const pdfBytes = await readRawBody(req, MAX_PDF_BYTES);
            if (pdfBytes.length < 5 || pdfBytes.subarray(0, 5).toString() !== '%PDF-') {
              sendJson(res, 400, { ok: false, message: '不是有效的 PDF 文件' });
              return;
            }
            const result = await importDeck({ deckId, title, pdfBytes });
            sendJson(res, 200, { ok: true, title, ...result });
          } catch (error) {
            sendJson(res, 400, {
              ok: false,
              message: error instanceof Error ? error.message : '导入失败',
            });
          }
          return;
        }

        // 重命名私有场次标题（只改 deck.json 的 title）
        const titleMatch = url?.match(/^\/api\/content\/decks\/([^/]+)\/title$/);
        if (titleMatch && req.method === 'PATCH') {
          const deckId = decodeURIComponent(titleMatch[1]);
          if (!isPrivateDeck(deckId)) {
            sendJson(res, 400, {
              ok: false,
              message: '只有私有场次可以重命名（示例场次不可改）',
            });
            return;
          }
          try {
            const body = await readJsonBody<{ title?: string }>(req);
            const title = (body.title ?? '').trim();
            if (!title) {
              sendJson(res, 400, { ok: false, message: '标题不能为空' });
              return;
            }
            if (title.length > 80) {
              sendJson(res, 400, { ok: false, message: '标题最多 80 个字符' });
              return;
            }
            writeDeckTitle(deckId, title);
            sendJson(res, 200, { ok: true, deckId, title });
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              message: error instanceof Error ? error.message : '重命名失败',
            });
          }
          return;
        }

        const deleteMatch = url?.match(/^\/api\/content\/decks\/([^/]+)$/);
        if (deleteMatch && req.method === 'DELETE') {
          const deckId = decodeURIComponent(deleteMatch[1]);
          if (!isPrivateDeck(deckId)) {
            sendJson(res, 400, {
              ok: false,
              message: '只能删除 content-private 下的私有场次（示例场次不可删）',
            });
            return;
          }
          removeDeck(deckId);
          sendJson(res, 200, { ok: true, deckId });
          return;
        }

        if (!url?.startsWith('/api/content/decks/')) {
          next();
          return;
        }

        const match = url.match(
          /^\/api\/content\/decks\/([^/]+)(?:\/slides\/(\d+)|\/compile|\/performance)?$/,
        );
        if (!match) {
          next();
          return;
        }

        const deckId = decodeURIComponent(match[1]);
        const pageRaw = match[2];
        const isCompile = url.endsWith('/compile');
        const isPerformance = url.endsWith('/performance');
        const contentDir = resolveDeckContentRoot(deckId);

        try {
          if (isPerformance && req.method === 'PUT') {
            const body = await readJsonBody<PerformanceCatalog>(req);
            if (!body.profiles || typeof body.profiles !== 'object') {
              sendJson(res, 400, { ok: false, message: 'profiles 不能为空' });
              return;
            }
            const filePath = writeDeckPerformanceJson(contentDir, deckId, body);
            sendJson(res, 200, { ok: true, filePath });
            return;
          }

          if (isCompile && req.method === 'POST') {
            const result = compileDeckDir(contentDir, deckId);
            if (result.issues.length > 0) {
              sendJson(res, 400, {
                ok: false,
                issues: result.issues,
              });
              return;
            }
            sendJson(res, 200, {
              ok: true,
              count: result.count,
              outPath: result.outPath,
            });
            return;
          }

          if (pageRaw && req.method === 'PUT') {
            const page = Number.parseInt(pageRaw, 10);
            const body = await readJsonBody<{ content?: string }>(req);
            if (!body.content?.trim()) {
              sendJson(res, 400, { ok: false, message: 'content 不能为空' });
              return;
            }
            const filePath = writeSlideMarkdown(
              contentDir,
              deckId,
              page,
              body.content,
            );
            sendJson(res, 200, { ok: true, filePath });
            return;
          }

          sendJson(res, 405, { ok: false, message: 'Method not allowed' });
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            message: error instanceof Error ? error.message : '服务器错误',
          });
        }
      });
    },
  };
}
