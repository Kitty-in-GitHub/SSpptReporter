import { describe, expect, it } from "vitest";
import { answerQuestion } from "./answerQuestion.js";
import type { BrainEmbedder } from "./embedTypes.js";
import { parseFaqMarkdown } from "./parseKnowledge.js";
import { retrieveHybrid } from "./retrieveHybrid.js";
import type { BrainKnowledge } from "./types.js";
import {
  computeKnowledgeContentHash,
  buildBrainVectorIndex,
} from "./vectorIndex.js";
import {
  cosineSimilarity,
  reciprocalRankFusion,
  retrieveByEmbedding,
} from "./vectorRetrieve.js";

function unitVec(dims: number, hotIndex: number): number[] {
  const v = Array.from({ length: dims }, () => 0);
  v[hotIndex] = 1;
  return v;
}

describe("cosineSimilarity", () => {
  it("ranks identical vectors highest", () => {
    const a = [1, 0, 0];
    expect(cosineSimilarity(a, a)).toBeCloseTo(1);
    expect(cosineSimilarity(a, [0, 1, 0])).toBeCloseTo(0);
  });
});

describe("reciprocalRankFusion", () => {
  it("prefers items appearing in both lists", () => {
    const a = parseFaqMarkdown(
      "## Q: Alpha\n\nA\n\n## Q: Beta\n\nB\n\n## Q: Gamma\n\nC",
    );
    const list1 = [a[0]!, a[1]!];
    const list2 = [a[1]!, a[2]!];
    const fused = reciprocalRankFusion([list1, list2], { topK: 2 });
    expect(fused[0]!.id).toBe(a[1]!.id);
  });
});

describe("retrieveByEmbedding", () => {
  it("returns nearest chunk by cosine", () => {
    const chunks = parseFaqMarkdown(
      "## Q: Phase 1\n\nPresent\n\n## Q: ASR\n\nWhisper",
    ).map((chunk, index) => ({
      ...chunk,
      embedding: unitVec(4, index),
    }));
    const hits = retrieveByEmbedding(unitVec(4, 1), chunks, {
      topK: 1,
      minScore: 0.1,
    });
    expect(hits).toHaveLength(1);
    expect(hits[0]!.title).toContain("ASR");
  });
});

describe("retrieveHybrid", () => {
  const knowledge: BrainKnowledge = {
    personaText: "短答。",
    faqChunks: parseFaqMarkdown(
      "## Q: Phase 1 验收了什么？\n\nPresent 闭环与 TTS。\n\n## Q: 语音识别用什么？\n\nWeb Speech 或 Whisper。",
    ),
    slideChunks: [],
  };

  it("falls back to TF when embedder missing", async () => {
    const result = await retrieveHybrid("Phase 1 验收了什么", knowledge);
    expect(result.usedVector).toBe(false);
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks[0]!.title).toContain("Phase 1");
  });

  it("fuses vector + TF with mock embedder", async () => {
    const pool = knowledge.faqChunks;
    const embeddings = new Map(
      pool.map((chunk, index) => [chunk.id, unitVec(8, index)]),
    );
    const asrChunk = pool.find((c) => c.title.includes("语音"))!;
    const queryEmb = embeddings.get(asrChunk.id)!;

    const index = await buildBrainVectorIndex(pool, {
      model: "mock-embed",
      embedTexts: async () => pool.map((c) => embeddings.get(c.id)!),
    });

    const embedder: BrainEmbedder = {
      model: "mock-embed",
      embedTexts: async () => [queryEmb],
    };

    // High TF threshold → empty keyword hits; vector should still surface ASR FAQ
    const result = await retrieveHybrid(
      "答辩时怎么把说话转成文字",
      knowledge,
      { embedder, vectorIndex: index, tfMinScore: 99 },
    );
    expect(result.usedVector).toBe(true);
    expect(result.chunks[0]!.title).toContain("语音");
  });
});

describe("answerQuestion hybrid", () => {
  it("works without embedder (TF path)", async () => {
    const knowledge: BrainKnowledge = {
      personaText: "短答。",
      faqChunks: parseFaqMarkdown(
        "## Q: Phase 1 验收了什么？\n\nPresent 闭环。",
      ),
      slideChunks: [],
    };
    const result = await answerQuestion({
      question: "Phase 1 验收了什么",
      currentSlidePage: 1,
      deckId: "demo",
      knowledge,
      llm: {
        complete: async () =>
          JSON.stringify({
            schema_version: "1.0",
            mode: "qa",
            utterance: "Present 闭环。",
            emotion: "friendly",
            gesture: "idle",
            qa: {
              question_summary: "Phase 1",
              confidence: 0.9,
              admit_unknown: false,
              sources: [{ kind: "faq", ref: "demo" }],
            },
          }),
      },
    });
    expect(result.usedVector).toBe(false);
    expect(result.action.utterance).toContain("Present");
  });
});

describe("computeKnowledgeContentHash", () => {
  it("changes when body changes", () => {
    const a = parseFaqMarkdown("## Q: A\n\nOne");
    const b = parseFaqMarkdown("## Q: A\n\nTwo");
    expect(computeKnowledgeContentHash(a)).not.toBe(
      computeKnowledgeContentHash(b),
    );
  });
});
