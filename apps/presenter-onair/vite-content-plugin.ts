import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {
  PRIVATE_CONTENT_DIR,
  PUBLIC_CONTENT_DIR,
  resolveContentFile,
} from './content-roots';

const CONTENT_MIME: Record<string, string> = {
  '.json': 'application/json',
  '.jsonl': 'application/x-ndjson',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function isUnderContentRoot(filePath: string): boolean {
  return (
    filePath.startsWith(PUBLIC_CONTENT_DIR + path.sep) ||
    filePath === PUBLIC_CONTENT_DIR ||
    filePath.startsWith(PRIVATE_CONTENT_DIR + path.sep) ||
    filePath === PRIVATE_CONTENT_DIR
  );
}

export function serveMonorepoContent(): Plugin {
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
        const filePath = resolveContentFile(relativePath);
        if (!filePath || !isUnderContentRoot(filePath)) {
          if (filePath && !isUnderContentRoot(filePath)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }
          next();
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
