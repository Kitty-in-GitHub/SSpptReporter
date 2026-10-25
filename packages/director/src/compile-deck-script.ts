import type { DirectorAction } from "./types.js";
import { validateDirectorAction } from "./validate.js";
import {
  parseSlideMarkdownToPageDraft,
  type SlideBeatDraft,
} from "./slide-script-draft.js";

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
  const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
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

function beatDraftToAction(beat: SlideBeatDraft): DirectorAction {
  const action: DirectorAction = {
    schema_version: "1.0",
    mode: "present",
    utterance: beat.utterance,
    camera: beat.camera,
    action_id: beat.action_id,
    emotion: beat.emotion,
    gesture: beat.gesture,
  };

  if (beat.profile?.trim()) {
    action.profile = beat.profile.trim();
  }
  // 呈现模式的翻页统一由「页边界」决定（见 compileDeckScript）：
  // 每页念完自动翻到下一页，讲稿里写的 slide_action 不再生效。
  if (beat.voice && Object.keys(beat.voice).length > 0) {
    action.voice = beat.voice;
  }
  if (beat.timing && Object.keys(beat.timing).length > 0) {
    action.timing = beat.timing;
  }
  if (beat.emphasis?.length) {
    action.emphasis = beat.emphasis;
  }

  return action;
}

/**
 * 页末翻页拍：utterance 为空（不朗读），承接上一页最后一句话结束后的翻页。
 * 引擎顺序是「翻页 → 表情/手势 → 朗读」，所以这一拍会先翻页再进入下一页首拍。
 */
function pageTurnAction(page: number): DirectorAction {
  return {
    schema_version: "1.0",
    mode: "present",
    utterance: "",
    action_id: `turn-${String(page).padStart(2, "0")}`,
    slide_action: { next: true },
  };
}

export function compileSlideMarkdown(
  file: SlideMarkdownFile,
): { actions?: DirectorAction[]; issue?: CompileDeckScriptIssue } {
  const page = parseSlideFilenamePage(file.filename);
  if (!page) {
    return {
      issue: {
        source: file.filename,
        message: "文件名须为 NN.md（页码，如 01.md）",
      },
    };
  }

  const pageDraft = parseSlideMarkdownToPageDraft(page, file.content);
  if (pageDraft.beats.length === 0) {
    return {
      issue: {
        source: file.filename,
        message: "讲稿无有效节拍",
      },
    };
  }

  const actions: DirectorAction[] = [];
  for (const beat of pageDraft.beats) {
    const action = beatDraftToAction(beat);
    const validated = validateDirectorAction(action);
    if (!validated.ok) {
      return {
        issue: {
          source: file.filename,
          message: validated.errors.join("; "),
        },
      };
    }
    actions.push(validated.action);
  }

  return { actions };
}

export function compileDeckScript(
  files: SlideMarkdownFile[],
): CompileDeckScriptResult {
  const sorted = [...files].sort((a, b) =>
    a.filename.localeCompare(b.filename, undefined, { numeric: true }),
  );
  const issues: CompileDeckScriptIssue[] = [];
  const pages: Array<{ page: number; actions: DirectorAction[] }> = [];

  for (const file of sorted) {
    const result = compileSlideMarkdown(file);
    if (result.issue) {
      issues.push(result.issue);
      continue;
    }
    if (!result.actions?.length) {
      continue;
    }
    const page = parseSlideFilenamePage(file.filename);
    if (!page) {
      issues.push({ source: file.filename, message: "文件名须为 NN.md（页码）" });
      continue;
    }
    pages.push({ page, actions: result.actions });
  }

  const lastPage = pages.reduce((max, entry) => Math.max(max, entry.page), 0);
  const actions: DirectorAction[] = [];

  for (const { page, actions: pageActions } of pages) {
    // 每页首拍先把页面对准本页：正常连播时是幂等操作，
    // 从别的页开始播放时则能立刻纠正页码。
    const [first, ...rest] = pageActions;
    actions.push({ ...first, slide_action: { goto: page } });
    actions.push(...rest);

    // 本页讲稿全部念完后，自动翻到下一页（最后一页不再翻）。
    if (page !== lastPage) {
      const turn = validateDirectorAction(pageTurnAction(page));
      if (!turn.ok) {
        issues.push({
          source: `turn-${String(page).padStart(2, "0")}`,
          message: turn.errors.join("; "),
        });
        continue;
      }
      actions.push(turn.action);
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
