import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// npm workspaces hoist three to the monorepo root
const workspaceThreeRoot = path.resolve(
  __dirname,
  '../../node_modules/three',
);
const directorRoot = path.resolve(__dirname, '../../packages/director/src');

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@ssreporter/director',
        replacement: path.resolve(directorRoot, 'index.ts'),
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
  plugins: [react()],
});
