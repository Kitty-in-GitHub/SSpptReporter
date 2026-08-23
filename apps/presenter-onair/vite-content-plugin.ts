import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_MIME: Record<string, string> = {
  '.json': 'application/json',
  '.jsonl': 'application/x-ndjson',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export function serveMonorepoContent(): Plugin {
  const contentDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../content',
  );

  return {
    name: 'serve-monorepo-content',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (!url?.startsWith('/content/')) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(url.slice('/content/'.length));
        const filePath = path.resolve(contentDir, relativePath);
        if (!filePath.startsWith(contentDir)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        fs.readFile(filePath, (error, data) => {
          if (error) {
            next();
            return;
          }

          const ext = path.extname(filePath).toLowerCase();
          res.setHeader(
            'Content-Type',
            CONTENT_MIME[ext] ?? 'application/octet-stream',
          );
          res.end(data);
        });
      });
    },
  };
}
