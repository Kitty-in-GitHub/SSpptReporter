import type { KnowledgeChunk } from "./types.js";

export function buildQaSystemPrompt(
  personaText: string,
  retrieved: KnowledgeChunk[],
  currentSlidePage: number,
  deckId: string,
): string {
  const contextBlocks = retrieved.map((chunk) => {
    const header =
      chunk.kind === "slide" && chunk.page
        ? `[slide 第${chunk.page}页] ${chunk.title}`
        : `[${chunk.kind}] ${chunk.title}`;
    return `${header}\n${chunk.body}`;
  });

  return [
    personaText.trim(),
    "",
    "你是 Brain 层：只输出一个 JSON 对象，符合 DirectorAction schema，不要 Markdown 代码围栏，不要额外解释。",
    "",
    "输出要求：",
    '- schema_version: "1.0"',
    '- mode: "qa"',
    "- utterance: 简短中文口语回答（建议 80 字以内）",
    "- emotion: neutral | confident | friendly | serious | thinking | apologetic | emphatic（控制虚拟人表情与默认手势；未设时默认 friendly）",
    "- 可选 profile: 与 emotion 同名的表演 preset，优先于 emotion 驱动表情/手势",
    "- 不要输出 voice：Q&A 的 TTS 音色/语速由系统 qa 基线统一处理",
    '- gesture: none | nod | think | explain | point_slide 等（可覆盖 profile 默认手势）',
    "- 可选 timing: { pause_before_ms?, pause_after_ms? } 覆盖 qa 基线停顿",
    "- qa.question_summary: 问题摘要",
    "- qa.confidence: 0~1",
    '- qa.sources: [{ "kind": "slide"|"faq", "ref": "页码或faq id" }]',
    "- qa.admit_unknown: 材料未覆盖时为 true",
    "- 有证据页时加 slide_action: { \"goto\": N }",
    "- 材料未覆盖：admit_unknown true，utterance 礼貌说明不在本次材料范围，禁止编造",
    "",
    `当前场次 deckId=${deckId}，当前幻灯页=${currentSlidePage}。`,
    "",
    contextBlocks.length > 0
      ? `检索到的材料片段：\n\n${contextBlocks.join("\n\n---\n\n")}`
      : "检索到的材料片段：（无命中，应 admit_unknown）",
  ].join("\n");
}

export function buildQaUserPrompt(question: string): string {
  return `评委提问：${question.trim()}\n\n请输出 DirectorAction JSON。`;
}
