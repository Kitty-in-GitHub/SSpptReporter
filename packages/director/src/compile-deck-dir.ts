import fs from "node:fs";
import path from "node:path";
import {
  compileDeckScript,
  formatScriptJsonl,
  type CompileDeckScriptIssue,
} from "./compile-deck-script.js";

export interface CompileDeckDirResult {
  outPath: string;
  count: number;
  issues: CompileDeckScriptIssue[];
}

export function resolveDeckDir(contentRoot: string, deckId: string): string {
  const safeId = deckId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(safeId)) {
    throw new Error(`非法 deckId：${deckId}`);
  }
  const deckDir = path.resolve(contentRoot, "decks", safeId);
  const decksRoot = path.resolve(contentRoot, "decks");
  if (!deckDir.startsWith(decksRoot)) {
    throw new Error(`非法 deck 路径：${deckId}`);
  }
  return deckDir;
}

export function compileDeckDir(
  contentRoot: string,
  deckId: string,
): CompileDeckDirResult {
  const deckDir = resolveDeckDir(contentRoot, deckId);
  const slidesDir = path.join(deckDir, "slides");
  if (!fs.existsSync(slidesDir)) {
    throw new Error(`未找到 slides 目录：${slidesDir}`);
  }

  const files = fs
    .readdirSync(slidesDir)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => ({
      filename,
      content: fs.readFileSync(path.join(slidesDir, filename), "utf8"),
    }));

  const result = compileDeckScript(files);
  const outPath = path.join(deckDir, "script.jsonl");
  if (result.issues.length === 0) {
    fs.writeFileSync(outPath, formatScriptJsonl(result.actions), "utf8");
  }

  return {
    outPath,
    count: result.actions.length,
    issues: result.issues,
  };
}

export function writeSlideMarkdown(
  contentRoot: string,
  deckId: string,
  page: number,
  content: string,
): string {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error(`非法页码：${page}`);
  }
  const deckDir = resolveDeckDir(contentRoot, deckId);
  const slidesDir = path.join(deckDir, "slides");
  fs.mkdirSync(slidesDir, { recursive: true });
  const filename = `${String(page).padStart(2, "0")}.md`;
  const filePath = path.join(slidesDir, filename);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}
