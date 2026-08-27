import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { serveMonorepoContent } from './vite-content-plugin';
import { contentDeckApi } from './vite-content-api-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// npm workspaces hoist three to the monorepo root
const workspaceThreeRoot = path.resolve(
  __dirname,
  '../../node_modules/three',
);
const directorRoot = path.resolve(__dirname, '../../packages/director/src');
const brainRoot = path.resolve(__dirname, '../../packages/brain/src');

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@ssreporter/director',
        replacement: path.resolve(directorRoot, 'index.ts'),
      },
      {
        find: '@ssreporter/brain',
        replacement: path.resolve(brainRoot, 'index.ts'),
      },
      {
        find: /^three$/,
        replacement: path.resolve(workspaceThreeRoot, 'build/three.module.js'),
      },
      {
        find: /^three\/examples\/jsm\/(.*)$/,
        replacement: `${path.resolve(workspaceThreeRoot, 'examples/jsm')}/$1`,
      },
    ],
  },
  plugins: [react(), serveMonorepoContent(), contentDeckApi()],
  optimizeDeps: {
    exclude: ['@huggingface/transformers', '@mediapipe/tasks-vision'],
  },
  worker: {
    format: 'es',
  },
  server: {
    proxy: {
      '/api/tts': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, ''),
      },
      '/api/asr': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/asr/, ''),
      },
      '/api/embed': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/embed/, ''),
      },
    },
  },
});
