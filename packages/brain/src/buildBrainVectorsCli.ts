import fs from "node:fs";
import path from "node:path";
import {
  buildBrainKnowledge,
  buildBrainVectorIndex,
  buildSlideIndex,
  createOpenAiCompatibleEmbedder,
  DEFAULT_EMBEDDING_MODEL,
  mergeKnowledgePools,
  type SlideMarkdownFile,
} from "./index.js";

export interface BuildBrainVectorsCliOptions {
  repoRoot: string;
  deckId: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

function resolveContentRoots(repoRoot: string): string[] {
  return [
    path.join(repoRoot, "content-private"),
    path.join(repoRoot, "content"),
  ];
}

function resolveExistingFile(
  roots: string[],
  relativePath: string,
): string | null {
  for (const root of roots) {
    const filePath = path.join(root, relativePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }
  return null;
}

function resolveDeckRoot(repoRoot: string, deckId: string): string {
  const privateRoot = path.join(repoRoot, "content-private");
  const publicRoot = path.join(repoRoot, "content");
  if (fs.existsSync(path.join(privateRoot, "decks", deckId, "deck.json"))) {
    return privateRoot;
  }
  if (fs.existsSync(path.join(publicRoot, "decks", deckId, "deck.json"))) {
    return publicRoot;
  }
  throw new Error(`找不到场次 deck.json：${deckId}`);
}

function readText(filePath: string | null): string {
  if (!filePath) {
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function loadSlideFiles(
  roots: string[],
  deckId: string,
): SlideMarkdownFile[] {
  const files: SlideMarkdownFile[] = [];
  for (let page = 1; page <= 40; page += 1) {
    const filename = `${String(page).padStart(2, "0")}.md`;
    const filePath = resolveExistingFile(
      roots,
      path.join("decks", deckId, "slides", filename),
    );
    if (!filePath) {
      break;
    }
    files.push({ filename, content: fs.readFileSync(filePath, "utf8") });
  }
  return files;
}

/**
 * Build `brain-vectors.json` for a deck (Node CLI / vitest).
 * Env fallbacks: OPENAI_API_KEY, OPENAI_BASE_URL, EMBEDDING_MODEL.
 */
export async function buildBrainVectorsForDeck(
  options: BuildBrainVectorsCliOptions,
): Promise<{ outPath: string; chunkCount: number }> {
  const deckId = options.deckId.trim();
  if (!deckId) {
    throw new Error("请指定 --deck <id>");
  }

  const apiKey =
    options.apiKey?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.SSREPORTER_EMBED_API_KEY?.trim() ||
    "";
  if (!apiKey) {
    throw new Error(
      "缺少 Embedding API Key：请设置 OPENAI_API_KEY 或 SSREPORTER_EMBED_API_KEY",
    );
  }

  const baseUrl =
    options.baseUrl?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    process.env.SSREPORTER_EMBED_BASE_URL?.trim() ||
    "https://api.openai.com/v1";
  const model =
    options.model?.trim() ||
    process.env.EMBEDDING_MODEL?.trim() ||
    DEFAULT_EMBEDDING_MODEL;

  const roots = resolveContentRoots(options.repoRoot);
  const personaText = readText(
    resolveExistingFile(roots, path.join("persona", "presenter.md")),
  );
  const faqMarkdown =
    readText(resolveExistingFile(roots, path.join("faq", `${deckId}.md`))) ||
    readText(resolveExistingFile(roots, path.join("faq", "demo.md")));
  const slideFiles = loadSlideFiles(roots, deckId);
  const slideIndex = buildSlideIndex(deckId, slideFiles);
  const knowledge = buildBrainKnowledge({
    personaText,
    faqMarkdown,
    faqId: deckId,
    deckId,
    slideEntries: slideIndex.map((entry) => ({
      page: entry.page,
      body: entry.body,
    })),
  });
  const pool = mergeKnowledgePools(
    knowledge.faqChunks,
    knowledge.slideChunks,
  );
  if (pool.length === 0) {
    throw new Error(`场次 ${deckId} 没有可向量化的 FAQ/slide chunks`);
  }

  const embedder = createOpenAiCompatibleEmbedder({
    apiKey,
    baseUrl,
    model,
  });
  const index = await buildBrainVectorIndex(pool, embedder);

  const deckRoot = resolveDeckRoot(options.repoRoot, deckId);
  const outPath = path.join(deckRoot, "decks", deckId, "brain-vectors.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  return { outPath, chunkCount: index.chunks.length };
}

export function parseBrainVectorsCliArgs(argv: string[]): {
  deckId: string;
  baseUrl?: string;
  model?: string;
} {
  let deckId = "demo";
  let baseUrl: string | undefined;
  let model: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--deck" && argv[i + 1]) {
      deckId = argv[i + 1]!;
      i += 1;
    } else if (arg?.startsWith("--deck=")) {
      deckId = arg.slice("--deck=".length);
    } else if (arg === "--base-url" && argv[i + 1]) {
      baseUrl = argv[i + 1];
      i += 1;
    } else if (arg === "--model" && argv[i + 1]) {
      model = argv[i + 1];
      i += 1;
    }
  }

  return { deckId, baseUrl, model };
}
