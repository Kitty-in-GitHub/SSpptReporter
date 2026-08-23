import type {
  CameraShot,
  DirectorAction,
  Emotion,
  Gesture,
  SlideAction,
} from "./types.js";
import { EMOTIONS, GESTURES } from "./types.js";
import { validateDirectorAction } from "./validate.js";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const CAMERA_SHOTS = new Set<CameraShot>(["bust", "medium", "wide"]);

export interface SlideMarkdownFile {
  filename: string;
  content: string;
}

export interface CompileDeckScriptIssue {
  source: string;
  message: string;
}

export interface CompileDeckScriptResult {
  actions: DirectorAction[];
  issues: CompileDeckScriptIssue[];
}

function isEmotion(value: string | undefined): value is Emotion {
  return Boolean(value && (EMOTIONS as readonly string[]).includes(value));
}

function isGesture(value: string | undefined): value is Gesture {
  return Boolean(value && (GESTURES as readonly string[]).includes(value));
}

function isCameraShot(value: string | undefined): value is CameraShot {
  return Boolean(value && CAMERA_SHOTS.has(value as CameraShot));
}

export function parseSlideFilenamePage(filename: string): number | null {
  const base = filename.replace(/\.md$/i, "");
  if (!/^\d+$/.test(base)) {
    return null;
  }
  const page = Number.parseInt(base, 10);
  return page > 0 ? page : null;
}

export function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { meta: {}, body: raw.trim() };
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const colon = trimmed.indexOf(":");
    if (colon === -1) {
      continue;
    }
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    if (key) {
      meta[key] = value;
    }
  }

  return { meta, body: match[2].trim() };
}

function parseSlideAction(value: string): SlideAction | null {
  try {
    const parsed = JSON.parse(value) as SlideAction;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function compileSlideMarkdown(
  file: SlideMarkdownFile,
): { action?: DirectorAction; issue?: CompileDeckScriptIssue } {
  const page = parseSlideFilenamePage(file.filename);
  if (!page) {
    return {
      issue: {
        source: file.filename,
        message: "文件名须为 NN.md（页码，如 01.md）",
      },
    };
  }

  const { meta, body } = parseFrontmatter(file.content);
  if (!body) {
    return {
      issue: {
        source: file.filename,
        message: "讲稿正文为空",
      },
    };
  }

  let slideAction: SlideAction = { goto: page };
  if (meta.slide_action) {
    const parsed = parseSlideAction(meta.slide_action);
    if (!parsed) {
      return {
        issue: {
          source: file.filename,
          message: 'slide_action 须为 JSON，如 {"next": true}',
        },
      };
    }
    slideAction = parsed;
  }

  const action: DirectorAction = {
    schema_version: "1.0",
    action_id: meta.action_id || `p${String(page).padStart(2, "0")}`,
    mode: "present",
    utterance: body,
    camera: isCameraShot(meta.camera) ? meta.camera : "bust",
    slide_action: slideAction,
  };

  if (isEmotion(meta.emotion)) {
    action.emotion = meta.emotion;
  } else {
    action.emotion = "neutral";
  }

  if (isGesture(meta.gesture)) {
    action.gesture = meta.gesture;
  } else {
    action.gesture = page === 1 ? "bow" : "explain";
  }

  const validated = validateDirectorAction(action);
  if (!validated.ok) {
    return {
      issue: {
        source: file.filename,
        message: validated.errors.join("; "),
      },
    };
  }

  return { action: validated.action };
}

export function compileDeckScript(
  files: SlideMarkdownFile[],
): CompileDeckScriptResult {
  const sorted = [...files].sort((a, b) =>
    a.filename.localeCompare(b.filename, undefined, { numeric: true }),
  );
  const actions: DirectorAction[] = [];
  const issues: CompileDeckScriptIssue[] = [];

  for (const file of sorted) {
    const result = compileSlideMarkdown(file);
    if (result.issue) {
      issues.push(result.issue);
      continue;
    }
    if (result.action) {
      actions.push(result.action);
    }
  }

  return { actions, issues };
}

export function parseScriptJsonl(content: string): CompileDeckScriptResult {
  const actions: DirectorAction[] = [];
  const issues: CompileDeckScriptIssue[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const source = `script.jsonl:${index + 1}`;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      issues.push({ source, message: "JSON 解析失败" });
      return;
    }

    const validated = validateDirectorAction(parsed);
    if (!validated.ok) {
      issues.push({ source, message: validated.errors.join("; ") });
      return;
    }

    actions.push(validated.action);
  });

  return { actions, issues };
}

export function formatScriptJsonl(actions: DirectorAction[]): string {
  if (actions.length === 0) {
    return "";
  }
  return `${actions.map((action) => JSON.stringify(action)).join("\n")}\n`;
}
