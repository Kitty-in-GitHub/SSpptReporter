import type {
  CameraShot,
  Emotion,
  Gesture,
  SlideAction,
  TimingBeat,
  VoiceBeatOverrides,
} from "./types.js";
import { EMOTIONS, GESTURES } from "./types.js";
import {
  parseFrontmatter,
  parseSlideFilenamePage,
  type SlideMarkdownFile,
} from "./compile-deck-script.js";

const CAMERA_SHOTS = new Set<CameraShot>(["bust", "medium", "wide"]);
const BEAT_MARKER_RE = /<!--\s*beat\s*-->/gi;
const META_KEY_RE = /^[a-z_][a-z0-9_]*$/i;

export interface SlideBeatDraft {
  utterance: string;
  profile?: string;
  emotion: Emotion;
  gesture: Gesture;
  camera: CameraShot;
  action_id?: string;
  slide_action?: SlideAction;
  voice?: VoiceBeatOverrides;
  timing?: TimingBeat;
  emphasis?: [number, number][];
}

export interface SlidePageDraft {
  page: number;
  beats: SlideBeatDraft[];
}

/** @deprecated Use SlideBeatDraft */
export type SlideScriptDraft = SlideBeatDraft & { page: number };

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

function parseJsonField<T>(value: string | undefined): T | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function parseMetaLines(text: string): {
  meta: Record<string, string>;
  utterance: string;
} {
  const lines = text.split(/\r?\n/);
  const meta: Record<string, string> = {};
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }

    const colon = trimmed.indexOf(":");
    if (colon === -1) {
      break;
    }

    const key = trimmed.slice(0, colon).trim();
    if (!META_KEY_RE.test(key)) {
      break;
    }

    meta[key] = trimmed.slice(colon + 1).trim();
    index += 1;
  }

  const utterance = lines.slice(index).join("\n").trim();
  return { meta, utterance };
}

function defaultBeatDraft(page: number, beatIndex: number): SlideBeatDraft {
  const isFirstBeat = beatIndex === 0;
  return {
    utterance: "",
    emotion: page === 1 && isFirstBeat ? "friendly" : "neutral",
    gesture: page === 1 && isFirstBeat ? "bow" : "explain",
    camera: "bust",
    action_id:
      beatIndex === 0
        ? `p${String(page).padStart(2, "0")}`
        : `p${String(page).padStart(2, "0")}-b${String(beatIndex + 1).padStart(2, "0")}`,
    slide_action: isFirstBeat ? { goto: page } : undefined,
  };
}

function beatDraftFromMeta(
  page: number,
  beatIndex: number,
  meta: Record<string, string>,
  utterance: string,
  pageDefaults?: Partial<SlideBeatDraft>,
): SlideBeatDraft {
  const draft = defaultBeatDraft(page, beatIndex);

  if (pageDefaults?.emotion) {
    draft.emotion = pageDefaults.emotion;
  }
  if (pageDefaults?.gesture) {
    draft.gesture = pageDefaults.gesture;
  }
  if (pageDefaults?.camera) {
    draft.camera = pageDefaults.camera;
  }
  if (pageDefaults?.action_id) {
    draft.action_id = pageDefaults.action_id;
  }
  if (pageDefaults?.slide_action) {
    draft.slide_action = pageDefaults.slide_action;
  }

  if (meta.profile?.trim()) {
    draft.profile = meta.profile.trim();
  }
  if (isEmotion(meta.emotion)) {
    draft.emotion = meta.emotion;
  }
  if (isEmotion(meta.profile)) {
    draft.emotion = meta.profile;
  }
  if (isGesture(meta.gesture)) {
    draft.gesture = meta.gesture;
  }
  if (isCameraShot(meta.camera)) {
    draft.camera = meta.camera;
  }
  if (meta.action_id?.trim()) {
    draft.action_id = meta.action_id.trim();
  }

  const slideAction = parseSlideAction(meta.slide_action);
  if (slideAction) {
    draft.slide_action = slideAction;
  }

  const voice = parseJsonField<VoiceBeatOverrides>(meta.voice);
  if (voice) {
    draft.voice = voice;
  }

  const timing = parseJsonField<TimingBeat>(meta.timing);
  if (timing) {
    draft.timing = timing;
  }

  const emphasis = parseJsonField<[number, number][]>(meta.emphasis);
  if (emphasis?.length) {
    draft.emphasis = emphasis;
  }

  if (meta.voice_speed?.trim()) {
    const speed = Number.parseFloat(meta.voice_speed);
    if (!Number.isNaN(speed)) {
      draft.voice = { ...draft.voice, speed };
    }
  }

  if (meta.pause_before_ms?.trim()) {
    const pause = Number.parseInt(meta.pause_before_ms, 10);
    if (!Number.isNaN(pause)) {
      draft.timing = { ...draft.timing, pause_before_ms: pause };
    }
  }

  if (meta.pause_after_ms?.trim()) {
    const pause = Number.parseInt(meta.pause_after_ms, 10);
    if (!Number.isNaN(pause)) {
      draft.timing = { ...draft.timing, pause_after_ms: pause };
    }
  }

  draft.utterance = utterance;
  return draft;
}

