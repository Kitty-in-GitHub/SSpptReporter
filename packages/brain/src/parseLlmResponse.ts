import { validateDirectorAction, type DirectorAction } from "@ssreporter/director";

const JSON_FENCE_RE = /^```(?:json)?\s*([\s\S]*?)```$/i;

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(JSON_FENCE_RE);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("响应中未找到 JSON 对象");
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

export function parseDirectorActionFromLlm(raw: string): DirectorAction {
  const parsed = extractJsonObject(raw);
  const result = validateDirectorAction(parsed);
  if (!result.ok) {
    throw new Error(result.errors.join("; "));
  }
  return result.action;
}

export function createFallbackQaAction(
  question: string,
  utterance: string,
): DirectorAction {
  return {
    schema_version: "1.0",
    action_id: `qa-fallback-${Date.now()}`,
    mode: "qa",
    utterance: utterance.trim() || "请稍等，我整理一下回答。",
    emotion: "apologetic",
    gesture: "nod",
    qa: {
      question_summary: question.slice(0, 120),
      confidence: 0.2,
      admit_unknown: true,
      sources: [],
    },
    barge_in: true,
    priority: "high",
  };
}
