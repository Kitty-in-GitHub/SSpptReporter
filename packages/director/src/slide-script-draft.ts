import type {
  CameraShot,
  Emotion,
  Gesture,
  SlideAction,
} from "./types.js";
import { EMOTIONS, GESTURES } from "./types.js";
import {
  parseFrontmatter,
  parseSlideFilenamePage,
  type SlideMarkdownFile,
} from "./compile-deck-script.js";

const CAMERA_SHOTS = new Set<CameraShot>(["bust", "medium", "wide"]);

export interface SlideScriptDraft {
  page: number;
  utterance: string;
  emotion: Emotion;
  gesture: Gesture;
  camera: CameraShot;
  action_id?: string;
  slide_action?: SlideAction;
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

function parseSlideAction(value: string | undefined): SlideAction | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value) as SlideAction;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function pageToSlideFilename(page: number): string {
  return `${String(page).padStart(2, "0")}.md`;
}

export function parseSlideMarkdownToDraft(
  page: number,
  content: string,
): SlideScriptDraft {
  const { meta, body } = parseFrontmatter(content);
  const slideAction =
    parseSlideAction(meta.slide_action) ?? ({ goto: page } satisfies SlideAction);

  return {
    page,
    utterance: body,
    emotion: isEmotion(meta.emotion) ? meta.emotion : "neutral",
    gesture: isGesture(meta.gesture)
      ? meta.gesture
      : page === 1
        ? "bow"
        : "explain",
    camera: isCameraShot(meta.camera) ? meta.camera : "bust",
    action_id: meta.action_id || `p${String(page).padStart(2, "0")}`,
    slide_action: slideAction,
  };
}

export function serializeSlideMarkdown(draft: SlideScriptDraft): string {
  const lines = ["---"];

  if (draft.action_id) {
    lines.push(`action_id: ${draft.action_id}`);
  }
  lines.push(`emotion: ${draft.emotion}`);
  lines.push(`gesture: ${draft.gesture}`);
  if (draft.camera !== "bust") {
    lines.push(`camera: ${draft.camera}`);
  }

  const action = draft.slide_action ?? { goto: draft.page };
  const isDefaultGoto =
    action.goto === draft.page &&
    !action.next &&
    !action.prev &&
    !action.highlight &&
    !action.cite_only;
  if (!isDefaultGoto) {
    lines.push(`slide_action: ${JSON.stringify(action)}`);
  }

  lines.push("---", "", draft.utterance.trim());
  return `${lines.join("\n")}\n`;
}

export function slideMarkdownFileFromDraft(
  draft: SlideScriptDraft,
): SlideMarkdownFile {
  return {
    filename: pageToSlideFilename(draft.page),
    content: serializeSlideMarkdown(draft),
  };
}

export function parseSlideMarkdownFile(
  file: SlideMarkdownFile,
): SlideScriptDraft | null {
  const page = parseSlideFilenamePage(file.filename);
  if (!page) {
    return null;
  }
  return parseSlideMarkdownToDraft(page, file.content);
}