export function pageToSlideFilename(page: number): string {
  return `${String(page).padStart(2, "0")}.md`;
}

export function parseSlideMarkdownToPageDraft(
  page: number,
  content: string,
): SlidePageDraft {
  const { meta: pageMeta, body } = parseFrontmatter(content);

  const pageDefaults: Partial<SlideBeatDraft> = {};
  if (isEmotion(pageMeta.emotion)) {
    pageDefaults.emotion = pageMeta.emotion;
  }
  if (isEmotion(pageMeta.profile)) {
    pageDefaults.emotion = pageMeta.profile;
  }
  if (isGesture(pageMeta.gesture)) {
    pageDefaults.gesture = pageMeta.gesture;
  }
  if (isCameraShot(pageMeta.camera)) {
    pageDefaults.camera = pageMeta.camera;
  }
  if (pageMeta.action_id?.trim()) {
    pageDefaults.action_id = pageMeta.action_id.trim();
  }
  const pageSlideAction = parseSlideAction(pageMeta.slide_action);
  if (pageSlideAction) {
    pageDefaults.slide_action = pageSlideAction;
  }

  const segments = body.split(BEAT_MARKER_RE);
  const hasBeatMarkers = segments.length > 1;

  const beats: SlideBeatDraft[] = [];

  if (!hasBeatMarkers) {
    const trimmedBody = body.trim();
    if (!trimmedBody && Object.keys(pageMeta).length === 0) {
      beats.push(defaultBeatDraft(page, 0));
    } else {
      const { meta: bodyMeta, utterance } = parseMetaLines(trimmedBody);
      const mergedMeta = { ...pageMeta, ...bodyMeta };
      beats.push(
        beatDraftFromMeta(page, 0, mergedMeta, utterance, pageDefaults),
      );
    }
    return { page, beats };
  }

  segments.forEach((segment, index) => {
    const trimmed = segment.trim();
    if (!trimmed && index === 0) {
      return;
    }
    const { meta, utterance } = parseMetaLines(trimmed);
    beats.push(beatDraftFromMeta(page, beats.length, meta, utterance, pageDefaults));
  });

  if (beats.length === 0) {
    beats.push(defaultBeatDraft(page, 0));
  }

  return { page, beats };
}

