import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import type { DirectorAction } from "./types.js";

/** Inline schema (kept in sync with schemas/director-action.schema.json). */
const directorActionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "mode", "utterance"],
  properties: {
    schema_version: { type: "string", const: "1.0" },
    action_id: { type: "string", minLength: 1 },
    mode: { type: "string", enum: ["present", "qa", "idle", "system"] },
    utterance: { type: "string", maxLength: 2000 },
    profile: { type: "string", minLength: 1 },
    emotion: {
      type: "string",
      enum: [
        "neutral",
        "confident",
        "friendly",
        "serious",
        "thinking",
        "apologetic",
        "emphatic",
      ],
    },
    gesture: {
      type: "string",
      enum: [
        "none",
        "idle",
        "bow",
        "nod",
        "think",
        "explain",
        "point_slide",
        "open_hands",
        "emphasize",
      ],
    },
    camera: { type: "string", enum: ["bust", "medium", "wide"] },
    voice: {
      type: "object",
      additionalProperties: false,
      properties: {
        speed: { type: "number", minimum: 0.25, maximum: 4 },
        pitch: { type: "number", minimum: -12, maximum: 12 },
        style_hint: { type: "string", maxLength: 500 },
      },
    },
    timing: {
      type: "object",
      additionalProperties: false,
      properties: {
        pause_before_ms: { type: "integer", minimum: 0, maximum: 60000 },
        pause_after_ms: { type: "integer", minimum: 0, maximum: 60000 },
      },
    },
    slide_action: {
      type: "object",
      additionalProperties: false,
      properties: {
        goto: { type: "integer", minimum: 1 },
        next: { type: "boolean" },
        prev: { type: "boolean" },
        highlight: { type: "string" },
        cite_only: { type: "boolean" },
      },
    },
    emphasis: {
      type: "array",
      items: {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: { type: "number", minimum: 0 },
      },
    },
    qa: {
      type: "object",
      additionalProperties: false,
      properties: {
        question_summary: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        sources: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["kind"],
            properties: {
              kind: {
                type: "string",
                enum: ["slide", "faq", "doc", "skill"],
              },
              ref: { type: "string" },
            },
          },
        },
        admit_unknown: { type: "boolean" },
      },
    },
    priority: { type: "string", enum: ["normal", "high", "emergency"] },
    barge_in: { type: "boolean" },
    notes: { type: "string" },
  },
} as const;

export type ValidateDirectorResult =
  | { ok: true; action: DirectorAction }
  | { ok: false; errors: string[] };

let cachedValidate: ValidateFunction | null = null;

function getValidator(): ValidateFunction {
  if (!cachedValidate) {
    const ajv = new Ajv({ allErrors: true, strict: false });
    cachedValidate = ajv.compile(directorActionSchema);
  }
  return cachedValidate;
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) return ["Unknown validation error"];
  return errors.map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim());
}

export function validateDirectorAction(input: unknown): ValidateDirectorResult {
  const validate = getValidator();
  if (validate(input)) {
    return { ok: true, action: input as DirectorAction };
  }
  return { ok: false, errors: formatErrors(validate.errors) };
}

export function parseDirectorActionJson(raw: string): ValidateDirectorResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateDirectorAction(parsed);
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : "Invalid JSON"],
    };
  }
}
