import { describe, expect, it } from "vitest";
import { parseSlideMarkdownToDraft, serializeSlideMarkdown } from "./slide-script-draft.js";

describe("slide-script-draft roundtrip", () => {
  it("parses and serializes demo slide 02", () => {
    const source = `---
emotion: confident
gesture: explain
action_id: present-02
slide_action: {"next": true}
---

第二页我们来看整体技术架构。`;

    const draft = parseSlideMarkdownToDraft(2, source);
    expect(draft.emotion).toBe("confident");
    expect(draft.slide_action).toEqual({ next: true });

    const serialized = serializeSlideMarkdown(draft);
    const again = parseSlideMarkdownToDraft(2, serialized);
    expect(again.utterance).toBe("第二页我们来看整体技术架构。");
    expect(again.slide_action).toEqual({ next: true });
  });

  it("omits default goto slide_action on serialize", () => {
    const draft = parseSlideMarkdownToDraft(1, `---
emotion: friendly
gesture: bow
---

开场白。`);
    const serialized = serializeSlideMarkdown(draft);
    expect(serialized).not.toContain("slide_action");
  });
});