export function serializeSlideMarkdown(pageDraft: SlidePageDraft): string {
  if (pageDraft.beats.length === 1) {
    const beat = pageDraft.beats[0];
    const lines = ["---"];

    if (beat.action_id) {
      lines.push(`action_id: ${beat.action_id}`);
    }
    if (beat.profile?.trim()) {
      lines.push(`profile: ${beat.profile.trim()}`);
    } else if (beat.emotion !== "neutral") {
      lines.push(`emotion: ${beat.emotion}`);
    }
    if (beat.gesture !== defaultBeatDraft(pageDraft.page, 0).gesture) {
      lines.push(`gesture: ${beat.gesture}`);
    }
    if (beat.camera !== "bust") {
      lines.push(`camera: ${beat.camera}`);
    }

    const action = beat.slide_action;
    const isDefaultGoto =
      action?.goto === pageDraft.page &&
      !action?.next &&
      !action?.prev &&
      !action?.highlight &&
      !action?.cite_only;
    if (action && !isDefaultGoto) {
      lines.push(`slide_action: ${JSON.stringify(action)}`);
    }

    if (beat.voice && Object.keys(beat.voice).length > 0) {
      lines.push(`voice: ${JSON.stringify(beat.voice)}`);
    }
    if (beat.timing && Object.keys(beat.timing).length > 0) {
      lines.push(`timing: ${JSON.stringify(beat.timing)}`);
    }

    lines.push("---", "", beat.utterance.trim());
    return `${lines.join("\n")}\n`;
  }

  const lines: string[] = ["---"];
  const firstBeat = pageDraft.beats[0];
  if (firstBeat?.action_id && !firstBeat.action_id.includes("-b")) {
    lines.push(`action_id: ${firstBeat.action_id}`);
  }

  lines.push("---", "");

  pageDraft.beats.forEach((beat, index) => {
    if (index > 0) {
      lines.push("<!-- beat -->", "");
    }

    if (beat.profile?.trim()) {
      lines.push(`profile: ${beat.profile.trim()}`);
    } else if (beat.emotion !== "neutral") {
      lines.push(`emotion: ${beat.emotion}`);
    }

    if (beat.gesture !== "explain" && beat.gesture !== "bow") {
      lines.push(`gesture: ${beat.gesture}`);
    } else if (pageDraft.page === 1 && index === 0 && beat.gesture === "bow") {
      lines.push(`gesture: ${beat.gesture}`);
    } else if (index > 0 || pageDraft.page !== 1) {
      if (beat.gesture !== defaultBeatDraft(pageDraft.page, index).gesture) {
        lines.push(`gesture: ${beat.gesture}`);
      }
    }

    if (beat.camera !== "bust") {
      lines.push(`camera: ${beat.camera}`);
    }

    if (beat.action_id && beat.action_id !== defaultBeatDraft(pageDraft.page, index).action_id) {
      lines.push(`action_id: ${beat.action_id}`);
    }

    const action = beat.slide_action;
    const isDefaultGoto =
      index === 0 &&
      action?.goto === pageDraft.page &&
      !action?.next &&
      !action?.prev &&
      !action?.highlight &&
      !action?.cite_only;
    if (action && !isDefaultGoto) {
      lines.push(`slide_action: ${JSON.stringify(action)}`);
    }

    if (beat.voice && Object.keys(beat.voice).length > 0) {
      lines.push(`voice: ${JSON.stringify(beat.voice)}`);
    }

    if (beat.timing && Object.keys(beat.timing).length > 0) {
      lines.push(`timing: ${JSON.stringify(beat.timing)}`);
    }

    if (beat.emphasis?.length) {
      lines.push(`emphasis: ${JSON.stringify(beat.emphasis)}`);
    }

    lines.push("", beat.utterance.trim());
    if (index < pageDraft.beats.length - 1) {
      lines.push("");
    }
  });

  return `${lines.join("\n")}\n`;
}

export function slideMarkdownFileFromPageDraft(
  pageDraft: SlidePageDraft,
): SlideMarkdownFile {
  return {
    filename: pageToSlideFilename(pageDraft.page),
    content: serializeSlideMarkdown(pageDraft),
  };
}

export function parseSlideMarkdownFile(
  file: SlideMarkdownFile,
): SlidePageDraft | null {
  const page = parseSlideFilenamePage(file.filename);
  if (!page) {
    return null;
  }
  return parseSlideMarkdownToPageDraft(page, file.content);
}

/** First beat only — legacy helper */
export function parseSlideMarkdownToDraft(
  page: number,
  content: string,
): SlideScriptDraft & { page: number } {
  const pageDraft = parseSlideMarkdownToPageDraft(page, content);
  const beat = pageDraft.beats[0] ?? defaultBeatDraft(page, 0);
  return { page, ...beat };
}

export function serializeSlideMarkdownFromBeat(
  draft: SlideScriptDraft & { page: number },
): string {
  return serializeSlideMarkdown({
    page: draft.page,
    beats: [
      {
        utterance: draft.utterance,
        profile: draft.profile,
        emotion: draft.emotion,
        gesture: draft.gesture,
        camera: draft.camera,
        action_id: draft.action_id,
        slide_action: draft.slide_action,
        voice: draft.voice,
        timing: draft.timing,
        emphasis: draft.emphasis,
      },
    ],
  });
}
