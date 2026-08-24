import { buildQaSystemPrompt, buildQaUserPrompt } from "./buildQaPrompt.js";
import {
  createFallbackQaAction,
  parseDirectorActionFromLlm,
} from "./parseLlmResponse.js";
import { mergeKnowledgePools, retrieveChunks } from "./retrieve.js";
import type { AnswerQuestionInput, AnswerQuestionResult } from "./types.js";

function ensureQaActionFields(
  action: ReturnType<typeof parseDirectorActionFromLlm>,
  question: string,
): ReturnType<typeof parseDirectorActionFromLlm> {
  return {
    ...action,
    mode: "qa",
    barge_in: action.barge_in ?? true,
    priority: action.priority ?? "high",
    qa: action.qa ?? {
      question_summary: question.slice(0, 120),
      confidence: 0.5,
      admit_unknown: false,
      sources: [],
    },
  };
}

export async function answerQuestion(
  input: AnswerQuestionInput,
): Promise<AnswerQuestionResult> {
  const question = input.question.trim();
  if (!question) {
    throw new Error("问题不能为空");
  }

  const pool = mergeKnowledgePools(
    input.knowledge.faqChunks,
    input.knowledge.slideChunks,
  );
  const retrieved = retrieveChunks(question, pool, { topK: 4, minScore: 1 });

  const systemPrompt = buildQaSystemPrompt(
    input.knowledge.personaText,
    retrieved,
    input.currentSlidePage,
    input.deckId,
  );
  const userPrompt = buildQaUserPrompt(question);

  let raw = "";
  try {
    raw = await input.llm.complete(systemPrompt, userPrompt);
    const action = ensureQaActionFields(
      parseDirectorActionFromLlm(raw),
      question,
    );
    return { action, usedFallback: false, retrieved };
  } catch (firstError) {
    try {
      raw = await input.llm.complete(
        `${systemPrompt}\n\n上次输出无效，请只输出合法 JSON。`,
        userPrompt,
      );
      const action = ensureQaActionFields(
        parseDirectorActionFromLlm(raw),
        question,
      );
      return { action, usedFallback: false, retrieved };
    } catch {
      const utterance =
        typeof firstError === "object" &&
        firstError &&
        "message" in firstError &&
        typeof firstError.message === "string"
          ? firstError.message.includes("JSON")
            ? "这个问题我需要对照材料确认，目前无法从已提交内容中给出准确回答。"
            : "请稍等，我整理一下回答。"
          : "请稍等，我整理一下回答。";

      return {
        action: createFallbackQaAction(question, utterance),
        usedFallback: true,
        retrieved,
      };
    }
  }
}
