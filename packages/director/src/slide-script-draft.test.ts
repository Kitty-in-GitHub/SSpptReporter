import { describe, expect, it } from "vitest";
import {
  parseSlideMarkdownToPageDraft,
  serializeSlideMarkdown,
} from "./slide-script-draft.js";

describe("slide page draft roundtrip", () => {
  it("parses and serializes demo slide 02", () => {
    const source = `---
emotion: confident
gesture: explain
action_id: present-02
slide_action: {"next": true}
---

第二页我们来看整体技术架构。`;

    const pageDraft = parseSlideMarkdownToPageDraft(2, source);
    expect(pageDraft.beats[0]?.emotion).toBe("confident");
    expect(pageDraft.beats[0]?.slide_action).toEqual({ next: true });

    const serialized = serializeSlideMarkdown(pageDraft);
    const again = parseSlideMarkdownToPageDraft(2, serialized);
    expect(again.beats[0]?.utterance).toBe("第二页我们来看整体技术架构。");
    expect(again.beats[0]?.slide_action).toEqual({ next: true });
  });

  it("parses multiple beats", () => {
    const source = `---
emotion: confident
---

<!-- beat -->
profile: confident
第一句。

<!-- beat -->
profile: thinking
gesture: nod
utterance:

<!-- beat -->
profile: emphatic
第二句。`;

    const pageDraft = parseSlideMarkdownToPageDraft(3, source);
    expect(pageDraft.beats.length).toBe(3);
    expect(pageDraft.beats[1]?.utterance).toBe("");
    expect(pageDraft.beats[1]?.gesture).toBe("nod");
  });

  it("omits default goto slide_action on serialize for first beat", () => {
    const pageDraft = parseSlideMarkdownToPageDraft(1, `---
emotion: friendly
gesture: bow
---

开场白。`);
    const serialized = serializeSlideMarkdown(pageDraft);
    expect(serialized).not.toContain("slide_action");
  });
});
