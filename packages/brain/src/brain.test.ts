import { describe, expect, it } from "vitest";
import { parseFaqMarkdown } from "./parseKnowledge.js";
import { retrieveChunks } from "./retrieve.js";
import {
  createFallbackQaAction,
  parseDirectorActionFromLlm,
} from "./parseLlmResponse.js";
import { buildSlideIndex } from "./slideIndex.js";

describe("parseFaqMarkdown", () => {
  it("parses Q/A sections", () => {
    const chunks = parseFaqMarkdown(
      "## Q: Phase 1 验收了什么？\n\nPresent 闭环。\n\n## Q: 讲稿工作流\n\nMarkdown 编译。",
    );
    expect(chunks).toHaveLength(2);
    expect(chunks[0].title).toContain("Phase 1");
  });
});

describe("retrieveChunks", () => {
  it("scores FAQ hit for related question", () => {
    const chunks = parseFaqMarkdown(
      "## Q: Phase 1 验收了什么？\n\nPresent 闭环与 TTS。",
    );
    const hits = retrieveChunks("Phase 1 验收了什么", chunks, {
      minScore: 1,
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].kind).toBe("faq");
  });
});

describe("buildSlideIndex", () => {
  it("extracts page bodies", () => {
    const index = buildSlideIndex("demo", [
      {
        filename: "01.md",
        content: "---\nemotion: friendly\n---\n\n开场白。",
      },
    ]);
    expect(index).toHaveLength(1);
    expect(index[0].page).toBe(1);
    expect(index[0].body).toContain("开场");
  });
});

describe("parseDirectorActionFromLlm", () => {
  it("parses fenced JSON", () => {
    const action = parseDirectorActionFromLlm(`\`\`\`json
{
  "schema_version": "1.0",
  "mode": "qa",
  "utterance": "材料在第 2 页。",
  "emotion": "serious",
  "gesture": "point_slide",
  "slide_action": { "goto": 2 },
  "qa": {
    "question_summary": "架构",
    "confidence": 0.8,
    "admit_unknown": false,
    "sources": [{ "kind": "slide", "ref": "2" }]
  }
}
\`\`\``);
    expect(action.mode).toBe("qa");
    expect(action.slide_action?.goto).toBe(2);
  });

  it("fallback action validates", () => {
    const action = createFallbackQaAction("未知问题", "不在材料范围内。");
    expect(action.mode).toBe("qa");
    expect(action.qa?.admit_unknown).toBe(true);
  });
});
