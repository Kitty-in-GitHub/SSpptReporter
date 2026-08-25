import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

/** Example / public knowledge base (committed). */
export const PUBLIC_CONTENT_DIR = path.join(monorepoRoot, 'content');

/** Private knowledge base (gitignored decks; local only). */
export const PRIVATE_CONTENT_DIR = path.join(monorepoRoot, 'content-private');

/** Prefer private overlay, then public example root. */
export function contentRoots(): string[] {
  return [PRIVATE_CONTENT_DIR, PUBLIC_CONTENT_DIR];
}

export function deckExistsIn(root: string, deckId: string): boolean {
  return fs.existsSync(path.join(root, 'decks', deckId, 'deck.json'));
}

/**
 * Resolve which content root owns a deck.
 * Existing private decks win; otherwise public; new decks default to private
 * so real defense material is not written into the public tree by accident.
 */
export function resolveDeckContentRoot(deckId: string): string {
  if (deckExistsIn(PRIVATE_CONTENT_DIR, deckId)) {
    return PRIVATE_CONTENT_DIR;
  }
  if (deckExistsIn(PUBLIC_CONTENT_DIR, deckId)) {
    return PUBLIC_CONTENT_DIR;
  }
  return PRIVATE_CONTENT_DIR;
}

/** First existing file under private, then public. */
export function resolveContentFile(relativePath: string): string | null {
  for (const root of contentRoots()) {
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root)) {
      continue;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }
  return null;
}

export interface DeckCatalogEntry {
  id: string;
  title: string;
  isPrivate: boolean;
}

function readDeckTitle(deckJsonPath: string, deckId: string): string {
  try {
    const raw = fs.readFileSync(deckJsonPath, 'utf8');
    const manifest = JSON.parse(raw) as { title?: string };
    return manifest.title?.trim() || deckId;
  } catch {
    return deckId;
  }
}

/** List decks from private + public content roots (private id wins). */
export function listDeckCatalog(): DeckCatalogEntry[] {
  const entries = new Map<string, DeckCatalogEntry>();

  for (const [root, isPrivate] of [
    [PRIVATE_CONTENT_DIR, true],
    [PUBLIC_CONTENT_DIR, false],
  ] as const) {
    const decksDir = path.join(root, 'decks');
    if (!fs.existsSync(decksDir)) {
      continue;
    }

    for (const dirent of fs.readdirSync(decksDir, { withFileTypes: true })) {
      if (!dirent.isDirectory()) {
        continue;
      }
      const deckId = dirent.name;
      if (entries.has(deckId)) {
        continue;
      }
      const deckJsonPath = path.join(decksDir, deckId, 'deck.json');
      if (!fs.existsSync(deckJsonPath)) {
        continue;
      }
      entries.set(deckId, {
        id: deckId,
        title: readDeckTitle(deckJsonPath, deckId),
        isPrivate,
      });
    }
  }

  return Array.from(entries.values()).sort((a, b) =>
    a.id.localeCompare(b.id, 'zh-CN'),
  );
}
