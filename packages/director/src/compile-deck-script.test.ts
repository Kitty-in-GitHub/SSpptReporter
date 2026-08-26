import { describe, expect, it } from "vitest";
import {
  compileDeckScript,
  compileSlideMarkdown,
  formatScriptJsonl,
  parseFrontmatter,
  parseScriptJsonl,
  parseSlideFilenamePage,
} from "./compile-deck-script.js";

describe("parseSlideFilenamePage", () => {
  it("reads page number from NN.md", () => {
    expect(parseSlideFilenamePage("01.md")).toBe(1);
    expect(parseSlideFilenamePage("12.md")).toBe(12);
    expect(parseSlideFilenamePage("slide.md")).toBeNull();
  });
});

describe("parseFrontmatter", () => {
  it("parses yaml-like frontmatter and body", () => {
    const result = parseFrontmatter(`---
emotion: friendly
gesture: bow
---

各位老师好。`);
    expect(result.meta.emotion).toBe("friendly");
    expect(result.meta.gesture).toBe("bow");
    expect(result.body).toBe("各位老师好。");
  });
});

describe("compileSlideMarkdown", () => {
  it("defaults slide_action to goto page from filename", () => {
    const result = compileSlideMarkdown({
      filename: "03.md",
      content: `---
emotion: emphatic
gesture: point_slide
---

第三页内容。`,
    });

    expect(result.actions?.[0]?.slide_action).toEqual({ goto: 3 });
    expect(result.actions?.[0]?.utterance).toBe("第三页内容。");
    expect(result.actions?.[0]?.action_id).toBe("p03");
  });

  it("compiles multiple beats per slide", () => {
    const result = compileSlideMarkdown({
      filename: "03.md",
      content: `---
emotion: confident
---

<!-- beat -->
profile: confident
第一句。

<!-- beat -->
profile: emphatic
gesture: nod
utterance:

<!-- beat -->
profile: friendly
第二句。`,
    });

    expect(result.actions?.length).toBe(3);
    expect(result.actions?.[0]?.utterance).toBe("第一句。");
    expect(result.actions?.[1]?.utterance).toBe("");
    expect(result.actions?.[1]?.gesture).toBe("nod");
    expect(result.actions?.[2]?.utterance).toBe("第二句。");
  });

  it("accepts slide_action JSON override", () => {
    const result = compileSlideMarkdown({
      filename: "02.md",
      content: `---
emotion: confident
gesture: explain
slide_action: {"next": true}
---

第二页内容。`,
    });

    expect(result.actions?.[0]?.slide_action).toEqual({ next: true });
  });
});

describe("compileDeckScript", () => {
  it("sorts slides numerically and compiles all actions", () => {
    const result = compileDeckScript([
      {
        filename: "02.md",
        content: `---
emotion: confident
gesture: explain
slide_action: {"next": true}
---

第二页。`,
      },
      {
        filename: "01.md",
        content: `---
emotion: friendly
gesture: bow
---

第一页。`,
      },
    ]);

    expect(result.issues).toHaveLength(0);
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]?.action_id).toBe("p01");
    expect(result.actions[1]?.slide_action).toEqual({ next: true });
  });
});

describe("parseScriptJsonl", () => {
  it("parses and validates jsonl lines", () => {
    const jsonl = formatScriptJsonl([
      {
        schema_version: "1.0",
        action_id: "p01",
        mode: "present",
        utterance: "测试",
        profile: "friendly",
        gesture: "bow",
        slide_action: { goto: 1 },
        voice: { speed: 0.95 },
        timing: { pause_after_ms: 200 },
      },
    ]);

    const result = parseScriptJsonl(jsonl);
    expect(result.issues).toHaveLength(0);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.utterance).toBe("测试");
    expect(result.actions[0]?.voice?.speed).toBe(0.95);
  });
});
