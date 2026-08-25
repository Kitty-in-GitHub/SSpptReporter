import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
  compileDeckDir,
  writeSlideMarkdown,
} from '../../packages/director/src/compile-deck-dir.ts';
import { resolveDeckContentRoot, listDeckCatalog } from './content-roots';

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

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function contentDeckApi(): Plugin {
  return {
    name: 'content-deck-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/content/decks' && req.method === 'GET') {
          sendJson(res, 200, { ok: true, decks: listDeckCatalog() });
          return;
        }

        if (!url?.startsWith('/api/content/decks/')) {
          next();
          return;
        }

        const match = url.match(
          /^\/api\/content\/decks\/([^/]+)(?:\/slides\/(\d+)|\/compile)?$/,
        );
        if (!match) {
          next();
          return;
        }

        const deckId = decodeURIComponent(match[1]);
        const pageRaw = match[2];
        const isCompile = url.endsWith('/compile');
        const contentDir = resolveDeckContentRoot(deckId);

        try {
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
